export const ADMIN_PAGE_SIZE = 20;

type SearchParams = { page?: string | string[] | undefined };

export function getAdminPage(searchParams: SearchParams) {
  const value = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = Math.max(1, Number.parseInt(value ?? "1", 10) || 1);
  return { page, offset: (page - 1) * ADMIN_PAGE_SIZE };
}

export function getTotalPages(total: number) {
  return Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
}
