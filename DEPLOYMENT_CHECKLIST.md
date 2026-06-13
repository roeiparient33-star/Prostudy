# ProStudy — Deployment Checklist

## שלב 1 — SQL ב-Supabase

### 1א. קבל את ה-Service Role Key
1. כנס ל-supabase.com → הפרויקט שלך
2. Settings → API
3. תחת "Project API keys" — לחץ "Reveal" ליד `service_role`
4. Copy את המפתח

### 1ב. עדכן את ux_updates.sql
- פתח `ux_updates.sql`
- שורות 34 ו-46 — החלף את `<SERVICE_ROLE_KEY>` במפתח

### 1ג. הרץ ב-SQL Editor
1. Supabase → SQL Editor
2. הרץ את `ux_updates.sql` (copy → paste → Run)
3. הרץ את `admin_dashboard.sql` (אותו דבר)

---

## שלב 2 — פתח חשבון Resend

1. כנס ל-resend.com → "Get Started" → הירשם
2. לחץ "Create API Key" → תן שם (prostudy-prod) → Add
3. Copy את המפתח (מתחיל ב-`re_`) — שמור, לא יוצג שוב

---

## שלב 3 — התקן Supabase CLI

```powershell
npm install -g supabase
supabase login
```
(יפתח דפדפן לאישור)

---

## שלב 4 — קשר את הפרויקט

מתוך תיקיית הפרויקט:
```powershell
supabase link --project-ref ymodgzacgzncrwmeqqle
```
סיסמת ה-database נמצאת ב: Supabase → Settings → Database → "Database password"

---

## שלב 5 — הגדר סודות

```powershell
supabase secrets set RESEND_API_KEY=re_XXXXXXXXXXXXXXXX
supabase secrets set FROM_EMAIL="ProStudy <onboarding@resend.dev>"
```

---

## שלב 6 — פרוס Edge Functions

```powershell
supabase functions deploy send-welcome
supabase functions deploy streak-reminder
supabase functions deploy weekly-summary
```

---

## שלב 7 — הגדר Webhook (מייל ברוכים הבאים)

1. Supabase → Database → Webhooks → "Create a new hook"
2. מלא:
   - **Name**: `send-welcome`
   - **Table**: `profiles`
   - **Events**: INSERT בלבד
   - **URL**: `https://ymodgzacgzncrwmeqqle.supabase.co/functions/v1/send-welcome`
3. תחת HTTP Headers → הוסף:
   - Key: `Authorization`
   - Value: `Bearer <SERVICE_ROLE_KEY>`
4. לחץ Save

---

## סדר מומלץ
1 → 2 → 3 → 4 → 5 → 6 → 7

## לאחר הפריסה
- כל נרשם חדש מקבל welcome email
- תזכורת רצף יוצאת כל יום ב-18:00
- סיכום שבועי יוצא כל יום שני ב-09:00
- ליגת השבוע מתאפסת כל ראשון בחצות
