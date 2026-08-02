"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createExamRequest } from "@/lib/exam-requests/actions";
import { AppButton, AppTextArea, AppTextField } from "@/components/ui/form-controls";

export function ExamRequestForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    setPending(true); setMessage("");
    const result = await createExamRequest({ title: formData.get("title"), subject: formData.get("subject"), level: formData.get("level"), description: formData.get("description") });
    if (!result.ok) { setMessage(result.message); setPending(false); return; }
    router.push("/profile/exam-requests?submitted=1");
  }
  return <form className="exam-request-form" action={submit}>
    <div className="exam-request-form__intro"><span className="eyebrow"><i /> درخواست جدید</span><h1>آزمون دلخواهت را پیشنهاد بده</h1><p>موضوع، سطح و نیازت را بنویس؛ تیم محتوا درخواست را بررسی می‌کند و نتیجه در پروفایل شما قابل پیگیری است.</p></div>
    <div className="exam-request-form__grid"><AppTextField fieldClassName="exam-request-form__full" id="request-title" name="title" label="عنوان درخواست" placeholder="مثلاً آزمون جامع React پیشرفته" required maxLength={180} /><AppTextField id="request-subject" name="subject" label="موضوع یا مهارت" placeholder="مثلاً React، روان‌شناسی شناختی یا زبان" required maxLength={160} /><AppTextField id="request-level" name="level" label="سطح پیشنهادی (اختیاری)" placeholder="مبتدی، متوسط یا پیشرفته" maxLength={80} /><AppTextArea fieldClassName="exam-request-form__full" id="request-description" name="description" label="جزئیات موردنیاز" placeholder="نوع آزمون، منابع پیشنهادی، بخش‌هایی که می‌خواهید پوشش داده شود و هدف خود را بنویسید." required maxLength={3000} rows={7} /></div>
    {message && <p className="form-error" role="alert">{message}</p>}
    <AppButton className="primary-button exam-request-form__submit" type="submit" isDisabled={pending}>{pending ? "در حال ارسال…" : "ارسال درخواست"}</AppButton>
  </form>;
}
