"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { updateOwnProfile } from "@/lib/auth/actions";
import { AppButton, AppSelect, AppTextArea, AppTextField } from "@/components/ui/form-controls";

export function ProfileForm({ profile }: { profile: { displayName: string; bio: string | null; preferredLocale: "fa" | "en"; timezone: string | null } }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => router.replace("/profile"), 1500);
    return () => window.clearTimeout(timer);
  }, [router, saved]);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setSaved(false);
    const result = await updateOwnProfile({
      displayName: formData.get("displayName"),
      bio: formData.get("bio"),
      preferredLocale: formData.get("preferredLocale"),
      timezone: formData.get("timezone")
    });
    setMessage(result.ok ? "تغییرات با موفقیت ذخیره شد؛ پروفایل شما آماده است." : result.message);
    setSaved(result.ok);
    setPending(false);
  }
  return (
    <form className="auth-form" action={onSubmit}>
      <AppTextField id="displayName" label="نام نمایشی" name="displayName" required defaultValue={profile.displayName} />
      <AppTextArea id="bio" label="دربارهٔ من" name="bio" maxLength={1000} defaultValue={profile.bio ?? ""} />
      <AppSelect defaultValue={profile.preferredLocale} label="زبان ترجیحی" name="preferredLocale" options={[{ value: "fa", label: "فارسی" }, { value: "en", label: "English" }]} />
      <AppTextField id="timezone" label="منطقهٔ زمانی" name="timezone" maxLength={80} defaultValue={profile.timezone ?? ""} placeholder="Asia/Tehran" dir="ltr" />
      {message && <p role="status" className={saved ? "form-success" : "form-error"}>{saved && <span aria-hidden="true">✓</span>}<span>{message}</span>{saved && <small>بازگشت به حساب کاربری…</small>}</p>}
      <AppButton className="primary-button" isDisabled={pending || saved} type="submit">{pending ? "در حال ذخیره…" : saved ? "ذخیره شد" : "ذخیرهٔ تغییرات"}</AppButton>
    </form>
  );
}
