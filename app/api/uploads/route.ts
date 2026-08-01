import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { vercelBlobProvider } from "@/lib/media/vercel-blob";
import { validateUpload } from "@/lib/media/validation";
import { apiError } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requirePermission("media:manage");
    const formData = await request.formData();
    const file = formData.get("file");
    const altText = String(formData.get("altText") ?? "").trim();
    if (!(file instanceof File)) throw new Error("VALIDATION_ERROR");
    const metadata = validateUpload(file);
    if (metadata.kind === "IMAGE" && !altText) throw new Error("VALIDATION_ERROR");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
    const stored = await vercelBlobProvider.upload(`exam-platform/${user.id}/${Date.now()}-${safeName}`, file);
    const [asset] = await getDb().insert(mediaAssets).values({ ...stored, kind: metadata.kind, storageProvider: "vercel-blob", altText: altText || "Decorative media", uploadedByUserId: user.id }).returning();
    return NextResponse.json({ id: asset?.id, url: asset?.url }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
