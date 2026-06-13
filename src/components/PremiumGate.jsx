// PremiumGate — מסך שדרוג שמוצג כשמשתמש לא-פרימיום מנסה לגשת לעוזר ה-AI.
// מיצוב: "מורה פרטי AI" — מסביר ומלמד, לא "פותר במקומך".
import { Sparkles, Check, FileText, MessageSquare, Camera, ListChecks } from 'lucide-react';

const FEATURES = [
  { icon: FileText,     text: 'העלאת מטלות, מבחנים וסיכומים — והפיכתם לחומר לימוד' },
  { icon: MessageSquare, text: 'שאלות על החומר שלך, עם תשובות שמסבירות — לא רק עונות' },
  { icon: ListChecks,   text: 'פתרון תרגילים שלב-אחרי-שלב, כדי שתבין באמת' },
  { icon: Camera,       text: 'צילום דף תרגיל → הסבר מלא תוך שניות' },
];

const PLANS = [
  { id: 'premium', name: 'בסיסי', price: '₪25', per: '/חודש',
    perks: ['30 פעולות AI ביום', 'סיכומים ושאלות על החומר', 'פתרון תרגילים'] },
  { id: 'pro', name: 'פרו', price: '₪40', per: '/חודש', best: true,
    perks: ['100 פעולות AI ביום', 'הכל מהבסיסי', 'מודל מתקדם לפתרון תרגילים מורכבים', 'עדיפות בזמני עומס'] },
];

export default function PremiumGate({ onUpgrade }) {
  return (
    <div className="page-enter premium-gate">
      <div className="premium-gate-hero">
        <div className="premium-gate-badge"><Sparkles size={15}/> ProStudy Premium</div>
        <h1>מורה פרטי AI שמכיר את החומר שלך</h1>
        <p>העלה את ההרצאות, המטלות והמבחנים — וקבל הסברים, סיכומים ופתרונות מותאמים בדיוק למה שאתה לומד.</p>
      </div>

      <div className="premium-gate-features">
        {FEATURES.map(({ icon: Icon, text }, i) => (
          <div className="premium-feature" key={i}>
            <div className="premium-feature-icon"><Icon size={20}/></div>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="premium-plans">
        {PLANS.map(p => (
          <div className={`premium-plan${p.best ? ' best' : ''}`} key={p.id}>
            {p.best && <div className="premium-plan-tag">הכי משתלם</div>}
            <div className="premium-plan-name">{p.name}</div>
            <div className="premium-plan-price">{p.price}<span>{p.per}</span></div>
            <ul className="premium-plan-perks">
              {p.perks.map((perk, i) => (
                <li key={i}><Check size={15}/> {perk}</li>
              ))}
            </ul>
            <button className={`premium-plan-btn${p.best ? ' best' : ''}`} onClick={() => onUpgrade?.(p.id)}>
              שדרג ל{p.name}
            </button>
          </div>
        ))}
      </div>

      <p className="premium-gate-note">
        ביטול בכל עת · ללא התחייבות · החיוב מאובטח
      </p>
    </div>
  );
}
