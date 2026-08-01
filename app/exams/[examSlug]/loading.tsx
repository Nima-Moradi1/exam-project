export default function ExamDetailLoading() {
  return (
    <main className="exam-detail page-shell" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال آماده‌سازی آزمون…</span>
      <section className="exam-detail__hero"><div className="loading-skeleton loading-skeleton--crumbs" /><div className="loading-skeleton loading-skeleton--title" /><div className="loading-skeleton loading-skeleton--text" /><div className="exam-metadata">{Array.from({ length: 4 }, (_, index) => <div className="loading-skeleton loading-skeleton--metric" key={index} />)}</div></section>
      <section className="outline-card"><div className="loading-skeleton loading-skeleton--text" /><div className="loading-skeleton loading-skeleton--text" /></section>
    </main>
  );
}
