"use client";

import { useMemo, useState, useTransition } from "react";

import { archiveCategory, createCategory, reorderCategory } from "@/lib/categories/mutations";
import type { CategoryTreeNode } from "@/lib/categories/queries";

function flatten(nodes: CategoryTreeNode[], depth = 0): Array<CategoryTreeNode & { depth: number }> {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flatten(node.children, depth + 1)]);
}

export function CategoryManager({ tree }: { tree: CategoryTreeNode[] }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const items = useMemo(() => flatten(tree), [tree]);
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
        <label>والد<select name="parentId"><option value="">دستهٔ ریشه</option>{items.map((item) => <option key={item.id} value={item.id}>{"— ".repeat(item.depth)}{item.name}</option>)}</select></label>
        <label>زبان<select name="locale" defaultValue="fa"><option value="fa">فارسی</option><option value="en">English</option></select></label>
        <label>جهت<select name="direction" defaultValue="AUTO"><option value="AUTO">خودکار</option><option value="RTL">راست‌به‌چپ</option><option value="LTR">چپ‌به‌راست</option></select></label>
        <label className="admin-form__full">توضیح<textarea name="description" maxLength={2000} /></label>
        <button className="primary-button" type="submit" disabled={pending}>ایجاد دسته‌بندی</button>
      </form>
      {message && <p role="status">{message}</p>}
      <div className="admin-tree" role="tree" aria-label="درخت دسته‌بندی‌ها">{items.map((item) => <div className="admin-tree__row" key={item.id} role="treeitem" aria-level={item.depth + 1} aria-selected={false}><span style={{ paddingInlineStart: `${item.depth * 24}px` }}><strong>{item.name}</strong><small dir="ltr">/{item.slug}</small></span><span>{item.status}</span><div><button type="button" onClick={() => run(() => reorderCategory({ categoryId: item.id, direction: "up" }))} disabled={pending} aria-label={`انتقال ${item.name} به بالا`}>↑</button><button type="button" onClick={() => run(() => reorderCategory({ categoryId: item.id, direction: "down" }))} disabled={pending} aria-label={`انتقال ${item.name} به پایین`}>↓</button><button type="button" onClick={() => run(() => archiveCategory(item.id))} disabled={pending}>بایگانی</button></div></div>)}</div>
    </div>
  );
}
