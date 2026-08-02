"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type NavigationLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
  "aria-label"?: string;
  "aria-current"?: "page";
};

export function NavigationLink({ href, children, className, onNavigate, ...props }: NavigationLinkProps) {
  const router = useRouter();

  function prefetch() {
    router.prefetch(href);
  }

  return (
    <Link
      {...props}
      href={href}
      className={className}
      onClick={onNavigate}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      {children}
    </Link>
  );
}
