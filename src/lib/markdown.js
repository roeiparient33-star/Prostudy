// renderMarkdown — ממיר Markdown ל-HTML עם תמיכת LaTeX (KaTeX).
// מתמטיקה: $$...$$ לבלוק, $...$ לאינליין.
import katex from 'katex';
import 'katex/dist/katex.min.css';

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderKatex(math, display) {
  try {
    return katex.renderToString(math.trim(), { displayMode: display, throwOnError: false, output: 'html' });
  } catch {
    return `<code>${escapeHtml(math)}</code>`;
  }
}

// עיצוב inline בתוך שורה (אחרי escaping)
function inline(text) {
  return text
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

export function renderMarkdown(md) {
  if (!md) return '';

  // ── שלב 1: חלץ מתמטיקה לפני כל עיצוב אחר ──────────────────
  // מחליפים ב-placeholders כדי שלא ייפגעו מ-escaping או regex אחרים
  const mathMap = {};
  let mathIdx = 0;

  // בלוק math: $$...$$
  md = md.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const key = `\x00MATH${mathIdx++}\x00`;
    mathMap[key] = `<div class="math-block">${renderKatex(math, true)}</div>`;
    return key;
  });

  // אינליין math: $...$  (לא חוצה שורה)
  md = md.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    const key = `\x00MATH${mathIdx++}\x00`;
    mathMap[key] = `<span class="math-inline">${renderKatex(math, false)}</span>`;
    return key;
  });

  // ── שלב 2: עיבוד שורות Markdown ─────────────────────────────
  const lines = escapeHtml(md).split('\n');
  const out = [];
  let inCode = false;
  let listType = null;

  const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };

  for (const raw of lines) {
    // בלוק קוד
    if (raw.trim().startsWith('```')) {
      if (inCode) { out.push('</code></pre>'); inCode = false; }
      else { closeList(); out.push('<pre><code>'); inCode = true; }
      continue;
    }
    if (inCode) { out.push(raw + '\n'); continue; }

    // שורה ריקה
    if (!raw.trim()) { closeList(); continue; }

    // כותרות
    const h = raw.match(/^(#{1,4})\s+(.*)$/);
    if (h) { closeList(); const n = h[1].length; out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; }

    // קו מפריד
    if (/^(---|\*\*\*|___)\s*$/.test(raw)) { closeList(); out.push('<hr/>'); continue; }

    // ציטוט
    if (raw.startsWith('&gt; ')) { closeList(); out.push(`<blockquote>${inline(raw.slice(5))}</blockquote>`); continue; }

    // רשימה ממוספרת
    const ol = raw.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }

    // רשימת תבליטים
    const ul = raw.match(/^\s*[-*•]\s+(.*)$/);
    if (ul) {
      if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    // פסקה
    closeList();
    out.push(`<p>${inline(raw)}</p>`);
  }
  if (inCode) out.push('</code></pre>');
  closeList();

  // ── שלב 3: שחזר את ה-placeholders של המתמטיקה ───────────────
  let html = out.join('\n');
  for (const [key, rendered] of Object.entries(mathMap)) {
    html = html.replace(escapeHtml(key), rendered);
  }
  return html;
}
