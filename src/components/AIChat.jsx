import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, FileText, X, BookOpenCheck, ListChecks, Loader2, Download } from 'lucide-react';
import { renderMarkdown } from '../lib/markdown';

// פותח חלון הדפסה עם התוכן — משם המשתמש שומר כ-PDF דרך הדפדפן
function downloadAsPDF(content, fileName = 'סיכום') {
  const html = renderMarkdown(content);
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <title>${fileName}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css"/>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:40px auto;
         color:#18160F;line-height:1.75;direction:rtl;padding:0 24px;}
    h1,h2,h3,h4{color:#FF6524;margin:20px 0 8px;line-height:1.3;}
    p{margin:8px 0;}
    ul,ol{padding-inline-start:24px;margin:8px 0;}
    li{margin:4px 0;}
    strong{color:#E5531A;}
    code{background:#f0ede6;border-radius:4px;padding:1px 5px;
         font-family:monospace;font-size:0.9em;}
    pre{background:#18160F;color:#F7F1E6;padding:14px;border-radius:8px;
        overflow-x:auto;direction:ltr;}
    pre code{background:none;color:inherit;padding:0;}
    blockquote{border-inline-start:3px solid #FF6524;padding-inline-start:14px;
               margin:10px 0;color:#555;}
    hr{border:none;border-top:1px solid #ddd;margin:16px 0;}
    .header{border-bottom:2px solid #FF6524;padding-bottom:12px;margin-bottom:28px;}
    .header h1{margin:0;font-size:22px;}
    .header small{color:#888;font-size:13px;}
    @media print{body{margin:20px;} .no-print{display:none;}}
  </style>
</head>
<body>
  <div class="header">
    <h1>ProStudy — ${fileName}</h1>
    <small>${new Date().toLocaleDateString('he-IL', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</small>
  </div>
  ${html}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
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
              <div className="ai-msg-assistant-wrap">
                <div className="ai-msg-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}/>
                <button
                  className="ai-msg-pdf-btn"
                  title="הורד כ-PDF"
                  onClick={() => downloadAsPDF(m.content, activeFile?.file_name?.replace(/\.[^.]+$/, '') || 'סיכום')}
                >
                  <Download size={13}/> PDF
                </button>
              </div>
            ) : (
              <div className="ai-msg-text">{m.content}</div>
            )}
          </div>
        ))}

        {streamingText != null && (
          <div className="ai-msg assistant">
            <div className="ai-msg-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText) }}/>
            <span className="ai-cursor"/>
          </div>
        )}
        {busy && streamingText == null && (
          <div className="ai-msg assistant">
            <div className="ai-typing"><Loader2 size={16} className="spin"/> חושב...</div>
          </div>
        )}
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
