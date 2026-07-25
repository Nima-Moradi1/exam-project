"use client";

import { AlertIcon, RefreshIcon } from "@/components/icons";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="empty-screen page-shell">
      <AlertIcon />
      <h1>مشکلی در نمایش آزمون پیش آمد</h1>
      <p>اطلاعات شما در مرورگر حفظ شده است. دوباره تلاش کنید.</p>
      <button className="primary-button" type="button" onClick={reset}>
        <RefreshIcon />
        تلاش دوباره
      </button>
    </main>
  );
}
