"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ArrowIcon } from "@/components/icons";
import { NavigationLink } from "@/components/navigation-link";
import type { ExamCardTheme } from "@/lib/exams/presentation";

type SliderExam = {
  href: string;
  label: string;
  description: string;
  detail: string;
  accent: ExamCardTheme;
};

export type ExamCategory = {
  name: string;
  exams: SliderExam[];
};

const AUTO_ADVANCE_DELAY = 6500;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ExamCategorySlider({ category, index }: { category: ExamCategory; index: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const categoryId = `exam-category-${index}`;
  const canNavigate = category.exams.length > 1;
  const canAutoAdvance = category.exams.length > 2;

  const goTo = useCallback((nextIndex: number) => {
    const normalizedIndex = (nextIndex + category.exams.length) % category.exams.length;
    setActiveIndex(normalizedIndex);
    const viewport = viewportRef.current;
    const item = itemRefs.current[normalizedIndex];
    if (!viewport || !item) return;
    // Keep the motion inside the horizontal carousel; never scroll the document.
    const distance = item.getBoundingClientRect().left - viewport.getBoundingClientRect().left;
    viewport.scrollBy({ left: distance, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [category.exams.length]);

  useEffect(() => {
    if (!canAutoAdvance || isPaused || prefersReducedMotion()) return;

    const timer = window.setInterval(() => goTo(activeIndex + 1), AUTO_ADVANCE_DELAY);
    return () => window.clearInterval(timer);
  }, [activeIndex, canAutoAdvance, goTo, isPaused]);

  return (
    <section
      className={`exam-category-slider${canNavigate ? "" : " exam-category-slider--single"}`}
      aria-labelledby={categoryId}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
      }}
    >
      <div className="exam-category-slider__heading">
        <div>
          <span className="exam-category-slider__overline">دسته‌بندی آزمون</span>
          <h3 id={categoryId}>{category.name}</h3>
        </div>
        <div className="exam-category-slider__tools">
          <span className="exam-category-slider__count">{category.exams.length.toLocaleString("fa-IR")} آزمون</span>
          {canNavigate && (
            <div className="exam-category-slider__controls" aria-label={`پیمایش آزمون‌های ${category.name}`}>
              <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="آزمون قبلی">
                <ArrowIcon className="exam-category-slider__previous-icon" />
              </button>
              <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="آزمون بعدی">
                <ArrowIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      <div ref={viewportRef} className="exam-category-slider__viewport" role="region" aria-roledescription="carousel" aria-label={`آزمون‌های ${category.name}`}>
        <div className="exam-category-slider__track">
          {category.exams.map((exam, examIndex) => (
            <article
              className={`hub-exam-card exam-card--${exam.accent}`}
              key={exam.href}
              ref={(element) => {
                itemRefs.current[examIndex] = element;
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${(examIndex + 1).toLocaleString("fa-IR")} از ${category.exams.length.toLocaleString("fa-IR")}`}
            >
              <span className="hub-exam-card__label">{category.name}</span>
              <h4>{exam.label}</h4>
              <p>{exam.description}</p>
              <div>
                <span>{exam.detail}</span>
                <NavigationLink className="hub-exam-card__action" href={exam.href} aria-label={`مشاهده و شروع ${exam.label}`}>
                  مشاهده و شروع <ArrowIcon className="hub-exam-card__action-icon" />
                </NavigationLink>
              </div>
            </article>
          ))}
        </div>
      </div>

      {canNavigate && (
        <div className="exam-category-slider__dots" aria-label={`انتخاب آزمون از دسته ${category.name}`}>
          {category.exams.map((exam, examIndex) => (
            <button
              key={exam.href}
              type="button"
              className={examIndex === activeIndex ? "is-active" : undefined}
              onClick={() => goTo(examIndex)}
              aria-label={`نمایش آزمون ${(examIndex + 1).toLocaleString("fa-IR")}`}
              aria-current={examIndex === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function ExamCategorySliders({ categories }: { categories: ExamCategory[] }) {
  return <div className="exam-category-sliders">{categories.map((category, index) => <ExamCategorySlider key={category.name} category={category} index={index} />)}</div>;
}
