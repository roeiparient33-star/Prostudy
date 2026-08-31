-- ============================================================
-- ProStudy — Security Fixes, שלב 2: נעילת עמודות כלכליות
--
-- ⚠️⚠️ להריץ רק אחרי ש:
--   1. security_fixes_step1.sql רץ בהצלחה
--   2. הקוד החדש (שקורא ל-RPC-ים) נפרס ל-Vercel והאתר עובד
-- אחרת הגרסה הישנה של האתר תיכשל בשמירת סשנים/רכישות.
--
-- מה זה עושה: מבטל את היכולת של הלקוח לעדכן ישירות עמודות
-- ששוות כסף/סטטוס (credits, streak, דקות לימוד, רכישות).
-- מעכשיו הן משתנות רק דרך ה-RPC-ים משלב 1.
-- ============================================================

REVOKE UPDATE ON profiles FROM anon, authenticated;

-- עמודות "בטוחות" שהלקוח עדיין מעדכן ישירות:
GRANT UPDATE (
  name,                    -- עריכת פרופיל (Topbar)
  semester,                -- עריכת פרופיל
  weekly_goal_hours,       -- עריכת פרופיל
  avatar_config,           -- לבישה/החלפת פריטים שכבר נרכשו (קוסמטי)
  achievements_unlocked,   -- חותמות זמן של גביעים (קוסמטי)
  onboarding_completed_at, -- סיום הטיול המודרך
  biz_progress             -- צ'קבוקסים של החמ"ל (אדמין)
) ON profiles TO authenticated;

-- עמודות שנעולות מעכשיו (לשינוי רק דרך RPC / שרת):
--   credits, streak_current, streak_best, streak_last_date, streak_freezes,
--   weekly_studied_minutes, total_studied_minutes, weekly_reset_date,
--   presets_purchased, avatar_purchased, activation_bonus_at,
--   invite_code, referred_by,
--   session_active, session_course_name, session_started_at, session_last_beat
--   (השעון עבר כולו ל-RPC בזמן-שרת — ראה friends_timer_upgrade.sql)

-- ============================================================
-- בדיקות אחרי הרצה (בקונסולת הדפדפן של האתר, כמשתמש מחובר):
--
--   // אמור להיכשל עם 403/permission denied:
--   await supabase.from('profiles').update({ credits: 99999 }).eq('id', (await supabase.auth.getUser()).data.user.id)
--
--   // אמור להצליח:
--   await supabase.from('profiles').update({ name: 'בדיקה' }).eq('id', (await supabase.auth.getUser()).data.user.id)
--
-- ולוודא באתר: עצירת טיימר נותנת קרדיטים, קנייה בחנות עובדת,
-- עריכת שם בפרופיל עובדת.
-- ============================================================
