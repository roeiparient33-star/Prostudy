// Edge Function: send-welcome
// Triggered by a Supabase Database Webhook on INSERT to the `profiles` table.
// Sends a branded welcome email via Resend.
//
// Setup (one-time):
//   1. Supabase Dashboard → Database → Webhooks → Create Webhook
//      Table: profiles · Event: INSERT
//      URL: https://<project>.supabase.co/functions/v1/send-welcome
//      Add header: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
//   2. Deploy: supabase functions deploy send-welcome
//   3. Set secrets: supabase secrets set RESEND_API_KEY=re_... FROM_EMAIL="ProStudy <hello@yourdomain.com>"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, wrapEmail } from '../_shared/email.ts';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const profile  = payload?.record;
    if (!profile?.id) return new Response('no profile', { status: 400 });

    // Get email from auth.users (profiles table doesn't store email)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    const email = authUser?.user?.email;
    if (!email) return new Response('no email', { status: 200 });

    const firstName = (profile.name ?? '').split(' ')[0] || 'חבר/ה';

    await sendEmail(email, '🎉 ברוך הבא ל-ProStudy!', wrapEmail(`
      <p>שלום ${firstName}! 👋</p>
      <p>שמחים שהצטרפת ל-<strong>ProStudy</strong> — הפלטפורמה שהופכת את הבלאגן של הסמסטר לשליטה מלאה.</p>
      <p><strong>3 הצעדים הראשונים שלך:</strong></p>
      <p>
        ✅ הוסף את הקורסים שלך<br/>
        ✅ הוסף 3 משימות ראשונות<br/>
        ✅ סיים סשן לימוד ראשון — וקבל <strong>100 קרדיטים</strong> מתנה! 🎁
      </p>
      <a class="btn" href="https://prostudy-one.vercel.app">
        פותחים את הסמסטר ←
      </a>
      <p style="font-size:13px;color:#6B6760">
        כל דקת לימוד שווה קרדיט. הרצף שלך מתחיל עכשיו 🔥
      </p>
    `));

    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
});
