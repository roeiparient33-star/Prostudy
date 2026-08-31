# ProStudy — מדריך למפתח (CLAUDE.md)

פלטפורמת לימוד לסטודנטים ישראלים. React + Vite, RTL עברית, Supabase (Auth/DB/Storage/Edge Functions), פריסה ב-Vercel.

## הרצה ובנייה
```bash
npm run dev       # שרת פיתוח (Vite)
npm run build     # בנייה ל-dist/
npm run preview   # תצוגה מקדימה של הבנייה
```
- **שים לב**: `dist/` נכלל ב-git ונדחף עם כל commit (Vercel פורס מ-main). תמיד הרץ `npm run build` לפני commit שמשנה קוד.
- Edge Functions **לא** נפרסות אוטומטית מ-git. פריסה ידנית:
  ```bash
  npx supabase functions deploy <name> --project-ref ymodgzacgzncrwmeqqle
  ```

## ארכיטקטורה
- **React 18 + Vite 5**, ללא TypeScript בצד הלקוח (JSX). כל הדפים ב-`lazy()` (code-splitting).
- **ניתוב**: אין react-router. `src/App.jsx` מחזיק `PAGE_MAP` (מילון state→component). הניווט דרך state.
- **Contexts**: `AuthContext` (משתמש/JWT), `DataContext` (קורסים/משימות/נתונים), `TimerContext` (טיימר לימוד).
- **עיצוב**: קובץ CSS יחיד גדול — `src/index.css` (משתני `--accent` כתום #FF6524, `--bg-*`, `--text-*`). אין Tailwind. RTL כברירת מחדל.
- **אייקונים**: `lucide-react` בלבד (לא אמוג'י כאייקונים).

## עמודים (`src/pages/`)
`Dashboard`, `Courses`, `Tasks`, `Schedule`, `Friends`, `Premium`, `Avatar`, `Achievements`, `AdminDashboard`, וכן `LandingPage`/`Login`/`Signup`/`ResetPassword`.

## פיצ'ר Premium — העוזר הלימודי ה-AI
הליבה של העבודה האחרונה. מאפשר העלאת PDF/תמונה ושאילת Claude עליהם.

**זרימה**: `Premium.jsx` → `MaterialsLibrary` (העלאה/ספרייה) + `AIChat` (צ'אט) + `ConversationsList` (שיחות שמורות). הלקוח קורא ל-Edge Function `ai-assistant` שמדבר עם Anthropic API.

**קבצים מרכזיים**:
- `src/pages/Premium.jsx` — מסך ראשי, ניהול state של שיחות והודעות.
- `src/components/AIChat.jsx` — צ'אט. כולל `AILoading` (אנימציית טעינה במקום הצגת טקסט חי) ו-`downloadAsPDF` (תבנית PDF מעוצבת).
- `src/components/MaterialsLibrary.jsx` — העלאה/רשימה/מחיקה/הורדה של חומרים.
- `src/lib/premiumApi.js` — לקוח: העלאה ל-Storage, ניהול שיחות, `askAI` (קורא SSE מוזרם).
- `src/lib/markdown.js` — `renderMarkdown`: Markdown→HTML עם KaTeX, צביעת תחביר (class), טבלאות, ו-3 רכיבים ויזואליים (סדר חילוץ placeholders: `svg` → ```chart``` → math → ```flow```). `buildFlow()` בונה כרטיסי זרימה ב-CSS טהור.
- `src/hooks/usePremium.js` — סטטוס מנוי + מכסה יומית.
- `supabase/functions/ai-assistant/index.ts` — ה-Edge Function (Deno/TS).

**החלטות עיצוב חשובות בפיצ'ר**:
1. **הצ'אט לא מציג את תוכן התשובה** — רק כרטיס קומפקטי "הסיכום מוכן" עם כפתור הורדה. כל התוכן יורד כ-PDF. חריג: `kind === 'question'` (שאלות המשך) כן מוצג inline בצ'אט.
2. **כל יופי ה-PDF נעשה בצד הלקוח** (CSS + highlight.js/Chart.js/KaTeX מ-CDN בחלון ההדפסה) — **אפס טוקנים**. אסור לבקש מ-Claude לייצר HTML מעוצב.
3. **ויזואלים** (3 סוגים בלבד): **SVG** רק לגאומטריה/צורות · ```chart``` (Chart.js, סגנון נקי ומינימלי) לנתונים · ```flow``` (כרטיסי CSS) לתהליכים/החלטות. **לא Mermaid** (נכשל ב-RTL/עברית/אמוג'י — הוסר לגמרי), לא ASCII art, ומתמטיקה תמיד ב-LaTeX (`$`/`$$`) ולעולם לא בבלוק קוד.
4. **תבנית ה-PDF היא בהירה** (`option3` — לבן + כחול אקדמי). חובה תֵמה בהירה כי דפדפנים לא מדפיסים רקעים כברירת מחדל — טקסט כהה על רקע לבן תמיד מודפס. אין דיאלוג הדפסה אוטומטי (המשתמש לוחץ "שמור כ-PDF" בעצמו), ואין תאריך ב-footer (רק "נוצר באמצעות ProStudy AI").

## ניתוב טוקנים (חשוב — אל תשבור)
ב-`ai-assistant/index.ts`:
- **ROUTING**: `solve`→opus-4-8 + extended thinking; `summary`/`practice`/`question`→sonnet-4-6.
- **דילוג על מסמך בשאלות המשך**: `question` עם היסטוריה קיימת (`isFollowUp`) **לא שולח מחדש את ה-PDF** — מסתמך על ההיסטוריה. `summary`/`solve`/`practice` תמיד קוראים את המסמך.
- **Prompt caching**: למסמך/תמונה ול-`SYSTEM_PROMPT` יש `cache_control: { type:'ephemeral', ttl:'1h' }` (TTL שעה — קריאת cache 0.1x, כתיבת cache 2x). **כל שינוי בייט ב-SYSTEM_PROMPT שובר את ה-cache** — אל תוסיף תאריך/שם משתמש שם.
- **הקטנת תמונות**: `downscaleImage()` ב-`premiumApi.js` מקטין תמונות ל-≤1568px (קצה ארוך) דרך canvas לפני העלאה — חוסך טוקני קלט.
- **היסטוריה**: רק 10 ההודעות האחרונות נשלחות.
- **אבטחה**: `filePath` חייב להתחיל ב-`${user.id}/`.

## בסיס נתונים (Supabase)
טבלאות Premium: `subscriptions`, `uploaded_files`, `ai_conversations`, `ai_messages`, `ai_usage` (כולן RLS — משתמש רואה רק את שלו). Storage bucket פרטי `materials` עם נתיבים `materials/{user_id}/...`. `course_id` הוא **BIGINT** (כי `courses.id` הוא bigserial). מכסות יומיות: premium=30, pro=100 פעולות.

**מיגרציות שצריך להריץ ב-SQL Editor** (קבצי `.sql` בשורש):
- `add_message_kind.sql` — עמודה `kind` ב-`ai_messages` (מסמן summary/practice/solve/question כדי שכרטיסי ההורדה ישוחזרו נכון בטעינת שיחה).
- `add_ai_costs.sql` — עמודה `cache_write_tokens` ב-`ai_usage` + RPC `admin_get_ai_costs()` (SECURITY DEFINER, בודק שהקורא הוא מייל האדמין).

## פאנל עלויות AI (חמ"ל / AdminDashboard)
`AiCostPanel` ב-`src/pages/AdminDashboard.jsx` מציג עלות שימוש בטוקנים **בלייב** (כמו Claude Console). קורא ל-`admin_get_ai_costs` ומתרענן כל 20 שניות. כולל KPI (היום/החודש/הכול), פירוט לפי מודל, ופיד 25 הקריאות האחרונות. תמחור לכל 1M$ מוגדר ב-`PRICING`: Opus 4.8 $5/$25, Sonnet 4.6 $3/$15, Haiku 4.5 $1/$5; המרה לש"ח `USD_TO_ILS=3.7`. **רק האדמין רואה את הדף** (ה-RPC חוסם בצד השרת לפי מייל).

## מערכת שעות (Schedule) — אינטגרציה עם מבחנים/משימות
`src/pages/Schedule.jsx` שואב `exams` ו-`updateTask` מ-`useData()`. מבחנים מלוח המבחנים מופיעים אוטומטית כדגלי כותרת ביום (`examsByDay`), ומשימות עם תאריך הגשה מופיעות כהתראה (`tasksByDay`, רק `!completed`). לחיצה על דגל פותחת `DayDetailModal` עם רשימת המבחנים והמשימות; כפתור "הוגש" קורא `updateTask(id,{completed:true})` ומסיר את ההתראה. מבחנים/משימות הם תאריך-בלבד (ללא שעה) ולכן מוצגים כדגלים בראש היום, לא כבלוקים ברשת השעות. **כיוון חצים ב-RTL**: חץ ימינה = שבוע קודם, חץ שמאלה = שבוע הבא.

## Edge Functions אחרות
`send-welcome`, `streak-reminder`, `weekly-summary` (תחת `supabase/functions/`, משתפות `_shared`).

## סודות נדרשים
`ANTHROPIC_API_KEY` (דרך `supabase secrets set`). `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ANON_KEY` מוזרקים אוטומטית. בצד הלקוח: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## סביבת פיתוח
Windows + PowerShell. Project ref של Supabase: `ymodgzacgzncrwmeqqle`. שורות מומרות CRLF (אזהרות git על LF→CRLF הן רעש, לא שגיאה).
