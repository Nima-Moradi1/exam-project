import { asc } from "drizzle-orm";

import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export default async function AdminUsersPage() {
  await requirePermission("user:read");
  const records = await getDb().select({ id: users.id, username: users.username, email: users.email, role: users.role, status: users.status }).from(users).orderBy(asc(users.usernameNormalized)).limit(100);
  return <section aria-labelledby="users-title"><span className="eyebrow"><i /> مدیریت</span><h1 id="users-title">کاربران</h1><div className="admin-tree">{records.map((user) => <div className="admin-tree__row" key={user.id}><span><strong>{user.username ?? "نیازمند onboarding"}</strong><small dir="ltr">{user.email}</small></span><span>{user.role}</span><span>{user.status}</span></div>)}</div></section>;
}
