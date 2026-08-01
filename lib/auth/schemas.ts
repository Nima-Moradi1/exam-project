import { z } from "zod";

const usernamePattern = /^[a-z0-9_-]{3,30}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

export function passwordHasRequiredStrength(password: string) {
  const categories = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z\d]/];
  return categories.filter((pattern) => pattern.test(password)).length >= 3;
}

const passwordSchema = z.string()
  .min(10, "رمز عبور باید حداقل ۱۰ نویسه باشد.")
  .refine(passwordHasRequiredStrength, "رمز عبور باید دست‌کم سه نوع نویسه داشته باشد.");

export const signupSchema = z.object({
  username: z.string().transform(normalizeUsername).refine((value) => usernamePattern.test(value), "نام کاربری باید ۳ تا ۳۰ نویسهٔ انگلیسی کوچک، عدد، خط تیره یا زیرخط باشد."),
  email: z.string().email("ایمیل معتبر نیست.").transform(normalizeEmail),
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: z.string().trim().min(1).max(120).optional().or(z.literal("")),
  acceptedTerms: z.literal(true, { error: "پذیرش شرایط استفاده لازم است." })
}).superRefine((data, context) => {
  if (data.password !== data.confirmPassword) {
    context.addIssue({ code: "custom", path: ["confirmPassword"], message: "تکرار رمز عبور یکسان نیست." });
  }
});

export const credentialsSchema = z.object({
  username: z.string().transform(normalizeUsername).refine((value) => usernamePattern.test(value), "نام کاربری یا رمز عبور نادرست است."),
  password: z.string().min(1, "نام کاربری یا رمز عبور نادرست است.")
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: z.string().trim().max(1_000).optional().or(z.literal("")),
  preferredLocale: z.enum(["fa", "en"]).default("fa"),
  timezone: z.string().trim().max(80).optional().or(z.literal(""))
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "تکرار رمز عبور یکسان نیست.",
  path: ["confirmPassword"]
});
