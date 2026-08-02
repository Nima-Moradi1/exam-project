export type ExamEditorialContent = {
  title: string;
  shortDescription: string;
  description: string;
  instructions: string;
  learningObjectives: string[];
  durationSeconds: number;
  passingScorePercent: number;
  locale: string;
  categoryId: string;
};

const placeholderPatterns = [/\bcomprehensive exam\b/i, /\blorem ipsum\b/i, /آزمون جامع\s*$/i, /توضیحات آزمون/i, /متن آزمایشی/i, /placeholder/i];

export function inspectExamContent(input: ExamEditorialContent) {
  const issues: string[] = [];
  const title = input.title.trim();
  if (title.length < 6) issues.push("عنوان آزمون باید مشخص و متمایز باشد.");
  if (/[a-z]/.test(title) && title === title.toLocaleLowerCase("en-US")) issues.push("عنوان لاتین نباید کاملاً با حروف کوچک باشد.");
  if (placeholderPatterns.some((pattern) => pattern.test(`${title} ${input.shortDescription}`))) issues.push("عنوان یا توضیح کوتاه شبیه متن جای‌نگهدار است.");
  if (input.shortDescription.trim().length < 40) issues.push("توضیح کوتاه باید نتیجه یا دامنهٔ آزمون را روشن کند.");
  if (input.description.trim() === input.shortDescription.trim()) issues.push("توضیح کامل نباید تکرار توضیح کوتاه باشد.");
  if (input.learningObjectives.length < 1) issues.push("دست‌کم یک هدف یادگیری لازم است.");
  if (!input.instructions.trim()) issues.push("راهنمای پیش از شروع لازم است.");
  if (input.durationSeconds < 60) issues.push("زمان آزمون معتبر نیست.");
  if (input.passingScorePercent < 0 || input.passingScorePercent > 100) issues.push("حدنصاب آزمون معتبر نیست.");
  if (!input.locale || !input.categoryId) issues.push("زبان و دسته‌بندی باید مشخص باشند.");
  return issues;
}
