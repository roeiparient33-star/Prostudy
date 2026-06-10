// Shared achievement definitions — used by the Achievements page (full display)
// and by AchievementWatcher (global unlock toasts).
// check/prog context: { p: profile, ct: completedTasksCount, fc: friendCount, ic: inviteCount, hasPact }

export const RARITY_GLOW = { common:'#9CA3AF', uncommon:'#3B82F6', rare:'#7C3AED', legendary:'#F59E0B' };

export const CATEGORY_LABELS = {
  milestone:'🏅 ציון דרך', streak:'🔥 רצף', time:'⏱️ זמן',
  social:'👥 חברתי', dedication:'💪 מסירות',
};

export const ACHIEVEMENTS = [
  { id:'first_session',  title:'מתחיל נלהב',       desc:'סיים סשן לימוד ראשון',      icon:'🚀', rarity:'common',    cat:'milestone',
    check:({p})    => (p?.total_studied_minutes||0)>0,
    prog: ({p})    => ({ cur:Math.min(1,p?.total_studied_minutes||0),  tot:1 }) },
  { id:'hours_10',       title:'עשר שעות',          desc:'צבור 10 שעות לימוד',        icon:'⏰', rarity:'common',    cat:'time',
    check:({p})    => (p?.total_studied_minutes||0)>=600,
    prog: ({p})    => ({ cur:Math.min(600,p?.total_studied_minutes||0), tot:600, label:h=>Math.floor(h/60)+'/'+'10 שע׳' }) },
  { id:'hours_50',       title:'50 שעות לימוד',     desc:'צבור 50 שעות לימוד',        icon:'⏱️', rarity:'uncommon',  cat:'time',
    check:({p})    => (p?.total_studied_minutes||0)>=3000,
    prog: ({p})    => ({ cur:Math.min(3000,p?.total_studied_minutes||0), tot:3000 }) },
  { id:'hours_100',      title:'100 שעות לימוד',    desc:'צבור 100 שעות לימוד',       icon:'🏆', rarity:'rare',      cat:'time',
    check:({p})    => (p?.total_studied_minutes||0)>=6000,
    prog: ({p})    => ({ cur:Math.min(6000,p?.total_studied_minutes||0), tot:6000 }) },
  { id:'streak_3',       title:'שלושה ימים ברצף',   desc:'למד 3 ימים ברצף',           icon:'🔥', rarity:'common',    cat:'streak',
    check:({p})    => (p?.streak_best||0)>=3,
    prog: ({p})    => ({ cur:Math.min(3, p?.streak_best||0),  tot:3 }) },
  { id:'streak_7',       title:'שבוע מושלם',        desc:'למד 7 ימים ברצף',           icon:'⭐', rarity:'uncommon',  cat:'streak',
    check:({p})    => (p?.streak_best||0)>=7,
    prog: ({p})    => ({ cur:Math.min(7, p?.streak_best||0),  tot:7 }) },
  { id:'streak_30',      title:'רץ מרתון',          desc:'למד 30 ימים ברצף',          icon:'🏃', rarity:'rare',      cat:'streak',
    check:({p})    => (p?.streak_best||0)>=30,
    prog: ({p})    => ({ cur:Math.min(30,p?.streak_best||0),  tot:30 }) },
  { id:'tasks_10',       title:'עשר משימות',        desc:'השלם 10 משימות',            icon:'✅', rarity:'common',    cat:'milestone',
    check:({ct})   => ct>=10,
    prog: ({ct})   => ({ cur:Math.min(10,ct), tot:10 }) },
  { id:'tasks_50',       title:'מאסטר משימות',      desc:'השלם 50 משימות',            icon:'🎯', rarity:'uncommon',  cat:'milestone',
    check:({ct})   => ct>=50,
    prog: ({ct})   => ({ cur:Math.min(50,ct), tot:50 }) },
  { id:'tasks_100',      title:'מכונת משימות',      desc:'השלם 100 משימות',           icon:'💪', rarity:'rare',      cat:'milestone',
    check:({ct})   => ct>=100,
    prog: ({ct})   => ({ cur:Math.min(100,ct), tot:100 }) },
  { id:'first_friend',   title:'חבר ראשון',         desc:'הוסף חבר ראשון לרשימה',     icon:'👋', rarity:'common',    cat:'social',
    check:({fc})   => fc>=1,
    prog: ({fc})   => ({ cur:Math.min(1,fc), tot:1 }) },
  { id:'friends_5',      title:'חוג חברים',         desc:'צבור 5 חברים',              icon:'👥', rarity:'uncommon',  cat:'social',
    check:({fc})   => fc>=5,
    prog: ({fc})   => ({ cur:Math.min(5,fc), tot:5 }) },
  { id:'invited_friend', title:'שגריר פרוסטאדי',   desc:'הזמן חבר שנרשם לאפליקציה', icon:'🌟', rarity:'uncommon',  cat:'social',
    check:({ic})   => ic>=1,
    prog: ({ic})   => ({ cur:Math.min(1,ic||0), tot:1 }) },
  { id:'pact_creator',   title:'צוות למידה',        desc:'פתח צוות למידה עם חבר',     icon:'🤝', rarity:'uncommon',  cat:'social',
    check:({hasPact}) => hasPact,
    prog: ({hasPact}) => ({ cur:hasPact?1:0, tot:1 }) },
  { id:'week_200',       title:'שבוע שיא',          desc:'למד 200 דקות (3.3 שע׳) בשבוע', icon:'📅', rarity:'common', cat:'dedication',
    check:({p})    => (p?.weekly_studied_minutes||0)>=200,
    prog: ({p})    => ({ cur:Math.min(200,p?.weekly_studied_minutes||0), tot:200 }) },
  { id:'legend',         title:'גאון הסמסטר',       desc:'100 שעות, 7-day streak, 5 חברים', icon:'👑', rarity:'legendary', cat:'dedication',
    check:({p,fc}) => (p?.total_studied_minutes||0)>=6000 && (p?.streak_best||0)>=7 && fc>=5,
    prog: ({p,fc}) => {
      const c1 = Math.min(1,(p?.total_studied_minutes||0)/6000);
      const c2 = Math.min(1,(p?.streak_best||0)/7);
      const c3 = Math.min(1,fc/5);
      return { cur:Math.round(((c1+c2+c3)/3)*100), tot:100 };
    } },
];
