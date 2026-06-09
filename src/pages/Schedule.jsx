import { useState, useCallback } from 'react';
import { Plus, X, Clock, CalendarDays } from 'lucide-react';
import ModalPortal from '../components/ModalPortal';
import { useData } from '../contexts/DataContext';

const DAYS   = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const HOURS  = [8,9,10,11,12,13,14,15,16,17,18,19,20];
const CELL_H = 64; // px per hour
const TOTAL_H = HOURS.length * CELL_H;

const TYPE_LABELS = { lecture: 'הרצאה', practice: 'תרגול', exercise: 'תרגיל בית' };
const TYPE_COLORS = { lecture: '#4F7EF7', practice: '#9B71F7', exercise: '#28C96F' };

const LS_KEY = 'ps_schedule_v1';

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
}
function saveEvents(evs) {
  localStorage.setItem(LS_KEY, JSON.stringify(evs));
}
function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}
function pad2(n) { return String(n).padStart(2, '0'); }
function minToTime(m) { return `${pad2(Math.floor(m/60))}:${pad2(m%60)}`; }

let nextId = Date.now();

export default function Schedule() {
  const [events, setEvents] = useState(loadEvents);
  const [modal,  setModal]  = useState(null);
  const { courses } = useData(); // { day, hour } or { editing: event }

  const addEvent = useCallback((ev) => {
    const updated = [...events, { ...ev, id: ++nextId }];
    setEvents(updated);
    saveEvents(updated);
    setModal(null);
  }, [events]);

  const deleteEvent = useCallback((id) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveEvents(updated);
  }, [events]);

  return (
    <div className="page-enter">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: 'var(--text)' }}>
            מערכת שעות
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
            לחץ על כל תא כדי להוסיף שיעור
          </p>
        </div>
        <button className="schedule-add-btn" onClick={() => setModal({ day: 0, hour: 9 })}>
          <Plus size={15}/> הוסף שיעור
        </button>
      </div>

      <div className="card schedule-card">
        <div className="sch-wrap">
          {/* Header row */}
          <div className="sch-header-row">
            <div className="sch-corner"><Clock size={13}/></div>
            {DAYS.map(d => <div key={d} className="sch-day-hd">{d}</div>)}
          </div>

          {/* Body */}
          <div className="sch-body">
            {/* Hour labels */}
            <div className="sch-hours-col">
              {HOURS.map(h => (
                <div key={h} className="sch-time" style={{ height: CELL_H }}>{pad2(h)}:00</div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((_, di) => (
              <div key={di} className="sch-col" style={{ height: TOTAL_H, position: 'relative' }}>
                {/* Clickable hour zones */}
                {HOURS.map((h, hi) => (
                  <div
                    key={h}
                    className="sch-zone"
                    style={{ top: hi * CELL_H, height: CELL_H }}
                    onClick={() => setModal({ day: di, hour: h })}
                  />
                ))}

                {/* Hour grid lines */}
                {HOURS.map((_, hi) => (
                  <div key={hi} className="sch-gridline" style={{ top: hi * CELL_H }}/>
                ))}

                {/* Events */}
                {events.filter(e => e.day === di).map(e => {
                  const sMin   = timeToMin(e.startTime);
                  const eMin   = timeToMin(e.endTime);
                  const top    = (sMin - HOURS[0] * 60) / 60 * CELL_H;
                  const height = Math.max(24, (eMin - sMin) / 60 * CELL_H - 4);
                  const color  = e.color || TYPE_COLORS[e.type] || '#4F7EF7';
                  return (
                    <div
                      key={e.id}
                      className="sch-event"
                      style={{ top: top + 2, height, background: `${color}22`, border: `1.5px solid ${color}55` }}
                    >
                      <button
                        className="sch-event-del"
                        onClick={ev => { ev.stopPropagation(); deleteEvent(e.id); }}
                      >
                        <X size={10}/>
                      </button>
                      <div className="sch-event-title" style={{ color }}>{e.title}</div>
                      <div className="sch-event-sub" style={{ color }}>
                        {e.startTime}–{e.endTime}
                        {e.room ? ` · ${e.room}` : ''}
                        {e.type ? ` · ${TYPE_LABELS[e.type]}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {events.length === 0 && (
          <div className="schedule-empty">
            <CalendarDays size={34} color="var(--text-3)" style={{display:'block',margin:'0 auto 12px'}}/>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              המערכת ריקה
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>לחץ על תא בטבלה או על "הוסף שיעור"</div>
          </div>
        )}
      </div>

      {modal && (
        <AddEventModal
          defaultDay={modal.day}
          defaultHour={modal.hour}
          courses={courses}
          onAdd={addEvent}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MIN_OPTIONS  = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function TimePicker({ value, onChange }) {
  const [hStr, mStr] = value.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const nearestMin = MIN_OPTIONS.reduce((prev, cur) =>
    Math.abs(cur - m) < Math.abs(prev - m) ? cur : prev
  );
  const labelStyle = { fontSize:10, color:'var(--text-3)', fontWeight:600, textAlign:'center', marginBottom:2 };
  return (
    <div style={{ display:'flex', gap:6, alignItems:'flex-end', direction:'ltr' }}>
      <div style={{ display:'flex', flexDirection:'column' }}>
        <span style={labelStyle}>שעה</span>
        <select
          className="modal-input"
          style={{ width:68, paddingInline:6, textAlign:'center' }}
          value={h}
          onChange={e => onChange(`${pad2(Number(e.target.value))}:${pad2(nearestMin)}`)}
        >
          {HOUR_OPTIONS.map(hr => <option key={hr} value={hr}>{pad2(hr)}</option>)}
        </select>
      </div>
      <span style={{ fontWeight:800, color:'var(--text-2)', paddingBottom:8, fontSize:18 }}>:</span>
      <div style={{ display:'flex', flexDirection:'column' }}>
        <span style={labelStyle}>דקות</span>
        <select
          className="modal-input"
          style={{ width:68, paddingInline:6, textAlign:'center' }}
          value={nearestMin}
          onChange={e => onChange(`${pad2(h)}:${pad2(Number(e.target.value))}`)}
        >
          {MIN_OPTIONS.map(mn => <option key={mn} value={mn}>{pad2(mn)}</option>)}
        </select>
      </div>
    </div>
  );
}

function AddEventModal({ defaultDay, defaultHour, courses, onAdd, onClose }) {
  const [title,     setTitle]     = useState('');
  const [day,       setDay]       = useState(defaultDay);
  const [startTime, setStartTime] = useState(`${pad2(defaultHour)}:00`);
  const [endTime,   setEndTime]   = useState(`${pad2(defaultHour + 1)}:00`);
  const [type,      setType]      = useState('lecture');
  const [room,      setRoom]      = useState('');
  const [color,     setColor]     = useState('#4F7EF7');

  const COLORS = ['#4F7EF7','#9B71F7','#28C96F','#F14040','#FF6524','#F5A623','#14B8A6','#EC4899','#1A1110'];

  function pickCourse(course) {
    setTitle(course.name);
    setColor(course.color);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    if (timeToMin(startTime) >= timeToMin(endTime)) return;
    onAdd({ title: title.trim(), day, startTime, endTime, type, room: room.trim(), color });
  }

  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <span className="modal-head-title">הוספת שיעור</span>
          <button className="modal-close-btn" onClick={onClose}><X size={17}/></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {courses.length > 0 && (
            <div className="modal-field">
              <label className="modal-label">בחר מקורס קיים (אופציונלי)</label>
              <div className="sch-course-chips">
                {courses.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="sch-course-chip"
                    style={{ borderColor: title === c.name ? c.color : 'transparent', background: title === c.name ? `${c.color}18` : 'var(--bg-2)' }}
                    onClick={() => pickCourse(c)}
                  >
                    <span style={{ width:8, height:8, borderRadius:'50%', background:c.color, flexShrink:0 }}/>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-field">
            <label className="modal-label">שם השיעור *</label>
            <input className="modal-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="לדוגמה: אלגוריתמים" required autoFocus/>
          </div>

          <div className="modal-field">
            <label className="modal-label">יום</label>
            <div className="modal-chips">
              {DAYS.map((d, i) => (
                <button key={i} type="button" className={`modal-chip${day===i?' active':''}`} onClick={() => setDay(i)}>{d}</button>
              ))}
            </div>
          </div>

          <div className="modal-row-2">
            <div className="modal-field">
              <label className="modal-label">התחלה</label>
              <TimePicker value={startTime} onChange={setStartTime}/>
            </div>
            <div className="modal-field">
              <label className="modal-label">סיום</label>
              <TimePicker value={endTime} onChange={setEndTime}/>
            </div>
          </div>

          <div className="modal-row-2">
            <div className="modal-field">
              <label className="modal-label">סוג</label>
              <select className="modal-input" value={type} onChange={e => setType(e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label">חדר (אופציונלי)</label>
              <input className="modal-input" value={room} onChange={e => setRoom(e.target.value)} placeholder="לדוגמה: 301"/>
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">צבע</label>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              {COLORS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width:26, height:26, borderRadius:'50%', background:c, border:'none',
                    outline: color===c ? `3px solid ${c}` : '2px solid transparent',
                    outlineOffset: 2, cursor:'pointer',
                    transform: color===c ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform .12s',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="modal-btn-primary" disabled={!title.trim()}>הוסף שיעור</button>
            <button type="button" className="modal-btn-ghost" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
