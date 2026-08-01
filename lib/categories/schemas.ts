import { z } from "zod";

const slugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "اسلاگ باید با حروف کوچک انگلیسی، عدد و خط تیره ساخته شود.").max(160);

export const categoryInputSchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(160),
  slug: slugSchema,
  description: z.string().trim().max(2_000).nullable().optional(),
  locale: z.enum(["fa", "en"]).default("fa"),
  direction: z.enum(["AUTO", "LTR", "RTL"]).default("AUTO"),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export const categoryMoveSchema = z.object({
  categoryId: z.string().uuid(),
  parentId: z.string().uuid().nullable()
});

export const categoryReorderSchema = z.object({
  categoryId: z.string().uuid(),
  direction: z.enum(["up", "down"])
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
