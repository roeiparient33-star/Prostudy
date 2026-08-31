// renderMarkdown — ממיר Markdown ל-HTML עם תמיכת LaTeX (KaTeX).
// משמש בעיקר לייצוא PDF. מתמטיקה: $$...$$ לבלוק, $...$ לאינליין.
// צביעת תחביר של קוד נעשית בצד ה-PDF (highlight.js מ-CDN) דרך class="language-X".
import katex from 'katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css'; // נדרש לתצוגת מתמטיקה inline בתשובות שאלה בצ'אט

// תוכן ה-AI הוא קלט לא-אמין (מסמך זדוני יכול להזריק דרכו HTML/SVG עם סקריפטים).
// כל SVG מסונן לפני הזרקה, וכל הפלט הסופי עובר DOMPurify ליתר ביטחון.
function sanitizeSvg(svg) {
  return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
}

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
    // קישורים: רק http/https (חוסם javascript: וכד' שמגיעים מתוכן ה-AI)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) =>
      /^https?:\/\//i.test(href.trim())
        ? `<a href="${href.trim()}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : label);
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
    mathMap[key] = `<div class="svg-figure">${sanitizeSvg(svg.trim())}</div>`;
    return key;
  });
  md = md.replace(/<svg[\s\S]*?<\/svg>/gi, (svg) => {
    const key = `\x00MATH${mathIdx++}\x00`;
    mathMap[key] = `<div class="svg-figure">${sanitizeSvg(svg)}</div>`;
    return key;
  });

  // Chart.js — גרפים של נתונים (פיזור/קו/עמודות/עוגה). Claude מוציא JSON תקין,
  // והספרייה בחלון ה-PDF מרנדרת גרף מקצועי בלי טעויות מיקום.
  md = md.replace(/```chart\s*([\s\S]+?)```/gi, (_, cfg) => {
    const key = `\x00MATH${mathIdx++}\x00`;
    const esc = cfg.trim()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    mathMap[key] = `<div class="chart-figure" data-chart="${esc}"><canvas></canvas></div>`;
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

  // Flow — רצף שלבים/החלטה. רכיב CSS בשליטתנו המלאה: תמיד מתרנדר, תומך עברית
  // ונוסחאות (placeholders של מתמטיקה כבר קיימים בשלב זה ומשוחזרים מיד).
  const buildFlow = (lines) => {
    const steps = lines
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        let s = inline(escapeHtml(l)).replace(/\x00MATH\d+\x00/g, m => mathMap[m] ?? m);
        return `<div class="flow-step">${s}</div>`;
      })
      .join('');
    return steps ? `<div class="flow">${steps}</div>` : '';
  };
  // בלוק flow מפורש — שורה = שלב
  md = md.replace(/```flow\s*([\s\S]+?)```/gi, (_, body) => {
    const key = `\x00MATH${mathIdx++}\x00`;
    mathMap[key] = buildFlow(body.split('\n'));
    return key;
  });
  // נפילה רכה ל-mermaid ישן (תשובות שמורות): חלץ תוויות והצג כשלבים, לא תיבה שחורה
  md = md.replace(/```mermaid\s*([\s\S]+?)```/gi, (_, code) => {
    const key = `\x00MATH${mathIdx++}\x00`;
    const labels = [];
    code.replace(/[[{("']\s*([^[\]{}()"'|]+?)\s*[\]})"']/g, (_, t) => {
      const c = t.replace(/\\n/g, ' ').trim();
      if (c && c.length > 1 && !labels.includes(c)) labels.push(c);
      return '';
    });
    mathMap[key] = buildFlow(labels);
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

  // ── שלב 4: סניטציה סופית — התוצר מוזרק ל-DOM (צ'אט + חלון PDF) ──
  // data-chart נדרש לרינדור Chart.js; target/rel לקישורים בלשונית חדשה.
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    ADD_ATTR: ['data-chart', 'target', 'rel'],
  });
}
