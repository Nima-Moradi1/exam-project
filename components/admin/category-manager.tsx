"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { ADMIN_PAGE_SIZE, getTotalPages } from "@/lib/admin/pagination";
import { archiveCategory, createCategory, reorderCategory } from "@/lib/categories/mutations";
import type { AdminCategoryFilters, CategoryTreeNode } from "@/lib/categories/queries";
import { AppModal } from "@/components/ui/app-modal";
import { AppButton, AppSelect, AppTextArea, AppTextField } from "@/components/ui/form-controls";

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
          <AppTextField defaultValue={filters.query ?? ""} fieldClassName="category-filters__field" label="جست‌وجو بر اساس نام یا اسلاگ" name="query" placeholder="مثلاً Reading" type="search" />
          <AppSelect className="category-filters__field" defaultValue={filters.kind ?? "all"} label="نوع دسته" name="kind" options={[{ value: "all", label: "همهٔ دسته‌ها" }, { value: "root", label: "فقط دسته‌های اصلی" }, { value: "child", label: "فقط زیرمجموعه‌ها" }]} />
          <AppButton className="secondary-button" tone="secondary" type="submit">اعمال فیلتر</AppButton>
          {hasFilters && <Link className="category-filters__reset" href="/admin/categories">پاک کردن</Link>}
        </form>
        <AppButton className="primary-button category-create-trigger" onPress={() => setIsCreateOpen(true)}>+ دسته‌بندی جدید</AppButton>
      </div>

      {message && <p role="status" className={messageIsSuccess ? "form-success" : "form-error"}>{messageIsSuccess && <span aria-hidden="true">✓</span>}<span>{message}</span></p>}

      <section className="admin-data-grid category-data-grid" aria-label="فهرست دسته‌بندی‌ها">
        <div className="admin-data-grid__meta"><span>{total ? `نمایش ${((page - 1) * ADMIN_PAGE_SIZE + 1).toLocaleString("fa-IR")} تا ${Math.min(page * ADMIN_PAGE_SIZE, total).toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")}` : "موردی برای نمایش نیست"}</span><span>دسته‌بندی‌ها</span></div>
        <div className="admin-data-grid__viewport">
          <table>
            <thead><tr><th scope="col">دسته‌بندی</th><th scope="col">سطح</th><th scope="col">دستهٔ والد</th><th scope="col">وضعیت</th><th scope="col">عملیات</th></tr></thead>
            <tbody>{items.length ? items.map((item) => {
              const status = statusInfo(item.status);
              return <tr key={item.id}><td><div className={`category-row__identity${item.parentId ? " category-row__identity--child" : ""}`}><span className="category-row__marker" aria-hidden="true" /><div><strong>{item.name}</strong><small dir="ltr">/{item.slug}</small></div></div></td><td><span className={`admin-badge admin-badge--${item.parentId ? "info" : "neutral"}`}>{item.parentId ? "زیرمجموعه" : "دستهٔ اصلی"}</span></td><td>{item.parentName ?? <span className="category-row__root">—</span>}</td><td><span className={`admin-badge admin-badge--${status.tone}`}>{status.label}</span></td><td><div className="category-row__actions"><AppButton aria-label={`انتقال ${item.name} به بالا`} isDisabled={pending} isIconOnly onPress={() => run(() => reorderCategory({ categoryId: item.id, direction: "up" }))}>↑</AppButton><AppButton aria-label={`انتقال ${item.name} به پایین`} isDisabled={pending} isIconOnly onPress={() => run(() => reorderCategory({ categoryId: item.id, direction: "down" }))}>↓</AppButton><AppButton isDisabled={pending} onPress={() => run(() => archiveCategory(item.id))} tone="danger-soft">بایگانی</AppButton></div></td></tr>;
            }) : <tr><td className="admin-data-grid__empty" colSpan={5}>دسته‌بندی مطابق فیلترهای انتخابی پیدا نشد.</td></tr>}</tbody>
          </table>
        </div>
        {totalPages > 1 && <nav className="admin-data-grid__pagination" aria-label="صفحه‌بندی دسته‌بندی‌ها"><Link className={page <= 1 ? "is-disabled" : undefined} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} href={pageHref(Math.max(1, page - 1))}>قبلی</Link><span>صفحهٔ {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span><Link className={page >= totalPages ? "is-disabled" : undefined} aria-disabled={page >= totalPages} tabIndex={page >= totalPages ? -1 : undefined} href={pageHref(Math.min(totalPages, page + 1))}>بعدی</Link></nav>}
      </section>

      <AppModal className="admin-modal" isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} title="دسته‌بندی جدید">
        <p className="admin-modal__description">سطح والد را انتخاب کنید تا این مورد در جای درست ساختار قرار بگیرد.</p>
        <form className="admin-form" action={(formData) => run(() => createCategory({ name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description"), parentId: formData.get("parentId") || null, locale: formData.get("locale"), direction: formData.get("direction"), sortOrder: 0 }), () => setIsCreateOpen(false))}>
          <AppTextField label="نام" maxLength={160} name="name" required />
          <AppTextField dir="ltr" label="اسلاگ" name="slug" pattern="[a-z0-9-]+" required />
          <AppSelect label="والد" name="parentId" options={[{ value: "", label: "دستهٔ ریشه" }, ...parentOptions.map((item) => ({ value: item.id, label: `${"— ".repeat(item.depth)}${item.name}` }))]} />
          <AppSelect defaultValue="fa" label="زبان" name="locale" options={[{ value: "fa", label: "فارسی" }, { value: "en", label: "English" }]} />
          <AppSelect defaultValue="AUTO" label="جهت" name="direction" options={[{ value: "AUTO", label: "خودکار" }, { value: "RTL", label: "راست‌به‌چپ" }, { value: "LTR", label: "چپ‌به‌راست" }]} />
          <AppTextArea fieldClassName="admin-form__full" label="توضیح" maxLength={2000} name="description" />
          <div className="admin-modal__actions"><AppButton className="secondary-button" isDisabled={pending} onPress={() => setIsCreateOpen(false)} tone="secondary">انصراف</AppButton><AppButton className="primary-button" isDisabled={pending} type="submit">{pending ? "در حال ایجاد…" : "ایجاد دسته‌بندی"}</AppButton></div>
        </form>
      </AppModal>
    </div>
  );
}
