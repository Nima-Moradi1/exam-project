"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function getSafeCallbackUrl(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
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
      className="auth-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new FormData(event.currentTarget));
      }}
    >
      <label htmlFor="username">نام کاربری</label>
      <input id="username" name="username" autoComplete="username" required minLength={3} />
      <label htmlFor="password">رمز عبور</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {loginError && <p role="alert" className="form-error">{loginError}</p>}
      <button className="primary-button" disabled={pending} type="submit">{pending ? "در حال ورود…" : "ورود"}</button>
      {googleEnabled && <button className="secondary-button" type="button" onClick={() => void signIn("google", { redirectTo: callbackUrl })}>ادامه با Google</button>}
    </form>
  );
}
