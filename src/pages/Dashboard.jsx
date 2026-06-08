import { useState } from 'react';
import { Plus, X, Target, ListChecks, Clock, BookOpen, CalendarDays, Smile, Trophy, Flame } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { taskTypeColors, taskTypeLabels } from '../data/mockData';
import AvatarSVG from '../components/AvatarSVG';
import ModalPortal from '../components/ModalPortal';

const TODAY = new Date().toISOString().split('T')[0];

function daysUntil(d) { return Math.ceil((new Date(d) - new Date(TODAY)) / 86400000); }
function examColor(days) {
  if (days <= 7)  return { bg:'var(--red-dim)',    text:'var(--red)'    };
  if (days <= 14) return { bg:'var(--yellow-dim)', text:'var(--yellow)' };
  return                  { bg:'var(--blue-dim)',   text:'var(--blue)'   };
}
function fmtDate(d) { return new Date(d).toLocaleDateString('he-IL',{day:'numeric',month:'short'}); }

export default function Dashboard({ onNavigate }) {
  const { profile } = useAuth();
  const { courses, tasks, exams, courseStats, updateTask, addExam, removeExam } = useData();
  const [showAddExam, setAdd] = useState(false);

  const firstName      = profile?.name?.split(' ')[0] ?? '';
  const completedCount = tasks.filter(t => t.completed).length;
  const openCount      = tasks.filter(t => !t.completed).length;
  const overallPct     = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const weeklyGoal     = profile?.weekly_goal_hours ?? 20;
  const weeklyMins     = profile?.weekly_studied_minutes ?? 0;
  const weeklyHours    = (weeklyMins / 60).toFixed(1);
  const streakCurrent  = profile?.streak_current ?? 0;
  const streakBest     = profile?.streak_best    ?? 0;

  const todayTasks    = tasks.filter(t => t.dueDate === TODAY).slice(0, 4);
  const upcomingExams = [...exams]
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);
  const courseById = Object.fromEntries(courses.map(c => [c.id, c]));

  const stats = [
    { Icon: Target,     iconColor:'var(--accent)',  bg:'var(--accent-dim)',  label:'השלמה כוללת',   value:`${overallPct}%`,  sub:`${completedCount} מתוך ${tasks.length}` },
    { Icon: ListChecks, iconColor:'var(--blue)',    bg:'var(--blue-dim)',    label:'משימות פתוחות', value:openCount,         sub:`${todayTasks.filter(t=>!t.completed).length} להיום` },
    { Icon: Clock,      iconColor:'var(--purple)',  bg:'var(--purple-dim)',  label:'שעות השבוע',    value:weeklyHours,       sub:`מתוך ${weeklyGoal} שעות` },
    { Icon: BookOpen,   iconColor:'var(--green)',   bg:'var(--green-dim)',   label:'קורסים פעילים', value:courses.length,    sub:'בסמסטר' },
  ];

  return (
    <div className="db-page">
      {/* Greeting */}
      <div className="db-greet">
        <h1>שלום{firstName ? <>, <span className="greet-name">{firstName}</span></> : ''}! 👋</h1>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <p style={{ margin:0 }}>{profile?.semester ?? ''}</p>
          {streakCurrent > 0 && (
            <button
              className="db-streak-badge"
              onClick={() => onNavigate('achievements')}
              title={`שיא: ${streakBest} ימים`}
            >
              <Flame size={13} fill="currentColor"/>
              <span>{streakCurrent} ימים ברצף</span>
              {streakBest > streakCurrent && <span className="db-streak-best">שיא: {streakBest}</span>}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="db-stats enter-stagger">
        {stats.map((s, i) => (
          <div className="db-stat" key={i}>
            <div className="db-stat-top">
              <div className="db-stat-label">{s.label}</div>
              <div className="db-stat-icon" style={{background:s.bg}}>
                <s.Icon size={16} color={s.iconColor}/>
              </div>
            </div>
            <div className="db-stat-value">{s.value}</div>
            <div className="db-stat-sub">{s.sub}</div>
          </div>
        ))}
        <div
          className="db-stat db-stat-achievements"
          onClick={() => onNavigate('achievements')}
          style={{ cursor:'pointer' }}
          title="ארון הגביעים"
        >
          <div className="db-stat-top">
            <div className="db-stat-label">הישגים</div>
            <div className="db-stat-icon" style={{background:'var(--yellow-dim)'}}>
              <Trophy size={16} color="var(--yellow)"/>
            </div>
          </div>
          <div className="db-stat-value">🏆</div>
          <div className="db-stat-sub">לחץ לצפייה</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="db-grid">
        {/* Left — courses + today tasks */}
        <div className="db-left">
          {/* Courses */}
          <div className="card db-card-inner">
            <div className="section-header" style={{marginBottom:10}}>
              <span className="section-title">קורסים</span>
              <button className="section-action" onClick={() => onNavigate('courses')}>הצג הכל</button>
            </div>
            {courses.length === 0 ? (
              <div className="db-empty-sm">
                <BookOpen size={28} color="var(--text-3)"/>
                <button className="section-action" onClick={() => onNavigate('courses')}>הוסף קורס ראשון</button>
              </div>
            ) : (
              <div className="db-courses-scroll">
                <div className="courses-mini-grid">
                  {courses.slice(0, 6).map(course => {
                    const s   = courseStats[course.id] || { total: 0, completed: 0 };
                    const pct = s.total ? Math.round((s.completed / s.total) * 100) : 0;
                    return (
                      <div className="course-mini-card" key={course.id} onClick={() => onNavigate('courses')}>
                        <div style={{position:'absolute',top:0,right:0,width:4,height:'100%',background:course.color,borderRadius:'0 var(--radius-lg) var(--radius-lg) 0'}}/>
                        <div className="course-mini-header">
                          <span className="course-emoji">{course.emoji}</span>
                          <div>
                            <div className="course-mini-title">{course.name}</div>
                            <div className="course-mini-code">{course.code}</div>
                          </div>
                        </div>
                        <ProgressBar value={pct} color={course.color} showLabel={false} size="sm"/>
                        <div className="course-mini-footer">
                          <span className="course-mini-tasks">{s.completed}/{s.total}</span>
                          <span style={{fontSize:12,fontWeight:700,color:course.color}}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Today's tasks — interactive checkboxes */}
          <div className="card db-card-inner">
            <div className="section-header" style={{marginBottom:10}}>
              <span className="section-title">משימות להיום</span>
              <button className="section-action" onClick={() => onNavigate('tasks')}>הצג הכל</button>
            </div>
            {todayTasks.length === 0 ? (
              <div className="db-empty-sm">
                <span>{tasks.length === 0 ? 'הוסף משימות כדי להתחיל' : '🎉 אין משימות להיום!'}</span>
              </div>
            ) : (
              <div className="tasks-today-list">
                {todayTasks.map(task => {
                  const tc     = taskTypeColors[task.type] || taskTypeColors.homework;
                  const course = courseById[task.courseId];
                  return (
                    <div className={`task-item${task.completed?' completed':''}`} key={task.id}>
                      <div
                        className={`task-check${task.completed?' checked':''}`}
                        onClick={() => updateTask(task.id, { completed: !task.completed })}
                        style={{cursor:'pointer'}}
                      >
                        {task.completed && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div className="task-body">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          <span className="task-badge" style={{background:tc.bg,color:tc.text,borderColor:tc.border}}>{taskTypeLabels[task.type]}</span>
                          {course && <span style={{display:'flex',alignItems:'center',gap:4}}><span className="task-course-dot" style={{background:course.color}}/><span className="task-date">{course.name}</span></span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — exams + avatar */}
        <div className="db-right">
          {/* Exams */}
          <div className="card db-card-inner">
            <div className="section-header" style={{marginBottom:10}}>
              <span className="section-title">מבחנים קרובים</span>
              <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--accent)',display:'flex',alignItems:'center',gap:3,fontSize:12,fontWeight:600,fontFamily:'var(--font)'}} onClick={() => setAdd(true)}>
                <Plus size={12}/> הוסף
              </button>
            </div>
            {upcomingExams.length === 0 ? (
              <div className="db-empty-sm">
                <CalendarDays size={28} color="var(--text-3)"/>
                <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--accent)',fontSize:12,fontWeight:600,fontFamily:'var(--font)'}} onClick={() => setAdd(true)}>+ הוסף מבחן</button>
              </div>
            ) : (
              <div className="exam-list">
                {upcomingExams.map(exam => {
                  const col    = examColor(exam.days);
                  const course = courseById[exam.courseId];
                  return (
                    <div className="exam-item" key={exam.id} style={{padding:'10px 12px'}}>
                      <div className="exam-countdown-box" style={{background:col.bg,color:col.text,minWidth:42,height:42}}>
                        <div className="exam-days" style={{fontSize:17}}>{exam.days}</div>
                        <div className="exam-days-label">יום</div>
                      </div>
                      <div className="exam-info">
                        <div className="exam-title" style={{fontSize:12.5}}>{exam.title}</div>
                        <div className="exam-date">{fmtDate(exam.date)}{exam.location && ` · ${exam.location}`}</div>
                      </div>
                      {course && <div style={{width:7,height:7,borderRadius:'50%',background:course.color,flexShrink:0}}/>}
                      <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',padding:2,flexShrink:0}} onClick={() => removeExam(exam.id)}>
                        <X size={12}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="card db-card-inner" style={{cursor:'pointer',textAlign:'center'}} onClick={() => onNavigate('avatar')}>
            <div className="section-header" style={{marginBottom:10}}>
              <span className="section-title">סוכן הלימודים שלי</span>
              <button className="section-action" onClick={e => { e.stopPropagation(); onNavigate('avatar'); }}>לסוכן</button>
            </div>
            <AvatarDashCard profile={profile}/>
          </div>
        </div>
      </div>

      {showAddExam && (
        <AddExamModal
          courses={courses}
          onAdd={async data => { await addExam(data); setAdd(false); }}
          onClose={() => setAdd(false)}
        />
      )}
    </div>
  );
}

function AvatarDashCard({ profile }) {
  const cfg       = profile?.avatar_config    || {};
  const purchased = profile?.avatar_purchased || {};
  const pid       = cfg?.presetId;
  const ownedItems = (pid != null && purchased[pid]) ? purchased[pid] : [];
  const hasAvatar  = cfg?.baseSelected && pid != null;

  if (!hasAvatar) return (
    <div style={{padding:'16px 0',color:'var(--text-3)'}}>
      <Smile size={34} color="var(--text-3)" style={{display:'block',margin:'0 auto 8px'}}/>
      <div style={{fontSize:12,fontWeight:600,color:'var(--text-2)',marginBottom:3}}>אין סוכן לימודים עדיין</div>
      <div style={{fontSize:11,color:'var(--text-3)'}}>לחץ לבחור</div>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
      <div style={{width:120,height:150,borderRadius:'var(--radius-lg)',overflow:'hidden',border:'2px solid var(--accent)',boxShadow:'0 4px 16px rgba(255,101,36,.18)'}}>
        <AvatarSVG config={cfg} purchased={ownedItems}/>
      </div>
      <div style={{fontSize:11.5,color:'var(--text-3)'}}>לחץ לכניסה לחנות</div>
    </div>
  );
}

function AddExamModal({ courses, onAdd, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [title,    setTitle]    = useState('');
  const [date,     setDate]     = useState(today);
  const [location, setLocation] = useState('');
  const [courseId, setCourseId] = useState('');
  const [saving,   setSaving]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    await onAdd({ title: title.trim(), date, location: location.trim(), courseId: courseId || null });
    setSaving(false);
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <span className="modal-head-title">הוספת מבחן</span>
          <button className="modal-close-btn" onClick={onClose}><X size={17}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">שם המבחן *</label>
            <input className="modal-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="בחינת אמצע – אלגוריתמים" required autoFocus/>
          </div>
          <div className="modal-row-2">
            <div className="modal-field">
              <label className="modal-label">תאריך *</label>
              <input className="modal-input" type="date" value={date} onChange={e => setDate(e.target.value)} dir="ltr" required/>
            </div>
            <div className="modal-field">
              <label className="modal-label">מיקום</label>
              <input className="modal-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="אולם 301"/>
            </div>
          </div>
          <div className="modal-field">
            <label className="modal-label">קורס (אופציונלי)</label>
            <select className="modal-input" value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">ללא קורס</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="submit" className="modal-btn-primary" disabled={!title.trim() || saving}>
              {saving ? 'שומר...' : 'הוסף מבחן'}
            </button>
            <button type="button" className="modal-btn-ghost" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
