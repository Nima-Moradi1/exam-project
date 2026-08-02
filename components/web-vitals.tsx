"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    const payload = JSON.stringify({ type: "vital", name: metric.name, value: metric.value, rating: metric.rating, route: window.location.pathname, device: window.innerWidth < 700 ? "mobile" : "desktop" });
    navigator.sendBeacon?.("/api/telemetry", new Blob([payload], { type: "application/json" }));
  });
  return null;
}
