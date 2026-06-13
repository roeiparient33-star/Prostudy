// AIChat — חלון השיחה עם העוזר. תומך streaming (הטקסט "נכתב" בזמן אמת)
// ורינדור Markdown לתשובות.
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, FileText, X, BookOpenCheck, ListChecks, Loader2 } from 'lucide-react';
import { renderMarkdown } from '../lib/markdown';

export default function AIChat({ messages, streamingText, activeFile, busy, onSend, onClearFile }) {
  const [text, setText]   = useState('');
  const [mode, setMode]   = useState('question'); // 'question' | 'solve'
  const scrollRef = useRef(null);

  // גלילה אוטומטית לתחתית בכל הודעה/קטע חדש
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
      {/* קובץ פעיל */}
      {activeFile && (
        <div className="ai-chat-file">
          <FileText size={15}/>
          <span>{activeFile.file_name}</span>
          <button onClick={onClearFile} title="הסר קובץ"><X size={14}/></button>
        </div>
      )}

      {/* פעולות מהירות על הקובץ */}
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

      {/* גוף השיחה */}
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
            {m.role === 'assistant'
              ? <div className="ai-msg-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}/>
              : <div className="ai-msg-text">{m.content}</div>}
          </div>
        ))}

        {/* תשובה שמוזרמת כרגע */}
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

      {/* קלט */}
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
