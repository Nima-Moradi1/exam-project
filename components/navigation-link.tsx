"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";

type NavigationLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
  "aria-label"?: string;
};

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

export function NavigationLink({ href, children, className, onNavigate, ...props }: NavigationLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  function prefetch() {
    router.prefetch(href);
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (href.startsWith("/#") && pathname === "/") return;
    if (event.defaultPrevented || isModifiedClick(event) || isNavigating) {
      if (isNavigating) event.preventDefault();
      return;
    }

    event.preventDefault();
    setIsNavigating(true);
    onNavigate?.();
    router.push(href);
  }

  return (
    <Link
      {...props}
      href={href}
      className={`${className ?? ""}${isNavigating ? " is-navigating" : ""}`.trim()}
      aria-busy={isNavigating}
      aria-disabled={isNavigating}
      onClick={navigate}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      {children}
      {isNavigating ? <span className="navigation-link__spinner" aria-hidden="true" /> : null}
    </Link>
  );
}
