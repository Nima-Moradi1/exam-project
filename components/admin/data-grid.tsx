import Link from "next/link";
import type { ReactNode } from "react";

import { ADMIN_PAGE_SIZE, getTotalPages } from "@/lib/admin/pagination";

type AdminDataGridProps = {
  columns: string[];
  children: ReactNode;
  emptyMessage: string;
  itemName: string;
  page: number;
  total: number;
};

export function AdminDataGrid({ columns, children, emptyMessage, itemName, page, total }: AdminDataGridProps) {
  const totalPages = getTotalPages(total);
  const hasRows = total > 0;
  const from = hasRows ? (page - 1) * ADMIN_PAGE_SIZE + 1 : 0;
  const to = Math.min(page * ADMIN_PAGE_SIZE, total);

  return (
    <section className="admin-data-grid" aria-label={itemName}>
      <div className="admin-data-grid__meta">
        <span>{hasRows ? `نمایش ${from.toLocaleString("fa-IR")} تا ${to.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")}` : "موردی برای نمایش نیست"}</span>
        <span>{itemName}</span>
      </div>
      <div className="admin-data-grid__viewport">
        <table>
          <thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
          <tbody>{hasRows ? children : <tr><td className="admin-data-grid__empty" colSpan={columns.length}>{emptyMessage}</td></tr>}</tbody>
        </table>
      </div>
      {totalPages > 1 && <nav className="admin-data-grid__pagination" aria-label={`صفحه‌بندی ${itemName}`}>
        <Link className={page <= 1 ? "is-disabled" : undefined} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} href={`?page=${Math.max(1, page - 1)}`}>قبلی</Link>
        <span>صفحهٔ {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span>
        <Link className={page >= totalPages ? "is-disabled" : undefined} aria-disabled={page >= totalPages} tabIndex={page >= totalPages ? -1 : undefined} href={`?page=${Math.min(totalPages, page + 1)}`}>بعدی</Link>
      </nav>}
    </section>
  );
}

export function AdminBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>;
}
