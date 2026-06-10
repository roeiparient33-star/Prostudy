// Tiny global toast bus — call showToast() from anywhere (hooks, contexts, components).
// ToastHost (mounted once in App) listens and renders.

const listeners = new Set();

export function showToast(toast) {
  listeners.forEach(fn => fn({ id: crypto.randomUUID(), ...toast }));
}

export function onToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
