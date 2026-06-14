// renderMarkdown — ממיר Markdown ל-HTML עם תמיכת LaTeX (KaTeX).
// משמש בעיקר לייצוא PDF. מתמטיקה: $$...$$ לבלוק, $...$ לאינליין.
// צביעת תחביר של קוד נעשית בצד ה-PDF (highlight.js מ-CDN) דרך class="language-X".
import katex from 'katex';

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

// שורת מפריד של טבלת Markdown: |---|---|
function isTableSep(s) {
  return /^[\s|:-]+$/.test(s) && s.includes('-') && s.includes('|');
}
function parseRow(s) {
  return s.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
}

export function renderMarkdown(md) {
  if (!md) return '';

  // ── שלב 1: חלץ מתמטיקה לפני כל עיצוב אחר ──────────────────
  const mathMap = {};
  let mathIdx = 0;

  // SVG גולמי — חלץ לפני escaping כדי שהתגיות יישמרו (גרפים, צורות, צירים)
  md = md.replace(/```svg\s*([\s\S]+?)```/gi, (_, svg) => {
    const key = `\x00MATH${mathIdx++}\x00`;
    mathMap[key] = `<div class="svg-figure">${svg.trim()}</div>`;
    return key;
  });
  md = md.replace(/<svg[\s\S]*?<\/svg>/gi, (svg) => {
    const key = `\x00MATH${mathIdx++}\x00`;
    mathMap[key] = `<div class="svg-figure">${svg}</div>`;
    return key;
  });

  // Mermaid — תרשימי זרימה/עצים; mermaid.js בחלון ה-PDF מרנדר את התוכן
  md = md.replace(/```mermaid\s*([\s\S]+?)```/gi, (_, code) => {
    const key = `\x00MATH${mathIdx++}\x00`;
    mathMap[key] = `<pre class="mermaid">${escapeHtml(code.trim())}</pre>`;
    return key;
  });

  md = md.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const key = `\x00MATH${mathIdx++}\x00`;
    mathMap[key] = `<div class="math-block">${renderKatex(math, true)}</div>`;
    return key;
  });
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

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // בלוק קוד — לוכד את שם השפה לצביעת תחביר
    if (raw.trim().startsWith('```')) {
      if (inCode) { out.push('</code></pre>'); inCode = false; }
      else {
        closeList();
        const lang = raw.trim().slice(3).trim().toLowerCase().replace(/[^a-z0-9#+]/g, '');
        out.push(`<pre><code${lang ? ` class="language-${lang}"` : ''}>`);
        inCode = true;
      }
      continue;
    }
    if (inCode) { out.push(raw + '\n'); continue; }

    // טבלה — שורה עם | ואחריה שורת מפריד
    if (raw.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      closeList();
      const headers = parseRow(raw);
      i += 2; // דלג על כותרת + מפריד
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(parseRow(lines[i])); i++;
      }
      i--; // תיקון בגלל ה-increment של הלולאה
      let t = '<table><thead><tr>';
      headers.forEach(h => { t += `<th>${inline(h)}</th>`; });
      t += '</tr></thead><tbody>';
      rows.forEach(r => {
        t += '<tr>';
        r.forEach(c => { t += `<td>${inline(c)}</td>`; });
        t += '</tr>';
      });
      t += '</tbody></table>';
      out.push(t);
      continue;
    }

    // שורה ריקה
    if (!raw.trim()) { closeList(); continue; }

    // כותרות
    const h = raw.match(/^(#{1,4})\s+(.*)$/);
    if (h) { closeList(); const n = h[1].length; out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; }

    // קו מפריד
    if (/^(---|\*\*\*|___)\s*$/.test(raw)) { closeList(); out.push('<hr/>'); continue; }

    // ציטוט / תיבת מידע
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
