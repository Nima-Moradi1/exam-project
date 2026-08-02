"use client";

import { AlertIcon, RefreshIcon } from "@/components/icons";
import { AppButton } from "@/components/ui/form-controls";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="empty-screen page-shell">
      <AlertIcon />
      <h1>مشکلی در نمایش آزمون پیش آمد</h1>
      <p>اطلاعات شما در مرورگر حفظ شده است. دوباره تلاش کنید.</p>
      <AppButton className="primary-button" onPress={reset}>
        <RefreshIcon />
        تلاش دوباره
      </AppButton>
    </main>
  );
}
