// Shared Resend email helper — used by all Edge Functions.
// Set RESEND_API_KEY in Supabase Dashboard → Edge Functions → Secrets.
// Set FROM_EMAIL in secrets too (must be a verified domain in Resend).

const RESEND_URL = 'https://api.resend.com/emails';

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key      = Deno.env.get('RESEND_API_KEY') ?? '';
  const fromAddr = Deno.env.get('FROM_EMAIL')     ?? 'ProStudy <hello@prostudy-one.vercel.app>';
  if (!key) { console.warn('RESEND_API_KEY not set — skipping email to', to); return; }

  const res = await fetch(RESEND_URL, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromAddr, to, subject, html }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`Resend error for ${to}:`, txt);
  }
}

// Brand-consistent email wrapper (RTL Hebrew, orange accent)
export function wrapEmail(content: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#F7F1E6;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#18160F;}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:20px;border:2.5px solid #18160F;box-shadow:-6px 6px 0 #18160F;overflow:hidden;}
  .header{background:#FF6524;padding:28px 32px;text-align:center;}
  .header img{width:52px;height:52px;border-radius:12px;border:2.5px solid #fff;}
  .header h1{margin:10px 0 0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-.3px;}
  .body{padding:32px;}
  .body p{font-size:15px;line-height:1.75;margin:0 0 16px;color:#18160F;}
  .body strong{color:#FF6524;}
  .btn{display:inline-block;background:#FF6524;color:#fff !important;text-decoration:none;font-weight:800;font-size:16px;padding:14px 32px;border-radius:100px;border:2.5px solid #18160F;box-shadow:-4px 4px 0 #18160F;margin:8px 0 16px;}
  .stat-row{display:flex;gap:12px;margin:16px 0;}
  .stat-box{flex:1;background:#F7F1E6;border-radius:12px;padding:12px 16px;border:2px solid #E5E1DA;text-align:center;}
  .stat-box .v{font-size:24px;font-weight:800;color:#FF6524;}
  .stat-box .l{font-size:11px;color:#6B6760;font-weight:600;margin-top:2px;}
  .footer{padding:20px 32px;border-top:2px dashed #E5E1DA;font-size:12px;color:#A8A49E;text-align:center;line-height:1.7;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <img src="https://prostudy-one.vercel.app/logo.png" alt="ProStudy"/>
    <h1>ProStudy</h1>
  </div>
  <div class="body">
    ${content}
  </div>
  <div class="footer">
    קיבלת מייל זה כי נרשמת ל-ProStudy · <a href="https://prostudy-one.vercel.app" style="color:#FF6524">prostudy-one.vercel.app</a><br/>
    לא רוצה לקבל מיילים? <a href="{{unsubscribe}}" style="color:#A8A49E">הסר אותי מהרשימה</a>
  </div>
</div>
</body>
</html>`;
}
