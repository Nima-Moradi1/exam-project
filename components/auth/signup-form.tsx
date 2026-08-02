"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { registerUser } from "@/lib/auth/actions";
import { AppButton, AppTextField } from "@/components/ui/form-controls";
import { GoogleIcon } from "@/components/icons";

const Required = ({ children }: { children: string }) => <>{children} <span className="required-mark" aria-hidden="true">*</span></>;

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
      <AppTextField fieldClassName="auth-form__field" id="username" label={<Required>نام کاربری</Required>} name="username" autoComplete="username" required minLength={3} maxLength={30} pattern="[a-z0-9_-]+" dir="ltr" />
      <AppTextField fieldClassName="auth-form__field auth-form__field--full" id="email" label={<Required>ایمیل</Required>} name="email" type="email" autoComplete="email" required dir="ltr" />
      <AppTextField fieldClassName="auth-form__field" id="password" label={<Required>رمز عبور</Required>} name="password" type="password" autoComplete="new-password" required minLength={10} />
      <p className="form-hint">حداقل ۱۰ نویسه و شامل دست‌کم سه نوع از حروف کوچک، بزرگ، عدد یا نماد.</p>
      <AppTextField fieldClassName="auth-form__field" id="confirmPassword" label={<Required>تکرار رمز عبور</Required>} name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} />
      <label className="checkbox-label"><input name="acceptedTerms" type="checkbox" required checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /> <span>شرایط استفاده را می‌پذیرم <span className="required-mark" aria-hidden="true">*</span></span></label>
      {!acceptedTerms && <p className="form-hint form-hint--terms">برای ساخت حساب، ابتدا شرایط استفاده را بپذیرید.</p>}
      {error && <p role="alert" className="form-error">{error}</p>}
      <AppButton className="primary-button" isDisabled={pending || !acceptedTerms} type="submit">{pending ? "در حال ساخت حساب…" : "ساخت حساب"}</AppButton>
      {googleEnabled && <AppButton className="secondary-button auth-form__google" tone="secondary" type="button" onPress={() => void signIn("google", { redirectTo: "/profile/edit?welcome=1" })}><GoogleIcon /> ثبت‌نام با گوگل</AppButton>}
      <p className="form-hint">حساب دارید؟ <Link href="/login">وارد شوید</Link></p>
    </form>
  );
}
