// Edge Function: streak-reminder
// Scheduled daily at 18:00 Israel time (15:00 UTC) via pg_cron.
// Finds users whose streak is alive but they haven't studied today — sends a nudge.
//
// Setup:
//   1. supabase functions deploy streak-reminder
//   2. In Supabase SQL Editor, run the pg_cron schedule (see ux_updates.sql)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, wrapEmail } from '../_shared/email.ts';

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const todayStr     = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Users with active streak who didn't study today
  const { data: atRisk } = await supabase
    .from('profiles')
    .select('id, name, streak_current, streak_freezes')
    .gt('streak_current', 0)
    .eq('streak_last_date', yesterdayStr); // studied yesterday but not today yet

  if (!atRisk?.length) return new Response('no users at risk', { status: 200 });

  let sent = 0;
  for (const p of atRisk) {
    const { data: authUser } = await supabase.auth.admin.getUserById(p.id);
    const email = authUser?.user?.email;
    if (!email) continue;
    const firstName = (p.name ?? '').split(' ')[0] || 'חבר/ה';
    const streak    = p.streak_current ?? 0;
    const freezes   = p.streak_freezes ?? 0;

    await sendEmail(email, `🔥 הרצף שלך בסכנה — ${streak} ימים!`, wrapEmail(`
      <p>שלום ${firstName}! 🔥</p>
      <p>הרצף שלך עומד על <strong>${streak} ימים</strong> — ועדיין לא למדת היום.</p>
      <p>יש לך עד חצות הלילה לסיים סשן לימוד ולשמור על הרצף.</p>
      ${freezes > 0 ? `<p style="background:#F2F8FF;border-radius:10px;padding:10px 14px;font-size:13px">❄️ יש לך <strong>${freezes} הקפאות רצף</strong> במלאי — הן יופעלו אוטומטית רק אם לא תלמד.</p>` : ''}
      <a class="btn" href="https://prostudy-one.vercel.app">
        פותחים סשן עכשיו ←
      </a>
      <p style="font-size:13px;color:#6B6760">
        רצף של ${streak} ימים הוא הישג אמיתי — שמרו עליו 💪
      </p>
    `));
    sent++;
    // Rate-limit: 2 emails per second to stay within Resend free tier
    await new Promise(r => setTimeout(r, 500));
  }

  return new Response(`sent ${sent} reminders`, { status: 200 });
});
