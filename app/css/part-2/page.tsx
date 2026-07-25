import { ExamApp } from "@/components/exam-app";
import { cssPart2Questions } from "@/lib/questions/css.public";
import { cssPart2Syllabus } from "@/lib/exam-syllabi";

export default function CssPartTwoPage() {
  return <ExamApp questions={cssPart2Questions} config={{
    title: "CSS — بخش ۲",
    description: "دانش خود را از واحدها و سایزها، چیدمان، فرم‌ها، رسپانسیو، Transform، انیمیشن و Transition بسنج.",
    syllabus: cssPart2Syllabus,
    durationMinutes: 45,
    storageKey: "css-part-2-attempt-v1",
    apiExamId: "css-part-2",
    abandon: { cooldownKey: "css-part-2-cooldown-until", returnTo: "/css" }
  }} />;
}
