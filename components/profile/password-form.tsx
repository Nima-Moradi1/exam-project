"use client";

import { useState } from "react";

import { changeOwnPassword } from "@/lib/auth/actions";
import { AppButton, AppTextField } from "@/components/ui/form-controls";

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
      <AppTextField id="currentPassword" label="رمز عبور فعلی" name="currentPassword" type="password" autoComplete="current-password" required />
      <AppTextField id="newPassword" label="رمز عبور جدید" name="newPassword" type="password" autoComplete="new-password" minLength={10} required />
      <AppTextField id="confirmPassword" label="تکرار رمز عبور جدید" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required />
      {message && <p role="status">{message}</p>}
      <AppButton className="primary-button" isDisabled={pending} type="submit">{pending ? "در حال ذخیره…" : "تغییر رمز عبور"}</AppButton>
    </form>
  );
}
