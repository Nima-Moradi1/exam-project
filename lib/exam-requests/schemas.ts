import { z } from "zod";

export const examRequestSchema = z.object({
  title: z.string().trim().min(4, "عنوان درخواست باید حداقل ۴ نویسه باشد.").max(180),
  subject: z.string().trim().min(2, "موضوع آزمون را مشخص کنید.").max(160),
  level: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().min(20, "جزئیات درخواست باید حداقل ۲۰ نویسه باشد.").max(3_000)
});

export const examRequestStatusSchema = z.enum(["PENDING", "REVIEWED", "REJECTED", "COMPLETED"]);
