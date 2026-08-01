import Link from "next/link";
import { asc } from "drizzle-orm";

import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { exams } from "@/lib/db/schema";

export default async function AdminExamsPage() {
  await requirePermission("exam:read");
  const items = await getDb().select({ id: exams.id, title: exams.title, slug: exams.slug, status: exams.status, difficulty: exams.difficulty, updatedAt: exams.updatedAt }).from(exams).orderBy(asc(exams.title)).limit(100);
  return <section aria-labelledby="admin-exams-title"><span className="eyebrow"><i /> محتوا</span><h1 id="admin-exams-title">آزمون‌ها</h1><p>ساخت و ویرایش آزمون از actionهای مجاز مدیریت انجام می‌شود؛ انتشار تنها پس از اعتبارسنجی کلیدهای پاسخ ممکن است.</p>{items.length ? <div className="admin-tree">{items.map((exam) => <div className="admin-tree__row" key={exam.id}><span><strong>{exam.title}</strong><small dir="ltr">/{exam.slug}</small></span><span>{exam.status}</span><Link className="secondary-button" href={`/exams/${exam.slug}`}>پیش‌نمایش عمومی</Link></div>)}</div> : <p className="empty-state">هنوز آزمونی ساخته نشده است. پس از اجرای seed، نمونه‌ها در اینجا ظاهر می‌شوند.</p>}</section>;
}
