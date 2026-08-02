import { ImageResponse } from "next/og";

import { getPublicExamBySlug } from "@/lib/exams/queries";

export const alt = "Exam preview on Azmoon Khaneh";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ExamOpenGraphImage({ params }: { params: Promise<{ examSlug: string }> }) {
  const exam = await getPublicExamBySlug((await params).examSlug);
  const title = exam?.slug.replaceAll("-", " ") ?? "Azmoon Khaneh";
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 70, color: "#21342b", background: "linear-gradient(145deg, #fff7ed, #dceee4)" }}><div style={{ display: "flex", color: "#366f57", fontSize: 30 }}>AZMOON KHANEH · ONLINE EXAM</div><div style={{ display: "flex", maxWidth: 1040, fontSize: 68, fontWeight: 800, lineHeight: 1.35, textTransform: "capitalize" }}>{title}</div><div style={{ display: "flex", gap: 22, fontSize: 30 }}><span>{exam?.difficulty.replaceAll("_", " ") ?? "TARGETED ASSESSMENT"}</span><span>•</span><span>{exam ? `${Math.ceil(exam.durationSeconds / 60)} MINUTES` : "ACTIONABLE FEEDBACK"}</span></div></div>, size);
}
