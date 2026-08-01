import { CategoryManager } from "@/components/admin/category-manager";
import { getCategoryTree } from "@/lib/categories/queries";
import { requirePermission } from "@/lib/auth/guards";

export default async function AdminCategoriesPage() {
  await requirePermission("category:read");
  const tree = await getCategoryTree({ includeHidden: true });
  return <section aria-labelledby="categories-title"><span className="eyebrow"><i /> محتوا</span><h1 id="categories-title">دسته‌بندی‌ها</h1><p>ساختار درختی نامحدود است؛ با دکمه‌های بالا و پایین می‌توان ترتیب را بدون کشیدن‌و‌رهاکردن تغییر داد.</p><CategoryManager tree={tree} /></section>;
}
