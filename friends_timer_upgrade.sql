-- ============================================================
-- ProStudy — שדרוג חברים + שעון (הרץ אחרי security_fixes_step1.sql)
-- הרץ ב-Supabase → SQL Editor → New query → Run
--
-- א. הפעלת Realtime על הטבלאות (הסיבה שהתראות לא הגיעו בלייב!)
-- ב. שעון בזמן-שרת: start/heartbeat/finish — אי אפשר לזייף משך,
--    ואי אפשר "להשאיר דולק" — בלי heartbeat הזיכוי נעצר תוך דקות.
-- ============================================================

-- ─── א. Realtime publication ─────────────────────────────────
-- בלי זה, postgres_changes לא שולח אירועים בכלל — וזו הסיבה
-- שהאתר לא התעדכן בלי רענון. (עטוף ב-DO למקרה שכבר נוסף.)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pact_members;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── ב. שעון בזמן-שרת ────────────────────────────────────────
-- עמודת "פעימת חיים" — הלקוח מעדכן כל ~3 דקות בזמן שהשעון רץ.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_last_beat TIMESTAMPTZ;

-- 1) התחלת סשן — הזמן נקבע בשרת, לא בלקוח
CREATE OR REPLACE FUNCTION start_study_session(p_course_name TEXT DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_now TIMESTAMPTZ := now();
BEGIN
  UPDATE profiles SET
    session_active      = true,
    session_course_name = left(COALESCE(p_course_name, ''), 80),
    session_started_at  = to_char(v_now AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    session_last_beat   = v_now
  WHERE id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'no_profile'; END IF;
  RETURN jsonb_build_object('started_at', v_now);
END; $$;

-- 2) פעימת חיים — מוכיחה שהטאב עדיין חי
CREATE OR REPLACE FUNCTION heartbeat_study_session()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE profiles SET session_last_beat = now()
  WHERE id = auth.uid() AND session_active = true;
$$;

-- 3) סיום סשן — המשך מחושב כולו בשרת:
--    מהתחלה ועד (עכשיו, או הפעימה האחרונה + חסד של 6 דקות — המוקדם מביניהם).
--    טאב שנסגר/מחשב שנרדם ⇒ הזיכוי נעצר בפעימה האחרונה.
--    תקרה: 4 שעות לסשן (נגד "להשאיר דולק" — סשן אמיתי ארוך פשוט מפצלים).
DROP FUNCTION IF EXISTS finish_study_session(INT);
CREATE OR REPLACE FUNCTION finish_study_session()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prof profiles%ROWTYPE;
  v_started TIMESTAMPTZ; v_end TIMESTAMPTZ;
  secs INT; mins INT;
  v_today DATE := (now() AT TIME ZONE 'utc')::date;
  gap INT; v_streak INT; v_freezes INT; v_used INT := 0;
  counted BOOLEAN := false;
BEGIN
  SELECT * INTO prof FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'no_profile'; END IF;

  v_started := NULLIF(prof.session_started_at, '')::timestamptz;

  -- אין סשן פעיל / אין נקודת התחלה — רק ניקוי סטטוס
  IF NOT COALESCE(prof.session_active, false) OR v_started IS NULL THEN
    UPDATE profiles SET session_active = false, session_course_name = '',
      session_started_at = '', session_last_beat = NULL
    WHERE id = auth.uid();
    RETURN jsonb_build_object('credits_earned', 0, 'streak_counted', false);
  END IF;

  v_end := LEAST(now(), COALESCE(prof.session_last_beat, now()) + interval '6 minutes');
  secs  := GREATEST(EXTRACT(EPOCH FROM (v_end - v_started))::int, 0);
  secs  := LEAST(secs, 14400);  -- תקרת 4 שעות לסשן
  mins  := CEIL(secs / 60.0);

  IF secs < 5 THEN
    UPDATE profiles SET session_active = false, session_course_name = '',
      session_started_at = '', session_last_beat = NULL
    WHERE id = auth.uid();
    RETURN jsonb_build_object('credits_earned', 0, 'streak_counted', false);
  END IF;

  v_streak  := COALESCE(prof.streak_current, 0);
  v_freezes := COALESCE(prof.streak_freezes, 0);

  IF prof.streak_last_date IS DISTINCT FROM v_today THEN
    counted := true;
    IF prof.streak_last_date IS NULL THEN
      v_streak := 1;
    ELSE
      gap := (v_today - prof.streak_last_date) - 1;
      IF gap <= 0 THEN
        v_streak := v_streak + 1;
      ELSIF v_freezes >= gap THEN
        v_used := gap; v_freezes := v_freezes - gap; v_streak := v_streak + 1;
      ELSE
        v_streak := 1;
      END IF;
    END IF;
  END IF;

  UPDATE profiles SET
    credits                = COALESCE(credits, 0) + mins,
    weekly_studied_minutes = COALESCE(weekly_studied_minutes, 0) + mins,
    total_studied_minutes  = COALESCE(total_studied_minutes, 0) + mins,
    streak_current         = CASE WHEN counted THEN v_streak ELSE streak_current END,
    streak_best            = CASE WHEN counted THEN GREATEST(COALESCE(streak_best,0), v_streak) ELSE streak_best END,
    streak_last_date       = CASE WHEN counted THEN v_today ELSE streak_last_date END,
    streak_freezes         = CASE WHEN counted THEN v_freezes ELSE streak_freezes END,
    session_active = false, session_course_name = '', session_started_at = '',
    session_last_beat = NULL
  WHERE id = auth.uid();

  RETURN jsonb_build_object(
    'credits_earned', mins,
    'streak_counted', counted,
    'streak_current', v_streak,
    'freezes_used',   v_used
  );
END; $$;

REVOKE EXECUTE ON FUNCTION start_study_session(TEXT), heartbeat_study_session(), finish_study_session()
  FROM anon, public;
GRANT EXECUTE ON FUNCTION start_study_session(TEXT), heartbeat_study_session(), finish_study_session()
  TO authenticated;

-- ============================================================
-- הערה: אחרי שהקוד החדש באוויר, עמודות session_* כבר לא צריכות
-- הרשאת UPDATE ישירה מהלקוח — security_fixes_step2_lockdown.sql
-- המעודכן כבר לא מעניק אותן.
-- ============================================================
