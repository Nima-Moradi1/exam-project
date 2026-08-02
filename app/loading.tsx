import { CodeIcon } from "@/components/icons";

export default function Loading() {
  return (
    <main className="loading-screen" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری</span>
      <div className="app-loader" aria-hidden="true">
        <i className="app-loader__halo app-loader__halo--outer" />
        <i className="app-loader__halo app-loader__halo--inner" />
        <i className="app-loader__spark app-loader__spark--one" />
        <i className="app-loader__spark app-loader__spark--two" />
        <span className="app-loader__mark"><CodeIcon /></span>
      </div>
    </main>
  );
}
