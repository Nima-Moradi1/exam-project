"use client";

import { CheckIcon, ListIcon } from "@/components/icons";
import type { ExamSyllabus } from "@/lib/exam-syllabi";

interface SyllabusDialogProps {
  syllabus: ExamSyllabus;
  onClose: () => void;
}

export function SyllabusDialog({ syllabus, onClose }: SyllabusDialogProps) {
  return (
    <div className="dialog-backdrop syllabus-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="syllabus-dialog" role="dialog" aria-modal="true" aria-labelledby="syllabus-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="syllabus-dialog__heading">
          <span><ListIcon /></span>
          <div><p>پیش از شروع آزمون</p><h2 id="syllabus-title">{syllabus.title}</h2></div>
        </div>
        <p className="syllabus-dialog__intro">این آزمون مهارت‌های زیر را بررسی می‌کند:</p>
        <ul>
          {syllabus.items.map((item) => <li key={item}><CheckIcon />{item}</li>)}
        </ul>
        <button className="primary-button" type="button" onClick={onClose}>متوجه شدم</button>
      </section>
    </div>
  );
}
