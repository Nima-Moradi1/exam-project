import { redirect } from "next/navigation";

import { AttemptRunner } from "@/components/exam/attempt-runner";
import { getAttemptForUser } from "@/lib/attempts/service";

export const dynamic = "force-dynamic";

export default async function AttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const attempt = await getAttemptForUser((await params).attemptId);
  if (attempt.status === "COMPLETED" || attempt.status === "PENDING_REVIEW") redirect(`/attempts/${attempt.id}/results`);
  return <AttemptRunner attempt={attempt} />;
}
