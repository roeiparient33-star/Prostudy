import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, FileText, X, BookOpenCheck, ListChecks, Download } from 'lucide-react';
import { renderMarkdown } from '../lib/markdown';

const LOADING_MSGS = [
  'קורא את הקובץ...',
  'מנתח את החומר...',
  'בונה סיכום...',
  'בודק נוסחאות...',
  'מסיים...',
];

// כותרת כרטיס ה-PDF לפי סוג הפעולה
const CARD_TITLE = {
  summary:  'הסיכום מוכן',
  practice: 'שאלות התרגול מוכנות',
  solve:    'הפתרון המלא מוכן',
};

function AILoading() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(t);
  }, []);

  // אם יש GIF/וידאו של אווטר — פשוט מחליפים את ה-div.ai-load-avatar ב:
  // <img src="/avatar-loading.gif" className="ai-load-avatar-img" />
  return (
    <div className="ai-loading">
      <div className="ai-load-orbit">
        <div className="ai-load-center">
          <Sparkles size={28} color="var(--accent)" />
        </div>
        <div className="ai-load-ring">
          <span className="ai-load-dot" style={{ '--i': 0 }} />
          <span className="ai-load-dot" style={{ '--i': 1 }} />
          <span className="ai-load-dot" style={{ '--i': 2 }} />
          <span className="ai-load-dot" style={{ '--i': 3 }} />
        </div>
      </div>
      <div className="ai-load-msg">{LOADING_MSGS[msgIdx]}</div>
      <div className="ai-load-sub">המורה הפרטי שלך עובד על זה...</div>
    </div>
  );
}

// פותח לשונית עם תבנית מעוצבת (בהירה) — המשתמש שומר כ-PDF דרך כפתור.
// כל העיצוב (צביעת תחביר, כותרות ממוספרות, נוסחאות) נעשה בצד הדפדפן — אפס טוקנים.
function downloadAsPDF(content, fileName = 'סיכום') {
  const html = renderMarkdown(content); // כבר עבר סניטציה בתוך renderMarkdown
  // שם הקובץ מגיע מכותרת השיחה (תוכן לא-אמין) — escape לפני שיבוץ בתבנית
  fileName = String(fileName).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const dateStr = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8"/>
<title>${fileName} — ProStudy</title>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css"/>
<style>
  :root{
    --bg:#ffffff; --text:#1e293b; --muted:#475569; --dim:#64748b;
    --accent:#2563eb; --accent-dark:#1d4ed8; --accent-soft:rgba(37,99,235,.08);
    --border:#e2e8f0; --code-bg:#f1f5f9;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Heebo',sans-serif;background:var(--bg);color:var(--text);
       line-height:1.85;font-size:15px;direction:rtl;
       -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .page{max-width:860px;margin:0 auto;padding:0 36px 60px;}

  /* ── סרגל פעולה (לא מודפס) ── */
  .toolbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;
    justify-content:space-between;gap:12px;background:#f8fafc;border-bottom:1px solid var(--border);
    padding:12px 24px;margin-bottom:8px;}
  .toolbar-hint{font-size:13px;color:var(--muted);}
  .toolbar-btn{display:inline-flex;align-items:center;gap:7px;cursor:pointer;
    background:var(--accent);color:#fff;border:none;border-radius:10px;
    font-family:'Heebo',sans-serif;font-size:14px;font-weight:800;padding:9px 20px;}
  .toolbar-btn:hover{background:var(--accent-dark);}
  @media print{ .toolbar{display:none !important;} }

  /* ── שער ── */
  .cover{padding:40px 0 26px;margin-bottom:30px;border-bottom:2px solid var(--accent);}
  .cover-badge{display:inline-flex;align-items:center;gap:7px;
    background:linear-gradient(135deg,var(--accent),var(--accent-dark));color:#fff;
    font-size:12px;font-weight:800;letter-spacing:.5px;
    padding:6px 16px;border-radius:99px;margin-bottom:18px;}
  .cover h1{font-size:36px;font-weight:900;letter-spacing:-1px;line-height:1.15;
            color:var(--text);margin-bottom:10px;}
  .cover .date{font-size:14px;color:var(--dim);font-weight:500;}

  .content{counter-reset:section;}

  /* ── כותרות ── */
  .content h1{font-size:25px;font-weight:900;color:var(--text);margin:32px 0 14px;
              letter-spacing:-.5px;line-height:1.25;}
  .content h2{font-size:21px;font-weight:800;color:var(--text);
              margin:34px 0 16px;padding-bottom:10px;
              border-bottom:2px solid var(--accent);
              display:flex;align-items:center;gap:14px;counter-increment:section;}
  .content h2::before{content:counter(section);flex-shrink:0;
    width:38px;height:38px;border-radius:11px;
    background:linear-gradient(135deg,var(--accent),var(--accent-dark));color:#fff;
    display:inline-flex;align-items:center;justify-content:center;
    font-size:17px;font-weight:900;}
  .content h3{font-size:17px;font-weight:800;color:var(--accent-dark);margin:24px 0 8px;}
  .content h4{font-size:15px;font-weight:700;color:var(--muted);margin:16px 0 6px;}

  /* ── טקסט ── */
  .content p{margin:0 0 12px;color:var(--text);}
  .content strong{color:var(--accent-dark);font-weight:800;}
  .content em{color:var(--muted);font-style:italic;}
  .content a{color:var(--accent);text-decoration:underline;}

  /* ── רשימות ── */
  .content ul,.content ol{margin:10px 0 16px;padding:0;list-style:none;}
  .content ul li{position:relative;padding-inline-start:24px;margin:8px 0;}
  .content ul li::before{content:'';position:absolute;inset-inline-start:0;top:11px;
    width:8px;height:8px;border-radius:50%;background:var(--accent);}
  .content ol{counter-reset:ol;}
  .content ol li{position:relative;padding-inline-start:32px;margin:8px 0;counter-increment:ol;}
  .content ol li::before{content:counter(ol);position:absolute;inset-inline-start:0;top:1px;
    width:23px;height:23px;border-radius:7px;background:var(--accent-soft);
    color:var(--accent-dark);font-size:12px;font-weight:800;
    display:inline-flex;align-items:center;justify-content:center;}

  /* ── קוד inline ── */
  .content code{background:var(--accent-soft);color:var(--accent-dark);
    border:1px solid rgba(37,99,235,.20);border-radius:5px;padding:2px 7px;
    font-family:'Fira Code',monospace;font-size:.84em;direction:ltr;
    display:inline-block;line-height:1.4;}

  /* ── בלוק קוד ── */
  .content pre{background:var(--code-bg);border:1px solid var(--border);border-radius:12px;
    padding:18px 20px;overflow-x:auto;margin:16px 0;direction:ltr;text-align:left;
    font-size:13px;line-height:1.9;}
  .content pre code{background:none;border:none;padding:0;
    font-family:'Fira Code',monospace;direction:ltr;display:block;font-size:13px;}
  /* הערות עברית בתוך קוד — בידוד כיווניות כדי שלא יישברו */
  .content pre .hljs-comment{unicode-bidi:isolate;}

  /* ── טבלאות ── */
  .content table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;
    border:1px solid var(--border);border-radius:10px;overflow:hidden;}
  .content th{background:var(--accent-soft);color:var(--accent-dark);
    text-align:right;font-weight:800;font-size:13px;padding:11px 15px;
    border-bottom:2px solid var(--accent);}
  .content td{padding:10px 15px;border-bottom:1px solid var(--border);
    color:var(--text);vertical-align:top;}
  .content tr:last-child td{border-bottom:none;}
  .content tr:nth-child(even) td{background:#f8fafc;}

  /* ── ציטוט / תיבת מידע ── */
  .content blockquote{background:var(--accent-soft);
    border-inline-start:4px solid var(--accent);
    padding:13px 18px;margin:14px 0;border-radius:0 10px 10px 0;color:var(--muted);}

  .content hr{border:none;border-top:1px solid var(--border);margin:24px 0;}

  /* ── מתמטיקה ── */
  .content .math-block{display:flex;justify-content:center;
    background:#f8fafc;border:1px solid var(--border);
    border-radius:10px;padding:18px;margin:16px 0;overflow-x:auto;direction:ltr;}
  .content .katex{font-size:1.1em;color:var(--text);}
  .content .math-block .katex{font-size:1.25em;}

  /* ── ויזואלים: SVG ── */
  .content .svg-figure{display:flex;justify-content:center;
    background:#f8fafc;border:1px solid var(--border);border-radius:12px;
    padding:20px;margin:18px 0;overflow-x:auto;}
  .content .svg-figure svg{max-width:100%;height:auto;}

  /* ── רצף שלבים / החלטה (flow) ── */
  .content .flow{display:flex;flex-direction:column;align-items:center;
    gap:0;margin:20px 0;}
  .content .flow-step{position:relative;width:100%;max-width:560px;
    background:var(--accent-soft);
    border:1.5px solid rgba(37,99,235,.28);border-radius:12px;
    padding:13px 18px;text-align:center;font-weight:600;color:var(--text);
    font-size:14.5px;line-height:1.6;}
  .content .flow-step:not(:last-child){margin-bottom:34px;}
  .content .flow-step:not(:last-child)::after{content:'';position:absolute;
    bottom:-26px;left:50%;transform:translateX(-50%);
    width:2px;height:16px;background:var(--accent);}
  .content .flow-step:not(:last-child)::before{content:'';position:absolute;
    bottom:-28px;left:50%;transform:translateX(-50%);z-index:1;
    width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;
    border-top:8px solid var(--accent);}
  .content .flow-step .katex{font-size:1.02em;}

  /* ── גרפים: Chart.js ── */
  .content .chart-figure{position:relative;height:330px;
    background:#fff;border:1px solid var(--border);border-radius:12px;
    padding:18px;margin:18px 0;}
  .content .chart-figure canvas{max-width:100%;}

  /* ── כותרת תחתונה ── */
  .footer{margin-top:48px;padding-top:18px;border-top:1px solid var(--border);
    text-align:center;color:var(--dim);font-size:12px;font-weight:500;}
</style>
</head>
<body>
<div class="toolbar">
  <span class="toolbar-hint">לחץ "שמור כ-PDF" ובחר "Save as PDF" ביעד ההדפסה</span>
  <button class="toolbar-btn" onclick="window.print()">⬇ שמור כ-PDF</button>
</div>
<div class="page">
  <div class="cover">
    <div class="cover-badge">✦ ProStudy · העוזר הלימודי</div>
    <h1>${fileName}</h1>
    <div class="date">${dateStr}</div>
  </div>
  <div class="content">
    ${html}
  </div>
  <div class="footer">נוצר באמצעות ProStudy AI</div>
</div>
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
<script type="module">
  // Chart.js נטען רק אם יש גרף בדף — חוסך טעינה מיותרת
  var charts = document.querySelectorAll('.chart-figure');
  window.addEventListener('load', async function(){
    try { if (window.hljs) hljs.highlightAll(); } catch(e){}
    if (charts.length) {
      try {
        var mod = await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/auto/+esm');
        var Chart = mod.default;
        Chart.defaults.font.family = 'Heebo, sans-serif';
        Chart.defaults.animation = false;
        var palette = ['#2563eb','#10b981','#f59e0b','#a855f7','#ef4444','#0ea5e9'];
        charts.forEach(function(el){
          try {
            var raw = JSON.parse(el.getAttribute('data-chart'));
            var datasets = (raw.data && raw.data.datasets) || [];
            var multi = datasets.length > 1;
            datasets.forEach(function(ds, i){
              var c = palette[i % palette.length];
              if (ds.backgroundColor === undefined) ds.backgroundColor = c;
              if (ds.borderColor === undefined) ds.borderColor = c;
              if (ds.pointRadius === undefined) ds.pointRadius = 5;
              if (ds.borderWidth === undefined) ds.borderWidth = 2.5;
              if (ds.tension === undefined) ds.tension = 0.3;
            });
            // house style נקי — מתעלמים מעיצוב Excel-י של המודל, שומרים רק כותרות
            var o = raw.options || {};
            var t  = (o.plugins && o.plugins.title) || {};
            var s  = o.scales || {};
            var xt = (s.x && s.x.title) || {};
            var yt = (s.y && s.y.title) || {};
            var muted = '#94a3b8', soft = '#64748b';
            var clean = {
              responsive: true, maintainAspectRatio: false,
              layout: { padding: 18 },
              plugins: {
                legend: { display: multi, position: 'bottom',
                  labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8,
                    padding: 18, font: { size: 12, family: 'Heebo' }, color: '#475569' } },
                title: { display: !!t.text, text: t.text || '', color: '#1e293b',
                  font: { size: 16, weight: '800', family: 'Heebo' }, padding: { bottom: 18 } },
                tooltip: { enabled: false }
              },
              scales: {
                x: { grid: { display: false }, border: { color: '#cbd5e1' },
                  ticks: { color: muted, font: { size: 11, family: 'Heebo' } },
                  title: { display: !!xt.text, text: xt.text || '', color: soft, font: { size: 12, family: 'Heebo' } } },
                y: { grid: { color: '#eef2f7' }, border: { display: false },
                  ticks: { color: muted, font: { size: 11, family: 'Heebo' } },
                  title: { display: !!yt.text, text: yt.text || '', color: soft, font: { size: 12, family: 'Heebo' } } }
              }
            };
            new Chart(el.querySelector('canvas'), { type: raw.type, data: raw.data, options: clean });
          } catch(e){ el.innerHTML = '<div style="padding:20px;color:#b00">שגיאה בטעינת הגרף</div>'; }
        });
      } catch(e){}
    }
  });
</script>
</body>
</html>`);
  win.document.close();
}

export default function AIChat({ messages, streamingText, activeFile, busy, onSend, onClearFile }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('question');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingText]);

  function submit() {
    const q = text.trim();
    if (!q || busy) return;
    onSend(mode, q);
    setText('');
  }

  const empty = messages.length === 0 && !streamingText;

  return (
    <div className="ai-chat">
      {activeFile && (
        <div className="ai-chat-file">
          <FileText size={15}/>
          <span>{activeFile.file_name}</span>
          <button onClick={onClearFile} title="הסר קובץ"><X size={14}/></button>
        </div>
      )}

      {activeFile && (
        <div className="ai-chat-quick">
          <button disabled={busy} onClick={() => onSend('summary', 'סכם לי את הקובץ הזה לנקודות העיקריות, עם דגשים חשובים למבחן.')}>
            <BookOpenCheck size={14}/> סכם לי
          </button>
          <button disabled={busy} onClick={() => onSend('practice', 'צור 5 שאלות תרגול מהחומר הזה, ולכל שאלה פתרון מוסבר בנפרד.')}>
            <ListChecks size={14}/> שאלות תרגול
          </button>
        </div>
      )}

      <div className="ai-chat-body" ref={scrollRef}>
        {empty && (
          <div className="ai-chat-empty">
            <Sparkles size={32}/>
            <div className="ai-chat-empty-title">איך אפשר לעזור?</div>
            <p>
              {activeFile
                ? 'שאל שאלה על הקובץ, בקש סיכום, או שלח תרגיל לפתרון מוסבר.'
                : 'בחר קובץ מהספרייה או פשוט שאל שאלה — אני כאן כדי להסביר ולתרגל איתך.'}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            {m.role === 'assistant' ? (
              m.kind === 'question' ? (
                // שאלה מהירה — תשובה ישירות בצ'אט
                <div className="ai-msg-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}/>
              ) : (
                // סיכום/תרגול/פתרון — כרטיס להורדת PDF
                <button
                  className="ai-summary-card"
                  title="הורד כ-PDF"
                  onClick={() => downloadAsPDF(m.content, activeFile?.file_name?.replace(/\.[^.]+$/, '') || 'סיכום')}
                >
                  <div className="ai-summary-card-icon"><FileText size={20}/></div>
                  <div className="ai-summary-card-info">
                    <div className="ai-summary-card-title">{CARD_TITLE[m.kind] || 'התוצאה מוכנה'}</div>
                    <div className="ai-summary-card-sub">לחץ להורדה כקובץ PDF מעוצב</div>
                  </div>
                  <div className="ai-summary-card-dl"><Download size={18}/></div>
                </button>
              )
            ) : (
              <div className="ai-msg-text">{m.content}</div>
            )}
          </div>
        ))}

        {busy && <AILoading />}
      </div>

      <div className="ai-chat-input">
        <div className="ai-mode-toggle">
          <button className={mode === 'question' ? 'active' : ''} onClick={() => setMode('question')}>שאלה</button>
          <button className={mode === 'solve' ? 'active' : ''} onClick={() => setMode('solve')}>פתרון תרגיל</button>
        </div>
        <div className="ai-input-row">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder={mode === 'solve' ? 'כתוב או הדבק את התרגיל...' : 'שאל שאלה על החומר...'}
            rows={1}
            disabled={busy}
          />
          <button className="ai-send-btn" onClick={submit} disabled={busy || !text.trim()} title="שלח">
            <Send size={17}/>
          </button>
        </div>
      </div>
    </div>
  );
}
