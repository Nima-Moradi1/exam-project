import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true
};

export function CodeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M14 4l-4 16" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z" />
    </svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M21.8 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.5a4.7 4.7 0 0 1-2.04 3.08v2.52h3.31c1.94-1.78 3.03-4.4 3.03-7.43Z" />
      <path fill="#34A853" d="M12 22c2.75 0 5.06-.91 6.75-2.34l-3.31-2.52c-.92.62-2.1.99-3.44.99-2.65 0-4.9-1.79-5.7-4.19H2.88v2.6A10.2 10.2 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.3 13.94A6.13 6.13 0 0 1 6 12c0-.67.12-1.32.3-1.94v-2.6H2.88A10 10 0 0 0 1.8 12c0 1.61.39 3.13 1.08 4.54l3.42-2.6Z" />
      <path fill="#EA4335" d="M12 5.87c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 2.84 14.75 2 12 2a10.2 10.2 0 0 0-9.12 5.46l3.42 2.6C7.1 7.66 9.35 5.87 12 5.87Z" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 21V4m0 0h10l-1 3 1 3H5" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.3 3.6 2.5 17.1A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.9L13.7 3.6a2 2 0 0 0-3.4 0ZM12 9v4m0 3h.01" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6.1 9A7 7 0 0 1 18 6l2 6M18 15a7 7 0 0 1-11.9 3L4 12" />
    </svg>
  );
}

export function GithubIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 22v-3.9c.04-1-.33-1.97-1.04-2.68 3.42-.38 7.02-1.68 7.02-7.56a5.9 5.9 0 0 0-1.56-4.1A5.47 5.47 0 0 0 19.27.9S18 0 15 1.95a14.67 14.67 0 0 0-6 0C6 0 4.73.9 4.73.9a5.47 5.47 0 0 0-.15 2.86A5.9 5.9 0 0 0 3.02 7.9c0 5.87 3.59 7.17 7.01 7.55A3.77 3.77 0 0 0 9 18.36V22" />
      <path d="M9 19c-3 .9-3-1.5-4.2-1.8" />
    </svg>
  );
}

export function LinkedinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function TelegramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m22 3-7.2 18-4.15-7.15L3.5 10.5 22 3Z" />
      <path d="m10.65 13.85 3.2-3.05" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m3 6 9 7 9-7" /></svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}><path d="M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.64-3.08 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.14 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.65 2.63a2 2 0 0 1-.45 2.11L8.03 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.31 1.73.53 2.63.65A2 2 0 0 1 22 16.9Z" /></svg>
  );
}
