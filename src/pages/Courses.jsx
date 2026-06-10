import { useState } from 'react';
import { Plus, X, BookOpen, Pencil } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import { useData } from '../contexts/DataContext';
import { COURSE_COLORS, COURSE_EMOJIS } from '../data/localStore';
import { taskTypeColors, taskTypeLabels } from '../data/mockData';
import ModalPortal from '../components/ModalPortal';
import { TaskModal } from './Tasks';
import { burstConfetti } from '../lib/confetti';

export default function Courses() {
  const { courses, tasks, courseStats, addCourse, updateCourse, removeCourse, updateTask, addTask } = useData();
  const [selectedId,    setSelectedId]   = useState(null);
  const [showModal,     setShowModal]    = useState(false);
  const [editingCourse, setEditing]      = useState(null);
  const [addingTaskFor, setAddingTaskFor] = useState(null); // courseId

  const selectedCourse = courses.find(c => c.id === selectedId) ?? null;

  async function handleAdd(data) {
    await addCourse(data);
    setShowModal(false);
  }

  async function handleEdit(data) {
    await updateCourse(data.id, data);
    setEditing(null);
  }

  async function handleDelete(id) {
    await removeCourse(id);
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="page-enter">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.4, color:'var(--text)' }}>
            הקורסים שלי
          </h2>
          <p style={{ fontSize:14, color:'var(--text-2)', marginTop:4 }}>
            {courses.length > 0 ? `${courses.length} קורסים פעילים בסמסטר` : 'הוסף את הקורסים שלך לסמסטר'}
          </p>
        </div>
        <button className="page-add-btn" data-tour="courses-add-btn" onClick={() => setShowModal(true)}>
          <Plus size={15}/> הוסף קורס
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'64px 32px' }}>
          <BookOpen size={48} color="var(--text-3)" style={{ marginBottom:16 }}/>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>אין קורסים עדיין</div>
          <div style={{ fontSize:14, color:'var(--text-3)', marginBottom:20 }}>הוסף את הקורסים שלך לסמסטר כדי לעקוב אחר ההתקדמות</div>
          <button className="page-add-btn" onClick={() => setShowModal(true)}><Plus size={15}/> הוסף קורס ראשון</button>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => {
            const s         = courseStats[course.id] || { total: 0, completed: 0 };
            const pct       = s.total ? Math.round((s.completed / s.total) * 100) : 0;
            const remaining = s.total - s.completed;
            return (
              <div
                className="course-card"
                key={course.id}
                onClick={() => setSelectedId(selectedId === course.id ? null : course.id)}
              >
                <div className="course-card-accent" style={{ background: course.color }}/>
                <div style={{ position:'absolute',top:10,left:8,display:'flex',gap:4,zIndex:2 }}>
                  <button
                    style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',padding:4,borderRadius:6,transition:'all .15s' }}
                    onClick={e => { e.stopPropagation(); setEditing(course); }}
                    title="ערוך קורס"
                  >
                    <Pencil size={13}/>
                  </button>
                  <button
                    style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',padding:4,borderRadius:6,transition:'all .15s' }}
                    onClick={e => { e.stopPropagation(); handleDelete(course.id); }}
                    title="מחק קורס"
                  >
                    <X size={13}/>
                  </button>
                </div>
                <div className="course-card-header">
                  <div className="course-icon-wrap" style={{ background:`${course.color}18` }}>
                    <span style={{ fontSize:24 }}>{course.emoji}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="course-card-title">{course.name}</div>
                    <div className="course-card-code">{course.code}</div>
                  </div>
                </div>
                {course.description && <div className="course-card-description">{course.description}</div>}
                <ProgressBar value={pct} color={course.color} label="התקדמות"/>
                <div className="course-card-stats">
                  <div className="course-stat">
                    <span className="course-stat-value" style={{ color:course.color }}>{pct}%</span>
                    <span className="course-stat-label">הושלם</span>
                  </div>
                  <div style={{ width:1,height:32,background:'var(--border-light)' }}/>
                  <div className="course-stat">
                    <span className="course-stat-value">{s.completed}</span>
                    <span className="course-stat-label">הושלמו</span>
                  </div>
                  <div style={{ width:1,height:32,background:'var(--border-light)' }}/>
                  <div className="course-stat">
                    <span className="course-stat-value" style={{ color:remaining > 0 ? 'var(--accent)' : 'var(--green)' }}>{remaining}</span>
                    <span className="course-stat-label">נותרו</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCourse && (
        <div className="course-tasks-panel">
          <div className="course-tasks-header">
            <div style={{ width:42,height:42,borderRadius:12,background:`${selectedCourse.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>
              {selectedCourse.emoji}
            </div>
            <div>
              <div className="course-tasks-title">משימות — {selectedCourse.name}</div>
              <div style={{ fontSize:13,color:'var(--text-3)',marginTop:2 }}>
                {(courseStats[selectedCourse.id]?.completed || 0)} מתוך {(courseStats[selectedCourse.id]?.total || 0)} הושלמו
              </div>
            </div>
            <button
              className="page-add-btn"
              style={{ marginRight:'auto', padding:'6px 12px', fontSize:12 }}
              onClick={() => setAddingTaskFor(selectedCourse.id)}
            >
              <Plus size={13}/> הוסף משימה
            </button>
            <button style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',padding:4 }} onClick={() => setSelectedId(null)}>
              <X size={18}/>
            </button>
          </div>
          <div className="course-tasks-list">
            {tasks.filter(t => t.courseId === selectedCourse.id).length === 0 ? (
              <div style={{ textAlign:'center',padding:'24px 0',color:'var(--text-3)' }}>
                אין משימות לקורס זה — הוסף משימות בדף המשימות
              </div>
            ) : (
              tasks.filter(t => t.courseId === selectedCourse.id).map(task => {
                const tc = taskTypeColors[task.type] || taskTypeColors.homework;
                return (
                  <div key={task.id} className={`task-item${task.completed?' completed':''}`} style={{ borderRight:`3px solid ${task.completed?'var(--green)':selectedCourse.color}` }}>
                    <div
                      className={`task-check${task.completed?' checked':''}`}
                      onClick={e => {
                        if (!task.completed) burstConfetti(e);
                        updateTask(task.id, { completed: !task.completed });
                      }}
                      style={{cursor:'pointer'}}
                    >
                      {task.completed && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div className="task-body">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta">
                        <span className="task-badge" style={{ background:tc.bg,color:tc.text,borderColor:tc.border }}>{taskTypeLabels[task.type]}</span>
                        {task.dueDate && <span className="task-date">{new Date(task.dueDate).toLocaleDateString('he-IL',{day:'numeric',month:'long'})}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {showModal     && <CourseModal onSave={handleAdd}                          onClose={() => setShowModal(false)}/>}
      {editingCourse && <CourseModal course={editingCourse} onSave={handleEdit}  onClose={() => setEditing(null)}/>}
      {addingTaskFor && (
        <TaskModal
          courses={courses}
          defaultCourseId={addingTaskFor}
          onSave={async (data) => { await addTask(data); setAddingTaskFor(null); }}
          onClose={() => setAddingTaskFor(null)}
        />
      )}
    </div>
  );
}

function CourseModal({ course, onSave, onClose }) {
  const isEdit = !!course;
  const [name,    setName]    = useState(course?.name        || '');
  const [code,    setCode]    = useState(course?.code        || '');
  const [emoji,   setEmoji]   = useState(course?.emoji       || '📚');
  const [color,   setColor]   = useState(course?.color       || COURSE_COLORS[0]);
  const [desc,    setDesc]    = useState(course?.description || '');
  const [saving,  setSaving]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ ...(course || {}), name: name.trim(), code: code.trim(), emoji, color, description: desc.trim() });
    setSaving(false);
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <span className="modal-head-title">{isEdit ? 'עריכת קורס' : 'הוספת קורס חדש'}</span>
          <button className="modal-close-btn" onClick={onClose}><X size={17}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">שם הקורס *</label>
            <input className="modal-input" value={name} onChange={e => setName(e.target.value)} placeholder="לדוגמה: אלגוריתמים" required autoFocus/>
          </div>
          <div className="modal-field">
            <label className="modal-label">קוד קורס</label>
            <input className="modal-input" value={code} onChange={e => setCode(e.target.value)} placeholder="לדוגמה: 83-234" dir="ltr"/>
          </div>
          <div className="modal-field">
            <label className="modal-label">אמוג'י</label>
            <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginTop:2 }}>
              {COURSE_EMOJIS.map(em => (
                <button key={em} type="button" onClick={() => setEmoji(em)}
                  style={{ width:36,height:36,borderRadius:8,border:`2px solid ${emoji===em?'var(--accent)':'var(--border)'}`,background:emoji===em?'var(--accent-dim)':'var(--bg-main)',fontSize:18,cursor:'pointer',transition:'all .12s' }}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-field">
            <label className="modal-label">צבע</label>
            <div style={{ display:'flex',gap:8,marginTop:4 }}>
              {COURSE_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ width:26,height:26,borderRadius:'50%',background:c,border:'none',outline:color===c?`3px solid ${c}`:'2px solid transparent',outlineOffset:2,cursor:'pointer',transform:color===c?'scale(1.2)':'scale(1)',transition:'transform .12s' }}/>
              ))}
            </div>
          </div>
          <div className="modal-field">
            <label className="modal-label">תיאור (אופציונלי)</label>
            <input className="modal-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="תיאור קצר של הקורס"/>
          </div>
          <div className="modal-actions">
            <button type="submit" className="modal-btn-primary" disabled={!name.trim() || saving}>
              {saving ? 'שומר...' : (isEdit ? 'שמור שינויים' : 'הוסף קורס')}
            </button>
            <button type="button" className="modal-btn-ghost" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
