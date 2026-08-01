import "server-only";

import { del, put } from "@vercel/blob";

import { getServerEnvironment } from "@/lib/env/server";
import type { MediaStorageProvider, StoredAsset } from "./provider";

export const vercelBlobProvider: MediaStorageProvider = {
  async upload(pathname: string, file: File): Promise<StoredAsset> {
    const token = getServerEnvironment().BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("UPLOAD_NOT_CONFIGURED");
    const blob = await put(pathname, file, { access: "public", addRandomSuffix: true, token, contentType: file.type });
    return { url: blob.url, pathname: blob.pathname, storageKey: blob.pathname, contentType: file.type, sizeBytes: file.size };
  },
  async remove(url: string) {
    const token = getServerEnvironment().BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("UPLOAD_NOT_CONFIGURED");
    await del(url, { token });
  }
};
