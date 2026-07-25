import type { PublicQuestion } from "@/types/exam";

const six = (...labels: string[]) =>
  labels.map((label, index) => ({ id: String.fromCharCode(97 + index), label }));

const four = (...labels: string[]) => six(...labels);

export const publicQuestions: readonly PublicQuestion[] = [
  {
    id: "q01",
    type: "descriptive",
    text: "برای ساخت بزرگ‌ترین عنوان صفحه، نام تگ مناسب را بنویسید.",
    placeholder: "برای نمونه: <tag>"
  },
  {
    id: "q02",
    type: "descriptive",
    text: "نام ویژگی‌ای را بنویسید که متن جایگزین تصویر را مشخص می‌کند.",
    placeholder: "فقط نام ویژگی"
  },
  {
    id: "q03",
    type: "descriptive",
    text: "عبارت کوتاه تگ و ویژگی لازم برای باز شدن لینک در زبانهٔ تازه را بنویسید.",
    placeholder: "برای نمونه: <a attribute=\"value\">"
  },
  {
    id: "q04",
    type: "dropdown",
    text: "کدام عبارت، نقش اصلی HTML را بهتر توصیف می‌کند؟",
    choices: six(
      "تعریف ساختار و معنای محتوای صفحه",
      "طراحی رنگ و فاصله‌های صفحه",
      "مدیریت پایگاه داده",
      "اجرای محاسبات سمت سرور",
      "فشرده‌سازی تصاویر",
      "ساخت سیستم‌عامل"
    )
  },
  {
    id: "q05",
    type: "dropdown",
    text: "برای نوشتن یک پاراگراف مستقل از کدام تگ استفاده می‌شود؟",
    choices: six("<p>", "<span>", "<br>", "<hr>", "<head>", "<meta>")
  },
  {
    id: "q06",
    type: "dropdown",
    text: "کدام تگ یک شکست خط در متن ایجاد می‌کند؟",
    choices: six("<br>", "<hr>", "<p>", "<pre>", "<line>", "<break>")
  },
  {
    id: "q07",
    type: "dropdown",
    text: "برای ساخت فهرست شماره‌دار کدام تگ مناسب است؟",
    choices: six("<ol>", "<ul>", "<li>", "<dl>", "<list>", "<nav>")
  },
  {
    id: "q08",
    type: "dropdown",
    text: "نشانی مقصد یک لینک با کدام ویژگی تعیین می‌شود؟",
    choices: six("href", "src", "action", "target", "rel", "link")
  },
  {
    id: "q09",
    type: "dropdown",
    text: "در جدول HTML، سلول عنوان ستون معمولاً با کدام تگ ساخته می‌شود؟",
    choices: six("<th>", "<td>", "<tr>", "<thead>", "<caption>", "<table>")
  },
  {
    id: "q10",
    type: "dropdown",
    text: "کدام نوع ورودی برای دریافت نشانی ایمیل و اعتبارسنجی اولیهٔ مرورگر مناسب است؟",
    choices: six(
      "email",
      "text",
      "mailbox",
      "address",
      "url",
      "search"
    )
  },
  {
    id: "q11",
    type: "dropdown",
    text: "برای پیوند دادن یک label به input باید مقدار ویژگی for با کدام مقدار input برابر باشد؟",
    choices: six("id", "name", "value", "type", "class", "placeholder")
  },
  {
    id: "q12",
    type: "dropdown",
    text: "کدام تگ معنایی برای محتوای اصلی و یکتای صفحه مناسب است؟",
    choices: six("<main>", "<div>", "<body>", "<section>", "<aside>", "<header>")
  },
  {
    id: "q13",
    type: "dropdown",
    text: "برای ارائهٔ گزینه‌های پیشنهادی به یک input، بدون محدود کردن کاربر به همان گزینه‌ها، کدام تگ به‌کار می‌رود؟",
    choices: six(
      "<datalist>",
      "<select>",
      "<option>",
      "<menu>",
      "<fieldset>",
      "<output>"
    )
  },
  {
    id: "q14",
    type: "multiple-choice",
    text: "کدام ساختار، اسکلت پایهٔ یک سند HTML5 را درست آغاز می‌کند؟",
    choices: four(
      "<!doctype html><html>…</html>",
      "<html5><page>…</page></html5>",
      "<doctype html><body>…</body>",
      "<document><html>…</html></document>"
    )
  },
  {
    id: "q15",
    type: "multiple-choice",
    text: "محتوای قابل‌نمایش صفحه معمولاً داخل کدام بخش قرار می‌گیرد؟",
    choices: four("<body>", "<head>", "<title>", "<meta>")
  },
  {
    id: "q16",
    type: "multiple-choice",
    text: "اگر بخواهیم بر اهمیت معنایی یک عبارت تأکید کنیم، کدام تگ مناسب‌تر است؟",
    choices: four("<strong>", "<b>", "<mark>", "<small>")
  },
  {
    id: "q17",
    type: "multiple-choice",
    text: "کدام نگارش یک دیدگاه معتبر HTML است؟",
    choices: four(
      "<!-- توضیح -->",
      "// توضیح",
      "/* توضیح */",
      "<comment>توضیح</comment>"
    )
  },
  {
    id: "q18",
    type: "multiple-choice",
    text: "برای مشخص کردن مسیر فایل تصویر از کدام ویژگی img استفاده می‌شود؟",
    choices: four("src", "href", "path", "file")
  },
  {
    id: "q19",
    type: "multiple-choice",
    text: "هر مورد در یک فهرست ul یا ol با کدام تگ تعریف می‌شود؟",
    choices: four("<li>", "<item>", "<dd>", "<option>")
  },
  {
    id: "q20",
    type: "multiple-choice",
    text: "کدام ویژگی controls کنترل‌های پخش را برای ویدئو در اختیار کاربر می‌گذارد؟",
    choices: four(
      "ویژگی controls روی <video>",
      "ویژگی play روی <source>",
      "ویژگی media روی <body>",
      "ویژگی controller روی <video>"
    )
  },
  {
    id: "q21",
    type: "multiple-choice",
    text: "برای گروه‌بندی منطقی چند کنترل مرتبط در فرم، کدام تگ مناسب‌تر است؟",
    choices: four("<fieldset>", "<section>", "<group>", "<formset>")
  },
  {
    id: "q22",
    type: "multiple-choice",
    text: "ویژگی action در تگ form چه چیزی را مشخص می‌کند؟",
    choices: four(
      "نشانی مقصد ارسال داده‌های فرم",
      "نوع همهٔ ورودی‌های فرم",
      "متن دکمهٔ ارسال",
      "روش نمایش فرم در مرورگر"
    )
  },
  {
    id: "q23",
    type: "multiple-choice",
    text: "کاربرد اصلی iframe چیست؟",
    choices: four(
      "جاسازی یک سند یا صفحهٔ دیگر",
      "ساخت قاب تزئینی دور تصویر",
      "ارسال داده‌های فرم",
      "تعریف اطلاعات متای صفحه"
    )
  },
  {
    id: "q24",
    type: "multiple-choice",
    text: "کدام جمله دربارهٔ id و class درست است؟",
    choices: four(
      "id باید در صفحه یکتا باشد؛ class می‌تواند تکرار شود",
      "class باید یکتا باشد؛ id می‌تواند تکرار شود",
      "هر دو باید همیشه یکتا باشند",
      "هیچ‌کدام در CSS قابل استفاده نیستند"
    )
  },
  {
    id: "q25",
    type: "multiple-choice",
    text: "برای یک نوشتهٔ مستقل که می‌تواند جداگانه بازنشر شود، کدام ساختار معنایی دقیق‌تر است؟",
    choices: four(
      "<article><header>…</header><section>…</section></article>",
      "<section><article>…</article></section>",
      "<div><span>…</span></div>",
      "<main><footer>…</footer></main>"
    )
  },
  {
    id: "q26",
    type: "true-false",
    text: "HTML یک زبان نشانه‌گذاری است، نه یک زبان برنامه‌نویسی.",
    choices: [
      { id: "true", label: "درست" },
      { id: "false", label: "نادرست" }
    ]
  },
  {
    id: "q27",
    type: "true-false",
    text: "در یک سند معتبر، محتوای title داخل بخش head قرار می‌گیرد.",
    choices: [
      { id: "true", label: "درست" },
      { id: "false", label: "نادرست" }
    ]
  },
  {
    id: "q28",
    type: "true-false",
    text: "تگ hr برای درج تصویر افقی در صفحه استفاده می‌شود.",
    choices: [
      { id: "true", label: "درست" },
      { id: "false", label: "نادرست" }
    ]
  },
  {
    id: "q29",
    type: "true-false",
    text: "ویژگی alt تصویر به دسترس‌پذیری و درک تصویر هنگام بارگذاری‌نشدن آن کمک می‌کند.",
    choices: [
      { id: "true", label: "درست" },
      { id: "false", label: "نادرست" }
    ]
  },
  {
    id: "q30",
    type: "true-false",
    text: "قرار دادن meta با charset مناسب به تفسیر درست نویسه‌های فارسی کمک می‌کند.",
    choices: [
      { id: "true", label: "درست" },
      { id: "false", label: "نادرست" }
    ]
  }
] as const;
