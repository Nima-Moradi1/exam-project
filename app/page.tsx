import { ExamHub } from "@/components/exam-hub";
import { getPublicHomeDiscovery } from "@/lib/exams/queries";

export const revalidate = 300;

export default async function HomePage() {
  if (!process.env.DATABASE_URL) return <ExamHub />;
  return <ExamHub discovery={await getPublicHomeDiscovery()} />;
}
