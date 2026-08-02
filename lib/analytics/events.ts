export const productEventNames = [
  "exam_catalog_viewed",
  "exam_search_used",
  "exam_filter_changed",
  "exam_detail_viewed",
  "exam_started",
  "exam_resumed",
  "exam_autosave_failed",
  "exam_submitted",
  "exam_result_viewed",
  "recommended_exam_opened"
] as const;

export type ProductEventName = typeof productEventNames[number];

export function trackProductEvent(name: ProductEventName, dimensions: { examId?: string; category?: string } = {}) {
  if (typeof window === "undefined" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  const payload = JSON.stringify({ type: "product", name, ...dimensions, route: window.location.pathname, device: window.innerWidth < 700 ? "mobile" : "desktop" });
  navigator.sendBeacon?.("/api/telemetry", new Blob([payload], { type: "application/json" }));
}
