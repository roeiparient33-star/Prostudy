// premiumApi — צד הלקוח לפיצ'רי ה-AI Premium.
// העלאת קבצים ל-Storage, ניהול ספריית החומרים, וצ'אט מוזרם מול ה-Edge Function.
import { supabase } from './supabase';

// מגבלות (תואם premium_schema.sql + פרק 7 בתוכנית)
export const MAX_FILE_MB   = 25;
export const MAX_FILES     = 50;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// סיווג קובץ לסוג שה-Edge Function מבין
function classify(file) {
  if (file.type === 'application/pdf') return 'pdf';
  if (IMAGE_TYPES.includes(file.type))  return 'image';
  return null; // לא נתמך
}

// סיומת לפי סוג ה-MIME (לשם הקובץ ב-Storage)
function extOf(file) {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type === 'image/png')  return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

// ── העלאת קובץ חדש ─────────────────────────────────────────────
export async function uploadMaterial(file, courseId = null) {
  const fileType = classify(file);
  if (!fileType) throw new Error('unsupported_type');
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error('file_too_large');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('unauthorized');

  const path = `${user.id}/${crypto.randomUUID()}.${extOf(file)}`;

  const { error: upErr } = await supabase.storage
    .from('materials')
    .upload(path, file, { contentType: file.type });
  if (upErr) throw upErr;

  const { data: row, error: dbErr } = await supabase.from('uploaded_files').insert({
    user_id:    user.id,
    course_id:  courseId || null,
    file_name:  file.name,
    storage_path: path,
    file_type:  fileType,
    size_bytes: file.size,
  }).select().single();

  if (dbErr) {
    // ניקוי: אם רישום ה-DB נכשל, אל תשאיר קובץ יתום
    await supabase.storage.from('materials').remove([path]);
    throw dbErr;
  }
  return row;
}

// ── רשימת הקבצים של המשתמש ─────────────────────────────────────
export async function listMaterials() {
  const { data } = await supabase
    .from('uploaded_files')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

// ── מחיקת קובץ (DB + Storage) ──────────────────────────────────
export async function deleteMaterial(file) {
  await supabase.storage.from('materials').remove([file.storage_path]);
  await supabase.from('uploaded_files').delete().eq('id', file.id);
}

// ── סטטוס מנוי ──────────────────────────────────────────────────
export async function getSubscription() {
  const { data } = await supabase
    .from('subscriptions')
    .select('status, plan, current_period_end')
    .maybeSingle();
  return data;
}

export function isSubscriptionActive(sub) {
  return !!sub
    && sub.status === 'active'
    && sub.current_period_end
    && new Date(sub.current_period_end) > new Date();
}

// ── שימוש יומי (כמה פעולות נוצלו היום) ─────────────────────────
export async function getTodayUsage() {
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', dayStart.toISOString());
  return count || 0;
}

export const DAILY_LIMITS = { premium: 30, pro: 100 };

// ── שיחות — יצירה, שמירת הודעות, טעינה ──────────────────────────

export async function createConversation(fileId, title) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from('ai_conversations').insert({
    user_id: user.id,
    file_id: fileId || null,
    title: title || 'שיחה חדשה',
  }).select().single();
  return data;
}

// kind: סוג הפעולה ('question'/'summary'/'practice'/'solve') — קובע אם התשובה
// מוצגת בצ'אט (question) או ככרטיס PDF (השאר). fallback אם עמודת kind עוד לא קיימת.
export async function saveMessage(conversationId, role, content, kind = null) {
  const base = { conversation_id: conversationId, role, content };
  const { error } = await supabase.from('ai_messages').insert(kind ? { ...base, kind } : base);
  if (error && kind) await supabase.from('ai_messages').insert(base);
}

export async function listConversations() {
  const { data } = await supabase
    .from('ai_conversations')
    .select('id, title, created_at, file_id')
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

export async function loadConversationMessages(conversationId) {
  // select('*') כדי לקבל גם את kind כשהעמודה קיימת, בלי לשבור לפני המיגרציה
  const { data } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at');
  return (data || []).map(m => ({ role: m.role, content: m.content, kind: m.kind ?? null }));
}

export async function deleteConversation(conversationId) {
  await supabase.from('ai_conversations').delete().eq('id', conversationId);
}

// ── שיחה עם ה-AI (קריאת SSE מוזרם) ─────────────────────────────
// onChunk(fullText) נקרא בכל קטע חדש; מחזיר את הטקסט המלא בסיום.
export async function askAI({ action, question, filePath, fileType, history, onChunk }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('unauthorized');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, question, filePath, fileType, history }),
    },
  );

  if (res.status === 403) throw new Error('premium_required');
  if (res.status === 429) throw new Error('daily_limit_reached');
  if (!res.ok || !res.body) throw new Error('ai_error');

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let remaining = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE: אירועים מופרדים ב-\n\n; קו עלול להגיע חצוי בין chunks → buffer
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data:')) continue;
      const data = JSON.parse(line.slice(5).trim());
      if (data.text)  { fullText += data.text; onChunk?.(fullText); }
      if (data.error) throw new Error(data.error);
      if (data.done && typeof data.remaining === 'number') remaining = data.remaining;
    }
  }
  return { text: fullText, remaining };
}
