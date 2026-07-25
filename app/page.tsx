import { ExamApp } from "@/components/exam-app";
import { publicQuestions } from "@/lib/questions/public";

export default function HomePage() {
  return <ExamApp questions={publicQuestions} />;
}
