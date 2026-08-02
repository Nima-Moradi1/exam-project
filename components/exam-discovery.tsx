"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ArrowIcon } from "@/components/icons";
import { AppModal } from "@/components/ui/app-modal";
import { AppButton } from "@/components/ui/form-controls";
import { formatDuration, formatNumber, getDifficultyLabel, getLanguageLabel, type ExamCardTheme } from "@/lib/exams/presentation";
import { trackProductEvent } from "@/lib/analytics/events";

export type DiscoveryCard = {
  href: string;
  title: string;
  description: string;
  durationSeconds: number;
  difficulty: string;
  language: string;
  questionCount: number;
  theme: ExamCardTheme;
  topic: string;
  topicSlug: string;
};

type Facet = { value: string; label: string; count: number };
type Filters = { q: string; paths: string[]; levels: string[]; topics: string[]; difficulties: string[]; page: number; sort: "newest" | "title"; view: "grid" | "list" };

type Props = {
  cards: DiscoveryCard[];
  filters: Filters;
  facets: { paths: Facet[]; levels: Facet[]; topics: Facet[]; difficulties: Array<{ value: string; count: number }> };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

function toggle(params: URLSearchParams, key: string, value: string, checked: boolean) {
  const values = params.getAll(key).filter((item) => item !== value);
  params.delete(key);
  for (const item of checked ? [...values, value] : values) params.append(key, item);
  params.delete("page");
}

function FacetGroup({ legend, name, options, selected, onToggle }: { legend: string; name: string; options: Facet[]; selected: string[]; onToggle: (name: string, value: string, checked: boolean) => void }) {
  return <fieldset className="discovery-facet"><legend>{legend}</legend><div>{options.map((option) => <label key={option.value} className={option.count === 0 ? "is-unavailable" : undefined}><input type="checkbox" checked={selected.includes(option.value)} disabled={option.count === 0 && !selected.includes(option.value)} onChange={(event) => onToggle(name, option.value, event.target.checked)} /><span>{option.label}</span><small>{formatNumber(option.count)}</small></label>)}</div></fieldset>;
}

function FilterFields({ facets, filters, onToggle }: Pick<Props, "facets" | "filters"> & { onToggle: (name: string, value: string, checked: boolean) => void }) {
  const difficultyFacets = facets.difficulties.map((item) => ({ ...item, label: getDifficultyLabel(item.value) }));
  return <div className="discovery-facets"><FacetGroup legend="مسیر یادگیری" name="path" options={facets.paths} selected={filters.paths} onToggle={onToggle} /><FacetGroup legend="سطح یا حوزه" name="level" options={facets.levels} selected={filters.levels} onToggle={onToggle} /><FacetGroup legend="موضوع" name="topic" options={facets.topics} selected={filters.topics} onToggle={onToggle} /><FacetGroup legend="درجهٔ دشواری" name="difficulty" options={difficultyFacets} selected={filters.difficulties} onToggle={onToggle} /></div>;
}

export function ExamDiscovery({ cards, filters, facets, pagination }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(filters.q);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const activeFilterCount = filters.paths.length + filters.levels.length + filters.topics.length + filters.difficulties.length;
  const range = useMemo(() => ({ from: pagination.total ? (pagination.page - 1) * pagination.pageSize + 1 : 0, to: Math.min(pagination.page * pagination.pageSize, pagination.total) }), [pagination]);

  const navigate = useCallback((params: URLSearchParams) => {
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, router]);

  function pageHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) params.set("page", String(page)); else params.delete("page");
    return params.size ? `${pathname}?${params}` : pathname;
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) params.set("q", query.trim()); else params.delete("q");
      params.delete("page");
      if (params.toString() !== searchParams.toString()) navigate(params);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [navigate, query, searchParams]);
  useEffect(() => { trackProductEvent("exam_catalog_viewed"); }, []);

  function onToggle(name: string, value: string, checked: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    toggle(params, name, value, checked);
    navigate(params);
    trackProductEvent("exam_filter_changed");
  }

  function clearFilters() {
    setQuery("");
    navigate(new URLSearchParams());
    setMobileFiltersOpen(false);
  }

  return <section className="exam-discovery" aria-labelledby="discovery-results-title">
    <div className="discovery-search-row">
      <label className="discovery-search" htmlFor="exam-search"><span>جست‌وجوی آزمون</span><input id="exam-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="عنوان، موضوع یا عبارت فنی مثل HTML و IELTS" autoComplete="off" /></label>
      <AppButton className="discovery-mobile-filter" tone="secondary" onPress={() => setMobileFiltersOpen(true)}>فیلترها{activeFilterCount ? ` (${formatNumber(activeFilterCount)})` : ""}</AppButton>
    </div>
    <div className="discovery-layout">
      <aside className="discovery-sidebar" aria-label="فیلترهای آزمون"><div className="discovery-sidebar__heading"><strong>فیلترها</strong>{activeFilterCount > 0 && <button type="button" onClick={clearFilters}>پاک‌کردن همه</button>}</div><FilterFields facets={facets} filters={filters} onToggle={onToggle} /></aside>
      <div className="discovery-results">
        <header className="discovery-results__header"><div><h3 id="discovery-results-title">آزمون‌های پیدا‌شده</h3><p role="status" aria-live="polite">{formatNumber(pagination.total)} آزمون؛ نمایش {formatNumber(range.from)} تا {formatNumber(range.to)}</p></div><label>مرتب‌سازی<select value={filters.sort} onChange={(event) => { const params = new URLSearchParams(searchParams.toString()); params.set("sort", event.target.value); params.delete("page"); navigate(params); }}><option value="newest">تازه‌ترین</option><option value="title">عنوان</option></select></label></header>
        {cards.length ? <div className={`discovery-grid discovery-grid--${filters.view}`}>{cards.map((exam) => <article className={`discovery-card exam-card--${exam.theme}`} key={exam.href}><div className="exam-card__attributes"><span className="exam-topic-chip">{exam.topic}</span><span>{getDifficultyLabel(exam.difficulty)}</span></div><h4 dir="auto">{exam.title}</h4><p dir="auto">{exam.description}</p><dl><div><dt>زمان</dt><dd>{formatDuration(exam.durationSeconds)}</dd></div><div><dt>پرسش</dt><dd>{formatNumber(exam.questionCount)}</dd></div><div><dt>زبان</dt><dd>{getLanguageLabel(exam.language)}</dd></div></dl><Link className="hub-exam-card__action" href={exam.href}>مشاهدهٔ جزئیات <ArrowIcon aria-hidden="true" /></Link></article>)}</div> : <div className="discovery-empty"><h4>آزمونی با این انتخاب‌ها پیدا نشد</h4><p>عبارت جست‌وجو را کوتاه‌تر کنید یا بعضی فیلترها را بردارید.</p><button type="button" className="secondary-button" onClick={clearFilters}>پاک‌کردن فیلترها</button></div>}
        {pagination.totalPages > 1 && <nav className="discovery-pagination" aria-label="صفحه‌بندی آزمون‌ها"><Link aria-disabled={pagination.page === 1} tabIndex={pagination.page === 1 ? -1 : undefined} href={pageHref(Math.max(1, pagination.page - 1))}>قبلی</Link><span>صفحهٔ {formatNumber(pagination.page)} از {formatNumber(pagination.totalPages)}</span><Link aria-disabled={pagination.page === pagination.totalPages} tabIndex={pagination.page === pagination.totalPages ? -1 : undefined} href={pageHref(Math.min(pagination.totalPages, pagination.page + 1))}>بعدی</Link></nav>}
      </div>
    </div>
    <AppModal isOpen={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen} title={`فیلترهای آزمون${activeFilterCount ? `؛ ${formatNumber(activeFilterCount)} فعال` : ""}`} footer={<div className="discovery-filter-actions"><AppButton tone="secondary" onPress={clearFilters}>پاک‌کردن</AppButton><AppButton onPress={() => setMobileFiltersOpen(false)}>نمایش {formatNumber(pagination.total)} نتیجه</AppButton></div>}><FilterFields facets={facets} filters={filters} onToggle={onToggle} /></AppModal>
  </section>;
}
