import { CategoryManager } from "@/components/admin/category-manager";
import { ADMIN_PAGE_SIZE, getAdminPage, getTotalPages } from "@/lib/admin/pagination";
import { getAdminCategoryPage, getCategoryTree } from "@/lib/categories/queries";
import { requirePermission } from "@/lib/auth/guards";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requirePermission("category:read");
  const { page: requestedPage } = getAdminPage(await searchParams);
  const [{ total }, tree] = await Promise.all([getAdminCategoryPage({ limit: 1, offset: 0 }), getCategoryTree({ includeHidden: true })]);
  const page = Math.min(requestedPage, getTotalPages(total));
  const categoryPage = await getAdminCategoryPage({ limit: ADMIN_PAGE_SIZE, offset: (page - 1) * ADMIN_PAGE_SIZE });
  return <section aria-labelledby="categories-title"><span className="eyebrow"><i /> محتوا</span><h1 id="categories-title">دسته‌بندی‌ها</h1><p className="admin-page-intro">ساختار درختی نامحدود است؛ ارتباط هر زیرمجموعه با دستهٔ والد آن با گره‌ها و رشته‌های پیوسته نمایش داده می‌شود.</p><CategoryManager tree={tree} items={categoryPage.items} page={page} total={total} /></section>;
}
