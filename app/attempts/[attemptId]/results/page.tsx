import { AttemptResults } from "@/components/results/attempt-results";
import { getAttemptResult } from "@/lib/attempts/service";

export const dynamic = "force-dynamic";

export default async function AttemptResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  return <AttemptResults result={await getAttemptResult((await params).attemptId)} />;
}
