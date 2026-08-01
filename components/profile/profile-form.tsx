"use client";

import { useState } from "react";

import { updateOwnProfile } from "@/lib/auth/actions";

export function ProfileForm({ profile }: { profile: { displayName: string; bio: string | null; preferredLocale: "fa" | "en"; timezone: string | null } }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await updateOwnProfile({
      displayName: formData.get("displayName"),
      bio: formData.get("bio"),
      preferredLocale: formData.get("preferredLocale"),
      timezone: formData.get("timezone")
    });
    setMessage(result.ok ? "پروفایل به‌روزرسانی شد." : result.message);
    setPending(false);
  }
  return (
    <form className="auth-form" action={onSubmit}>
      <label htmlFor="displayName">نام نمایشی</label>
      <input id="displayName" name="displayName" required defaultValue={profile.displayName} />
      <label htmlFor="bio">دربارهٔ من</label>
      <textarea id="bio" name="bio" maxLength={1000} defaultValue={profile.bio ?? ""} />
      <label htmlFor="preferredLocale">زبان ترجیحی</label>
      <select id="preferredLocale" name="preferredLocale" defaultValue={profile.preferredLocale}><option value="fa">فارسی</option><option value="en">English</option></select>
      <label htmlFor="timezone">منطقهٔ زمانی</label>
      <input id="timezone" name="timezone" maxLength={80} defaultValue={profile.timezone ?? ""} placeholder="Asia/Tehran" dir="ltr" />
      {message && <p role="status">{message}</p>}
      <button className="primary-button" disabled={pending} type="submit">{pending ? "در حال ذخیره…" : "ذخیرهٔ تغییرات"}</button>
    </form>
  );
}
