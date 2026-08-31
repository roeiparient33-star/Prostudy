-- ============================================================
-- ProStudy — Security Fixes, שלב 1 (תואם אחורה — בטוח להרצה מיד)
-- הרץ ב-Supabase → SQL Editor → New query → Run
--
-- מה הקובץ עושה:
--   א. טבלת מחירי חנות בצד שרת (הלקוח לא קובע מחירים)
--   ב. RPC-ים לכל הפעולות הכלכליות (קרדיטים/רצף/רכישות/הפניות)
--   ג. סגירת הפרצה ב-pact_members (הצטרפות עצמית לכל צוות)
--   ד. אכיפת מגבלות העלאה ברמת ה-bucket
--
-- ⚠️ סדר פריסה: קובץ זה → פריסת הקוד החדש ל-Vercel →
--    ורק אז security_fixes_step2_lockdown.sql (נעילת העמודות).
-- ============================================================

-- ─── א. מחירי החנות (מקור אמת בשרת) ─────────────────────────
CREATE TABLE IF NOT EXISTS avatar_prices (
  kind TEXT NOT NULL,          -- 'preset' | 'item'
  key  TEXT NOT NULL,          -- אינדקס פריסט או id של פריט
  cost INT  NOT NULL CHECK (cost >= 0),
  PRIMARY KEY (kind, key)
);
ALTER TABLE avatar_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_prices" ON avatar_prices;
CREATE POLICY "read_prices" ON avatar_prices FOR SELECT TO authenticated USING (true);

-- סנכרון מ-avatarData.js (PRESET_COSTS + SHOP_ITEMS)
INSERT INTO avatar_prices (kind, key, cost) VALUES
  ('preset','0',80),('preset','1',60),('preset','2',90),('preset','3',70),
  ('preset','4',100),('preset','5',75),
  ('preset','6',350),('preset','7',400),('preset','8',320),('preset','9',370),
  ('preset','10',300),('preset','11',420),('preset','12',450),
  ('item','crown',80),('item','halo',50),('item','cat_ears',40),('item','party_hat',35),
  ('item','grad_cap',60),('item','top_hat',65),
  ('item','blush',20),('item','freckles',30),('item','face_stars',45),
  ('item','bg_sunset',40),('item','bg_space',60),('item','bg_confetti',50),
  ('item','float_hearts',55),('item','aura_sparkles',65),('item','aura_fire',80),('item','aura_rainbow',70),
  ('item','pet_dog',100),('item','pet_robot',150),('item','pet_duck',80),('item','pet_bunny',90),('item','pet_cat',120)
ON CONFLICT (kind, key) DO UPDATE SET cost = EXCLUDED.cost;

-- ─── ב. RPC-ים כלכליים ───────────────────────────────────────
-- כולם SECURITY DEFINER + auth.uid() — פועלים רק על המשתמש המחובר.

-- 1) סיום סשן לימוד: קרדיטים + דקות + רצף — הכל מחושב בשרת.
--    תקרה: 8 שעות לסשן (כמו MAX_SESSION_SECS בלקוח).
CREATE OR REPLACE FUNCTION finish_study_session(p_seconds INT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prof profiles%ROWTYPE;
  secs INT; mins INT;
  v_today DATE := (now() AT TIME ZONE 'utc')::date;
  gap INT; v_streak INT; v_freezes INT; v_used INT := 0;
  counted BOOLEAN := false;
BEGIN
  SELECT * INTO prof FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'no_profile'; END IF;

  secs := LEAST(GREATEST(COALESCE(p_seconds, 0), 0), 28800);
  mins := CEIL(secs / 60.0);

  IF secs < 5 THEN
    UPDATE profiles SET session_active = false, session_course_name = '', session_started_at = ''
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
    session_active = false, session_course_name = '', session_started_at = ''
  WHERE id = auth.uid();

  RETURN jsonb_build_object(
    'credits_earned', mins,
    'streak_counted', counted,
    'streak_current', v_streak,
    'freezes_used',   v_used
  );
END; $$;

-- 2) קניית הקפאת רצף (150 קרדיטים, מקסימום 2 במלאי)
CREATE OR REPLACE FUNCTION buy_streak_freeze()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_credits INT; v_freezes INT;
BEGIN
  UPDATE profiles SET credits = credits - 150, streak_freezes = COALESCE(streak_freezes, 0) + 1
  WHERE id = auth.uid() AND COALESCE(credits, 0) >= 150 AND COALESCE(streak_freezes, 0) < 2
  RETURNING credits, streak_freezes INTO v_credits, v_freezes;
  IF v_credits IS NULL THEN RAISE EXCEPTION 'cannot_buy_freeze'; END IF;
  RETURN jsonb_build_object('credits', v_credits, 'streak_freezes', v_freezes);
END; $$;

-- 3) בונוס אקטיבציה (100 קרדיטים) — התנאים נבדקים בשרת, פעם אחת בלבד
CREATE OR REPLACE FUNCTION claim_activation_bonus()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prof profiles%ROWTYPE; v_credits INT;
BEGIN
  SELECT * INTO prof FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'no_profile'; END IF;
  IF prof.activation_bonus_at IS NOT NULL THEN RAISE EXCEPTION 'already_claimed'; END IF;
  IF (SELECT count(*) FROM courses WHERE user_id = auth.uid()) < 1 THEN RAISE EXCEPTION 'steps_incomplete'; END IF;
  IF (SELECT count(*) FROM tasks   WHERE user_id = auth.uid()) < 3 THEN RAISE EXCEPTION 'steps_incomplete'; END IF;
  IF COALESCE(prof.total_studied_minutes, 0) = 0 AND COALESCE(prof.streak_current, 0) = 0 THEN
    RAISE EXCEPTION 'steps_incomplete';
  END IF;
  UPDATE profiles SET credits = COALESCE(credits, 0) + 100, activation_bonus_at = now()
  WHERE id = auth.uid()
  RETURNING credits INTO v_credits;
  RETURN jsonb_build_object('credits', v_credits);
END; $$;

-- 4) קניית פריסט (המחיר מ-avatar_prices, לא מהלקוח)
CREATE OR REPLACE FUNCTION buy_preset(p_idx INT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cost INT; v_credits INT; v_presets JSONB;
BEGIN
  SELECT cost INTO v_cost FROM avatar_prices WHERE kind = 'preset' AND key = p_idx::text;
  IF v_cost IS NULL THEN RAISE EXCEPTION 'unknown_preset'; END IF;
  UPDATE profiles SET
    credits = credits - v_cost,
    presets_purchased = COALESCE(presets_purchased, '[]'::jsonb) || to_jsonb(p_idx)
  WHERE id = auth.uid()
    AND COALESCE(credits, 0) >= v_cost
    AND NOT (COALESCE(presets_purchased, '[]'::jsonb) @> to_jsonb(p_idx))
  RETURNING credits, presets_purchased INTO v_credits, v_presets;
  IF v_credits IS NULL THEN RAISE EXCEPTION 'cannot_buy_preset'; END IF;
  RETURN jsonb_build_object('credits', v_credits, 'presets_purchased', v_presets);
END; $$;

-- 5) קניית פריט לאווטר
CREATE OR REPLACE FUNCTION buy_avatar_item(p_preset_id INT, p_item_id TEXT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cost INT; v_credits INT; v_purchased JSONB; v_owned JSONB;
BEGIN
  SELECT cost INTO v_cost FROM avatar_prices WHERE kind = 'item' AND key = p_item_id;
  IF v_cost IS NULL THEN RAISE EXCEPTION 'unknown_item'; END IF;

  SELECT COALESCE(avatar_purchased, '{}'::jsonb) INTO v_purchased
  FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF v_purchased IS NULL THEN RAISE EXCEPTION 'no_profile'; END IF;

  v_owned := COALESCE(v_purchased -> p_preset_id::text, '[]'::jsonb);
  IF v_owned @> to_jsonb(p_item_id) THEN RAISE EXCEPTION 'already_owned'; END IF;

  UPDATE profiles SET
    credits = credits - v_cost,
    avatar_purchased = jsonb_set(COALESCE(avatar_purchased, '{}'::jsonb),
                                 ARRAY[p_preset_id::text],
                                 v_owned || to_jsonb(p_item_id))
  WHERE id = auth.uid() AND COALESCE(credits, 0) >= v_cost
  RETURNING credits, avatar_purchased INTO v_credits, v_purchased;
  IF v_credits IS NULL THEN RAISE EXCEPTION 'insufficient_credits'; END IF;
  RETURN jsonb_build_object('credits', v_credits, 'avatar_purchased', v_purchased);
END; $$;

-- 6) בחירת פריסט התחלתי (onboarding) — חינם, רק מ-6 הבסיסיים, רק פעם אחת
CREATE OR REPLACE FUNCTION select_initial_preset(p_idx INT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cfg JSONB;
BEGIN
  IF p_idx < 0 OR p_idx > 5 THEN RAISE EXCEPTION 'invalid_preset'; END IF;
  v_cfg := jsonb_build_object('baseSelected', true, 'presetId', p_idx, 'presetCfgs', '{}'::jsonb);
  UPDATE profiles SET
    avatar_config = v_cfg,
    presets_purchased = jsonb_build_array(p_idx)
  WHERE id = auth.uid()
    AND COALESCE(presets_purchased, '[]'::jsonb) = '[]'::jsonb
    AND COALESCE(avatar_config ->> 'baseSelected', 'false') <> 'true';
  IF NOT FOUND THEN RAISE EXCEPTION 'already_selected'; END IF;
  RETURN v_cfg;
END; $$;

-- 7) הפניות — אטומי, דו-צדדי, עם הגנות מפני farming
CREATE OR REPLACE FUNCTION apply_referral(p_code TEXT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inviter UUID; v_credits INT;
BEGIN
  SELECT id INTO v_inviter FROM profiles
  WHERE invite_code = upper(trim(p_code)) AND id <> auth.uid();
  IF v_inviter IS NULL THEN RETURN jsonb_build_object('applied', false); END IF;

  -- רק אם עוד לא הופנה + החשבון נוצר בשבוע האחרון (מקשה על farming)
  UPDATE profiles SET referred_by = v_inviter, credits = COALESCE(credits, 0) + 30
  WHERE id = auth.uid() AND referred_by IS NULL
    AND created_at > now() - interval '7 days'
  RETURNING credits INTO v_credits;
  IF v_credits IS NULL THEN RETURN jsonb_build_object('applied', false); END IF;

  UPDATE profiles SET credits = COALESCE(credits, 0) + 50 WHERE id = v_inviter;
  RETURN jsonb_build_object('applied', true, 'credits', v_credits, 'referred_by', v_inviter);
END; $$;

-- 8) יצירת קוד הזמנה (בשרת, עם עמידות להתנגשויות)
CREATE OR REPLACE FUNCTION ensure_invite_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code TEXT; i INT := 0;
BEGIN
  SELECT invite_code INTO v_code FROM profiles WHERE id = auth.uid();
  IF v_code IS NOT NULL AND v_code <> '' THEN RETURN v_code; END IF;
  LOOP
    i := i + 1;
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    BEGIN
      UPDATE profiles SET invite_code = v_code WHERE id = auth.uid();
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      IF i >= 5 THEN RAISE; END IF;
    END;
  END LOOP;
END; $$;

-- 9) איפוס דקות שבועי (השבוע מחושב בשרת — ראשון כתחילת שבוע)
CREATE OR REPLACE FUNCTION reset_weekly_minutes()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sunday TEXT := to_char((now() AT TIME ZONE 'utc')::date
                   - EXTRACT(dow FROM (now() AT TIME ZONE 'utc')::date)::int, 'YYYY-MM-DD');
  v_did BOOLEAN := false;
BEGIN
  UPDATE profiles SET weekly_studied_minutes = 0, weekly_reset_date = v_sunday
  WHERE id = auth.uid() AND COALESCE(weekly_reset_date, '') <> v_sunday;
  v_did := FOUND;
  RETURN jsonb_build_object('reset', v_did, 'week_key', v_sunday);
END; $$;

-- הרשאות: רק משתמשים מחוברים
REVOKE EXECUTE ON FUNCTION finish_study_session(INT),
  buy_streak_freeze(), claim_activation_bonus(),
  buy_preset(INT), buy_avatar_item(INT, TEXT), select_initial_preset(INT),
  apply_referral(TEXT), ensure_invite_code(), reset_weekly_minutes()
  FROM anon, public;
GRANT EXECUTE ON FUNCTION finish_study_session(INT),
  buy_streak_freeze(), claim_activation_bonus(),
  buy_preset(INT), buy_avatar_item(INT, TEXT), select_initial_preset(INT),
  apply_referral(TEXT), ensure_invite_code(), reset_weekly_minutes()
  TO authenticated;

-- ─── ג. סגירת פרצת pact_members ─────────────────────────────
-- helpers ב-SECURITY DEFINER כדי למנוע רקורסיית RLS בין הטבלאות
CREATE OR REPLACE FUNCTION is_pact_creator(p_pact_id BIGINT)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS
$$ SELECT EXISTS (SELECT 1 FROM study_pacts WHERE id = p_pact_id AND creator_id = auth.uid()) $$;

CREATE OR REPLACE FUNCTION is_pact_member(p_pact_id BIGINT)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS
$$ SELECT EXISTS (SELECT 1 FROM pact_members WHERE pact_id = p_pact_id AND user_id = auth.uid()) $$;

REVOKE EXECUTE ON FUNCTION is_pact_creator(BIGINT), is_pact_member(BIGINT) FROM anon, public;
GRANT  EXECUTE ON FUNCTION is_pact_creator(BIGINT), is_pact_member(BIGINT) TO authenticated;

-- INSERT: יוצר הצוות מוסיף את עצמו כ-accepted, ומזמין אחרים רק כ-pending.
-- אף אחד אחר לא יכול להוסיף אף אחד.
DROP POLICY IF EXISTS "Auth insert pact_members" ON pact_members;
DROP POLICY IF EXISTS "Creator adds members"     ON pact_members;
DROP POLICY IF EXISTS "pact_member_insert"       ON pact_members;
CREATE POLICY "pact_member_insert" ON pact_members FOR INSERT TO authenticated
  WITH CHECK (
    is_pact_creator(pact_id)
    AND (
      (user_id = auth.uid() AND status = 'accepted')   -- היוצר את עצמו
      OR (user_id <> auth.uid() AND status = 'pending') -- הזמנות — תמיד pending
    )
  );

-- SELECT: רואים חברי צוות רק בצוותים שאתה חבר/יוצר בהם (לא את כל הגרף)
DROP POLICY IF EXISTS "Auth read pact_members" ON pact_members;
DROP POLICY IF EXISTS "pact_member_select"     ON pact_members;
CREATE POLICY "pact_member_select" ON pact_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_pact_member(pact_id) OR is_pact_creator(pact_id));

-- study_pacts SELECT — ניסוח מחדש עם ה-helper (מונע רקורסיה עתידית)
DROP POLICY IF EXISTS "Members see pacts"            ON study_pacts;
DROP POLICY IF EXISTS "Members or creator see pacts" ON study_pacts;
CREATE POLICY "Members or creator see pacts" ON study_pacts
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR is_pact_member(id));

-- ─── ד. מגבלות bucket בצד שרת ───────────────────────────────
UPDATE storage.buckets
SET file_size_limit = 26214400,  -- 25MB
    allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp']
WHERE id = 'materials';

-- ============================================================
-- בדיקה מהירה אחרי הרצה (אופציונלי):
--   SELECT proname FROM pg_proc WHERE proname IN
--     ('finish_study_session','buy_streak_freeze','claim_activation_bonus',
--      'buy_preset','buy_avatar_item','select_initial_preset',
--      'apply_referral','ensure_invite_code','reset_weekly_minutes');
-- אמור להחזיר 9 שורות.
-- ============================================================
