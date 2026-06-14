-- ════════════════════════════════════════════════════════════════
--  עלויות AI לחמ"ל — מעקב טוקנים + פונקציית אדמין לחישוב עלות חי
--  הרץ פעם אחת ב-Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- 1) עמודת טוקני כתיבת cache (הוצאה משמעותית בקריאה ראשונה — נדרשת לעלות מדויקת)
ALTER TABLE public.ai_usage
  ADD COLUMN IF NOT EXISTS cache_write_tokens INTEGER DEFAULT 0;

-- 2) פונקציית אדמין: מחזירה סיכומי טוקנים לפי מודל וטווח זמן + פיד אחרון.
--    העלות בדולרים מחושבת בצד הלקוח (לפי מחירון לכל מודל).
CREATE OR REPLACE FUNCTION public.admin_get_ai_costs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email text;
  result jsonb;
BEGIN
  SELECT lower(email) INTO caller_email FROM auth.users WHERE id = auth.uid();
  IF caller_email IS DISTINCT FROM 'roeiparient33@gmail.com' THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'by_model_today', (
      SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT model,
               count(*)                          AS calls,
               coalesce(sum(input_tokens),0)     AS input_tokens,
               coalesce(sum(output_tokens),0)    AS output_tokens,
               coalesce(sum(cache_read_tokens),0)  AS cache_read_tokens,
               coalesce(sum(cache_write_tokens),0) AS cache_write_tokens
        FROM ai_usage WHERE created_at >= date_trunc('day', now())
        GROUP BY model
      ) t
    ),
    'by_model_month', (
      SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT model,
               count(*)                          AS calls,
               coalesce(sum(input_tokens),0)     AS input_tokens,
               coalesce(sum(output_tokens),0)    AS output_tokens,
               coalesce(sum(cache_read_tokens),0)  AS cache_read_tokens,
               coalesce(sum(cache_write_tokens),0) AS cache_write_tokens
        FROM ai_usage WHERE created_at >= date_trunc('month', now())
        GROUP BY model
      ) t
    ),
    'by_model_all', (
      SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT model,
               count(*)                          AS calls,
               coalesce(sum(input_tokens),0)     AS input_tokens,
               coalesce(sum(output_tokens),0)    AS output_tokens,
               coalesce(sum(cache_read_tokens),0)  AS cache_read_tokens,
               coalesce(sum(cache_write_tokens),0) AS cache_write_tokens
        FROM ai_usage
        GROUP BY model
      ) t
    ),
    -- פיד חי: 25 הפעולות האחרונות עם מייל המשתמש
    'recent', (
      SELECT coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) FROM (
        SELECT u.email,
               a.action, a.model,
               a.input_tokens, a.output_tokens,
               a.cache_read_tokens, a.cache_write_tokens,
               a.created_at
        FROM ai_usage a
        JOIN auth.users u ON u.id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT 25
      ) r
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_ai_costs() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.admin_get_ai_costs() TO authenticated;
