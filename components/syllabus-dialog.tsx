"use client";

import { CheckIcon, ListIcon } from "@/components/icons";
import { AppModal } from "@/components/ui/app-modal";
import { AppButton } from "@/components/ui/form-controls";
import type { ExamSyllabus } from "@/lib/exam-syllabi";

interface SyllabusDialogProps {
  syllabus: ExamSyllabus;
  onClose: () => void;
}

export function SyllabusDialog({ syllabus, onClose }: SyllabusDialogProps) {
  return (
    <AppModal className="syllabus-dialog" footer={<AppButton className="primary-button" onPress={onClose}>متوجه شدم</AppButton>} isOpen onOpenChange={(isOpen) => { if (!isOpen) onClose(); }} title={<span className="syllabus-dialog__heading"><span><ListIcon /></span><span><small>پیش از شروع آزمون</small>{syllabus.title}</span></span>}>
      <p className="syllabus-dialog__intro">این آزمون مهارت‌های زیر را بررسی می‌کند:</p>
      <ul className="syllabus-dialog__items">
        {syllabus.items.map((item) => <li key={item}><CheckIcon />{item}</li>)}
      </ul>
    </AppModal>
  );
}
