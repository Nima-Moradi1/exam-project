import { z } from "zod";

export const examInputSchema = z.object({
  categoryId: z.string().uuid(),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  title: z.string().trim().min(3).max(220),
  shortDescription: z.string().trim().min(10).max(500),
  description: z.string().trim().min(10).max(10_000),
  instructions: z.string().trim().min(1).max(10_000),
  locale: z.enum(["fa", "en"]),
  direction: z.enum(["AUTO", "LTR", "RTL"]),
  difficulty: z.enum(["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "UPPER_INTERMEDIATE", "ADVANCED", "EXPERT"]),
  durationSeconds: z.coerce.number().int().min(60).max(8 * 60 * 60),
  passingScorePercent: z.coerce.number().int().min(0).max(100),
  maxAttempts: z.coerce.number().int().positive().nullable().optional(),
  retryCooldownMinutes: z.coerce.number().int().min(0).nullable().optional(),
  randomizeQuestionOrder: z.boolean().default(false),
  randomizeOptionOrder: z.boolean().default(false),
  showResultsImmediately: z.boolean().default(true),
  antiCheatMode: z.enum(["OFF", "WARN", "STRICT"]).default("WARN")
});

const baseSettings = z.object({ placeholder: z.string().max(160).optional() });
export const questionSettingsSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SINGLE_CHOICE"), settings: baseSettings }),
  z.object({ type: z.literal("DROPDOWN"), settings: baseSettings }),
  z.object({ type: z.literal("TRUE_FALSE"), settings: baseSettings }),
  z.object({ type: z.literal("MULTIPLE_CHOICE"), settings: baseSettings.extend({ minimumSelections: z.number().int().min(0).optional(), maximumSelections: z.number().int().positive().optional(), partialCredit: z.boolean().optional() }) }),
  z.object({ type: z.literal("SHORT_TEXT"), settings: baseSettings.extend({ caseSensitive: z.boolean().optional(), normalizePersian: z.boolean().optional() }) }),
  z.object({ type: z.literal("LONG_TEXT"), settings: baseSettings.extend({ minimumCharacters: z.number().int().min(0).optional(), maximumCharacters: z.number().int().positive().optional() }) }),
  z.object({ type: z.literal("NUMERIC"), settings: z.object({ target: z.number().finite(), tolerance: z.number().finite().min(0).optional() }) }),
  z.object({ type: z.literal("ORDERING"), settings: z.object({ partialCredit: z.boolean().optional() }) }),
  z.object({ type: z.literal("MATCHING"), settings: z.object({ partialCredit: z.boolean().optional(), pairs: z.array(z.object({ leftId: z.string().min(1), rightId: z.string().min(1) })).min(1) }) })
]);

export const questionInputSchema = z.object({
  examId: z.string().uuid(),
  type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "DROPDOWN", "SHORT_TEXT", "LONG_TEXT", "NUMERIC", "ORDERING", "MATCHING"]),
  gradingMode: z.enum(["AUTOMATIC", "MANUAL", "AI_ASSISTED"]),
  prompt: z.string().trim().min(1).max(10_000),
  description: z.string().trim().max(4_000).nullable().optional(),
  locale: z.enum(["fa", "en"]).nullable().optional(),
  direction: z.enum(["AUTO", "LTR", "RTL"]).default("AUTO"),
  points: z.coerce.number().int().min(1).max(10_000),
  negativePoints: z.coerce.number().int().min(0).max(10_000).default(0),
  isRequired: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
  explanation: z.string().trim().max(10_000).nullable().optional(),
  modelAnswer: z.string().trim().max(10_000).nullable().optional(),
  settings: z.record(z.string(), z.unknown()).default({}),
  options: z.array(z.object({ id: z.string().uuid().optional(), label: z.string().trim().min(1).max(1_000), value: z.string().trim().min(1).max(300), isCorrect: z.boolean(), explanation: z.string().trim().max(2_000).nullable().optional(), sortOrder: z.number().int().min(0) })).default([]),
  acceptedAnswers: z.array(z.string().trim().min(1).max(1_000)).default([]),
  topicIds: z.array(z.string().uuid()).default([])
}).superRefine((input, context) => {
  const settings = questionSettingsSchema.safeParse({ type: input.type, settings: input.settings });
  if (!settings.success) context.addIssue({ code: "custom", path: ["settings"], message: "تنظیمات این نوع پرسش معتبر نیست." });
  if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "DROPDOWN"].includes(input.type) && input.gradingMode === "AUTOMATIC" && !input.options.some((option) => option.isCorrect)) context.addIssue({ code: "custom", path: ["options"], message: "یک گزینهٔ درست لازم است." });
  if (input.type === "TRUE_FALSE" && (input.options.length !== 2 || input.options.filter((option) => option.isCorrect).length !== 1)) context.addIssue({ code: "custom", path: ["options"], message: "پرسش درست/نادرست باید دقیقاً دو گزینه و یک پاسخ درست داشته باشد." });
  if (input.type === "SHORT_TEXT" && input.gradingMode === "AUTOMATIC" && !input.acceptedAnswers.length) context.addIssue({ code: "custom", path: ["acceptedAnswers"], message: "برای پاسخ کوتاه دست‌کم یک پاسخ پذیرفته‌شده لازم است." });
  if (input.type === "LONG_TEXT" && input.gradingMode === "AUTOMATIC") context.addIssue({ code: "custom", path: ["gradingMode"], message: "پاسخ بلند باید دستی یا با کمک هوش مصنوعی بررسی شود." });
});
