// All onboarding tour steps
// quick:true → included in the fast 5-step tour
// isWelcome → the choice modal (always first)

export const ALL_STEPS = [
  {
    id: 'welcome',
    page: 'dashboard',
    target: null,
    isWelcome: true,
    title: 'ברוכים הבאים ל-ProStudy!',
    body: 'אני הסוכן שלך — כאן כדי לעזור לך להפיק את המקסימום. רוצה שאסביר לך איך הכל עובד?',
  },
  {
    id: 'stats',
    page: 'dashboard',
    target: '[data-tour="stats-grid"]',
    side: 'bottom',
    quick: true,
    title: 'הסטטיסטיקות שלך 📊',
    body: 'כאן רואים הכל: כמה למדת השבוע, כמה משימות פתוחות, קורסים פעילים, קרדיטים והישגים — במבט אחד.',
  },
  {
    id: 'streak',
    page: 'dashboard',
    target: '[data-tour="streak-badge"]',
    side: 'bottom',
    title: 'הרצף שלך 🔥',
    body: 'כל יום שלומד שומר על הרצף. שוברים יום אחד — הרצף מתאפס לאפס. שמור על הלהבה!',
  },
  {
    id: 'timer',
    page: 'dashboard',
    target: '[data-tour="study-timer"]',
    side: 'left',
    quick: true,
    title: 'שעון הלימוד ⏱️',
    body: 'לחץ "התחל" לפני שפותחים את החומר. כל דקת לימוד = קרדיט אחד לחנות. השעון מתאפס כל חצות.',
  },
  {
    id: 'pomodoro',
    page: 'dashboard',
    target: '[data-tour="pomodoro-toggle"]',
    side: 'left',
    title: 'מצב פומדורו 🍅',
    body: 'סשנים של 25 דק׳ לימוד + 5 דק׳ הפסקה. מוכח כשיטת הלימוד הכי יעילה לריכוז ממושך.',
  },
  {
    id: 'tasks',
    page: 'tasks',
    target: '[data-tour="tasks-add-btn"]',
    side: 'bottom',
    quick: true,
    title: 'הוסף משימה ✅',
    body: 'הוסף משימות עם סוג (שיעורי בית / הרצאה / מבחן), תאריך ועדיפות. אפשר לסנן, לערוך ולסמן הושלם.',
  },
  {
    id: 'courses',
    page: 'courses',
    target: '[data-tour="courses-add-btn"]',
    side: 'bottom',
    title: 'הקורסים שלך 📚',
    body: 'כל קורס מקבל צבע ואייקון ייחודי. משימות ומבחנים מקושרים לקורס — כך אפשר לראות איפה מתמקדים.',
  },
  {
    id: 'friends-invite',
    page: 'friends',
    target: '[data-tour="invite-link"]',
    side: 'bottom',
    title: 'הזמן חברים 🤝',
    body: 'שתף את הקישור האישי שלך. אתה מקבל 50 קרדיטים על כל חבר שמצטרף — והחבר מקבל 30 בונוס.',
  },
  {
    id: 'pact',
    page: 'friends',
    target: '[data-tour="pact-create-btn"]',
    side: 'top',
    title: 'ברית למידה 💪',
    body: 'צור ברית עם חברים, הגדרו משימות משותפות, ותראו מי השלים מה. אחריות הדדית = תוצאות טובות יותר.',
  },
  {
    id: 'avatar',
    page: 'avatar',
    target: '[data-tour="avatar-preview"]',
    side: 'right',
    quick: true,
    title: 'הסוכן שלך 🎨',
    body: 'כל קרדיט שצברת מלימוד אפשר להוציא פה — שדרג עם כובעים, רקעים, חיות מחמד ועוד.',
  },
  {
    id: 'achievements',
    page: 'achievements',
    target: '[data-tour="achievements-grid"]',
    side: 'top',
    title: 'ארון הגביעים 🏆',
    body: 'פרסים שמתגלים לפי הפעילות שלך. חלקם מגיעים בהפתעה — לא הכל גלוי מראש. תגלה בדרך!',
  },
];

// Quick tour: welcome + 5 key steps
export const QUICK_STEPS = ALL_STEPS.filter(s => s.isWelcome || s.quick);
