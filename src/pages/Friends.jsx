import { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, Search, Check, X, Clock, UserCheck, Copy, Link2, Target, Plus, Users, Handshake, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AvatarSVG from '../components/AvatarSVG';
import ModalPortal from '../components/ModalPortal';

const PROFILE_FIELDS = 'id, name, weekly_studied_minutes, session_active, session_course_name, session_started_at, avatar_config, avatar_purchased';

const MEDALS = ['🥇', '🥈', '🥉'];

function daysUntilSunday() {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 7 : 7 - d;
}
const APP_URL = window.location.origin;

function fmtElapsed(isoStr) {
  if (!isoStr) return '';
  const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (mins < 1) return 'הרגע התחיל';
  if (mins < 60) return `${mins} דק׳`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}:${String(m).padStart(2,'0')} שע׳` : `${h} שע׳`;
}

function fmtHours(mins) {
  const m = mins || 0;
  if (m === 0) return '0 שע׳';
  const h = Math.floor(m / 60), rem = m % 60;
  if (h === 0) return `${rem} דק׳`;
  return rem > 0 ? `${h}:${String(rem).padStart(2,'0')}` : `${h} שע׳`;
}

// ── Study Pact Modal ──────────────────────────────────────
function CreatePactModal({ friends, userId, onCreated, onClose }) {
  const [name,        setName]        = useState('');
  const [target,      setTarget]      = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState('');

  function toggleFriend(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || selectedIds.length === 0) { setErr('יש למלא שם ולבחור לפחות חבר אחד'); return; }
    setSaving(true);
    const { data: pact, error } = await supabase
      .from('study_pacts')
      .insert({ name: name.trim(), target_hours_per_week: target, creator_id: userId })
      .select()
      .single();
    if (error || !pact) { setErr('שגיאה ביצירת הצוות'); setSaving(false); return; }
    // Creator inserted first as 'accepted' (RLS passes), friends as 'pending'
    await supabase.from('pact_members').insert({ pact_id: pact.id, user_id: userId, status: 'accepted' });
    for (const fid of selectedIds) {
      await supabase.from('pact_members').insert({ pact_id: pact.id, user_id: fid, status: 'pending' });
    }
    setSaving(false);
    onCreated();
  }

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <div className="modal-head">
            <span className="modal-head-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Handshake size={17} color="var(--purple)"/> צוות למידה חדש
            </span>
            <button className="modal-close-btn" onClick={onClose} aria-label="סגור"><X size={17}/></button>
          </div>
          <form onSubmit={handleCreate} className="modal-form">
            <div className="modal-field">
              <label className="modal-label">שם הצוות</label>
              <input className="modal-input" value={name} onChange={e=>setName(e.target.value)} placeholder="לדוגמה: נוכחות מושלמת" autoFocus/>
            </div>
            <div className="modal-field">
              <label className="modal-label">יעד שבועי (שעות)</label>
              <input className="modal-input" type="number" min={1} max={80} value={target} onChange={e=>setTarget(Number(e.target.value))} dir="ltr"/>
            </div>
            <div className="modal-field">
              <label className="modal-label">
                חברים לצוות
                {selectedIds.length > 0 && (
                  <span style={{ marginRight:6, fontWeight:500, color:'var(--accent)', fontSize:12 }}>
                    ({selectedIds.length} נבחרו)
                  </span>
                )}
              </label>
              <div className="pact-friends-list">
                {friends.map(f => {
                  const checked = selectedIds.includes(f.id);
                  return (
                    <label key={f.id} className={`pact-friend-check${checked ? ' selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFriend(f.id)}
                        style={{ display:'none' }}
                      />
                      <div className={`pact-check-box${checked ? ' checked' : ''}`}>
                        {checked && <Check size={11} strokeWidth={3}/>}
                      </div>
                      <span>{f.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            {err && <div className="auth-error">{err}</div>}
            <div className="modal-actions">
              <button type="submit" className="modal-btn-primary" disabled={saving || !name.trim() || selectedIds.length === 0}>
                {saving ? 'פותח...' : `פתח צוות${selectedIds.length > 1 ? ` (${selectedIds.length + 1} חברים)` : ''}`}
              </button>
              <button type="button" className="modal-btn-ghost" onClick={onClose}>ביטול</button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

// ── Pact Card ──────────────────────────────────────────────
function PactCard({ pact, userId, onLeave, onTasksChanged }) {
  const allMembers = pact.pact_members || [];
  // Only show accepted members in progress; pending = awaiting confirmation
  const members    = allMembers.filter(m => !m.status || m.status === 'accepted');
  const pending    = allMembers.filter(m => m.status === 'pending');
  const tasks     = pact.pact_tasks   || [];
  const target    = pact.target_hours_per_week * 60;
  const isCreator = pact.creator_id === userId;

  const [newTask,   setNewTask]   = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [savingTask, setSavingTask] = useState(false);

  async function submitTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setSavingTask(true);
    await supabase.from('pact_tasks').insert({
      pact_id: pact.id, title: newTask.trim(), created_by: userId,
    });
    setNewTask('');
    setAddingTask(false);
    setSavingTask(false);
    onTasksChanged();
  }

  async function deleteTask(taskId) {
    await supabase.from('pact_tasks').delete().eq('id', taskId);
    onTasksChanged();
  }

  async function toggleCompletion(taskId, alreadyDone) {
    if (alreadyDone) {
      await supabase.from('pact_task_completions')
        .delete().eq('pact_task_id', taskId).eq('user_id', userId);
    } else {
      await supabase.from('pact_task_completions')
        .insert({ pact_task_id: taskId, user_id: userId });
    }
    onTasksChanged();
  }

  return (
    <div className="pact-card">
      {/* Header */}
      <div className="pact-card-header">
        <div className="pact-card-icon-wrap" aria-hidden="true">
          <Handshake size={20} color="var(--purple)"/>
        </div>
        <div style={{ flex:1 }}>
          <div className="pact-card-name">{pact.name}</div>
          <div className="pact-card-target">יעד: {pact.target_hours_per_week} שע׳ / שבוע</div>
        </div>
        <button
          className="friend-btn friend-btn-reject"
          onClick={onLeave}
          aria-label={isCreator ? 'מחק צוות' : 'עזוב צוות'}
          title={isCreator ? 'מחק צוות (אתה היוצר)' : 'עזוב צוות'}
        >
          <X size={14}/>
        </button>
      </div>

      {/* League header */}
      <div className="pact-league-head">
        <span><Trophy size={13}/> ליגת השבוע</span>
        <span className="pact-league-reset">
          מתאפס בעוד {daysUntilSunday()} ימים
        </span>
      </div>

      {/* Member progress — sorted by weekly minutes (league ranking) */}
      <div className="pact-members-list">
        {[...members]
          .sort((a, b) => (b.profiles?.weekly_studied_minutes || 0) - (a.profiles?.weekly_studied_minutes || 0))
          .map((m, idx) => {
          const prof = m.profiles || {};
          const mins = prof.weekly_studied_minutes || 0;
          const pct  = target ? Math.min(100, Math.round((mins / target) * 100)) : 0;
          const isMe = prof.id === userId;
          const medal = MEDALS[idx] ?? `#${idx + 1}`;
          const isLeader = idx === 0 && mins > 0;
          return (
            <div key={m.user_id} className={`pact-member-row${isLeader ? ' league-leader' : ''}`}>
              <span className="pact-member-medal" aria-label={`מקום ${idx + 1}`}>{medal}</span>
              <div className="pact-member-name">{prof.name || '?'}{isMe ? ' (אתה)' : ''}</div>
              <div className="pact-member-progress">
                <div className="pact-progress-bar-wrap" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="pact-progress-bar-fill"
                    style={{ width:`${pct}%`, background: isLeader ? 'var(--yellow)' : undefined }}
                  />
                </div>
                <span className="pact-member-hours">{fmtHours(mins)}</span>
                {pct >= 100
                  ? <span className="pact-target-badge">✓</span>
                  : <span className="pact-member-pct">{pct}%</span>
                }
              </div>
            </div>
          );
        })}

        {/* Pending invitations — shown only to creator */}
        {isCreator && pending.length > 0 && (
          <div className="pact-pending-list">
            {pending.map(m => (
              <div key={m.user_id} className="pact-pending-row">
                <span className="pact-pending-dot"/>
                <span className="pact-pending-name">{m.profiles?.name || '?'}</span>
                <span className="pact-pending-label">ממתין לאישור</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks section */}
      <div className="pact-tasks-section">
        <div className="pact-tasks-header">
          <span className="pact-tasks-title">משימות הצוות</span>
          {isCreator && !addingTask && (
            <button className="pact-add-task-btn" onClick={() => setAddingTask(true)} aria-label="הוסף משימה">
              <Plus size={13}/> הוסף
            </button>
          )}
        </div>

        {/* Add task form */}
        {addingTask && (
          <form className="pact-task-form" onSubmit={submitTask}>
            <input
              className="pact-task-input"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="שם המשימה..."
              autoFocus
            />
            <button type="submit" className="pact-task-save-btn" disabled={!newTask.trim() || savingTask}>
              {savingTask ? '...' : <Check size={13}/>}
            </button>
            <button type="button" className="pact-task-cancel-btn" onClick={() => { setAddingTask(false); setNewTask(''); }}>
              <X size={13}/>
            </button>
          </form>
        )}

        {/* Task list */}
        {tasks.length === 0 && !addingTask ? (
          <div className="pact-tasks-empty">
            {isCreator ? 'לחץ "+ הוסף" כדי להוסיף משימות לצוות' : 'אין משימות עדיין'}
          </div>
        ) : (
          <div className="pact-task-list">
            {tasks.map(task => {
              const completions = task.pact_task_completions || [];
              const myDone = completions.some(c => c.user_id === userId);
              const doneCount = completions.length;
              return (
                <div key={task.id} className="pact-task-row">
                  <button
                    className={`pact-task-check${myDone ? ' done' : ''}`}
                    onClick={() => toggleCompletion(task.id, myDone)}
                    aria-label={myDone ? 'בטל סימון' : 'סמן כהושלם'}
                  >
                    {myDone && <Check size={10} strokeWidth={3}/>}
                  </button>
                  <span className={`pact-task-title${myDone ? ' done' : ''}`}>{task.title}</span>
                  <div className="pact-task-meta">
                    {members.map(m => {
                      const prof = m.profiles || {};
                      const done = completions.some(c => c.user_id === prof.id);
                      return (
                        <div
                          key={m.user_id}
                          className={`pact-task-member-dot${done ? ' done' : ''}`}
                          title={`${prof.name}${done ? ' ✓' : ''}`}
                        >
                          {prof.name?.[0] ?? '?'}
                        </div>
                      );
                    })}
                    <span className="pact-task-count">{doneCount}/{members.length}</span>
                  </div>
                  {isCreator && (
                    <button className="pact-task-delete-btn" onClick={() => deleteTask(task.id)} aria-label="מחק משימה">
                      <X size={11}/>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────
function FriendsSkeleton() {
  return (
    <div className="friends-skeleton">
      {[1,2,3].map(i => (
        <div key={i} className="friend-skeleton-row">
          <div className="skeleton-circle"/>
          <div className="skeleton-lines">
            <div className="skeleton-line skeleton-line-lg"/>
            <div className="skeleton-line skeleton-line-sm"/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function Friends() {
  const { user, profile } = useAuth();
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendships,   setFriendships]   = useState([]);
  const [pacts,         setPacts]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searching,     setSearching]     = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [showPactModal, setShowPactModal] = useState(false);
  const [inviteCopied,  setInviteCopied]  = useState(false);
  const [inviteCount,   setInviteCount]   = useState(0);
  const [, setTick] = useState(0);
  const searchTimer  = useRef(null);
  const friendIdsRef = useRef([]);

  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchFriendships = useCallback(async () => {
    const { data } = await supabase
      .from('friendships')
      .select(`id, status, created_at,
        requester:profiles!requester_id(${PROFILE_FIELDS}),
        addressee:profiles!addressee_id(${PROFILE_FIELDS})`)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const fs = data || [];
    setFriendships(fs);
    setLoading(false);
    friendIdsRef.current = fs
      .filter(f => f.status === 'accepted')
      .map(f => f.requester?.id === user.id ? f.addressee?.id : f.requester?.id)
      .filter(Boolean);
  }, [user.id]);

  const fetchPacts = useCallback(async () => {
    const { data: memberships } = await supabase
      .from('pact_members').select('pact_id').eq('user_id', user.id).eq('status', 'accepted');
    const ids = (memberships || []).map(m => m.pact_id);
    if (ids.length === 0) { setPacts([]); return; }
    const { data: pactsData } = await supabase
      .from('study_pacts')
      .select(`id, name, target_hours_per_week, creator_id,
        pact_members(user_id, status, profiles(id, name, weekly_studied_minutes)),
        pact_tasks(id, title, created_by, pact_task_completions(user_id))`)
      .in('id', ids);
    setPacts(pactsData || []);
  }, [user.id]);

  useEffect(() => {
    fetchFriendships();
    fetchPacts();
    supabase.from('profiles').select('id',{count:'exact',head:true})
      .eq('referred_by', user.id)
      .then(({ count }) => setInviteCount(count || 0));
  }, [fetchFriendships, fetchPacts, user.id]);

  useEffect(() => {
    // Realtime: סטטוס "לומד עכשיו" של חברים, שינויים בחברויות, ושינויים בצוותים.
    // דורש שהטבלאות יהיו ב-publication (ראה friends_timer_upgrade.sql).
    const channel = supabase
      .channel('friends-live')
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'profiles' }, (payload) => {
        if (friendIdsRef.current.includes(payload.new.id)) fetchFriendships();
      })
      .on('postgres_changes', { event:'*', schema:'public', table:'friendships',
        filter:`addressee_id=eq.${user.id}` }, fetchFriendships)
      .on('postgres_changes', { event:'*', schema:'public', table:'friendships',
        filter:`requester_id=eq.${user.id}` }, fetchFriendships)
      .on('postgres_changes', { event:'*', schema:'public', table:'pact_members' }, () => {
        fetchPacts();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchFriendships, fetchPacts, user.id]);

  function searchUsers(query) {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles').select('id, name')
        .ilike('name', `%${query}%`).neq('id', user.id).limit(8);
      setSearchResults(data || []);
      setSearching(false);
    }, 350);
  }

  async function sendRequest(addresseeId) {
    setActionLoading(addresseeId);
    await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: addresseeId });
    await fetchFriendships(); setActionLoading(null);
  }
  async function acceptRequest(friendshipId) {
    setActionLoading(friendshipId);
    await supabase.from('friendships').update({ status:'accepted' }).eq('id', friendshipId);
    await fetchFriendships(); setActionLoading(null);
  }
  async function removeRelation(friendshipId) {
    setActionLoading(friendshipId);
    await supabase.from('friendships').delete().eq('id', friendshipId);
    await fetchFriendships(); setActionLoading(null);
  }
  async function leavePact(pactId, isCreator) {
    if (isCreator) {
      // היוצר מוחק את הצוות לכולם — לוודא שזו הכוונה
      if (!window.confirm('אתה יוצר הצוות — יציאה תמחק את הצוות לכל החברים. להמשיך?')) return;
      await supabase.from('study_pacts').delete().eq('id', pactId);
    } else {
      // חבר רגיל עוזב — מוחק רק את החברות שלו
      await supabase.from('pact_members').delete().eq('pact_id', pactId).eq('user_id', user.id);
    }
    fetchPacts();
  }

  function getOther(f) {
    if (!f.requester || !f.addressee) return { name:'?' };
    return f.requester.id === user.id ? f.addressee : f.requester;
  }
  function getRelation(targetId) {
    return friendships.find(f => f.requester?.id === targetId || f.addressee?.id === targetId);
  }

  function copyInviteLink() {
    if (!profile?.invite_code) return;
    const link = `${APP_URL}?ref=${profile.invite_code}`;
    navigator.clipboard.writeText(link);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  }

  const friends      = friendships.filter(f => f.status === 'accepted');
  const incoming     = friendships.filter(f => f.status === 'pending' && f.addressee?.id === user.id);
  const studyingNow  = friends.map(f => getOther(f)).filter(o => o?.session_active);
  const myWeeklyMins = profile?.weekly_studied_minutes ?? 0;
  const friendObjs   = friends.map(f => getOther(f)).filter(o => o?.id);

  return (
    <div className="page-enter">
      <div className="friends-page-header">
        <h2 className="friends-page-title">חברים</h2>
        <p className="friends-page-sub">עקוב אחרי חברים וראה את ההתקדמות שלהם</p>
      </div>

      {/* ── Invite Link ──────────────────────────── */}
      <div className="card invite-card" style={{ marginBottom:20 }}>
        <div className="section-header" style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Link2 size={16} color="var(--accent)"/>
            <span className="section-title">הזמן חברים</span>
          </div>
          {inviteCount > 0 && (
            <span className="invite-success-badge">
              <Check size={11}/> {inviteCount} נרשמו דרכך
            </span>
          )}
        </div>
        <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:14, lineHeight:1.65 }}>
          שתף את הקישור האישי שלך — כשחבר נרשם דרכו, שניכם מקבלים קרדיטים!
        </p>
        <div className="invite-link-row" data-tour="invite-link">
          <div className="invite-link-box" dir="ltr" aria-label="קישור הזמנה אישי">
            {profile?.invite_code ? `${APP_URL}?ref=${profile.invite_code}` : 'טוען קישור...'}
          </div>
          <button
            className={`invite-copy-btn${inviteCopied ? ' copied' : ''}`}
            onClick={copyInviteLink}
            disabled={!profile?.invite_code}
            aria-label="העתק קישור הזמנה"
          >
            {inviteCopied ? <><Check size={14}/> הועתק!</> : <><Copy size={14}/> העתק</>}
          </button>
        </div>
        <div className="invite-rewards-row">
          <span className="invite-reward-pill">+50 קרדיטים לך על הזמנה</span>
          <span className="invite-reward-pill" style={{ background:'var(--green-dim)', color:'var(--green)' }}>+30 קרדיטים לנרשם</span>
        </div>
      </div>

      {/* ── Live Now ─────────────────────────────── */}
      {studyingNow.length > 0 && (
        <div className="card friends-live-section">
          <div className="section-header" style={{ marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span className="live-pulse-dot" aria-hidden="true"/>
              <span className="section-title">לומדים עכשיו</span>
            </div>
            <span style={{ fontSize:13, color:'var(--green)', fontWeight:700 }}>{studyingNow.length} פעילים</span>
          </div>
          <div className="friends-live-list">
            {studyingNow.map(o => (
              <div key={o.id} className="friend-live-row">
                <MiniAvatar profile={o} size={48} isLive={true}/>
                <div className="friend-live-info">
                  <div className="friend-name">{o.name}</div>
                  <div className="friend-live-meta">
                    {o.session_course_name && <span className="friend-live-course">{o.session_course_name}</span>}
                    <span className="friend-live-elapsed">{fmtElapsed(o.session_started_at)}</span>
                  </div>
                </div>
                <span className="friend-live-badge" aria-label="לומד כעת">לומד</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search ───────────────────────────────── */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="section-header">
          <span className="section-title">חפש חברים</span>
          <UserPlus size={17} color="var(--text-3)" aria-hidden="true"/>
        </div>
        <div className="friends-search-wrap">
          <Search size={15} className="friends-search-icon" aria-hidden="true"/>
          <input
            className="friends-search-input"
            placeholder="חפש לפי שם..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); searchUsers(e.target.value); }}
            aria-label="חיפוש משתמשים לפי שם"
          />
        </div>

        {searching && (
          <div style={{ padding:'12px 0', color:'var(--text-3)', fontSize:13, textAlign:'center' }} role="status">
            מחפש...
          </div>
        )}

        {!searching && searchResults.length > 0 && (
          <div className="friends-search-results" role="list">
            {searchResults.map(u => {
              const rel = getRelation(u.id);
              return (
                <div className="friend-row" key={u.id} role="listitem">
                  <div className="friend-avatar" aria-hidden="true">{u.name?.[0] ?? '?'}</div>
                  <span className="friend-name">{u.name}</span>
                  <div className="friend-row-actions">
                    {!rel && (
                      <button className="friend-btn friend-btn-add" onClick={() => sendRequest(u.id)} disabled={actionLoading === u.id} aria-label={`שלח בקשת חברות ל${u.name}`}>
                        <UserPlus size={13}/> הוסף חבר
                      </button>
                    )}
                    {rel?.status === 'pending' && rel.requester.id === user.id && (
                      <span className="friend-tag friend-tag-pending"><Clock size={11}/> ממתין</span>
                    )}
                    {rel?.status === 'pending' && rel.addressee.id === user.id && (
                      <button className="friend-btn friend-btn-accept" onClick={() => acceptRequest(rel.id)} disabled={actionLoading === rel.id}>
                        <Check size={13}/> אשר
                      </button>
                    )}
                    {rel?.status === 'accepted' && (
                      <span className="friend-tag friend-tag-accepted"><UserCheck size={11}/> חבר</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!searching && searchQuery.trim() && searchResults.length === 0 && (
          <div style={{ padding:'16px 0 4px', color:'var(--text-3)', fontSize:13, textAlign:'center' }}>
            לא נמצאו משתמשים בשם "{searchQuery}"
          </div>
        )}
      </div>

      {/* ── Incoming requests ────────────────────── */}
      {incoming.length > 0 && (
        <div className="card" style={{ marginBottom:20 }}>
          <div className="section-header">
            <span className="section-title">בקשות חברות</span>
            <span className="friends-count-badge">{incoming.length}</span>
          </div>
          <div className="friends-list">
            {incoming.map(f => {
              const other = getOther(f);
              return (
                <div className="friend-card" key={f.id}>
                  <div className="friend-avatar friend-avatar-lg" aria-hidden="true">{other.name?.[0] ?? '?'}</div>
                  <div className="friend-card-info">
                    <div className="friend-name">{other.name}</div>
                    <div className="friend-card-sub">שלח לך בקשת חברות</div>
                  </div>
                  <div className="friend-card-actions">
                    <button className="friend-btn friend-btn-accept" onClick={() => acceptRequest(f.id)} disabled={actionLoading === f.id} aria-label={`אשר בקשת חברות של ${other.name}`}>
                      <Check size={13}/> אשר
                    </button>
                    <button className="friend-btn friend-btn-reject" onClick={() => removeRelation(f.id)} disabled={actionLoading === f.id} aria-label={`דחה בקשת חברות של ${other.name}`}>
                      <X size={13}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Friends list ─────────────────────────── */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="section-header">
          <span className="section-title">החברים שלי</span>
          <span style={{ fontSize:13, color:'var(--text-3)', fontWeight:500 }}>{friends.length} חברים</span>
        </div>
        {loading ? (
          <FriendsSkeleton/>
        ) : friends.length === 0 ? (
          <div className="friends-empty">
            <Users size={36} color="var(--text-3)" aria-hidden="true"/>
            <div className="friends-empty-text">עדיין אין חברים</div>
            <div className="friends-empty-sub">חפש חברים למעלה או שתף את קישור ההזמנה</div>
          </div>
        ) : (
          <div className="friends-list">
            {friends.map(f => {
              const other = getOther(f);
              return (
                <FriendCard
                  key={f.id} other={other}
                  myWeeklyMins={myWeeklyMins}
                  myName={profile?.name?.split(' ')[0] ?? 'אתה'}
                  isRemoving={actionLoading === f.id}
                  onRemove={() => removeRelation(f.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Study Pacts ──────────────────────────── */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: pacts.length > 0 ? 14 : 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Target size={16} color="var(--purple)" aria-hidden="true"/>
            <span className="section-title">צוות למידה</span>
          </div>
          {friendObjs.length > 0 && (
            <button className="friend-btn friend-btn-add" data-tour="pact-create-btn" onClick={() => setShowPactModal(true)} aria-label="פתח צוות למידה חדש">
              <Plus size={13}/> צוות חדש
            </button>
          )}
        </div>
        {pacts.length === 0 ? (
          <div className="friends-empty" style={{ padding:'20px 0' }}>
            <Handshake size={36} color="var(--text-3)" aria-hidden="true"/>
            <div className="friends-empty-text">אין צוות למידה פעיל</div>
            <div className="friends-empty-sub">
              {friendObjs.length === 0
                ? 'הוסף חבר כדי לפתוח צוות למידה'
                : 'פתח צוות עם חבר ולמדו יחד לקראת יעד משותף'}
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {pacts.map(p => (
              <PactCard key={p.id} pact={p} userId={user.id} onLeave={() => leavePact(p.id, p.creator_id === user.id)} onTasksChanged={fetchPacts}/>
            ))}
          </div>
        )}
      </div>

      {showPactModal && (
        <CreatePactModal
          friends={friendObjs}
          userId={user.id}
          onCreated={() => { setShowPactModal(false); fetchPacts(); }}
          onClose={() => setShowPactModal(false)}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function MiniAvatar({ profile, size = 52, isLive = false }) {
  const cfg        = profile?.avatar_config    || {};
  const purchased  = profile?.avatar_purchased || {};
  const pid        = cfg?.presetId;
  const ownedItems = (pid != null && purchased[pid]) ? purchased[pid] : [];
  const hasAvatar  = cfg?.baseSelected && pid != null;

  if (!hasAvatar) {
    return (
      <div
        className={`friend-avatar friend-avatar-lg${isLive ? ' friend-avatar-live' : ''}`}
        style={{ width:size, height:size, flexShrink:0 }}
        aria-hidden="true"
      >
        {profile?.name?.[0] ?? '?'}
      </div>
    );
  }
  return (
    <div
      className={`friend-mini-avatar-wrap${isLive ? ' friend-avatar-live' : ''}`}
      style={{ width:size, height:Math.round(size*1.22), flexShrink:0 }}
      aria-hidden="true"
    >
      <AvatarSVG config={cfg} purchased={ownedItems}/>
    </div>
  );
}

function FriendCard({ other, myWeeklyMins, myName, isRemoving, onRemove }) {
  if (!other || !other.name) return null;
  const isLive     = other.session_active;
  const friendMins = other.weekly_studied_minutes ?? 0;
  const friendFirst= other.name.split(' ')[0];

  return (
    <div className={`friend-card${isLive ? ' friend-card-live' : ''}`} style={{ alignItems:'flex-start', paddingBlock:10 }}>
      <MiniAvatar profile={other} size={52} isLive={isLive}/>
      <div className="friend-card-info" style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div className="friend-name">{other.name}</div>
          {isLive && <span className="friend-live-badge-sm" aria-label="לומד כעת">לומד</span>}
        </div>
        {isLive && other.session_course_name && (
          <div className="friend-live-meta" style={{ marginBottom:4 }}>
            <span className="friend-live-course">{other.session_course_name}</span>
            <span className="friend-live-elapsed">{fmtElapsed(other.session_started_at)}</span>
          </div>
        )}
        <div className="friend-weekly-row">
          <span className="friend-weekly-me">{myName}: {fmtHours(myWeeklyMins)}</span>
          <span className="friend-weekly-sep">·</span>
          <span className="friend-weekly-them">{friendFirst}: {fmtHours(friendMins)}</span>
        </div>
      </div>
      <button
        className="friend-btn friend-btn-reject"
        onClick={onRemove}
        disabled={isRemoving}
        aria-label={`הסר את ${other.name} מרשימת החברים`}
        style={{ marginTop:2 }}
      >
        <X size={14}/>
      </button>
    </div>
  );
}
