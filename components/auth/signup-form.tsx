"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { registerUser } from "@/lib/auth/actions";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const result = await registerUser({
      username: formData.get("username"),
      email: formData.get("email"),
      displayName: formData.get("displayName"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      acceptedTerms: formData.get("acceptedTerms") === "on"
    });
    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <form
      className="auth-form auth-form--signup"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new FormData(event.currentTarget));
      }}
    >
      <div className="auth-form__field"><label htmlFor="displayName">نام نمایشی <span aria-hidden="true">(اختیاری)</span></label><input id="displayName" name="displayName" autoComplete="name" maxLength={120} /></div>
      <div className="auth-form__field"><label htmlFor="username">نام کاربری</label><input id="username" name="username" autoComplete="username" required minLength={3} maxLength={30} pattern="[a-z0-9_-]+" dir="ltr" /></div>
      <div className="auth-form__field"><label htmlFor="email">ایمیل</label><input id="email" name="email" type="email" autoComplete="email" required dir="ltr" /></div>
      <div className="auth-form__field"><label htmlFor="password">رمز عبور</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} /></div>
      <p className="form-hint">حداقل ۱۰ نویسه و شامل دست‌کم سه نوع از حروف کوچک، بزرگ، عدد یا نماد.</p>
      <div className="auth-form__field"><label htmlFor="confirmPassword">تکرار رمز عبور</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} /></div>
      <label className="checkbox-label"><input name="acceptedTerms" type="checkbox" required /> <span>شرایط استفاده را می‌پذیرم.</span></label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="primary-button" disabled={pending} type="submit">{pending ? "در حال ساخت حساب…" : "ساخت حساب"}</button>
      <p className="form-hint">حساب دارید؟ <Link href="/login">وارد شوید</Link></p>
    </form>
  );
}
