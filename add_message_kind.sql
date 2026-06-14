-- מוסיף עמודת kind ל-ai_messages:
-- סוג הפעולה שיצרה את ההודעה — 'question' מוצג בצ'אט, השאר ('summary'/'practice'/'solve') כקובץ PDF.
-- הקוד עובד גם לפני וגם אחרי המיגרציה (fallback), אבל בלי זה תשובות שאלה ישנות יוצגו ככרטיס PDF.

alter table public.ai_messages
  add column if not exists kind text;

-- הודעות assistant ישנות נשארות NULL ומטופלות כברירת מחדל ככרטיס PDF (כמו היום).
