"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@heroui/react";

import { ArrowIcon } from "@/components/icons";
import { NavigationLink } from "@/components/navigation-link";
import type { ExamCardTheme } from "@/lib/exams/presentation";

type SliderExam = { href: string; label: string; description: string; detail: string; accent: ExamCardTheme; category: string; categorySlug: string; level: string; levelSlug: string };
export type LearningPath = { name: string; slug: string; exams: SliderExam[] };

const AUTO_ADVANCE_DELAY = 6500;
const chipThemes: Record<string, string> = { reading: "ocean", listening: "violet", writing: "coral", speaking: "mint", full: "gold", html: "coral", css: "ocean", javascript: "gold", typescript: "violet", react: "mint", nextjs: "plum", nodejs: "mint", sql: "ocean", postgresql: "violet", docker: "coral", kubernetes: "plum", "git-github": "gold", "ci-cd": "mint", devops: "plum" };
const chipLabels: Record<string, string> = { reading: "Reading", listening: "Listening", writing: "Writing", speaking: "Speaking", full: "Full Exam", html: "HTML", css: "CSS", javascript: "JavaScript", typescript: "TypeScript", react: "React", nextjs: "Next.js", nodejs: "Node.js", sql: "SQL", postgresql: "PostgreSQL", docker: "Docker", kubernetes: "Kubernetes", "git-github": "Git & GitHub", "ci-cd": "CI/CD", devops: "DevOps" };
const labelFor = (slug: string, fallback: string) => chipLabels[slug] ?? fallback;
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Carousel({ path, exams }: { path: LearningPath; exams: SliderExam[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canNavigate = exams.length > 1;
  const goTo = useCallback((next: number) => { const index = (next + exams.length) % exams.length; setActiveIndex(index); const item = itemRefs.current[index]; item?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest", inline: "start" }); }, [exams.length]);
  useEffect(() => { viewportRef.current?.scrollTo({ left: 0, behavior: "auto" }); }, [path.slug, exams.length]);
  useEffect(() => { if (exams.length < 3 || paused || prefersReducedMotion()) return; const timer = window.setInterval(() => goTo(activeIndex + 1), AUTO_ADVANCE_DELAY); return () => window.clearInterval(timer); }, [activeIndex, exams.length, goTo, paused]);
  if (!exams.length) return <p className="exam-filter-empty">با این فیلتر آزمونی پیدا نشد.</p>;
  return <section className={`exam-category-slider${canNavigate ? "" : " exam-category-slider--single"}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
    <div className="exam-category-slider__heading"><div><span className="exam-category-slider__overline">آزمون‌های انتخاب‌شده</span><h3>{path.name}</h3></div><div className="exam-category-slider__tools"><span className="exam-category-slider__count">{exams.length.toLocaleString("fa-IR")} آزمون</span>{canNavigate && <div className="exam-category-slider__controls" aria-label="پیمایش آزمون‌ها"><button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="آزمون قبلی"><ArrowIcon className="exam-category-slider__previous-icon" /></button><button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="آزمون بعدی"><ArrowIcon /></button></div>}</div></div>
    <div ref={viewportRef} className="exam-category-slider__viewport" role="region" aria-roledescription="carousel" aria-label={`آزمون‌های ${path.name}`}><div className="exam-category-slider__track">{exams.map((exam, index) => <article className={`hub-exam-card exam-card--${exam.accent}`} key={exam.href} ref={(element) => { itemRefs.current[index] = element; }} role="group" aria-roledescription="slide" aria-label={`${(index + 1).toLocaleString("fa-IR")} از ${exams.length.toLocaleString("fa-IR")}`}><span className={`exam-topic-chip exam-topic-chip--${chipThemes[exam.categorySlug] ?? "mint"}`}>{labelFor(exam.categorySlug, exam.category)}</span><h4>{exam.label}</h4><p>{exam.description}</p><div><span>{exam.detail}</span><NavigationLink className="hub-exam-card__action" href={exam.href}>مشاهده و شروع <ArrowIcon className="hub-exam-card__action-icon" /></NavigationLink></div></article>)}</div></div>
    {canNavigate && <div className="exam-category-slider__dots">{Array.from({ length: Math.ceil(exams.length / 4) }, (_, page) => <button key={page} type="button" className={Math.floor(activeIndex / 4) === page ? "is-active" : undefined} onClick={() => goTo(page * 4)} aria-label={`نمایش صفحه ${(page + 1).toLocaleString("fa-IR")}`} />)}</div>}
  </section>;
}

function FilterAutocomplete({ label, placeholder, items, selected, onChange }: { label: string; placeholder: string; items: Array<[string, string]>; selected: Set<string>; onChange: (values: Set<string>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = items.filter(([, name]) => name.toLocaleLowerCase("fa-IR").includes(query.trim().toLocaleLowerCase("fa-IR")));
  function select(slug: string) { onChange(new Set([...selected, slug])); setQuery(""); setOpen(false); inputRef.current?.focus(); }
  return <div className="exam-autocomplete-wrap"><label className="exam-autocomplete" onClick={() => inputRef.current?.focus()}>{label}<Input aria-expanded={open} aria-controls={`options-${label}`} className="exam-autocomplete__input" fullWidth placeholder={placeholder} ref={inputRef} role="combobox" value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)} />{open && <div className="exam-autocomplete__options" id={`options-${label}`} role="listbox">{filtered.length ? filtered.map(([slug, name]) => <button aria-selected={selected.has(slug)} key={slug} onMouseDown={(event) => { event.preventDefault(); select(slug); }} role="option" type="button">{name}{selected.has(slug) && <span>انتخاب‌شده</span>}</button>) : <p>نتیجه‌ای پیدا نشد.</p>}</div>}</label>{selected.size > 0 && <div className="exam-autocomplete-tags" aria-label={`${label} انتخاب‌شده`}>{[...selected].map((slug) => <button key={slug} type="button" onClick={() => onChange(new Set([...selected].filter((value) => value !== slug)))}>{items.find(([value]) => value === slug)?.[1]} <span aria-hidden="true">×</span></button>)}</div>}</div>;
}

export function ExamCategorySliders({ paths }: { paths: LearningPath[] }) {
  const [pathSlugs, setPathSlugs] = useState<Set<string>>(new Set());
  const [levelSlugs, setLevelSlugs] = useState<Set<string>>(new Set());
  const [topicSlugs, setTopicSlugs] = useState<Set<string>>(new Set());
  const selectedPaths = useMemo(() => paths.filter((path) => !pathSlugs.size || pathSlugs.has(path.slug)), [paths, pathSlugs]);
  const levels = useMemo(() => [...new Map(selectedPaths.flatMap((path) => path.exams).map((exam) => [exam.levelSlug, exam.level] as const)).entries()], [selectedPaths]);
  const topics = useMemo(() => [...new Map(selectedPaths.flatMap((path) => path.exams).map((exam) => [exam.categorySlug, exam.category] as const)).entries()], [selectedPaths]);
  const visible = useMemo(() => selectedPaths.flatMap((path) => path.exams).filter((exam) => (!levelSlugs.size || levelSlugs.has(exam.levelSlug)) && (!topicSlugs.size || topicSlugs.has(exam.categorySlug))), [levelSlugs, selectedPaths, topicSlugs]);
  return <div className="exam-discovery"><div className="exam-autocomplete-grid"><FilterAutocomplete label="مسیرهای یادگیری" placeholder="جست‌وجوی مسیر…" items={paths.map((path) => [path.slug, path.name])} selected={pathSlugs} onChange={(values) => { setPathSlugs(values); setLevelSlugs(new Set()); setTopicSlugs(new Set()); }} /><FilterAutocomplete label="سطح یا حوزه" placeholder="جست‌وجوی سطح…" items={levels} selected={levelSlugs} onChange={setLevelSlugs} /><FilterAutocomplete label="زیرشاخه‌ها" placeholder="جست‌وجوی زیرشاخه…" items={topics} selected={topicSlugs} onChange={setTopicSlugs} /></div><p className="exam-filter-summary">{visible.length.toLocaleString("fa-IR")} آزمون مطابق انتخاب شما پیدا شد.</p><Carousel key={`${[...pathSlugs].join("-")}-${[...levelSlugs].join("-")}-${[...topicSlugs].join("-")}`} path={{ name: "آزمون‌های انتخاب‌شده", slug: "filtered", exams: visible }} exams={visible} /></div>;
}
