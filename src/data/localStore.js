// Shared localStorage store for courses, tasks, exams
// All pages read/write through these helpers for consistency

let _uid = '';
export function setActiveUser(uid) { _uid = uid || ''; }

function keys() {
  const suf = _uid ? `_${_uid}` : '';
  return {
    courses: `ps_courses_v1${suf}`,
    tasks:   `ps_tasks_v1${suf}`,
    exams:   `ps_exams_v1${suf}`,
  };
}

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const courseStore = {
  get: () => load(keys().courses),
  set: (data) => save(keys().courses, data),
  add: (item) => {
    const k = keys().courses;
    const list = [...load(k), { ...item, id: Date.now() }];
    save(k, list);
    return list;
  },
  update: (id, patch) => {
    const k = keys().courses;
    const list = load(k).map(c => c.id === id ? { ...c, ...patch } : c);
    save(k, list);
    return list;
  },
  remove: (id) => {
    const k = keys().courses;
    const list = load(k).filter(c => c.id !== id);
    save(k, list);
    return list;
  },
};

export const taskStore = {
  get: () => load(keys().tasks),
  set: (data) => save(keys().tasks, data),
  add: (item) => {
    const k = keys().tasks;
    const list = [...load(k), { ...item, id: Date.now() }];
    save(k, list);
    return list;
  },
  update: (id, patchOrFn) => {
    const k = keys().tasks;
    const list = load(k).map(t => {
      if (t.id !== id) return t;
      const patch = typeof patchOrFn === 'function' ? patchOrFn(t) : patchOrFn;
      return { ...t, ...patch };
    });
    save(k, list);
    return list;
  },
  remove: (id) => {
    const k = keys().tasks;
    const list = load(k).filter(t => t.id !== id);
    save(k, list);
    return list;
  },
};

export const examStore = {
  get: () => load(keys().exams),
  add: (item) => {
    const k = keys().exams;
    const list = [...load(k), { ...item, id: Date.now() }];
    save(k, list);
    return list;
  },
  remove: (id) => {
    const k = keys().exams;
    const list = load(k).filter(e => e.id !== id);
    save(k, list);
    return list;
  },
};

export const COURSE_COLORS = [
  '#4F7EF7','#9B71F7','#28C96F','#F14040','#FF6524','#F5A623','#4A90D9','#E87CA0',
];
export const COURSE_EMOJIS = [
  '📚','⚡','🎲','🖥️','📐','🔬','🧮','🎨','🏛️','🌍','💻','🎵',
];
