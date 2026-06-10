// Tiny dependency-free confetti burst using the Web Animations API.
// Call burstConfetti(event) from a click handler — particles fly from the click point.

const COLORS = ['#FF6524', '#4F7EF7', '#28C96F', '#9B71F7', '#F5A623', '#F46FA8'];

export function burstConfetti(eventOrEl, count = 14) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let x, y;
  if (eventOrEl?.clientX != null) {
    x = eventOrEl.clientX; y = eventOrEl.clientY;
  } else {
    const rect = (eventOrEl?.getBoundingClientRect?.() ?? eventOrEl?.target?.getBoundingClientRect?.());
    if (!rect) return;
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(host);

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = 5 + Math.random() * 5;
    const isCircle = Math.random() > 0.5;
    p.style.cssText = `
      position:absolute; left:${x}px; top:${y}px;
      width:${size}px; height:${isCircle ? size : size * 0.45}px;
      background:${COLORS[i % COLORS.length]};
      border-radius:${isCircle ? '50%' : '2px'};
    `;
    host.appendChild(p);

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist  = 46 + Math.random() * 56;
    const dx    = Math.cos(angle) * dist;
    const dy    = Math.sin(angle) * dist - 30; // bias upward

    p.animate([
      { transform: 'translate(0,0) rotate(0deg) scale(1)',                                opacity: 1 },
      { transform: `translate(${dx}px,${dy + 70}px) rotate(${360 + Math.random() * 360}deg) scale(.4)`, opacity: 0 },
    ], {
      duration: 650 + Math.random() * 350,
      easing: 'cubic-bezier(.16,.8,.4,1)',
      fill: 'forwards',
    });
  }

  setTimeout(() => host.remove(), 1100);
}
