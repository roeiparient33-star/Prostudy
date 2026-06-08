import { useState, useMemo } from 'react';
import { Plus, X, CheckSquare, SearchX, Pencil } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { taskTypeColors, taskTypeLabels, priorityLabels } from '../data/mockData';
import ModalPortal from '../components/ModalPortal';

const TODAY = new Date().toISOString().split('T')[0];

const STATUS_FILTERS = [
  { id:'all',       label:'הכל'     },
  { id:'today',     label:'להיום'   },
  { id:'open',      label:'פתוחות'  },
  { id:'completed', label:'הושלמו'  },
];
const TYPE_FILTERS = [
  { id:'all',      label:'כל הסוגים'  },
  { id:'lecture',  label:'הרצאה'      },
  { id:'practice', label:'תרגול'      },
  { id:'homework', label:'שיעורי בית' },
  { id:'exam',     label:'מבחן'       },
  { id:'reading',  label:'קריאה'      },
];
const PRIORITY_COLORS = {
  high:   { bg:'var(--red-dim)',    text:'var(--red)',    border:'#FECACA' },
  medium: { bg:'var(--yellow-dim)', text:'var(--yellow)', border:'#FDE68A' },
  low:    { bg:'var(--green-dim)',  text:'var(--green)',  border:'#BBF7D0' },
};

export default function Tasks() {
  const { courses, tasks, addTask, updateTask, removeTask } = useData();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [showModal,    setShowModal]    = useState(false);
  const [editingTask,  setEditingTask]  = useState(null);

  const courseById = Object.fromEntries(courses.map(c => [c.id, c]));

  async function handleAdd(data) {
    await addTask(data);
    setShowModal(false);
  }

  async function handleEdit(data) {
    await updateTask(editingTask.id, data);
    setEditingTask(null);
  }

  function openEdit(task) {
    setEditingTask(task);
  }

  const filtered = useMemo(() => tasks.filter(t => {
    const statusOk =
      statusFilter === 'all'       ? true :
      statusFilter === 'today'     ? t.dueDate === TODAY :
      statusFilter === 'open'      ? !t.completed :
      statusFilter === 'completed' ? t.completed : true;
    return statusOk && (typeFilter === 'all' || t.type === typeFilter);
  }), [tasks, statusFilter, typeFilter]);

  return (
    <div className="page-enter">
      <div className="section-header" style={{ marginBottom: 6 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.4, color:'var(--text)' }}>המשימות שלי</h2>
          {tasks.filter(t => !t.completed).length > 0 && (
            <span style={{ fontSize:13, fontWeight:600, color:'var(--accent)', background:'var(--accent-dim)', padding:'2px 10px', borderRadius:20 }}>
              {tasks.filter(t => !t.completed).length} פתוחות
            </span>
          )}
        </div>
        <button className="page-add-btn" data-tour="tasks-add-btn" onClick={() => setShowModal(true)}>
          <Plus size={15}/> הוסף משימה
        </button>
      </div>
      <p style={{ fontSize:14, color:'var(--text-2)', marginBottom:20 }}>
        {tasks.filter(t => t.completed).length} מתוך {tasks.length} משימות הושלמו
      </p>

      {tasks.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'64px 32px' }}>
          <CheckSquare size={48} color="var(--text-3)" style={{ marginBottom:16 }}/>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--text-2)', marginBottom:8 }}>אין משימות עדיין</div>
          <div style={{ fontSize:14, color:'var(--text-3)', marginBottom:20 }}>הוסף משימות עם תאריכי יעד וסדרי עדיפויות</div>
          <button className="page-add-btn" onClick={() => setShowModal(true)}><Plus size={15}/> הוסף משימה ראשונה</button>
        </div>
      ) : (
        <>
          <div className="tasks-filters">
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <span className="filter-label">סטטוס</span>
              <div className="filters-group">
                {STATUS_FILTERS.map(f => (
                  <button key={f.id} className={`filter-btn${statusFilter===f.id?' active':''}`} onClick={() => setStatusFilter(f.id)}>{f.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <span className="filter-label">סוג</span>
              <div className="filters-group">
                {TYPE_FILTERS.map(f => (
                  <button key={f.id} className={`filter-btn${typeFilter===f.id?' active':''}`} onClick={() => setTypeFilter(f.id)}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="tasks-count-label">
            {filtered.length === 0 ? 'לא נמצאו משימות' : `מציג ${filtered.length} משימות`}
          </div>

          {filtered.length === 0 ? (
            <div className="tasks-empty">
              <SearchX size={36} color="var(--text-3)" style={{margin:'0 auto 12px', display:'block'}}/>
              <div className="tasks-empty-text">אין משימות התואמות לפילטר שנבחר</div>
            </div>
          ) : (
            <div className="tasks-list-full">
              {filtered.map(task => {
                const tc     = taskTypeColors[task.type] || taskTypeColors.homework;
                const pc     = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
                const course = courseById[task.courseId];
                const isToday = task.dueDate === TODAY;
                return (
                  <div key={task.id} className={`task-item${task.completed?' completed':''}`} style={{ borderRight:`3px solid ${task.completed?'var(--green)':course?.color??'var(--border)'}` }}>
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
                        <span className="task-badge" style={{ background:tc.bg, color:tc.text, borderColor:tc.border }}>{taskTypeLabels[task.type]}</span>
                        <span className="task-badge" style={{ background:pc.bg, color:pc.text, borderColor:pc.border }}>{priorityLabels[task.priority]}</span>
                        {course && (
                          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <span className="task-course-dot" style={{ background:course.color }}/>
                            <span className="task-date">{course.name}</span>
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="task-date">
                            {isToday ? '📌 להיום' : new Date(task.dueDate).toLocaleDateString('he-IL', {day:'numeric', month:'long'})}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:2, flexShrink:0 }}>
                      <button
                        className="task-action-btn"
                        onClick={() => openEdit(task)}
                        title="ערוך משימה"
                        aria-label="ערוך משימה"
                      >
                        <Pencil size={13}/>
                      </button>
                      <button
                        className="task-action-btn task-action-btn-delete"
                        onClick={() => removeTask(task.id)}
                        title="מחק"
                        aria-label="מחק משימה"
                      >
                        <X size={14}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <TaskModal courses={courses} onSave={handleAdd} onClose={() => setShowModal(false)}/>
      )}
      {editingTask && (
        <TaskModal courses={courses} task={editingTask} onSave={handleEdit} onClose={() => setEditingTask(null)}/>
      )}
    </div>
  );
}

function TaskModal({ courses, task, onSave, onClose }) {
  const isEdit = !!task;
  const [title,    setTitle]    = useState(task?.title    ?? '');
  const [courseId, setCourseId] = useState(task?.courseId ? String(task.courseId) : '');
  const [type,     setType]     = useState(task?.type     ?? 'homework');
  const [dueDate,  setDueDate]  = useState(task?.dueDate  ?? TODAY);
  const [priority, setPriority] = useState(task?.priority ?? 'medium');
  const [saving,   setSaving]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title:     title.trim(),
      courseId:  courseId || null,
      type,
      dueDate,
      priority,
      ...(isEdit ? {} : { completed: false }),
    });
    setSaving(false);
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <span className="modal-head-title">{isEdit ? 'עריכת משימה' : 'הוספת משימה'}</span>
          <button className="modal-close-btn" onClick={onClose} aria-label="סגור"><X size={17}/></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">כותרת *</label>
            <input
              className="modal-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="לדוגמה: תרגיל 5 – מיון ועצים"
              required
              autoFocus
            />
          </div>
          <div className="modal-row-2">
            <div className="modal-field">
              <label className="modal-label">סוג</label>
              <select className="modal-input" value={type} onChange={e => setType(e.target.value)}>
                <option value="homework">שיעורי בית</option>
                <option value="lecture">הרצאה</option>
                <option value="practice">תרגול</option>
                <option value="exam">מבחן</option>
                <option value="reading">קריאה</option>
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label">עדיפות</label>
              <select className="modal-input" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="high">גבוהה</option>
                <option value="medium">בינונית</option>
                <option value="low">נמוכה</option>
              </select>
            </div>
          </div>
          <div className="modal-row-2">
            <div className="modal-field">
              <label className="modal-label">
                {type === 'homework' ? 'תאריך הגשה' :
                 type === 'exam'     ? 'תאריך מבחן' :
                 type === 'lecture'  ? 'תאריך שיעור' :
                 type === 'practice' ? 'תאריך תרגול' :
                                       'תאריך קריאה'}
              </label>
              <input className="modal-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} dir="ltr"/>
            </div>
            <div className="modal-field">
              <label className="modal-label">קורס (אופציונלי)</label>
              <select className="modal-input" value={courseId} onChange={e => setCourseId(e.target.value)}>
                <option value="">ללא קורס</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="modal-btn-primary" disabled={!title.trim() || saving}>
              {saving ? 'שומר...' : isEdit ? 'שמור שינויים' : 'הוסף משימה'}
            </button>
            <button type="button" className="modal-btn-ghost" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
