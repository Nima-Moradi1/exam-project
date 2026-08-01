"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const result = await signIn("credentials", {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
      redirectTo: callbackUrl
    });
    if (!result?.ok) {
      setError("نام کاربری یا رمز عبور نادرست است.");
      setPending(false);
      return;
    }
    window.location.assign(result.url || callbackUrl);
  }

  return (
    <form action={onSubmit} className="auth-form" noValidate>
      <label htmlFor="username">نام کاربری</label>
      <input id="username" name="username" autoComplete="username" required minLength={3} />
      <label htmlFor="password">رمز عبور</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="primary-button" disabled={pending} type="submit">{pending ? "در حال ورود…" : "ورود"}</button>
      {googleEnabled && <button className="secondary-button" type="button" onClick={() => void signIn("google", { redirectTo: callbackUrl })}>ادامه با Google</button>}
    </form>
  );
}
