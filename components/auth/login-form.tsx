"use client";

import { GoogleIcon } from "@/components/icons";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

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
      <div className="auth-form__field"><label htmlFor="username">{adminLogin ? "نام کاربری مدیر" : "نام کاربری"}</label><input id="username" name="username" autoComplete="username" required minLength={3} /></div>
      <div className="auth-form__field"><label htmlFor="password">رمز عبور</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {loginError && <p role="alert" className="form-error">{loginError}</p>}
      <div className="auth-form__actions">
        <button className="primary-button" disabled={pending} type="submit">{pending ? "در حال ورود…" : adminLogin ? "ورود به پنل مدیریت" : "ورود"}</button>
        {googleEnabled && <button className="secondary-button" type="button" onClick={() => void signIn("google", { redirectTo: callbackUrl })}><GoogleIcon /> ادامه با گوگل</button>}
      </div>
    </form>
  );
}
