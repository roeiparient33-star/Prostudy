# 🚀 פריסת תיקוני האבטחה — סדר פעולות מחייב

> נוצר: 8 ביולי 2026. הקוד החדש כבר כתוב ונבנה (`npm run build` עבר), אבל **עוד לא נדחף ל-git בכוונה** — הקוד קורא ל-RPC-ים שעוד לא קיימים ב-DB. עקוב אחרי הסדר, אחרת האתר החי יישבר.

## ✅ שלב 1 — SQL ראשון (5 דקות)
1. פתח Supabase → SQL Editor → New query.
2. הדבק את כל התוכן של **`security_fixes_step1.sql`** → Run.
3. ודא שאין שגיאות. בדיקה: הרץ את השאילתה שבסוף הקובץ — אמורה להחזיר 9 פונקציות.

> שלב זה בטוח לחלוטין — הוא רק *מוסיף* פונקציות ומתקן policies. האתר הקיים ממשיך לעבוד כרגיל.

## ✅ שלב 2 — פריסת ה-Edge Function המוקשחת
```powershell
cd C:\Users\roeip\Desktop\proStudy2d\prostudy
npx supabase functions deploy ai-assistant --project-ref ymodgzacgzncrwmeqqle
```
אופציונלי (מומלץ אחרי שיש דומיין קבוע) — נעילת CORS לדומיין שלך:
```powershell
npx supabase secrets set ALLOWED_ORIGIN=https://<הדומיין-שלך> --project-ref ymodgzacgzncrwmeqqle
```

## ✅ שלב 3 — דחיפת הקוד (Vercel יפרוס אוטומטית)
```powershell
git add -A
git commit -m "security: server-side RPCs for credits/streak/purchases, XSS sanitization, edge function hardening"
git push origin main
```
המתן שVercel יסיים, ואז **בדוק באתר החי**:
- [ ] הפעל טיימר, עצור אחרי דקה → מקבל קרדיט + טוסט.
- [ ] קנה פריט/הקפאת רצף בחנות → היתרה יורדת.
- [ ] פתח חשבון חדש → בחירת אווטר ראשוני עובדת.
- [ ] שאל את ה-AI שאלה (אם יש לך מנוי פעיל) → עובד.

## ✅ שלב 4 — SQL נעילה (רק אחרי ששלב 3 עבר!)
הרץ ב-SQL Editor את **`security_fixes_step2_lockdown.sql`**.
מרגע זה אי אפשר לזייף קרדיטים/רצף/דקות גם עם DevTools.
חזור על צ'קליסט הבדיקות של שלב 3.

## ✅ שלב 5 — GitHub לפרטי (2 דקות, בדפדפן)
1. https://github.com/roeiparient33-star/Prostudy → Settings → General.
2. גלול ל-Danger Zone → **Change repository visibility** → Private.
3. ודא ש-Vercel עדיין מחובר (Vercel עובד מצוין עם ריפו פרטי; אם ביקש הרשאה מחדש — אשר).

> `.env` כבר הוסר מה-git בקומיט הזה. הוא עדיין קיים בהיסטוריה — לא קריטי (מפתח ה-anon ציבורי ממילא), והפיכת הריפו לפרטי סוגרת את החשיפה.

## ✅ שלב 6 — הגדרות ידניות ב-Supabase Dashboard (10 דקות)
ב-Authentication:
1. **Attack Protection → Bot and Abuse Protection** → הפעל CAPTCHA (Cloudflare Turnstile). שים לב: אחרי ההפעלה צריך להוסיף את ה-widget לטפסי ההרשמה — אם עוד לא מוכן בקוד, דחה את זה לשלב הבא.
2. **Passwords** → הפעל "Leaked password protection", אורך מינימלי 8.
3. שקול להחזיר **Confirm email** (Sign In / Up → Email) — עוצר יצירת חשבונות בסקריפט.

## מה תוקן בקוד (בקומיט הזה)
| תיקון | קבצים |
|---|---|
| קרדיטים/רצף/דקות/רכישות עברו ל-RPC בשרת | `useStudyTimer.js`, `Avatar.jsx`, `StreakBadge.jsx`, `ActivationChecklist.jsx`, `App.jsx`, `AuthContext.jsx` |
| הפניות (referral) — אטומי בשרת, המזמין באמת מקבל 50 | `AuthContext.jsx` + `apply_referral` |
| XSS: סניטציית DOMPurify ל-SVG + כל פלט ה-AI, חסימת קישורי `javascript:`, escape לכותרת ה-PDF | `markdown.js`, `AIChat.jsx` |
| pact_members: אי אפשר להצטרף/להוסיף לצוות זר; הזמנות תמיד pending | `security_fixes_step1.sql` |
| מגבלות קובץ (25MB + סוגי MIME) נאכפות ב-bucket | `security_fixes_step1.sql` |
| Edge Function: קיטום history (8K/הודעה), שגיאות גנריות, CORS דרך env | `ai-assistant/index.ts` |
| `.env` הוסר מ-git, `.gitignore` עודכן | — |

## נשאר לפעם הבאה (מתועד ב-SECURITY_IMPROVEMENTS.md)
- **ממצא 7** — צמצום קריאת פרופילים זרים (דורש refactor של Friends/ליגה ל-view; לא לשבור לפני שיש בדיקה מסודרת).
- **ממצא 8** — סגירת race במכסת ה-AI (RPC אטומי ל-reserve).
- CAPTCHA widget בטפסי Login/Signup (אחרי הפעלת Turnstile בדשבורד).
- Security headers ב-Vercel (`vercel.json`).
- `npm audit` מראה 2 חולשות ב-vite/esbuild — **כלי פיתוח בלבד** (לא נכנסות ל-build). התיקון = שדרוג ל-vite 7 (שינוי גרסה ראשית) — לתכנן בנפרד.
