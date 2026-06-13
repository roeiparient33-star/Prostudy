import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { usePremium } from '../hooks/usePremium';
import {
  listMaterials, uploadMaterial, deleteMaterial, askAI,
  createConversation, saveMessage, listConversations,
  loadConversationMessages, deleteConversation,
} from '../lib/premiumApi';
import { showToast } from '../lib/toast';
import PremiumGate from '../components/PremiumGate';
import MaterialsLibrary from '../components/MaterialsLibrary';
import AIChat from '../components/AIChat';
import UsageMeter from '../components/UsageMeter';

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
}

function ConversationsList({ conversations, activeId, onLoad, onNew, onDelete }) {
  return (
    <div className="convos-panel">
      <div className="convos-head">
        <span>שיחות שמורות</span>
        <button className="convos-new-btn" onClick={onNew} title="שיחה חדשה">
          <Plus size={15}/>
        </button>
      </div>
      {conversations.length === 0
        ? <div className="convos-empty">עוד אין שיחות שמורות</div>
        : conversations.map(c => (
          <div
            key={c.id}
            className={`convo-row${activeId === c.id ? ' active' : ''}`}
            onClick={() => onLoad(c)}
          >
            <div className="convo-info">
              <div className="convo-title">{c.title || 'שיחה'}</div>
              <div className="convo-date">{fmtDate(c.created_at)}</div>
            </div>
            <button
              className="convo-del"
              title="מחק שיחה"
              onClick={e => { e.stopPropagation(); onDelete(c); }}
            >
              <Trash2 size={13}/>
            </button>
          </div>
        ))
      }
    </div>
  );
}

export default function Premium() {
  const { courses } = useData();
  const { loading, isPremium, used, limit, remaining, bumpUsed } = usePremium();

  const [files, setFiles]           = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [streaming, setStreaming]   = useState(null);
  const [busy, setBusy]             = useState(false);

  const [convId, setConvId]         = useState(null);
  const [conversations, setConvos]  = useState([]);

  useEffect(() => {
    if (!isPremium) return;
    listMaterials().then(setFiles);
    listConversations().then(setConvos);
  }, [isPremium]);

  const handleUpload = useCallback(async (file, courseId) => {
    const row = await uploadMaterial(file, courseId);
    setFiles(p => [row, ...p]);
    setActiveFile(row);
    showToast({ type: 'success', text: '📎 הקובץ הועלה — אפשר לשאול עליו' });
  }, []);

  const handleDeleteFile = useCallback(async (file) => {
    await deleteMaterial(file);
    setFiles(p => p.filter(f => f.id !== file.id));
    setActiveFile(a => a?.id === file.id ? null : a);
  }, []);

  async function handleLoadConversation(conv) {
    const msgs = await loadConversationMessages(conv.id);
    setMessages(msgs);
    setConvId(conv.id);
    setStreaming(null);
  }

  function handleNewConversation() {
    setMessages([]);
    setConvId(null);
    setStreaming(null);
    setActiveFile(null);
  }

  async function handleDeleteConversation(conv) {
    await deleteConversation(conv.id);
    setConvos(p => p.filter(c => c.id !== conv.id));
    if (convId === conv.id) handleNewConversation();
  }

  async function handleSend(action, question) {
    if (busy) return;
    if (remaining <= 0) {
      showToast({ type: 'error', text: 'הגעת למכסה היומית — נתראה מחר 😴' });
      return;
    }

    // שמור את ה-history לפני הוספת השאלה הנוכחית
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    // צור שיחה חדשה בפעם הראשונה
    let currentConvId = convId;
    if (!currentConvId) {
      const title = question.length > 55 ? question.slice(0, 52) + '...' : question;
      const conv = await createConversation(activeFile?.id, title);
      currentConvId = conv.id;
      setConvId(currentConvId);
      setConvos(p => [conv, ...p]);
    }

    // שמור הודעת משתמש ל-DB
    await saveMessage(currentConvId, 'user', question);
    setMessages(p => [...p, { role: 'user', content: question }]);
    setStreaming('');
    setBusy(true);

    try {
      const { text, remaining: left } = await askAI({
        action,
        question,
        filePath: activeFile?.storage_path,
        fileType: activeFile?.file_type,
        history,
        onChunk: (full) => setStreaming(full),
      });

      // שמור תשובת AI ל-DB
      await saveMessage(currentConvId, 'assistant', text);
      setMessages(p => [...p, { role: 'assistant', content: text }]);
      setStreaming(null);
      bumpUsed(left);

      // עדכן כותרת בשיחות אם זו הייתה הראשונה
      setConvos(p => p.map(c =>
        c.id === currentConvId ? { ...c, title: c.title || question.slice(0, 55) } : c
      ));
    } catch (e) {
      setStreaming(null);
      const map = {
        premium_required:    'המנוי אינו פעיל',
        daily_limit_reached: 'הגעת למכסה היומית — נתראה מחר 😴',
      };
      showToast({ type: 'error', text: map[e.message] || 'משהו השתבש, נסה שוב' });
      setMessages(p => p.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="page-spinner"><div className="auth-spinner"/></div>;
  if (!isPremium) return <PremiumGate onUpgrade={() => showToast({ type: 'info', text: 'התשלומים ייפתחו בקרוב 🚀' })}/>;

  return (
    <div className="page-enter premium-page">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.4, color:'var(--text)', display:'flex', alignItems:'center', gap:8 }}>
            <Sparkles size={22} color="var(--accent)"/> העוזר הלימודי
          </h2>
          <p style={{ fontSize:14, color:'var(--text-2)', marginTop:4 }}>
            המורה הפרטי שמכיר את החומר שלך — סיכומים, שאלות ופתרונות
          </p>
        </div>
        <UsageMeter used={used} limit={limit}/>
      </div>

      <div className="premium-layout">
        {/* עמודה שמאל: קבצים + שיחות */}
        <div className="premium-left">
          <MaterialsLibrary
            files={files}
            activeFileId={activeFile?.id}
            onSelect={setActiveFile}
            onUpload={handleUpload}
            onDelete={handleDeleteFile}
            courses={courses}
          />
          <ConversationsList
            conversations={conversations}
            activeId={convId}
            onLoad={handleLoadConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
          />
        </div>

        {/* עמודה ימין: הצ'אט */}
        <AIChat
          messages={messages}
          streamingText={streaming}
          activeFile={activeFile}
          busy={busy}
          onSend={handleSend}
          onClearFile={() => setActiveFile(null)}
        />
      </div>
    </div>
  );
}
