"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const goTo = useCallback((next: number) => { const index = (next + exams.length) % exams.length; setActiveIndex(index); const item = itemRefs.current[index]; const viewport = viewportRef.current; if (!item || !viewport) return; viewport.scrollBy({ left: item.getBoundingClientRect().left - viewport.getBoundingClientRect().left, behavior: prefersReducedMotion() ? "auto" : "smooth" }); }, [exams.length]);
  useEffect(() => { setActiveIndex(0); viewportRef.current?.scrollTo({ left: 0, behavior: "auto" }); }, [path.slug, exams.length]);
  useEffect(() => { if (exams.length < 3 || paused || prefersReducedMotion()) return; const timer = window.setInterval(() => goTo(activeIndex + 1), AUTO_ADVANCE_DELAY); return () => window.clearInterval(timer); }, [activeIndex, exams.length, goTo, paused]);
  if (!exams.length) return <p className="exam-filter-empty">با این فیلتر آزمونی پیدا نشد.</p>;
  return <section className={`exam-category-slider${canNavigate ? "" : " exam-category-slider--single"}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
    <div className="exam-category-slider__heading"><div><span className="exam-category-slider__overline">آزمون‌های انتخاب‌شده</span><h3>{path.name}</h3></div><div className="exam-category-slider__tools"><span className="exam-category-slider__count">{exams.length.toLocaleString("fa-IR")} آزمون</span>{canNavigate && <div className="exam-category-slider__controls" aria-label="پیمایش آزمون‌ها"><button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="آزمون قبلی"><ArrowIcon className="exam-category-slider__previous-icon" /></button><button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="آزمون بعدی"><ArrowIcon /></button></div>}</div></div>
    <div ref={viewportRef} className="exam-category-slider__viewport" role="region" aria-roledescription="carousel" aria-label={`آزمون‌های ${path.name}`}><div className="exam-category-slider__track">{exams.map((exam, index) => <article className={`hub-exam-card exam-card--${exam.accent}`} key={exam.href} ref={(element) => { itemRefs.current[index] = element; }} role="group" aria-roledescription="slide" aria-label={`${(index + 1).toLocaleString("fa-IR")} از ${exams.length.toLocaleString("fa-IR")}`}><span className={`exam-topic-chip exam-topic-chip--${chipThemes[exam.categorySlug] ?? "mint"}`}>{labelFor(exam.categorySlug, exam.category)}</span><h4>{exam.label}</h4><p>{exam.description}</p><div><span>{exam.detail}</span><NavigationLink className="hub-exam-card__action" href={exam.href}>مشاهده و شروع <ArrowIcon className="hub-exam-card__action-icon" /></NavigationLink></div></article>)}</div></div>
    {canNavigate && <div className="exam-category-slider__dots">{exams.map((exam, index) => <button key={exam.href} type="button" className={index === activeIndex ? "is-active" : undefined} onClick={() => goTo(index)} aria-label={`نمایش آزمون ${(index + 1).toLocaleString("fa-IR")}`} />)}</div>}
  </section>;
}

export function ExamCategorySliders({ paths }: { paths: LearningPath[] }) {
  const [pathSlug, setPathSlug] = useState(paths[0]?.slug ?? "");
  const [levelSlug, setLevelSlug] = useState("all");
  const [topicSlug, setTopicSlug] = useState("all");
  const path = paths.find((entry) => entry.slug === pathSlug) ?? paths[0];
  const levels = useMemo(() => path ? [...new Map<string, string>(path.exams.map((exam) => [exam.levelSlug, exam.level] as const)).entries()] : [], [path]);
  const topics = useMemo(() => path ? [...new Map<string, string>(path.exams.map((exam) => [exam.categorySlug, exam.category] as const)).entries()] : [], [path]);
  const visible = path?.exams.filter((exam) => (levelSlug === "all" || exam.levelSlug === levelSlug) && (topicSlug === "all" || exam.categorySlug === topicSlug)) ?? [];
  function choosePath(slug: string) { setPathSlug(slug); setLevelSlug("all"); setTopicSlug("all"); }
  return <div className="exam-discovery"> <div className="exam-path-tabs" role="tablist" aria-label="مسیرهای یادگیری">{paths.map((item) => <button type="button" key={item.slug} role="tab" aria-selected={item.slug === path?.slug} className={item.slug === path?.slug ? "is-active" : undefined} onClick={() => choosePath(item.slug)}>{item.name}</button>)}</div>{path && <><div className="exam-filters"><div><span>سطح / حوزه</span><div className="exam-filter-chips"><button type="button" className={levelSlug === "all" ? "is-active" : undefined} onClick={() => setLevelSlug("all")}>همه</button>{levels.map(([slug, name]) => <button type="button" key={slug} className={levelSlug === slug ? "is-active" : undefined} onClick={() => setLevelSlug(slug)}>{name}</button>)}</div></div><div><span>زیرشاخه</span><div className="exam-filter-chips exam-filter-chips--topics"><button type="button" className={topicSlug === "all" ? "is-active" : undefined} onClick={() => setTopicSlug("all")}>همه</button>{topics.map(([slug, name]) => <button type="button" key={slug} className={`exam-topic-chip exam-topic-chip--${chipThemes[slug] ?? "mint"}${topicSlug === slug ? " is-active" : ""}`} onClick={() => setTopicSlug(slug)}>{labelFor(slug, name)}</button>)}</div></div></div><Carousel path={path} exams={visible} /></>}</div>;
}
