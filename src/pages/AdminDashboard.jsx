import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, UserPlus, Activity, Gem, RefreshCw, CheckSquare, BookOpen,
  GraduationCap, Share2, Flag, Sparkles, AlertTriangle, CalendarCheck,
  Target, Rocket, TrendingUp, Database, ChevronDown, Clock, Coins, Trophy,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../lib/admin';

/* ────────────────────────────────────────────────────────────────
   התוכנית העסקית — מקור אמת: BUSINESS_PLAN.md בשורש הפרויקט.
   כאן גרסה אינטראקטיבית: צ'קבוקסים שנשמרים ב-DB (profiles.biz_progress).
──────────────────────────────────────────────────────────────── */
const PLAN = [
  {
    id: 'p0', num: 0, title: 'ולידציה', emoji: '🏁',
    goalLabel: '50 פעילים שבועיים', target: 50,
    metric: s => s?.wau_studied ?? 0,
    metricLabel: 'פעילים השבוע',
    cost: 'עלות: ₪0',
    items: [
      { id: 'p0-1', t: 'גייס 20-30 משתמשים ראשונים ביד — חברים מהתואר, קבוצות וואטסאפ של המחזור' },
      { id: 'p0-2', t: '10 ראיונות משתמשים. השאלה הקריטית: "אם ProStudy ייעלם מחר, מה תרגיש?"' },
      { id: 'p0-3', t: 'הרץ את admin_dashboard.sql בסופאבייס כדי שהחמ"ל הזה יראה נתונים' },
      { id: 'p0-4', t: 'תקן את 3 החסמים הגדולים שעלו מהראיונות — לפני כל שיווק' },
      { id: 'p0-5', t: 'ודא Onboarding חלק: משתמש חדש מגיע ל"רגע הקסם" תוך 3 דקות' },
    ],
  },
  {
    id: 'p1', num: 1, title: 'צמיחה אורגנית', emoji: '🌱',
    goalLabel: '500 נרשמים', target: 500,
    metric: s => s?.total_users ?? 0,
    metricLabel: 'נרשמים',
    cost: 'עלות: ₪0-500/חודש',
    items: [
      { id: 'p1-1', t: 'פתח חשבון TikTok + Instagram בשם ProStudy' },
      { id: 'p1-2', t: 'בקש מקלוד 20 תסריטי וידאו מוכנים לצילום (🤖)' },
      { id: 'p1-3', t: 'העלה 3-4 סרטונים בשבוע: POV בעיה→פתרון · Study With Me · לפני/אחרי · האווטר שלי' },
      { id: 'p1-4', t: 'מפה 30+ קבוצות וואטסאפ רלוונטיות — תרום ערך, אל תספאם' },
      { id: 'p1-5', t: 'חזק את לולאת ההפניות: תגמול דו-צדדי + כפתור "הזמן לצוות בוואטסאפ" (🤖)' },
      { id: 'p1-6', t: 'OG image + meta tags — שהלינק ייראה מושלם בשיתוף וואטסאפ (🤖)' },
      { id: 'p1-7', t: 'רישום ל-Google Search Console + 3 עמודי תוכן SEO (🤖)' },
    ],
  },
  {
    id: 'p2', num: 2, title: 'מונטיזציה ראשונה', emoji: '💎',
    goalLabel: '30 מנויים משלמים', target: 30,
    metric: s => s?.paying_subscribers ?? 0,
    metricLabel: 'מנויים',
    cost: 'עלות: ~₪500-900/חודש · איזון: ~40 מנויים',
    items: [
      { id: 'p2-1', t: 'פתח רשימת המתנה לפרימיום: "הירשם + 20% הנחת השקה" — יעד 50 מתעניינים (🤖)' },
      { id: 'p2-2', t: 'פתח חשבון Paddle או LemonSqueezy (תומכים בעסק ישראלי)' },
      { id: 'p2-3', t: 'ממש Premium לפי PREMIUM_AI_PLAN.md — AI + העלאת קבצים (🤖)' },
      { id: 'p2-4', t: 'מחיר השקה ₪19.90/חודש "מחיר מייסדים — ננעל לתמיד" · שנתי ₪149' },
      { id: 'p2-5', t: 'טעימות חינם: 3 שאלות AI בחודש לכל משתמש חינמי' },
      { id: 'p2-6', t: 'חבילות טוקנים: ₪9.90/₪19.90/₪34.90 — קיצור דרך, לא חומת תשלום (🤖)' },
    ],
  },
  {
    id: 'p3', num: 3, title: 'סקייל + B2B', emoji: '🚀',
    goalLabel: '₪10,000 הכנסה חודשית', target: 10000,
    metric: () => null, // ידני — אין עדיין נתוני הכנסות ב-DB
    metricLabel: '₪/חודש',
    cost: 'עלות: ~₪2,500-4,000/חודש',
    items: [
      { id: 'p3-1', t: 'פרסום ממומן ₪1,000/חודש — רק Spark Ads על סרטונים שהוכיחו את עצמם' },
      { id: 'p3-2', t: 'מדוד: עלות לנרשם < ₪8 · עלות למנוי < ₪80. ROI חיובי → הכפל תקציב' },
      { id: 'p3-3', t: 'בנה מצגת פיץ\' "ProStudy Campus" לאגודות סטודנטים (🤖)' },
      { id: 'p3-4', t: 'פנה ל-10 אגודות הסטודנטים הגדולות + מכינות פסיכומטרי' },
      { id: 'p3-5', t: 'סגור עסקת B2B ראשונה — הכנסה + חותמת אמינות' },
      { id: 'p3-6', t: 'שותפויות מותגים לסטודנטים — רק הטבות עם ערך אמיתי' },
    ],
  },
];

const MISTAKES = [
  'לשלם על פרסום לפני שיש שימור — שורפים כסף על דלי מחורר',
  'להפוך את החינמי לגרוע כדי לדחוף לפרימיום — החינמי המעולה הוא מנוע השיווק (Duolingo)',
  'לבנות פיצ\'רים במקום לדבר עם משתמשים — שיחה בשבוע שווה יותר מפיצ\'ר',
  'למכור טוקנים שהורסים את המשחק — קיצור דרך כן, חומה לא',
  'לפזר מאמץ על 5 ערוצים — TikTok עד שעובד, רק אז הבא',
  'לוותר אחרי חודשיים — צמיחה אורגנית מתעקלת רק אחרי 3-4 חודשים',
];

const WEEKLY = [
  ['ראשון', 'צילום + העלאת 2 סרטוני TikTok/Reels', '2 ש׳'],
  ['שלישי', 'סרטון נוסף + תגובות וקהילה', '1.5 ש׳'],
  ['חמישי', 'פיתוח לפי פידבק השבוע', '3 ש׳'],
  ['שישי', 'סקירת מדדים בחמ"ל + סימון התקדמות', '15 דק׳'],
  ['גמיש', 'שיחה עם משתמש אמיתי אחד', '30 דק׳'],
];

const REVENUE = [
  ['💎 מנוי Premium (AI + קבצים)', 'שלב 2', '₪3,000-15,000'],
  ['🪙 חבילות טוקנים + קוסמטיקה', 'שלב 2', '₪500-2,000'],
  ['🏛️ B2B אגודות / מכינות', 'שלב 3', '₪2,000-8,000'],
  ['🤝 שותפויות ותוכן ממומן', 'שלב 3+', '₪1,000-5,000'],
  ['📚 מרקטפלייס סיכומים (עמלה)', 'שנה 2', '—'],
];

const AUTOMATIONS = [
  'אירועי אנליטיקס + מדדי שימור מדויקים (WAU אמיתי, retention)',
  '20 תסריטי TikTok מוכנים לצילום',
  'רשימת המתנה לפרימיום (טופס + DB)',
  'חיזוק לולאת ההפניות + שיתוף וואטסאפ',
  'OG image + meta tags + עמודי SEO',
  'מיילים אוטומטיים (ברוך הבא / רצף בסכנה / סיכום שבועי)',
  'מצגת פיץ\' לאגודות סטודנטים',
  'מימוש Premium מלא לפי PREMIUM_AI_PLAN.md',
];

/* ──────────────────────────────────────────────────────────────── */

const fmtNum = n => (n ?? 0).toLocaleString('he-IL');

/* ── תמחור Anthropic לכל מיליון טוקנים (USD) ──
   cache read = 10% ממחיר ה-input · cache write (TTL שעה) = פי 2 ממחיר ה-input */
const PRICING = {
  'claude-opus-4-8':   { in: 5, out: 25, label: 'Opus' },
  'claude-sonnet-4-6': { in: 3, out: 15, label: 'Sonnet' },
  'claude-haiku-4-5':  { in: 1, out: 5,  label: 'Haiku' },
};
const priceOf = m => PRICING[m] || PRICING['claude-sonnet-4-6'];
const USD_TO_ILS = 3.7;
const ACTION_HE = { summary: 'סיכום', question: 'שאלה', practice: 'תרגול', solve: 'פתרון' };

// עלות שורה/סיכום ($), מקבל אובייקט עם ספירות טוקנים + model
function costUSD(row) {
  const p = priceOf(row.model);
  return (
    (row.input_tokens  || 0) / 1e6 * p.in +
    (row.output_tokens || 0) / 1e6 * p.out +
    (row.cache_read_tokens  || 0) / 1e6 * (p.in * 0.1) +
    (row.cache_write_tokens || 0) / 1e6 * (p.in * 2)
  );
}
const sumCost   = arr => (arr || []).reduce((s, r) => s + costUSD(r), 0);
const sumTokens = arr => (arr || []).reduce(
  (s, r) => s + (r.input_tokens||0) + (r.output_tokens||0) + (r.cache_read_tokens||0) + (r.cache_write_tokens||0), 0);
const fmtUSD = n => `$${n.toFixed(n < 1 ? 4 : 2)}`;
const fmtILS = n => `₪${(n * USD_TO_ILS).toFixed(2)}`;

function KpiCard({ icon: Icon, label, value, sub, color, delta }) {
  return (
    <div className="adm-kpi" style={{ '--kpi-color': color }}>
      <div className="adm-kpi-top">
        <span className="adm-kpi-label">{label}</span>
        <span className="adm-kpi-icon"><Icon size={16}/></span>
      </div>
      <div className="adm-kpi-value">{value}</div>
      <div className="adm-kpi-sub">
        {delta != null && (
          <span className={`adm-kpi-delta ${delta >= 0 ? 'up' : 'down'}`}>
            <TrendingUp size={11}/> {delta >= 0 ? '+' : ''}{delta}
          </span>
        )}
        {sub}
      </div>
    </div>
  );
}

function SignupChart({ data }) {
  const max = Math.max(1, ...data.map(d => d.c));
  return (
    <div className="adm-chart">
      {data.map((d, i) => {
        const date = new Date(d.d);
        const label = `${date.getDate()}/${date.getMonth() + 1}`;
        return (
          <div key={d.d} className="adm-bar-col" title={`${label} — ${d.c} נרשמו`}>
            <div className="adm-bar-track">
              <div
                className={`adm-bar${d.c > 0 ? ' has' : ''}`}
                style={{ height: `${Math.max(d.c > 0 ? 8 : 3, (d.c / max) * 100)}%` }}
              />
            </div>
            {i % 5 === 0 && <span className="adm-bar-label">{label}</span>}
          </div>
        );
      })}
    </div>
  );
}

function ConversionFunnel({ stats }) {
  if (!stats) return null;
  const steps = [
    { label: 'נרשמו',          value: stats.total_users    || 0, color: 'var(--blue)'   },
    { label: 'למדו אי-פעם',    value: stats.had_session    || 0, color: 'var(--accent)' },
    { label: 'פעילים השבוע',   value: stats.wau_studied    || 0, color: 'var(--green)'  },
    { label: 'השלימו אקטיבציה',value: stats.activation_claimed || 0, color: 'var(--purple)'},
  ];
  const top = steps[0].value || 1;
  return (
    <div className="adm-card adm-funnel-card">
      <div className="adm-card-title"><TrendingUp size={15}/> משפך המרה</div>
      <div className="adm-funnel">
        {steps.map((s, i) => {
          const pct = Math.round((s.value / top) * 100);
          const conv = i > 0 ? Math.round((s.value / (steps[i-1].value || 1)) * 100) : 100;
          return (
            <div key={s.label} className="adm-funnel-step">
              {i > 0 && <div className="adm-funnel-arrow"><ArrowLeft size={14}/><span className="adm-funnel-conv">{conv}%</span></div>}
              <div className="adm-funnel-bar-wrap">
                <div className="adm-funnel-bar" style={{ width:`${pct}%`, background: s.color }}/>
              </div>
              <div className="adm-funnel-meta">
                <span className="adm-funnel-label">{s.label}</span>
                <span className="adm-funnel-val">{fmtNum(s.value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, sub }) {
  return (
    <div className="adm-mini">
      <Icon size={15} className="adm-mini-icon"/>
      <div>
        <div className="adm-mini-value">{value}</div>
        <div className="adm-mini-label">{label}{sub ? ` · ${sub}` : ''}</div>
      </div>
    </div>
  );
}

function AiCostPanel({ costs, error }) {
  if (error) {
    return (
      <div className="adm-card">
        <div className="adm-card-title"><Coins size={15}/> עלות ה-AI בזמן אמת</div>
        <div className="adm-setup" style={{ margin: 0 }}>
          <Database size={18}/>
          <div>
            <strong>פאנל העלויות עדיין לא מחובר.</strong>
            <p>הרץ ב-Supabase → SQL Editor את הקובץ <code>add_ai_costs.sql</code>, ואז רענן.</p>
          </div>
        </div>
      </div>
    );
  }
  if (!costs) return null;

  const today = sumCost(costs.by_model_today);
  const month = sumCost(costs.by_model_month);
  const all   = sumCost(costs.by_model_all);
  const callsToday = (costs.by_model_today || []).reduce((s, r) => s + (r.calls || 0), 0);

  return (
    <div className="adm-card adm-cost-card">
      <div className="adm-card-title">
        <Coins size={15}/> עלות ה-AI בזמן אמת
        <span className="adm-live-dot" title="מתעדכן אוטומטית"/>
      </div>

      <div className="adm-cost-kpis">
        <div className="adm-cost-kpi">
          <div className="adm-cost-val">{fmtUSD(today)}</div>
          <div className="adm-cost-lbl">היום · {fmtNum(callsToday)} פעולות</div>
          <div className="adm-cost-ils">{fmtILS(today)}</div>
        </div>
        <div className="adm-cost-kpi">
          <div className="adm-cost-val">{fmtUSD(month)}</div>
          <div className="adm-cost-lbl">החודש</div>
          <div className="adm-cost-ils">{fmtILS(month)}</div>
        </div>
        <div className="adm-cost-kpi">
          <div className="adm-cost-val">{fmtUSD(all)}</div>
          <div className="adm-cost-lbl">מאז ומתמיד · {fmtNum(Math.round(sumTokens(costs.by_model_all) / 1000))}K טוקנים</div>
          <div className="adm-cost-ils">{fmtILS(all)}</div>
        </div>
      </div>

      {/* פירוק לפי מודל (החודש) */}
      {(costs.by_model_month || []).length > 0 && (
        <table className="adm-table" style={{ marginTop: 14 }}>
          <thead><tr><th>מודל</th><th>פעולות</th><th>טוקנים</th><th>עלות החודש</th></tr></thead>
          <tbody>
            {costs.by_model_month.map(r => (
              <tr key={r.model}>
                <td>{priceOf(r.model).label}</td>
                <td>{fmtNum(r.calls)}</td>
                <td dir="ltr">{fmtNum(Math.round(sumTokens([r]) / 1000))}K</td>
                <td dir="ltr">{fmtUSD(costUSD(r))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* פיד חי */}
      <div className="adm-cost-feed-title">פעולות אחרונות</div>
      <div className="adm-cost-feed">
        {(costs.recent || []).length === 0
          ? <div className="adm-cost-feed-empty">עדיין אין שימוש</div>
          : costs.recent.map((r, i) => (
            <div key={i} className="adm-cost-feed-row">
              <span className="adm-cost-feed-time">
                {new Date(r.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="adm-cost-feed-user" title={r.email}>{(r.email || '').split('@')[0]}</span>
              <span className="adm-cost-feed-action">{ACTION_HE[r.action] || r.action}</span>
              <span className="adm-cost-feed-model">{priceOf(r.model).label}</span>
              <span className="adm-cost-feed-cost" dir="ltr">{fmtUSD(costUSD(r))}</span>
            </div>
          ))}
      </div>
      <div className="adm-cost-note">העלות בדולרים (Anthropic) · ₪ לפי שער ~{USD_TO_ILS}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, profile, updateProfile } = useAuth();
  const [stats, setStats]     = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  // checked plan items — DB first, localStorage fallback
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ps_biz_progress') || '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    if (profile?.biz_progress?.done) setDone(profile.biz_progress.done);
  }, [profile?.biz_progress]);

  const toggleItem = useCallback((itemId) => {
    setDone(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      if (!next[itemId]) delete next[itemId];
      localStorage.setItem('ps_biz_progress', JSON.stringify(next));
      updateProfile({ biz_progress: { done: next } }).catch(() => {});
      return next;
    });
  }, [updateProfile]);

  const [costs, setCosts]         = useState(null);
  const [costErr, setCostErr]     = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.rpc('admin_get_stats');
    if (err) setError(err.message);
    else { setStats(data); setError(null); setUpdatedAt(new Date()); }
    setLoading(false);
  }, []);

  const fetchCosts = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('admin_get_ai_costs');
    if (err) setCostErr(err.message);
    else { setCosts(data); setCostErr(null); }
  }, []);

  useEffect(() => { fetchStats(); fetchCosts(); }, [fetchStats, fetchCosts]);

  // רענון חי של העלויות כל 20 שניות — רואים שימוש כמעט בזמן אמת
  useEffect(() => {
    const t = setInterval(fetchCosts, 20000);
    return () => clearInterval(t);
  }, [fetchCosts]);

  // current phase = first phase whose live metric is below target (manual phases skipped)
  const currentPhase = useMemo(() => {
    if (!stats) return PLAN[0];
    return PLAN.find(p => {
      const m = p.metric(stats);
      return m === null || m < p.target;
    }) ?? PLAN[PLAN.length - 1];
  }, [stats]);

  const nextActions = useMemo(
    () => currentPhase.items.filter(it => !done[it.id]).slice(0, 3),
    [currentPhase, done],
  );

  if (!isAdmin(user)) return null;

  const newDelta = stats ? stats.new_7d - stats.new_prev_7d : null;
  const taskPct  = stats?.tasks_total ? Math.round((stats.tasks_completed / stats.tasks_total) * 100) : 0;
  const onbPct   = stats?.total_users ? Math.round((stats.onboarded / stats.total_users) * 100) : 0;

  return (
    <div className="adm-page">

      {/* ── Header ── */}
      <div className="adm-head">
        <div>
          <h1 className="adm-title">חמ"ל ProStudy 🎯</h1>
          <p className="adm-subtitle">
            המצב העסקי בזמן אמת · התוכנית המלאה: BUSINESS_PLAN.md
            {updatedAt && <span className="adm-updated"> · עודכן {updatedAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <button className="adm-refresh" onClick={() => { fetchStats(); fetchCosts(); }} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'adm-spin' : ''}/> רענן
        </button>
      </div>

      {/* ── Setup notice ── */}
      {error && (
        <div className="adm-setup">
          <Database size={18}/>
          <div>
            <strong>החמ"ל עדיין לא מחובר למסד הנתונים.</strong>
            <p>היכנס ל-Supabase → SQL Editor → הרץ את הקובץ <code>admin_dashboard.sql</code> שבתיקיית הפרויקט, ואז לחץ "רענן".</p>
            <p className="adm-setup-err">שגיאה: {error}</p>
          </div>
        </div>
      )}

      {/* ── "Where am I" banner ── */}
      <div className="adm-now">
        <div className="adm-now-phase">
          <Flag size={15}/>
          <span>אתה בשלב {currentPhase.num} — {currentPhase.emoji} {currentPhase.title}</span>
          {stats && currentPhase.metric(stats) !== null && (
            <span className="adm-now-metric">
              {fmtNum(currentPhase.metric(stats))} / {fmtNum(currentPhase.target)} {currentPhase.metricLabel}
            </span>
          )}
        </div>
        <div className="adm-now-actions">
          <span className="adm-now-label">הצעדים הבאים שלך:</span>
          {nextActions.length === 0
            ? <span className="adm-now-done">✅ כל משימות השלב סומנו — עבור לשלב הבא!</span>
            : nextActions.map(a => (
              <button key={a.id} className="adm-now-item" onClick={() => toggleItem(a.id)} title="לחץ לסימון כבוצע">
                <span className="adm-now-check"/>{a.t}
              </button>
            ))
          }
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="adm-kpi-grid">
        <KpiCard icon={Users}    label="סה״כ משתמשים" color="var(--blue)"
                 value={stats ? fmtNum(stats.total_users) : '—'}
                 sub={stats ? `+${fmtNum(stats.new_30d)} בחודש האחרון` : ''}/>
        <KpiCard icon={UserPlus} label="הצטרפו השבוע" color="var(--green)"
                 value={stats ? fmtNum(stats.new_7d) : '—'}
                 delta={newDelta}
                 sub="מול שבוע קודם"/>
        <KpiCard icon={Activity} label="למדו השבוע (WAU)" color="var(--accent)"
                 value={stats ? fmtNum(stats.wau_studied) : '—'}
                 sub={stats ? `${fmtNum(stats.signed_in_7d)} התחברו · ${fmtNum(Math.round((stats.weekly_minutes_sum || 0) / 60))} שעות לימוד` : ''}/>
        <KpiCard icon={Gem}      label="מנויים משלמים" color="var(--purple)"
                 value={stats ? fmtNum(stats.paying_subscribers) : '—'}
                 sub="Premium טרם הושק — שלב 2"/>
      </div>

      {/* ── Funnel ── */}
      <ConversionFunnel stats={stats}/>

      {/* ── Chart + engagement ── */}
      <div className="adm-row">
        <div className="adm-card adm-chart-card">
          <div className="adm-card-title"><TrendingUp size={15}/> הרשמות — 30 ימים אחרונים</div>
          {stats?.signups_by_day?.length
            ? <SignupChart data={stats.signups_by_day}/>
            : <div className="adm-empty-chart">{loading ? 'טוען...' : 'אין נתונים עדיין'}</div>}
        </div>

        <div className="adm-card adm-engage-card">
          <div className="adm-card-title"><Activity size={15}/> מעורבות</div>
          <div className="adm-mini-grid">
            <MiniStat icon={CheckSquare}   label="משימות הושלמו" value={stats ? `${fmtNum(stats.tasks_completed)}/${fmtNum(stats.tasks_total)}` : '—'} sub={`${taskPct}%`}/>
            <MiniStat icon={BookOpen}      label="קורסים" value={stats ? fmtNum(stats.courses_total) : '—'}/>
            <MiniStat icon={GraduationCap} label="בחינות" value={stats ? fmtNum(stats.exams_total) : '—'}/>
            <MiniStat icon={Users}         label="צוותים" value={stats ? fmtNum(stats.pacts_total) : '—'} sub={stats ? `${fmtNum(stats.pact_members_accepted)} חברים` : ''}/>
            <MiniStat icon={Share2}        label="הגיעו מהפניה" value={stats ? fmtNum(stats.referred) : '—'}/>
            <MiniStat icon={Trophy}        label="סיימו Onboarding" value={stats ? `${onbPct}%` : '—'}/>
            <MiniStat icon={Coins}         label="קרדיטים במשק" value={stats ? fmtNum(stats.total_credits) : '—'}/>
            <MiniStat icon={Clock}         label="דקות לימוד השבוע" value={stats ? fmtNum(stats.weekly_minutes_sum) : '—'}/>
          </div>
        </div>
      </div>

      {/* ── AI cost (live) ── */}
      <AiCostPanel costs={costs} error={costErr}/>

      {/* ── The plan ── */}
      <div className="adm-section-head">
        <Target size={17}/>
        <h2>התוכנית העסקית — 4 שלבים</h2>
        <span className="adm-section-hint">סמן ✓ על מה שבוצע — נשמר אוטומטית</span>
      </div>

      <div className="adm-phases">
        {PLAN.map(phase => {
          const m = stats ? phase.metric(stats) : null;
          const pct = m === null ? null : Math.min(100, Math.round((m / phase.target) * 100));
          const doneCount = phase.items.filter(it => done[it.id]).length;
          const isCurrent = phase.id === currentPhase.id;
          return (
            <details key={phase.id} className={`adm-phase${isCurrent ? ' current' : ''}`} open={isCurrent}>
              <summary className="adm-phase-head">
                <span className="adm-phase-num">{phase.num}</span>
                <span className="adm-phase-name">{phase.emoji} {phase.title}</span>
                {isCurrent && <span className="adm-phase-badge">אתה כאן</span>}
                <span className="adm-phase-goal">{phase.goalLabel}</span>
                <ChevronDown size={15} className="adm-phase-chev"/>
              </summary>
              <div className="adm-phase-body">
                {pct !== null && (
                  <div className="adm-progress">
                    <div className="adm-progress-track"><div className="adm-progress-fill" style={{ width: `${pct}%` }}/></div>
                    <span className="adm-progress-text">{fmtNum(m)} / {fmtNum(phase.target)} {phase.metricLabel} ({pct}%)</span>
                  </div>
                )}
                <ul className="adm-checklist">
                  {phase.items.map(it => (
                    <li key={it.id}>
                      <label className={`adm-check${done[it.id] ? ' done' : ''}`}>
                        <input type="checkbox" checked={!!done[it.id]} onChange={() => toggleItem(it.id)}/>
                        <span className="adm-check-box"/>
                        <span className="adm-check-text">{it.t}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="adm-phase-foot">
                  <span>{doneCount}/{phase.items.length} בוצעו</span>
                  <span>{phase.cost}</span>
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {/* ── Reference panels ── */}
      <div className="adm-ref-grid">
        <div className="adm-card">
          <div className="adm-card-title"><Sparkles size={15}/> מקורות הכנסה</div>
          <table className="adm-table">
            <thead><tr><th>מקור</th><th>מתי</th><th>פוטנציאל/חודש</th></tr></thead>
            <tbody>
              {REVENUE.map(([a, b, c]) => <tr key={a}><td>{a}</td><td>{b}</td><td dir="ltr">{c}</td></tr>)}
            </tbody>
          </table>
        </div>

        <div className="adm-card">
          <div className="adm-card-title"><CalendarCheck size={15}/> השגרה השבועית (~8 שעות)</div>
          <table className="adm-table">
            <tbody>
              {WEEKLY.map(([d, t, h]) => <tr key={d}><td className="adm-td-day">{d}</td><td>{t}</td><td>{h}</td></tr>)}
            </tbody>
          </table>
        </div>

        <div className="adm-card">
          <div className="adm-card-title"><Rocket size={15}/> 🤖 בקש מקלוד — מוכן לביצוע אוטומטי</div>
          <ul className="adm-list">
            {AUTOMATIONS.map(a => <li key={a}>{a}</li>)}
          </ul>
        </div>

        <div className="adm-card adm-warn-card">
          <div className="adm-card-title"><AlertTriangle size={15}/> טעויות שהורגות מיזמים</div>
          <ul className="adm-list">
            {MISTAKES.map(m => <li key={m}>{m}</li>)}
          </ul>
        </div>
      </div>

    </div>
  );
}
