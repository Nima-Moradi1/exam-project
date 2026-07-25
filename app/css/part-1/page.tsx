import { ExamApp } from "@/components/exam-app";
import { cssPart1Questions } from "@/lib/questions/css.public";
import { cssPart1Syllabus } from "@/lib/exam-syllabi";

export default function CssPartOnePage() {
  return <ExamApp questions={cssPart1Questions} config={{
    title: "CSS — بخش ۱",
    description: "دانش خود را از معرفی CSS، مقدمات، انتخاب‌کننده‌ها، Box Model، بک‌گراند و تصویر، فونت و متن بسنج.",
    syllabus: cssPart1Syllabus,
    durationMinutes: 45,
    storageKey: "css-part-1-attempt-v1",
    apiExamId: "css-part-1",
    abandon: { cooldownKey: "css-part-1-cooldown-until", returnTo: "/css" }
  }} />;
}
