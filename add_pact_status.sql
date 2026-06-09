-- ════════════════════════════════════════════════
-- הוסף עמודת status לחברי צוות למידה
-- הרץ ב-Supabase SQL Editor → New Query → Run
-- ════════════════════════════════════════════════

ALTER TABLE pact_members
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted';

-- אפשר UPDATE ל-accepted
DROP POLICY IF EXISTS "Members update own status" ON pact_members;
CREATE POLICY "Members update own status" ON pact_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- אפשר DELETE (דחייה)
DROP POLICY IF EXISTS "Members delete own membership" ON pact_members;
CREATE POLICY "Members delete own membership" ON pact_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
