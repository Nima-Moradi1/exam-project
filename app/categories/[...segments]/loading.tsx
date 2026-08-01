export default function CategoryLoading() {
  return (
    <main className="catalog-page page-shell" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری دسته‌بندی…</span>
      <div className="loading-skeleton loading-skeleton--crumbs" />
      <div className="loading-skeleton loading-skeleton--title" />
      <div className="loading-skeleton loading-skeleton--text" />
      <div className="catalog-grid loading-card-grid">{Array.from({ length: 3 }, (_, index) => <div className="loading-skeleton loading-skeleton--card" key={index} />)}</div>
    </main>
  );
}
