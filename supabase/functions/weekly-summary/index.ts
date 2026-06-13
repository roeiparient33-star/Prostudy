// Edge Function: weekly-summary
// Scheduled every Monday at 09:00 Israel time (06:00 UTC) via pg_cron.
// Sends each active user a summary of their past week.
//
// Setup:
//   1. supabase functions deploy weekly-summary
//   2. In Supabase SQL Editor, run the pg_cron schedule (see ux_updates.sql)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, wrapEmail } from '../_shared/email.ts';

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Only send to users who studied at least once this week
  const { data: active } = await supabase
    .from('profiles')
    .select('id, name, weekly_studied_minutes, streak_current, streak_best, credits')
    .gt('weekly_studied_minutes', 0);

  if (!active?.length) return new Response('no active users', { status: 200 });

  let sent = 0;
  for (const p of active) {
    const { data: authUser } = await supabase.auth.admin.getUserById(p.id);
    const email = authUser?.user?.email;
    if (!email) continue;
    const firstName = (p.name ?? '').split(' ')[0] || 'חבר/ה';
    const hours     = Math.floor((p.weekly_studied_minutes ?? 0) / 60);
    const mins      = (p.weekly_studied_minutes ?? 0) % 60;
    const hoursStr  = hours > 0 ? `${hours} שעות${mins > 0 ? ` ו-${mins} דקות` : ''}` : `${mins} דקות`;
    const streak    = p.streak_current ?? 0;
    const credits   = p.credits ?? 0;

    const emoji = hours >= 15 ? '🔥' : hours >= 8 ? '💪' : '📚';

    await sendEmail(email, `${emoji} סיכום שבועי — למדת ${hoursStr} השבוע!`, wrapEmail(`
      <p>שלום ${firstName}! ${emoji}</p>
      <p>השבוע היה לך שבוע לימוד. הנה הסיכום:</p>
      <div class="stat-row">
        <div class="stat-box">
          <div class="v">${hoursStr}</div>
          <div class="l">לימדת השבוע</div>
        </div>
        <div class="stat-box">
          <div class="v">${streak} 🔥</div>
          <div class="l">ימי רצף</div>
        </div>
        <div class="stat-box">
          <div class="v">🪙 ${credits}</div>
          <div class="l">קרדיטים</div>
        </div>
      </div>
      ${streak >= 7 ? `<p><strong>🏆 רצף של שבוע!</strong> זה הישג מרשים — המשיכו ככה.</p>` : '<p>שבוע חדש מתחיל — בוא.י ממשיך.ה את המומנטום 🚀</p>'}
      <a class="btn" href="https://prostudy-one.vercel.app">
        פותחים את השבוע ←
      </a>
    `));
    sent++;
    await new Promise(r => setTimeout(r, 500));
  }

  return new Response(`sent ${sent} summaries`, { status: 200 });
});
