"use client";

import { GoogleIcon } from "@/components/icons";
import { AppButton, AppTextField } from "@/components/ui/form-controls";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const Required = ({ children }: { children: string }) => <>{children} <span className="required-mark" aria-hidden="true">*</span></>;

function getSafeCallbackUrl(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function LoginForm({ googleEnabled, adminLogin = false }: { googleEnabled: boolean; adminLogin?: boolean }) {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const loginError = error || (searchParams.get("error") ? "نام کاربری یا رمز عبور نادرست است." : "");

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    try {
      await signIn("credentials", {
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirectTo: callbackUrl
      });
    } catch {
      setError("ورود انجام نشد. دوباره تلاش کنید.");
      setPending(false);
    }
  }

  return (
    <form
      className={`auth-form auth-form--login${adminLogin ? " auth-form--admin" : ""}`}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new FormData(event.currentTarget));
      }}
    >
      <AppTextField fieldClassName="auth-form__field" id="username" label={<Required>{adminLogin ? "نام کاربری مدیر" : "نام کاربری"}</Required>} name="username" autoComplete="username" required minLength={3} />
      <AppTextField fieldClassName="auth-form__field" id="password" label={<Required>رمز عبور</Required>} name="password" type="password" autoComplete="current-password" required />
      {loginError && <p role="alert" className="form-error">{loginError}</p>}
      <div className="auth-form__actions">
        <AppButton className="primary-button" isDisabled={pending} type="submit">{pending ? "در حال ورود…" : adminLogin ? "ورود به پنل مدیریت" : "ورود"}</AppButton>
        {googleEnabled && <AppButton className="secondary-button" tone="secondary" type="button" onPress={() => void signIn("google", { redirectTo: callbackUrl })}><GoogleIcon /> ادامه با گوگل</AppButton>}
      </div>
    </form>
  );
}
