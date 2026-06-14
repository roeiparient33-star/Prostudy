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

// פותח חלון הדפסה עם תבנית מעוצבת — משם המשתמש שומר כ-PDF.
// כל העיצוב (צביעת תחביר, כותרות ממוספרות, תיבות מידע) נעשה בצד הדפדפן — אפס טוקנים.
function downloadAsPDF(content, fileName = 'סיכום') {
  const html = renderMarkdown(content);
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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/atom-one-dark.min.css"/>
<style>
  :root{
    --bg:#1a1714; --card:#242019; --code:#0f0d0b; --border:#3a342c;
    --accent:#FF6524; --accent-2:#ff8a5c;
    --text:#f0ebe3; --muted:#b8b0a4; --dim:#8a8175;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Heebo',sans-serif;background:var(--bg);color:var(--text);
       line-height:1.85;font-size:15px;direction:rtl;
       -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .page{max-width:860px;margin:0 auto;padding:0 36px 60px;}

  /* ── שער ── */
  .cover{padding:48px 0 32px;margin-bottom:36px;border-bottom:1px solid var(--border);
         position:relative;}
  .cover-badge{display:inline-flex;align-items:center;gap:7px;
    background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;
    font-size:12px;font-weight:800;letter-spacing:.5px;
    padding:6px 16px;border-radius:99px;margin-bottom:18px;}
  .cover h1{font-size:38px;font-weight:900;letter-spacing:-1px;line-height:1.15;
            color:#fff;margin-bottom:10px;}
  .cover .date{font-size:14px;color:var(--dim);font-weight:500;}

  .content{counter-reset:section;}

  /* ── כותרות ── */
  .content h1{font-size:26px;font-weight:900;color:#fff;margin:34px 0 14px;
              letter-spacing:-.5px;line-height:1.25;}
  .content h2{font-size:21px;font-weight:800;color:#fff;
              margin:36px 0 16px;padding-bottom:10px;
              border-bottom:2px solid var(--accent);
              display:flex;align-items:center;gap:14px;counter-increment:section;}
  .content h2::before{content:counter(section);flex-shrink:0;
    width:38px;height:38px;border-radius:11px;
    background:linear-gradient(135deg,var(--accent),#e5531a);color:#fff;
    display:inline-flex;align-items:center;justify-content:center;
    font-size:17px;font-weight:900;}
  .content h3{font-size:17px;font-weight:800;color:var(--accent-2);margin:24px 0 8px;}
  .content h4{font-size:15px;font-weight:700;color:var(--muted);margin:16px 0 6px;}

  /* ── טקסט ── */
  .content p{margin:0 0 12px;color:var(--text);}
  .content strong{color:var(--accent-2);font-weight:800;}
  .content em{color:var(--muted);font-style:italic;}
  .content a{color:#82aaff;text-decoration:underline;}

  /* ── רשימות ── */
  .content ul,.content ol{margin:10px 0 16px;padding:0;list-style:none;}
  .content ul li{position:relative;padding-inline-start:24px;margin:8px 0;}
  .content ul li::before{content:'';position:absolute;inset-inline-start:0;top:11px;
    width:8px;height:8px;border-radius:50%;background:var(--accent);}
  .content ol{counter-reset:ol;}
  .content ol li{position:relative;padding-inline-start:32px;margin:8px 0;counter-increment:ol;}
  .content ol li::before{content:counter(ol);position:absolute;inset-inline-start:0;top:0;
    width:22px;height:22px;border-radius:6px;background:rgba(255,101,36,.15);
    color:var(--accent);font-size:12px;font-weight:800;
    display:inline-flex;align-items:center;justify-content:center;}

  /* ── קוד inline ── */
  .content code{background:rgba(255,101,36,.12);color:var(--accent-2);
    border:1px solid rgba(255,101,36,.22);border-radius:5px;padding:2px 7px;
    font-family:'Fira Code',monospace;font-size:.84em;direction:ltr;
    display:inline-block;line-height:1.4;}

  /* ── בלוק קוד ── */
  .content pre{background:var(--code);border:1px solid #2a241d;border-radius:12px;
    padding:18px 20px;overflow-x:auto;margin:16px 0;direction:ltr;text-align:left;
    font-size:13px;line-height:1.9;}
  .content pre code{background:none;border:none;padding:0;color:#cdd5e0;
    font-family:'Fira Code',monospace;direction:ltr;display:block;font-size:13px;}
  /* הערות עברית בתוך קוד — בידוד כיווניות כדי שלא יישברו */
  .content pre .hljs-comment{unicode-bidi:isolate;}

  /* ── טבלאות ── */
  .content table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;
    background:var(--card);border-radius:10px;overflow:hidden;}
  .content th{background:rgba(255,101,36,.18);color:var(--accent-2);
    text-align:right;font-weight:800;font-size:13px;padding:11px 15px;
    border-bottom:2px solid var(--accent);}
  .content td{padding:10px 15px;border-bottom:1px solid var(--border);
    color:var(--text);vertical-align:top;}
  .content tr:last-child td{border-bottom:none;}
  .content tr:nth-child(even) td{background:rgba(255,255,255,.025);}

  /* ── ציטוט / תיבת מידע ── */
  .content blockquote{background:rgba(255,101,36,.08);
    border-inline-start:4px solid var(--accent);
    padding:13px 18px;margin:14px 0;border-radius:0 10px 10px 0;color:var(--muted);}

  .content hr{border:none;border-top:1px solid var(--border);margin:24px 0;}

  /* ── מתמטיקה ── */
  .content .math-block{display:flex;justify-content:center;
    background:rgba(255,101,36,.06);border:1px solid rgba(255,101,36,.16);
    border-radius:10px;padding:18px;margin:16px 0;overflow-x:auto;direction:ltr;}
  .content .katex{font-size:1.1em;color:var(--text);}
  .content .math-block .katex{font-size:1.25em;}

  /* ── ויזואלים: SVG ו-Mermaid ── */
  .content .svg-figure,.content .mermaid{display:flex;justify-content:center;
    background:#fbf9f5;border:1px solid var(--border);border-radius:12px;
    padding:20px;margin:18px 0;overflow-x:auto;}
  .content .svg-figure svg,.content .mermaid svg{max-width:100%;height:auto;}

  /* ── כותרת תחתונה ── */
  .footer{margin-top:48px;padding-top:18px;border-top:1px solid var(--border);
    text-align:center;color:var(--dim);font-size:12px;font-weight:500;}

  @media print{
    body{background:var(--bg);}
    .content pre,.content table,.content blockquote,.content h2::before,
    .cover-badge,.content ol li::before{
      -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  }
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div class="cover-badge">✦ ProStudy · העוזר הלימודי</div>
    <h1>${fileName}</h1>
    <div class="date">${dateStr}</div>
  </div>
  <div class="content">
    ${html}
  </div>
  <div class="footer">נוצר באמצעות ProStudy AI · ${dateStr}</div>
</div>
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
<script type="module">
  // mermaid נטען רק אם יש תרשים בדף — חוסך טעינה מיותרת
  var hasMermaid = document.querySelector('.mermaid');
  function finish(){ setTimeout(function(){ window.print(); }, 700); }
  window.addEventListener('load', async function(){
    try { if (window.hljs) hljs.highlightAll(); } catch(e){}
    if (hasMermaid) {
      try {
        var m = await import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs');
        m.default.initialize({ startOnLoad: false, theme: 'neutral' });
        await m.default.run({ querySelector: '.mermaid' });
      } catch(e){}
    }
    finish();
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
              <button
                className="ai-summary-card"
                title="הורד כ-PDF"
                onClick={() => downloadAsPDF(m.content, activeFile?.file_name?.replace(/\.[^.]+$/, '') || 'סיכום')}
              >
                <div className="ai-summary-card-icon"><FileText size={20}/></div>
                <div className="ai-summary-card-info">
                  <div className="ai-summary-card-title">הסיכום מוכן</div>
                  <div className="ai-summary-card-sub">לחץ להורדה כקובץ PDF מעוצב</div>
                </div>
                <div className="ai-summary-card-dl"><Download size={18}/></div>
              </button>
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
