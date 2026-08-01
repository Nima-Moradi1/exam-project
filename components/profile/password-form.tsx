"use client";

import { useState } from "react";

import { changeOwnPassword } from "@/lib/auth/actions";

export function PasswordForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await changeOwnPassword({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword")
    });
    setMessage(result.ok ? "رمز عبور تغییر کرد. برای ادامه دوباره وارد شوید." : result.message);
    setPending(false);
  }
  return (
    <form className="auth-form" action={onSubmit}>
      <label htmlFor="currentPassword">رمز عبور فعلی</label>
      <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      <label htmlFor="newPassword">رمز عبور جدید</label>
      <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={10} required />
      <label htmlFor="confirmPassword">تکرار رمز عبور جدید</label>
      <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required />
      {message && <p role="status">{message}</p>}
      <button className="primary-button" disabled={pending} type="submit">{pending ? "در حال ذخیره…" : "تغییر رمز عبور"}</button>
    </form>
  );
}
