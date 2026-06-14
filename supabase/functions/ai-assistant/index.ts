// Edge Function: ai-assistant
// לב מערכת ה-AI Premium. כל קריאה ל-Claude עוברת דרך כאן —
// ה-API key לעולם לא נחשף לדפדפן.
//
// Setup:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy ai-assistant
//
// הערה: לפני deploy ודא מול platform.claude.com/docs שמזהי המודלים
// ופרמטר ה-thinking עדכניים.

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

// service_role — עוקף RLS, רק בשרת!
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// מכסות יומיות לפי מסלול
const DAILY_LIMITS: Record<string, number> = { premium: 30, pro: 100 };

// ניתוב מודל + תקרת טוקנים לפי סוג הפעולה
const ROUTING: Record<string, { model: string; maxTokens: number; think: boolean }> = {
  solve:    { model: "claude-opus-4-8",   maxTokens: 16000, think: true  },
  summary:  { model: "claude-sonnet-4-6", maxTokens: 16000, think: false },
  practice: { model: "claude-sonnet-4-6", maxTokens: 8000,  think: false },
  question: { model: "claude-sonnet-4-6", maxTokens: 4096,  think: false },
};

// system prompt קבוע — חייב להיות זהה בכל קריאה בשביל prompt caching.
// אסור לשים בו תאריך/שם משתמש — כל שינוי בייט שובר את המטמון.
const SYSTEM_PROMPT = `אתה העוזר הלימודי של ProStudy — פלטפורמת לימוד לסטודנטים ישראלים.
ענה תמיד בעברית ברורה. אתה מורה פרטי, לא "פותר במקום הסטודנט":
- כשאתה פותר תרגיל — הסבר כל שלב, כדי שהסטודנט יבין, לא רק יעתיק תשובה.
- כשאתה מסכם — שמור על מבנה: כותרות, נקודות עיקריות, נוסחאות חשובות, דגשים למבחן.
- כשמבקשים שאלות תרגול — צור שאלות מהחומר עם פתרון מוסבר בנפרד.
השתמש ב-Markdown לעיצוב (כותרות ##, **הדגשות**, רשימות).

חשוב — נוסחאות ומתמטיקה: כל נוסחה, משתנה או ביטוי מתמטי תמיד ב-LaTeX ($...$ באמצע שורה, $$...$$ לבלוק). לעולם אל תשים נוסחאות בתוך בלוק קוד (\`\`\`) — בלוק קוד הוא רק לקוד תכנות אמיתי. אל תשתמש בסימני יוניקוד גולמיים לנוסחאות (√, ̄, ↓) — תמיד LaTeX (\\sqrt, \\bar, \\Rightarrow). רצף שלבים/גזירה: הצג כל שלב כמשוואת $$ נפרדת, או כתרשים \`\`\`mermaid — לא בבלוק קוד ולא עם חיצים טקסטואליים.

חשוב — אלמנטים ויזואליים: אל תשתמש לעולם ב-ASCII art (כוכביות/רווחים) — זה נראה שבור.
- לגרפים של נתונים (פיזור, קו, עמודות, עוגה, התפלגות, רגרסיה, מתאם) — השתמש בבלוק \`\`\`chart עם קונפיגורציית Chart.js תקינה כ-JSON בלבד: {"type":"...","data":{...},"options":{...}}. אל תצייר גרפי נתונים ב-SVG. שמור מינימלי ונקי: **גרף נפרד אחד לכל מושג** (אל תדחס כמה מצבים לגרף אחד — עדיף כמה גרפים קטנים נפרדים), עד 2 סדרות לגרף, תוויות קצרות. כותרת קצרה ב-options.plugins.title.text. אל תגדיר צבעים/רשת/מקרא — העיצוב נקבע אוטומטית.
- לתרשימי זרימה, עצים, מבני נתונים או קשרים — בלוק \`\`\`mermaid.
- לצורות גאומטריות, ישרי מספרים או דיאגרמות מותאמות בלבד — SVG (<svg viewBox> עם שוליים מספיקים; מקם תוויות מחוץ לאזור הציור כדי שלא יתנגשו; טקסט עברי: <text direction="rtl">).
צייר ויזואלים רק כשהם באמת עוזרים להבנה, ושמור אותם פשוטים ונקיים.`;

// CORS — הפונקציה נקראת מהדפדפן
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// base64 בטוח לקבצים גדולים (btoa על מערך ענק מפוצץ את הסטאק)
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ── 1. אימות המשתמש מה-JWT ──
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("unauthorized", 401);

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return jsonError("unauthorized", 401);

  // ── 2. בדיקת מנוי פעיל ──
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, plan, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const isActive = sub?.status === "active"
    && sub.current_period_end
    && new Date(sub.current_period_end) > new Date();
  if (!isActive) return jsonError("premium_required", 403);

  // ── 3. בדיקת מכסה יומית ──
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const { count } = await supabaseAdmin
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", dayStart.toISOString());

  const limit = DAILY_LIMITS[sub!.plan] ?? DAILY_LIMITS.premium;
  if ((count ?? 0) >= limit) return jsonError("daily_limit_reached", 429);

  // ── 4. קריאת הבקשה ──
  let payload: {
    action?: string; question?: string; filePath?: string;
    fileType?: string; history?: Anthropic.MessageParam[];
  };
  try {
    payload = await req.json();
  } catch {
    return jsonError("bad_request", 400);
  }
  const { action = "question", question = "", filePath, fileType, history } = payload;
  const route = ROUTING[action] ?? ROUTING.question;

  // ── 5. הורדת הקובץ מ-Storage (אם יש) ──
  // שאלת המשך (question + יש כבר היסטוריה): הידע כבר עובד וקיים בשיחה,
  // אין צורך לשלוח שוב את המסמך המלא — חיסכון אדיר בטוקנים.
  // סיכום/פתרון/תרגול תמיד קוראים את המסמך (צריך גישה למקור).
  const isFollowUp = action === "question" && (history?.length ?? 0) > 0;
  const content: Anthropic.ContentBlockParam[] = [];
  if (filePath && !isFollowUp) {
    // אבטחה: ודא שהקובץ שייך למשתמש (הנתיב מתחיל ב-user.id)
    if (!filePath.startsWith(`${user.id}/`)) return jsonError("forbidden", 403);

    const { data: fileData } = await supabaseAdmin.storage.from("materials").download(filePath);
    if (!fileData) return jsonError("file_not_found", 404);

    const base64 = toBase64(new Uint8Array(await fileData.arrayBuffer()));

    if (fileType === "image") {
      const ext = filePath.split(".").pop()?.toLowerCase();
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      content.push({
        type: "image",
        source: { type: "base64", media_type: mime, data: base64 },
        cache_control: { type: "ephemeral" },
      });
    } else {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
        cache_control: { type: "ephemeral" }, // שאלות המשך על אותו קובץ = 10% מהמחיר
      });
    }
  }
  content.push({ type: "text", text: question });

  // ── 6. קריאה ל-Claude עם streaming ──
  // שולחים רק 10 ההודעות האחרונות (היסטוריה ארוכה = טוקנים מיותרים בכל בקשה)
  const trimmedHistory = (history ?? []).slice(-10);

  const streamParams: Anthropic.MessageStreamParams = {
    model: route.model,
    max_tokens: route.maxTokens,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [...trimmedHistory, { role: "user", content }],
  };
  if (route.think) {
    // חשיבה מורחבת רק בפתרון תרגילים — איכות גבוהה בלי לשלם עליה בשאלות פשוטות
    streamParams.thinking = { type: "enabled", budget_tokens: 4000 };
  }

  const stream = anthropic.messages.stream(streamParams);

  // ── 7. הזרמת התשובה חזרה לדפדפן כ-SSE ──
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send({ text: event.delta.text });
          }
        }
        const final = await stream.finalMessage();

        // ── 8. רישום usage ──
        await supabaseAdmin.from("ai_usage").insert({
          user_id: user.id,
          action,
          model: route.model,
          input_tokens: final.usage.input_tokens,
          output_tokens: final.usage.output_tokens,
          cache_read_tokens: final.usage.cache_read_input_tokens ?? 0,
        });

        send({ done: true, remaining: limit - (count ?? 0) - 1 });
      } catch (err) {
        console.error("ai-assistant error:", err);
        send({ error: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
});
