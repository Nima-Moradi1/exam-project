"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

import { ADMIN_PAGE_SIZE, getTotalPages } from "@/lib/admin/pagination";
import { archiveCategory, createCategory, reorderCategory } from "@/lib/categories/mutations";
import type { CategoryTreeNode } from "@/lib/categories/queries";

function flatten(nodes: CategoryTreeNode[], depth = 0): Array<CategoryTreeNode & { depth: number }> {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flatten(node.children, depth + 1)]);
}

type CategoryRow = { id: string; parentId: string | null; name: string; slug: string; locale: string; direction: "AUTO" | "LTR" | "RTL"; status: "ACTIVE" | "HIDDEN" | "ARCHIVED"; parentName: string | null };

export function CategoryManager({ tree, items, page, total }: { tree: CategoryTreeNode[]; items: CategoryRow[]; page: number; total: number }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const parentOptions = useMemo(() => flatten(tree), [tree]);
  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? "تغییرات ذخیره شد." : result.message ?? "تغییرات ذخیره نشد.");
    });
  }
  return (
    <div className="admin-stack">
      <form className="admin-form" action={(formData) => run(() => createCategory({
        name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description"),
        parentId: formData.get("parentId") || null, locale: formData.get("locale"), direction: formData.get("direction"), sortOrder: 0
      }))}>
        <h2>دسته‌بندی جدید</h2>
        <label>نام<input name="name" required maxLength={160} /></label>
        <label>اسلاگ<input name="slug" required dir="ltr" pattern="[a-z0-9-]+" /></label>
        <label>والد<select name="parentId"><option value="">دستهٔ ریشه</option>{parentOptions.map((item) => <option key={item.id} value={item.id}>{"— ".repeat(item.depth)}{item.name}</option>)}</select></label>
        <label>زبان<select name="locale" defaultValue="fa"><option value="fa">فارسی</option><option value="en">English</option></select></label>
        <label>جهت<select name="direction" defaultValue="AUTO"><option value="AUTO">خودکار</option><option value="RTL">راست‌به‌چپ</option><option value="LTR">چپ‌به‌راست</option></select></label>
        <label className="admin-form__full">توضیح<textarea name="description" maxLength={2000} /></label>
        <button className="primary-button" type="submit" disabled={pending}>ایجاد دسته‌بندی</button>
      </form>
      {message && <p role="status">{message}</p>}
      <section className="category-directory" aria-label="فهرست دسته‌بندی‌ها">
        <div className="category-directory__meta"><span>نمایش {total ? `${((page - 1) * ADMIN_PAGE_SIZE + 1).toLocaleString("fa-IR")} تا ${Math.min(page * ADMIN_PAGE_SIZE, total).toLocaleString("fa-IR")}` : "۰"} از {total.toLocaleString("fa-IR")}</span><span>دسته‌بندی‌ها</span></div>
        <div className="category-directory__heading" aria-hidden="true"><span>دسته‌بندی</span><span>والد</span><span>وضعیت</span><span>عملیات</span></div>
        <div className="category-directory__list" role="tree">{items.map((item) => <article className={`category-thread${item.parentId ? " category-thread--nested" : ""}`} key={item.id} role="treeitem" aria-level={item.parentId ? 2 : 1}><span className="category-thread__connector" aria-hidden="true"><i /></span><div className="category-thread__identity"><strong>{item.name}</strong><small dir="ltr">/{item.slug}</small></div><div className="category-thread__parent">{item.parentName ? <><span className="sr-only">دستهٔ والد: </span>{item.parentName}</> : "دستهٔ ریشه"}</div><span className={`admin-badge admin-badge--${item.status === "ACTIVE" ? "success" : item.status === "HIDDEN" ? "warning" : "neutral"}`}>{item.status === "ACTIVE" ? "فعال" : item.status === "HIDDEN" ? "مخفی" : "بایگانی"}</span><div className="category-thread__actions"><button type="button" onClick={() => run(() => reorderCategory({ categoryId: item.id, direction: "up" }))} disabled={pending} aria-label={`انتقال ${item.name} به بالا`}>↑</button><button type="button" onClick={() => run(() => reorderCategory({ categoryId: item.id, direction: "down" }))} disabled={pending} aria-label={`انتقال ${item.name} به پایین`}>↓</button><button type="button" onClick={() => run(() => archiveCategory(item.id))} disabled={pending}>بایگانی</button></div></article>)}</div>
        {getTotalPages(total) > 1 && <nav className="admin-data-grid__pagination" aria-label="صفحه‌بندی دسته‌بندی‌ها"><Link className={page <= 1 ? "is-disabled" : undefined} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} href={`?page=${Math.max(1, page - 1)}`}>قبلی</Link><span>صفحهٔ {page.toLocaleString("fa-IR")} از {getTotalPages(total).toLocaleString("fa-IR")}</span><Link className={page >= getTotalPages(total) ? "is-disabled" : undefined} aria-disabled={page >= getTotalPages(total)} tabIndex={page >= getTotalPages(total) ? -1 : undefined} href={`?page=${Math.min(getTotalPages(total), page + 1)}`}>بعدی</Link></nav>}
      </section>
    </div>
  );
}
