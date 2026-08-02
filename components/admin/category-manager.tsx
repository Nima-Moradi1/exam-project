"use client";

import { useMemo, useState, useTransition } from "react";

import { archiveCategory, createCategory, reorderCategory } from "@/lib/categories/mutations";
import type { CategoryTreeNode } from "@/lib/categories/queries";

function flatten(nodes: CategoryTreeNode[], depth = 0): Array<CategoryTreeNode & { depth: number }> {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flatten(node.children, depth + 1)]);
}

function CategoryBranch({ node, run, pending }: { node: CategoryTreeNode; run: (action: () => Promise<{ ok: boolean; message?: string }>) => void; pending: boolean }) {
  const status = node.status === "ACTIVE" ? "فعال" : node.status === "HIDDEN" ? "مخفی" : "بایگانی";
  const tone = node.status === "ACTIVE" ? "success" : node.status === "HIDDEN" ? "warning" : "neutral";
  return <li className="category-branch"><article className="category-node"><div className="category-node__identity"><span className="category-node__dot" aria-hidden="true" /><div><strong>{node.name}</strong><small dir="ltr">/{node.slug}</small></div></div><span className={`admin-badge admin-badge--${tone}`}>{status}</span><div className="category-node__actions"><button type="button" onClick={() => run(() => reorderCategory({ categoryId: node.id, direction: "up" }))} disabled={pending} aria-label={`انتقال ${node.name} به بالا`}>↑</button><button type="button" onClick={() => run(() => reorderCategory({ categoryId: node.id, direction: "down" }))} disabled={pending} aria-label={`انتقال ${node.name} به پایین`}>↓</button><button type="button" onClick={() => run(() => archiveCategory(node.id))} disabled={pending}>بایگانی</button></div></article>{node.children.length > 0 && <ol className="category-branch__children">{node.children.map((child) => <CategoryBranch key={child.id} node={child} run={run} pending={pending} />)}</ol>}</li>;
}

export function CategoryManager({ tree }: { tree: CategoryTreeNode[] }) {
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
      <section className="category-tree" aria-label="درخت دسته‌بندی‌ها"><div className="category-tree__meta"><span>{parentOptions.length.toLocaleString("fa-IR")} دسته‌بندی</span><span>درخت دسته‌بندی‌ها</span></div><ol role="tree">{tree.map((node) => <CategoryBranch key={node.id} node={node} run={run} pending={pending} />)}</ol></section>
    </div>
  );
}
