import { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, Search, Check, X, Clock, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AvatarSVG from '../components/AvatarSVG';

const PROFILE_FIELDS = 'id, name, weekly_studied_minutes, session_active, session_course_name, session_started_at, avatar_config, avatar_purchased';

function fmtElapsed(isoStr) {
  if (!isoStr) return '';
  const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (mins < 1) return 'הרגע התחיל';
  if (mins < 60) return `${mins} דק׳`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}:${String(m).padStart(2, '0')} שע׳` : `${h} שע׳`;
}

function fmtHours(mins) {
  const m = mins || 0;
  if (m === 0) return '0 שע׳';
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem} דק׳`;
  return rem > 0 ? `${h}:${String(rem).padStart(2, '0')}` : `${h} שע׳`;
}

export default function Friends() {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendships, setFriendships]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searching, setSearching]         = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [, setTick] = useState(0);
  const searchTimer  = useRef(null);
  const friendIdsRef = useRef([]);

  // Tick every 30s to refresh elapsed-time displays
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchFriendships = useCallback(async () => {
    const { data } = await supabase
      .from('friendships')
      .select(`
        id, status, created_at,
        requester:profiles!requester_id(${PROFILE_FIELDS}),
        addressee:profiles!addressee_id(${PROFILE_FIELDS})
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const fs = data || [];
    setFriendships(fs);
    setLoading(false);
    // Track accepted friend IDs for realtime filtering
    friendIdsRef.current = fs
      .filter(f => f.status === 'accepted')
      .map(f => f.requester?.id === user.id ? f.addressee?.id : f.requester?.id)
      .filter(Boolean);
  }, [user.id]);

  useEffect(() => { fetchFriendships(); }, [fetchFriendships]);

  // Realtime: re-fetch when a friend's profile changes (session start/stop)
  useEffect(() => {
    const channel = supabase
      .channel('friend-live-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        if (friendIdsRef.current.includes(payload.new.id)) {
          fetchFriendships();
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchFriendships]);

  function searchUsers(query) {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .neq('id', user.id)
        .limit(8);
      setSearchResults(data || []);
      setSearching(false);
    }, 350);
  }

  async function sendRequest(addresseeId) {
    setActionLoading(addresseeId);
    await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: addresseeId });
    await fetchFriendships();
    setActionLoading(null);
  }

  async function acceptRequest(friendshipId) {
    setActionLoading(friendshipId);
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    await fetchFriendships();
    setActionLoading(null);
  }

  async function removeRelation(friendshipId) {
    setActionLoading(friendshipId);
    await supabase.from('friendships').delete().eq('id', friendshipId);
    await fetchFriendships();
    setActionLoading(null);
  }

  function getOther(f) {
    if (!f.requester || !f.addressee) return { name: '?' };
    return f.requester.id === user.id ? f.addressee : f.requester;
  }

  function getRelation(targetId) {
    return friendships.find(f =>
      f.requester?.id === targetId || f.addressee?.id === targetId
    );
  }

  const friends      = friendships.filter(f => f.status === 'accepted');
  const incoming     = friendships.filter(f => f.status === 'pending' && f.addressee?.id === user.id);
  const studyingNow  = friends.map(f => getOther(f)).filter(o => o?.session_active);
  const myWeeklyMins = profile?.weekly_studied_minutes ?? 0;

  return (
    <div className="page-enter">
      <div className="friends-page-header">
        <h2 className="friends-page-title">חברים</h2>
        <p className="friends-page-sub">עקוב אחרי חברים וראה את ההתקדמות שלהם</p>
      </div>

      {/* ── Live Now ─────────────────────────────────── */}
      {studyingNow.length > 0 && (
        <div className="card friends-live-section">
          <div className="section-header" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="live-pulse-dot" />
              <span className="section-title">לומדים עכשיו</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>
              {studyingNow.length} פעילים
            </span>
          </div>
          <div className="friends-live-list">
            {studyingNow.map(o => (
              <div key={o.id} className="friend-live-row">
                <MiniAvatar profile={o} size={48} isLive={true} />
                <div className="friend-live-info">
                  <div className="friend-name">{o.name}</div>
                  <div className="friend-live-meta">
                    {o.session_course_name && (
                      <span className="friend-live-course">{o.session_course_name}</span>
                    )}
                    <span className="friend-live-elapsed">{fmtElapsed(o.session_started_at)}</span>
                  </div>
                </div>
                <span className="friend-live-badge">לומד</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search ───────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">חפש חברים</span>
          <UserPlus size={17} color="var(--text-3)" />
        </div>
        <div className="friends-search-wrap">
          <Search size={15} className="friends-search-icon" />
          <input
            className="friends-search-input"
            placeholder="חפש לפי שם..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); searchUsers(e.target.value); }}
          />
        </div>

        {searching && (
          <div style={{ padding: '12px 0', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
            מחפש...
          </div>
        )}

        {!searching && searchResults.length > 0 && (
          <div className="friends-search-results">
            {searchResults.map(u => {
              const rel = getRelation(u.id);
              return (
                <div className="friend-row" key={u.id}>
                  <div className="friend-avatar">{u.name?.[0] ?? '?'}</div>
                  <span className="friend-name">{u.name}</span>
                  <div className="friend-row-actions">
                    {!rel && (
                      <button
                        className="friend-btn friend-btn-add"
                        onClick={() => sendRequest(u.id)}
                        disabled={actionLoading === u.id}
                      >
                        <UserPlus size={13} /> הוסף חבר
                      </button>
                    )}
                    {rel?.status === 'pending' && rel.requester.id === user.id && (
                      <span className="friend-tag friend-tag-pending">
                        <Clock size={11} /> ממתין לאישור
                      </span>
                    )}
                    {rel?.status === 'pending' && rel.addressee.id === user.id && (
                      <button
                        className="friend-btn friend-btn-accept"
                        onClick={() => acceptRequest(rel.id)}
                        disabled={actionLoading === rel.id}
                      >
                        <Check size={13} /> אשר
                      </button>
                    )}
                    {rel?.status === 'accepted' && (
                      <span className="friend-tag friend-tag-accepted">
                        <UserCheck size={11} /> חבר
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!searching && searchQuery.trim() && searchResults.length === 0 && (
          <div style={{ padding: '16px 0 4px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
            לא נמצאו משתמשים בשם "{searchQuery}"
          </div>
        )}
      </div>

      {/* ── Incoming requests ────────────────────────── */}
      {incoming.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-header">
            <span className="section-title">בקשות חברות</span>
            <span className="friends-count-badge">{incoming.length}</span>
          </div>
          <div className="friends-list">
            {incoming.map(f => {
              const other = getOther(f);
              return (
                <div className="friend-card" key={f.id}>
                  <div className="friend-avatar friend-avatar-lg">{other.name?.[0] ?? '?'}</div>
                  <div className="friend-card-info">
                    <div className="friend-name">{other.name}</div>
                    <div className="friend-card-sub">שלח לך בקשת חברות</div>
                  </div>
                  <div className="friend-card-actions">
                    <button
                      className="friend-btn friend-btn-accept"
                      onClick={() => acceptRequest(f.id)}
                      disabled={actionLoading === f.id}
                    >
                      <Check size={13} /> אשר
                    </button>
                    <button
                      className="friend-btn friend-btn-reject"
                      onClick={() => removeRelation(f.id)}
                      disabled={actionLoading === f.id}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Friends list ─────────────────────────────── */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">החברים שלי</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
            {friends.length} חברים
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            טוען...
          </div>
        ) : friends.length === 0 ? (
          <div className="friends-empty">
            <div className="friends-empty-icon">👥</div>
            <div className="friends-empty-text">עדיין אין חברים</div>
            <div className="friends-empty-sub">חפש חברים למעלה כדי להתחיל</div>
          </div>
        ) : (
          <div className="friends-list">
            {friends.map(f => {
              const other = getOther(f);
              return (
                <FriendCard
                  key={f.id}
                  other={other}
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
    </div>
  );
}

function MiniAvatar({ profile, size = 52, isLive = false }) {
  const cfg       = profile?.avatar_config    || {};
  const purchased = profile?.avatar_purchased || {};
  const pid       = cfg?.presetId;
  const ownedItems = (pid != null && purchased[pid]) ? purchased[pid] : [];
  const hasAvatar  = cfg?.baseSelected && pid != null;

  if (!hasAvatar) {
    return (
      <div
        className={`friend-avatar friend-avatar-lg${isLive ? ' friend-avatar-live' : ''}`}
        style={{ width: size, height: size, flexShrink: 0 }}
      >
        {profile?.name?.[0] ?? '?'}
      </div>
    );
  }

  return (
    <div
      className={`friend-mini-avatar-wrap${isLive ? ' friend-avatar-live' : ''}`}
      style={{ width: size, height: Math.round(size * 1.22), flexShrink: 0 }}
    >
      <AvatarSVG config={cfg} purchased={ownedItems} />
    </div>
  );
}

function FriendCard({ other, myWeeklyMins, myName, isRemoving, onRemove }) {
  if (!other || !other.name) return null;
  const isLive      = other.session_active;
  const friendMins  = other.weekly_studied_minutes ?? 0;
  const friendFirst = other.name.split(' ')[0];

  return (
    <div className={`friend-card${isLive ? ' friend-card-live' : ''}`} style={{ alignItems: 'flex-start', paddingBlock: 10 }}>
      <MiniAvatar profile={other} size={52} isLive={isLive} />
      <div className="friend-card-info" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="friend-name">{other.name}</div>
          {isLive && <span className="friend-live-badge-sm">לומד</span>}
        </div>
        {isLive && other.session_course_name && (
          <div className="friend-live-meta" style={{ marginBottom: 4 }}>
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
        title="הסר חבר"
        style={{ marginTop: 2 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
