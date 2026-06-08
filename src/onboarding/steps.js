// All onboarding tour steps — casual Israeli tone
// quick:true  → included in the fast 5-step tour
// isWelcome   → the choice modal (always first, no target)

export const ALL_STEPS = [
  {
    id: 'welcome',
    page: 'dashboard',
    target: null,
    isWelcome: true,
    title: 'היי! אני הסוכן שלך 👋',
    body: 'בא אראה לך כמה דברים חשובים פה — תבחר איך מתחילים:',
  },
  {
    id: 'stats',
    page: 'dashboard',
    target: '[data-tour="stats-grid"]',
    quick: true,
    title: 'לוח הבקרה שלך 📊',
    body: 'פה רואים כל מה שחשוב — גרף התקדמות, שעות לימוד, משימות פתוחות ועוד.',
  },
  {
    id: 'streak',
    page: 'dashboard',
    target: '[data-tour="streak-badge"]',
    title: 'הרצף שלך 🔥',
    body: 'הלהבה הזו גדלה עם כל יום שלומדים. שוברים יום אחד — חוזרים לאפס. בלי כרחים, אבל כיף לשמור עליה.',
  },
  {
    id: 'timer',
    page: 'dashboard',
    target: '[data-tour="study-timer"]',
    quick: true,
    title: 'שעון הלימוד ⏱️',
    body: 'לוחצים "התחל" לפני שפותחים חומר — וזהו. כל דקה = קרדיט אחד לחנות.',
  },
  {
    id: 'pomodoro',
    page: 'dashboard',
    target: '[data-tour="pomodoro-toggle"]',
    title: 'מצב פומדורו 🍅',
    body: '25 דק׳ לימוד, 5 דק׳ הפסקה — ואז חוזר. שווה לנסות.',
  },
  {
    id: 'tasks',
    page: 'tasks',
    target: '[data-tour="tasks-add-btn"]',
    quick: true,
    title: 'הוסף משימה ✅',
    body: 'מוסיפים עם תאריך, סוג ועדיפות. אפשר לסנן, לערוך ולסמן "הושלם" כשסיימת.',
  },
  {
    id: 'courses',
    page: 'courses',
    target: '[data-tour="courses-add-btn"]',
    title: 'הקורסים שלך 📚',
    body: 'כל קורס מקבל צבע ייחודי אז כשמסתכלים על המשימות, ברור מיד מה שייך לאן.',
  },
  {
    id: 'friends-invite',
    page: 'friends',
    target: '[data-tour="invite-link"]',
    title: 'הזמן חברים 🤝',
    body: 'שלח את הקישור לחברים — אתה מקבל 50 נקודות על כל אחד שנרשם, והם מקבלים 30. כולם מרוויחים.',
  },
  {
    id: 'pact',
    page: 'friends',
    target: '[data-tour="pact-create-btn"]',
    title: 'צוות למידה 💪',
    body: 'פותחים צוות עם חברים, מוסיפים משימות משותפות, ורואים מי השלים מה. כשיש עם מי ללמוד — לומדים יותר.',
  },
  {
    id: 'avatar',
    page: 'avatar',
    target: '[data-tour="avatar-preview"]',
    quick: true,
    title: 'החנות שלך 🎨',
    body: 'כאן מוציאים את הנקודות שצברת. כובעים, רקעים, חיות מחמד — הכל נפתח עם לימוד, לא עם כסף.',
  },
  {
    id: 'achievements',
    page: 'achievements',
    target: '[data-tour="achievements-grid"]',
    title: 'הגביעים שלך 🏆',
    body: 'מופיעים לפי מה שעשית — לא צריך לרדוף אחריהם. חלקם יבואו בהפתעה. תמשיך ללמוד ותראה.',
  },
];

export const QUICK_STEPS = ALL_STEPS.filter(s => s.isWelcome || s.quick);
