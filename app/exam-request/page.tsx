import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ExamRequestForm } from "@/components/exam-request-form";

export const dynamic = "force-dynamic";

export default async function ExamRequestPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fexam-request");
  return <main id="main-content" className="exam-request-page page-shell"><ExamRequestForm /></main>;
}
