import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';

const TODAY    = () => new Date().toISOString().split('T')[0];
const TOMORROW = () => new Date(Date.now() + 86400000).toISOString().split('T')[0];

export default function NotificationBell() {
  const { user } = useAuth();
  const { tasks } = useData();
  const [open,    setOpen]    = useState(false);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(null); // pact_id being responded

  const fetchInvites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pact_members')
      .select('pact_id, study_pacts(id, name, creator_id, profiles!study_pacts_creator_id_fkey(name))')
      .eq('user_id', user.id)
      .eq('status', 'pending');
    setInvites(data || []);
  }, [user?.id]); // eslint-disable-line

  useEffect(() => {
    fetchInvites();
    if (!user) return;
    // Realtime: listen for new invitations
    const ch = supabase
      .channel(`notif-pact-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'pact_members',
        filter: `user_id=eq.${user.id}`,
      }, fetchInvites)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user?.id, fetchInvites]); // eslint-disable-line

  async function accept(pactId) {
    setLoading(pactId);
    await supabase.from('pact_members').update({ status: 'accepted' }).eq('pact_id', pactId).eq('user_id', user.id);
    await fetchInvites();
    setLoading(null);
  }

  async function decline(pactId) {
    setLoading(pactId);
    await supabase.from('pact_members').delete().eq('pact_id', pactId).eq('user_id', user.id);
    await fetchInvites();
    setLoading(null);
  }

  // Task deadline reminders (today + tomorrow, not completed)
  const today    = TODAY();
  const tomorrow = TOMORROW();
  const deadlines = tasks.filter(t => !t.completed && (t.dueDate === today || t.dueDate === tomorrow));

  const total = invites.length + deadlines.length;

  return (
    <div className="notif-wrap">
      <button
        className="topbar-icon-btn notif-bell-btn"
        onClick={() => setOpen(p => !p)}
        aria-label={`התראות${total > 0 ? ` (${total})` : ''}`}
        title="התראות"
      >
        <Bell size={17}/>
        {total > 0 && (
          <span className="notif-badge">{total > 9 ? '9+' : total}</span>
        )}
      </button>

      {open && (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)}/>
          <div className="notif-panel">
            <div className="notif-panel-head">
              <span className="notif-panel-title">
                התראות {total > 0 && <span className="notif-count-pill">{total}</span>}
              </span>
              <button className="modal-close-btn" onClick={() => setOpen(false)} aria-label="סגור">
                <X size={16}/>
              </button>
            </div>

            <div className="notif-panel-body">
              {total === 0 ? (
                <div className="notif-empty">
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div>הכל מסודר — אין התראות</div>
                </div>
              ) : (
                <>
                  {/* ── הזמנות לצוות ── */}
                  {invites.length > 0 && (
                    <div className="notif-section">
                      <div className="notif-section-label">הזמנות לצוות למידה</div>
                      {invites.map(inv => {
                        const pact       = inv.study_pacts;
                        const inviterName = pact?.profiles?.name || 'חבר';
                        const busy       = loading === inv.pact_id;
                        return (
                          <div key={inv.pact_id} className="notif-item">
                            <div className="notif-item-emoji">🤝</div>
                            <div className="notif-item-body">
                              <div className="notif-item-text">
                                <strong>{inviterName}</strong> הזמין/ה אותך לצוות{' '}
                                <strong>"{pact?.name}"</strong>
                              </div>
                              <div className="notif-item-actions">
                                <button
                                  className="notif-btn notif-btn-accept"
                                  onClick={() => accept(inv.pact_id)}
                                  disabled={busy}
                                >
                                  {busy ? '...' : <><Check size={12}/> הצטרף</>}
                                </button>
                                <button
                                  className="notif-btn notif-btn-decline"
                                  onClick={() => decline(inv.pact_id)}
                                  disabled={busy}
                                >
                                  <X size={12}/> דחה
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── תזכורות משימות ── */}
                  {deadlines.length > 0 && (
                    <div className="notif-section">
                      <div className="notif-section-label">תזכורות משימות</div>
                      {deadlines.map(t => (
                        <div key={t.id} className={`notif-item${t.dueDate === today ? ' notif-item-urgent' : ''}`}>
                          <div className="notif-item-emoji">
                            {t.dueDate === today ? '🔴' : '📅'}
                          </div>
                          <div className="notif-item-body">
                            <div className="notif-item-text">
                              <strong>{t.dueDate === today ? 'להגשה היום' : 'להגשה מחר'}:</strong>{' '}
                              {t.title}
                            </div>
                            {t.dueDate === today && (
                              <div className="notif-item-sub">היום האחרון להגשה</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
