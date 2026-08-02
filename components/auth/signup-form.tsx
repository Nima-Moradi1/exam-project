"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { registerUser } from "@/lib/auth/actions";
import { AppButton, AppTextField } from "@/components/ui/form-controls";

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
      <AppTextField fieldClassName="auth-form__field" id="displayName" label={<>نام نمایشی (اختیاری)</>} name="displayName" autoComplete="name" maxLength={120} />
      <AppTextField fieldClassName="auth-form__field" id="username" label="نام کاربری" name="username" autoComplete="username" required minLength={3} maxLength={30} pattern="[a-z0-9_-]+" dir="ltr" />
      <AppTextField fieldClassName="auth-form__field" id="email" label="ایمیل" name="email" type="email" autoComplete="email" required dir="ltr" />
      <AppTextField fieldClassName="auth-form__field" id="password" label="رمز عبور" name="password" type="password" autoComplete="new-password" required minLength={10} />
      <p className="form-hint">حداقل ۱۰ نویسه و شامل دست‌کم سه نوع از حروف کوچک، بزرگ، عدد یا نماد.</p>
      <AppTextField fieldClassName="auth-form__field" id="confirmPassword" label="تکرار رمز عبور" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} />
      <label className="checkbox-label"><input name="acceptedTerms" type="checkbox" required /> <span>شرایط استفاده را می‌پذیرم.</span></label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <AppButton className="primary-button" isDisabled={pending} type="submit">{pending ? "در حال ساخت حساب…" : "ساخت حساب"}</AppButton>
      <p className="form-hint">حساب دارید؟ <Link href="/login">وارد شوید</Link></p>
    </form>
  );
}
