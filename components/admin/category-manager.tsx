"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { ADMIN_PAGE_SIZE, getTotalPages } from "@/lib/admin/pagination";
import { archiveCategory, createCategory, reorderCategory } from "@/lib/categories/mutations";
import type { AdminCategoryFilters, CategoryTreeNode } from "@/lib/categories/queries";

type CategoryRow = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  locale: string;
  direction: "AUTO" | "LTR" | "RTL";
  status: "ACTIVE" | "HIDDEN" | "ARCHIVED";
  parentName: string | null;
};

function flatten(nodes: CategoryTreeNode[], depth = 0): Array<CategoryTreeNode & { depth: number }> {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flatten(node.children, depth + 1)]);
}

function statusInfo(status: CategoryRow["status"]) {
  return status === "ACTIVE" ? { label: "فعال", tone: "success" } : status === "HIDDEN" ? { label: "مخفی", tone: "warning" } : { label: "بایگانی", tone: "neutral" };
}

export function CategoryManager({ tree, items, page, total, filters }: { tree: CategoryTreeNode[]; items: CategoryRow[]; page: number; total: number; filters: AdminCategoryFilters }) {
  const [message, setMessage] = useState("");
  const [messageIsSuccess, setMessageIsSuccess] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const parentOptions = useMemo(() => flatten(tree), [tree]);
  const totalPages = getTotalPages(total);
  const hasFilters = Boolean(filters.query) || filters.kind === "root" || filters.kind === "child";

  useEffect(() => {
    if (!isCreateOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsCreateOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isCreateOpen]);

  function run(action: () => Promise<{ ok: boolean; message?: string }>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? "تغییرات ذخیره شد." : result.message ?? "تغییرات ذخیره نشد.");
      setMessageIsSuccess(result.ok);
      if (result.ok) onSuccess?.();
    });
  }

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (filters.query) params.set("query", filters.query);
    if (filters.kind && filters.kind !== "all") params.set("kind", filters.kind);
    params.set("page", String(nextPage));
    return `?${params.toString()}`;
  }

  return (
    <div className="admin-stack category-manager">
      <div className="category-manager__toolbar">
        <form className="category-filters" action="/admin/categories" method="get">
          <label>جست‌وجو بر اساس نام یا اسلاگ<input name="query" type="search" defaultValue={filters.query ?? ""} placeholder="مثلاً Reading" /></label>
          <label>نوع دسته<select name="kind" defaultValue={filters.kind ?? "all"}><option value="all">همهٔ دسته‌ها</option><option value="root">فقط دسته‌های اصلی</option><option value="child">فقط زیرمجموعه‌ها</option></select></label>
          <button className="secondary-button" type="submit">اعمال فیلتر</button>
          {hasFilters && <Link className="category-filters__reset" href="/admin/categories">پاک کردن</Link>}
        </form>
        <button className="primary-button category-create-trigger" type="button" onClick={() => setIsCreateOpen(true)}>+ دسته‌بندی جدید</button>
      </div>

      {message && <p role="status" className={messageIsSuccess ? "form-success" : "form-error"}>{messageIsSuccess && <span aria-hidden="true">✓</span>}<span>{message}</span></p>}

      <section className="admin-data-grid category-data-grid" aria-label="فهرست دسته‌بندی‌ها">
        <div className="admin-data-grid__meta"><span>{total ? `نمایش ${((page - 1) * ADMIN_PAGE_SIZE + 1).toLocaleString("fa-IR")} تا ${Math.min(page * ADMIN_PAGE_SIZE, total).toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")}` : "موردی برای نمایش نیست"}</span><span>دسته‌بندی‌ها</span></div>
        <div className="admin-data-grid__viewport">
          <table>
            <thead><tr><th scope="col">دسته‌بندی</th><th scope="col">سطح</th><th scope="col">دستهٔ والد</th><th scope="col">وضعیت</th><th scope="col">عملیات</th></tr></thead>
            <tbody>{items.length ? items.map((item) => {
              const status = statusInfo(item.status);
              return <tr key={item.id}><td><div className={`category-row__identity${item.parentId ? " category-row__identity--child" : ""}`}><span className="category-row__marker" aria-hidden="true" /><div><strong>{item.name}</strong><small dir="ltr">/{item.slug}</small></div></div></td><td><span className={`admin-badge admin-badge--${item.parentId ? "info" : "neutral"}`}>{item.parentId ? "زیرمجموعه" : "دستهٔ اصلی"}</span></td><td>{item.parentName ?? <span className="category-row__root">—</span>}</td><td><span className={`admin-badge admin-badge--${status.tone}`}>{status.label}</span></td><td><div className="category-row__actions"><button type="button" onClick={() => run(() => reorderCategory({ categoryId: item.id, direction: "up" }))} disabled={pending} aria-label={`انتقال ${item.name} به بالا`}>↑</button><button type="button" onClick={() => run(() => reorderCategory({ categoryId: item.id, direction: "down" }))} disabled={pending} aria-label={`انتقال ${item.name} به پایین`}>↓</button><button type="button" onClick={() => run(() => archiveCategory(item.id))} disabled={pending}>بایگانی</button></div></td></tr>;
            }) : <tr><td className="admin-data-grid__empty" colSpan={5}>دسته‌بندی مطابق فیلترهای انتخابی پیدا نشد.</td></tr>}</tbody>
          </table>
        </div>
        {totalPages > 1 && <nav className="admin-data-grid__pagination" aria-label="صفحه‌بندی دسته‌بندی‌ها"><Link className={page <= 1 ? "is-disabled" : undefined} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} href={pageHref(Math.max(1, page - 1))}>قبلی</Link><span>صفحهٔ {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span><Link className={page >= totalPages ? "is-disabled" : undefined} aria-disabled={page >= totalPages} tabIndex={page >= totalPages ? -1 : undefined} href={pageHref(Math.min(totalPages, page + 1))}>بعدی</Link></nav>}
      </section>

      {isCreateOpen && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsCreateOpen(false); }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="create-category-title"><div className="admin-modal__heading"><div><span className="eyebrow"><i /> محتوا</span><h2 id="create-category-title">دسته‌بندی جدید</h2><p>سطح والد را انتخاب کنید تا این مورد در جای درست ساختار قرار بگیرد.</p></div><button type="button" className="admin-modal__close" onClick={() => setIsCreateOpen(false)} aria-label="بستن">×</button></div><form className="admin-form" action={(formData) => run(() => createCategory({ name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description"), parentId: formData.get("parentId") || null, locale: formData.get("locale"), direction: formData.get("direction"), sortOrder: 0 }), () => setIsCreateOpen(false))}><label>نام<input name="name" required maxLength={160} /></label><label>اسلاگ<input name="slug" required dir="ltr" pattern="[a-z0-9-]+" /></label><label>والد<select name="parentId"><option value="">دستهٔ ریشه</option>{parentOptions.map((item) => <option key={item.id} value={item.id}>{"— ".repeat(item.depth)}{item.name}</option>)}</select></label><label>زبان<select name="locale" defaultValue="fa"><option value="fa">فارسی</option><option value="en">English</option></select></label><label>جهت<select name="direction" defaultValue="AUTO"><option value="AUTO">خودکار</option><option value="RTL">راست‌به‌چپ</option><option value="LTR">چپ‌به‌راست</option></select></label><label className="admin-form__full">توضیح<textarea name="description" maxLength={2000} /></label><div className="admin-modal__actions"><button className="secondary-button" type="button" onClick={() => setIsCreateOpen(false)} disabled={pending}>انصراف</button><button className="primary-button" type="submit" disabled={pending}>{pending ? "در حال ایجاد…" : "ایجاد دسته‌بندی"}</button></div></form></section></div>}
    </div>
  );
}
