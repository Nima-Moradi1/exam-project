# Exam Platform

## Production origin and release gate

The canonical production origin is `https://full-exam-project.vercel.app`. The former `full-exam-website.vercel.app` host and preview `*.vercel.app` hosts are redirected with HTTP 308 in production. Set `NEXT_PUBLIC_APP_URL` to the canonical origin in Production; local development may use `http://localhost:3000`.

Every production promotion must follow [the migration procedure](docs/migrations.md): run `pnpm db:migrate`, then `pnpm db:health`, deploy the candidate, and run `pnpm deploy:verify`. The readiness check verifies the committed Drizzle migration table plus the exact plural `users`, `accounts`, `sessions`, and `verification_tokens` relations used by Auth.js without returning database details.

Quality commands include `pnpm check`, `pnpm test:e2e`, `pnpm test:a11y`, `pnpm analyze`, and `pnpm perf:lhci`. Product analytics fields and privacy boundaries are documented in [docs/analytics.md](docs/analytics.md).

یک پلتفرم آزمون تمام‌پشته با Next.js App Router، PostgreSQL/Neon، Drizzle و Auth.js. رابط کاربری فارسی‌محور است، اما هر آزمون به‌صورت مستقل RTL یا LTR رندر می‌شود. پاسخ‌نامه‌ها و زمان آزمون فقط روی سرور کنترل می‌شوند.

## قابلیت‌ها

- دسته‌بندی نامحدود و درختی، آزمون‌ها، سرفصل‌ها، پرسش‌ها، گزینه‌ها و منابع آموزشی پویا
- ثبت‌نام با نام کاربری/رمز عبور و ورود Google OAuth از طریق متغیر محیطی
- نقش‌های `USER`، `CONTENT_MANAGER`، `ADMIN` و `SUPER_ADMIN` با مجوزهای متمرکز
- تلاش آزمون با زمان سمت سرور، ذخیرهٔ خودکار، snapshot تغییرناپذیر، انصراف و ثبت نهایی idempotent
- موتور ارزیابی خالص برای چندگزینه‌ای، چندانتخابی، درست/نادرست، کشویی، پاسخ کوتاه، عددی، ترتیب، تطبیق و پاسخ‌های در انتظار بررسی دستی
- پاسخ‌برگ فشرده و پاسخ‌نامهٔ تشریحی برای مالک تلاش یا مدیر مجاز
- پیشنهاد آموزشی قطعی از منابع curated؛ AI اختیاری است و هرگز مانع ثبت آزمون نمی‌شود
- آپلود امن رسانه با Vercel Blob، ثبت metadata در PostgreSQL و اعتبارسنجی MIME/حجم
- seed idempotent برای درخت IELTS و Software Engineering، آزمون‌های قبلی HTML/CSS، نمونه‌های IELTS، TypeScript و React

## معماری

`lib/db/schema` مدل Drizzle و migrationهای SQL را نگه می‌دارد. دسترسی به داده با `getDb()` در زمان اجرا انجام می‌شود تا build صفحات استاتیک به اتصال دیتابیس وابسته نباشد.

- کلیدهای پاسخ، hash رمز عبور، snapshot ارزیابی و credentials فقط در ماژول‌های `server-only` قرار دارند.
- Client Componentها فقط DTO عمومی تلاش و سؤال را دریافت می‌کنند. پاسخ صحیح پیش از ثبت نهایی serialize نمی‌شود.
- هر تلاش در `attempt_question_snapshots` نسخهٔ ثابت سؤال و دادهٔ ارزیابی را نگه می‌دارد؛ ویرایش آزمون روی تاریخچه اثر نمی‌گذارد.
- `proxy.ts` مسیرهای حساب و مدیریت را محافظت می‌کند، اما تمام Route Handlerها و Server Actionها مجوز سروری را دوباره بررسی می‌کنند.

## پیش‌نیازها

- Node.js 20.9 یا جدیدتر
- pnpm 11 (در `packageManager` ثابت شده است)
- یک پایگاه Neon PostgreSQL برای اجرای واقعی برنامه

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

سپس `http://localhost:3000` را باز کنید.

## متغیرهای محیطی

تمام نام‌ها و placeholderها در [.env.example](.env.example) آمده‌اند. فایل واقعی `.env` یا `.env.local` را commit نکنید.

| متغیر | کاربرد |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | نشانی عمومی برنامه، مانند `https://your-app.vercel.app` |
| `DATABASE_URL` | Neon pooled/HTTP URL برای درخواست‌های معمول |
| `DATABASE_URL_UNPOOLED` | URL unpooled برای migration یا transactionهای سازگار |
| `DATABASE_URL_TEST` | دیتابیس جدا برای integration test |
| `AUTH_SECRET` | secret تصادفی طولانی برای Auth.js |
| `AUTH_TRUST_HOST` | در Vercel برای Preview و Production برابر `true`؛ اعتماد Auth.js به دامنهٔ deployment |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | OAuth Google؛ در صورت خالی‌بودن provider نمایش داده نمی‌شود |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob برای مدیریت رسانه |
| `AI_PROVIDER`, `AI_MODEL` | `none`، `openai`، `google` یا `xai` و نام مدل |
| `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `XAI_API_KEY` | فقط برای provider انتخاب‌شده |
| `SEED_ADMIN_*`, `SEED_DEMO_*` | ایجاد اختیاری کاربر مدیر و demo هنگام seed |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | اتصال rate limit توزیع‌شده در production |

برای Vercel، همین متغیرها را در Project Settings → Environment Variables اضافه کنید. هیچ‌کدام از secretها نباید با `NEXT_PUBLIC_` شروع شوند.

## Neon و migration

1. یک پروژه و دیتابیس Neon بسازید.
2. `DATABASE_URL` را از connection string Neon در `.env.local` و Vercel قرار دهید.
3. migrationهای commit‌شده را اجرا کنید:

```bash
pnpm db:migrate
pnpm db:seed
```

برای تغییر schema، فایل‌های `lib/db/schema` را ویرایش، سپس migration جدید بسازید و commit کنید:

```bash
pnpm db:generate
pnpm db:migrate
```

از `drizzle-kit push` برای استقرار production استفاده نکنید.

## Google OAuth

در Google Cloud Console یک OAuth Web Client ایجاد کنید.

- توسعه: Authorized origin برابر `http://localhost:3000` و callback برابر `http://localhost:3000/api/auth/callback/google`
- production: origin دامنهٔ Vercel و callback برابر `https://your-domain/api/auth/callback/google`

سپس `AUTH_GOOGLE_ID` و `AUTH_GOOGLE_SECRET` را اضافه کنید. پیوند خودکار خطرناک حساب‌ها فعال نیست؛ کاربر OAuth بدون نام کاربری باید onboarding شود.

## Vercel Blob و AI

برای Blob یک store بسازید و `BLOB_READ_WRITE_TOKEN` را در محیط‌ها قرار دهید. اگر token وجود نداشته باشد، endpoint آپلود با پیام پیکربندی‌نشده پاسخ می‌دهد.

AI کاملاً اختیاری است. `AI_PROVIDER=none` وضعیت پیش‌فرض است و پیشنهادهای deterministic همچنان کار می‌کنند. خروجی AI با Zod بررسی می‌شود و فقط مجاز است ID منبع‌های curated را انتخاب کند؛ PII، رمز عبور، ایمیل و URL ساختگی برای AI ارسال نمی‌شود.

## دادهٔ seed

`pnpm db:seed` قابل تکرار است و رکورد تکراری نمی‌سازد. این داده‌ها را اضافه می‌کند:

- ساختار کامل IELTS در سطح‌های A1 تا C2 و ساختار Software Engineering
- آزمون‌های فارسی HTML، CSS بخش ۱ و CSS بخش ۲ به‌همراه پاسخ و سرفصل قبلی
- IELTS B2 Reading، IELTS A2 Full Demo، TypeScript Foundations و React Fundamentals
- منابع رسمی HTML/CSS/TypeScript/React/Next.js/PostgreSQL/Docker/Kubernetes/IELTS

کاربر مدیر فقط با تعریف `SEED_ADMIN_PASSWORD` ایجاد می‌شود؛ رمز پیش‌فرض در مخزن وجود ندارد.

## مدیریت محتوا

کاربر `CONTENT_MANAGER` یا بالاتر می‌تواند از `/admin` دسته‌بندی، آزمون، سرفصل و سؤال را مدیریت کند. انتشار آزمون تنها وقتی مجاز است که دسته، مدت، عنوان، slug، امتیاز و کلیدهای لازم معتبر باشند. تغییر آزمون منتشرشده فقط بر تلاش‌های آینده اثر دارد.

## کیفیت

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration # تنها با DATABASE_URL_TEST
pnpm test:e2e
pnpm test:a11y
pnpm build
pnpm check
```

`pnpm check` شامل lint، typecheck، unit test و build است. Playwright نیازمند مرورگر نصب‌شده است:

```bash
pnpm exec playwright install chromium
```

## امنیت و محدودیت‌ها

- score و زمان هرگز از client پذیرفته نمی‌شوند.
- محدودیت کپی/تب فقط هشدار اطلاعاتی است؛ هیچ مرورگری anti-cheat مطلق ارائه نمی‌دهد.
- تلاش‌های anonymous قدیمی localStorage به حساب کاربری مهاجرت نمی‌شوند، چون نگاشت هویت امنی نداشتند.
- integration test، seed واقعی و OAuth redirect به credential دیتابیس/Google نیاز دارند و در CI بدون آن‌ها اجرا نمی‌شوند.
- برای production چندنمونه‌ای، Upstash را برای rate limit توزیع‌شده پیکربندی کنید؛ fallback حافظه‌ای فقط برای توسعهٔ کم‌ترافیک است.
