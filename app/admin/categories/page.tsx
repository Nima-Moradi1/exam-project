import { CategoryManager } from "@/components/admin/category-manager";
import { ADMIN_PAGE_SIZE, getAdminPage, getTotalPages } from "@/lib/admin/pagination";
import { getAdminCategoryPage, getCategoryTree, type AdminCategoryFilters } from "@/lib/categories/queries";
import { requirePermission } from "@/lib/auth/guards";

type CategorySearchParams = { page?: string | string[]; query?: string | string[]; kind?: string | string[] };

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<CategorySearchParams> }) {
  await requirePermission("category:read");
  const params = await searchParams;
  const requestedPage = getAdminPage(params).page;
  const rawKind = getFirst(params.kind);
  const filters: AdminCategoryFilters = {
    query: getFirst(params.query)?.trim().slice(0, 100) || undefined,
    kind: rawKind === "root" || rawKind === "child" ? rawKind : "all"
  };
  const [tree, initialPage] = await Promise.all([
    getCategoryTree({ includeHidden: true }),
    getAdminCategoryPage({ limit: ADMIN_PAGE_SIZE, offset: (requestedPage - 1) * ADMIN_PAGE_SIZE, filters })
  ]);
  const page = Math.min(requestedPage, getTotalPages(initialPage.total));
  const categoryPage = page === requestedPage ? initialPage : await getAdminCategoryPage({ limit: ADMIN_PAGE_SIZE, offset: (page - 1) * ADMIN_PAGE_SIZE, filters });
  return <section aria-labelledby="categories-title"><span className="eyebrow"><i /> محتوا</span><h1 id="categories-title">دسته‌بندی‌ها</h1><p className="admin-page-intro">دسته‌ها را بر اساس سطح و نام فیلتر کنید؛ رابطهٔ هر زیرمجموعه با والدش در ستون مستقل نمایش داده می‌شود.</p><CategoryManager tree={tree} items={categoryPage.items} page={page} total={categoryPage.total} filters={filters} /></section>;
}
