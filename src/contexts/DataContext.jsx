import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

// ── Supabase row → React object mappers ──────────────────────────────────────
const toCourse = r => ({
  id: r.id, name: r.name, code: r.code,
  color: r.color, emoji: r.emoji, description: r.description,
});

const toTask = r => ({
  id: r.id, courseId: r.course_id, title: r.title,
  type: r.type, dueDate: r.due_date || '', priority: r.priority, completed: r.completed,
});

const toExam = r => ({
  id: r.id, courseId: r.course_id, title: r.title,
  date: r.exam_date, location: r.location || '',
});

// ── Provider ─────────────────────────────────────────────────────────────────
export function DataProvider({ children }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCourses([]); setTasks([]); setExams([]); setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const [c, t, e] = await Promise.all([
        supabase.from('courses').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('tasks')  .select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('exams')  .select('*').eq('user_id', user.id).order('exam_date'),
      ]);
      setCourses((c.data || []).map(toCourse));
      setTasks  ((t.data || []).map(toTask));
      setExams  ((e.data || []).map(toExam));
      setLoading(false);
    })();
  }, [user?.id]);

  // Real-time course progress — computed from tasks, never stale
  const courseStats = useMemo(() => {
    const m = {};
    tasks.forEach(t => {
      if (!t.courseId) return;
      if (!m[t.courseId]) m[t.courseId] = { total: 0, completed: 0 };
      m[t.courseId].total++;
      if (t.completed) m[t.courseId].completed++;
    });
    return m;
  }, [tasks]);

  // ── Courses ────────────────────────────────────────────────────────────────
  async function addCourse(data) {
    const { data: row } = await supabase.from('courses').insert({
      user_id: user.id, name: data.name, code: data.code || '',
      color: data.color, emoji: data.emoji, description: data.description || '',
    }).select().single();
    if (row) setCourses(p => [...p, toCourse(row)]);
  }

  async function updateCourse(id, patch) {
    const { data: row } = await supabase.from('courses').update({
      name: patch.name, code: patch.code, color: patch.color,
      emoji: patch.emoji, description: patch.description,
    }).eq('id', id).select().single();
    if (row) setCourses(p => p.map(c => c.id === id ? toCourse(row) : c));
  }

  async function removeCourse(id) {
    await supabase.from('courses').delete().eq('id', id);
    setCourses(p => p.filter(c => c.id !== id));
    setTasks (p => p.map(t => t.courseId === id ? { ...t, courseId: null } : t));
    setExams (p => p.map(e => e.courseId === id ? { ...e, courseId: null } : e));
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────
  async function addTask(data) {
    const { data: row } = await supabase.from('tasks').insert({
      user_id:   user.id,
      course_id: data.courseId || null,
      title:     data.title,
      type:      data.type,
      due_date:  data.dueDate  || null,
      priority:  data.priority,
      completed: false,
    }).select().single();
    if (row) setTasks(p => [...p, toTask(row)]);
  }

  async function updateTask(id, patch) {
    const db = {};
    if ('completed' in patch) db.completed  = patch.completed;
    if ('title'     in patch) db.title      = patch.title;
    if ('courseId'  in patch) db.course_id  = patch.courseId  || null;
    if ('dueDate'   in patch) db.due_date   = patch.dueDate   || null;
    if ('priority'  in patch) db.priority   = patch.priority;
    if ('type'      in patch) db.type       = patch.type;

    const { data: row } = await supabase.from('tasks').update(db).eq('id', id).select().single();
    if (row) setTasks(p => p.map(t => t.id === id ? toTask(row) : t));
  }

  async function removeTask(id) {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(p => p.filter(t => t.id !== id));
  }

  // ── Exams ──────────────────────────────────────────────────────────────────
  async function addExam(data) {
    const { data: row } = await supabase.from('exams').insert({
      user_id:   user.id,
      course_id: data.courseId || null,
      title:     data.title,
      exam_date: data.date,
      location:  data.location || '',
    }).select().single();
    if (row) setExams(p => [...p, toExam(row)]);
  }

  async function removeExam(id) {
    await supabase.from('exams').delete().eq('id', id);
    setExams(p => p.filter(e => e.id !== id));
  }

  return (
    <DataContext.Provider value={{
      courses, tasks, exams, courseStats, dataLoading: loading,
      addCourse, updateCourse, removeCourse,
      addTask, updateTask, removeTask,
      addExam, removeExam,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
