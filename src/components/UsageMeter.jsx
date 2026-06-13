// UsageMeter — שקיפות מכסה: "נשארו לך X/Y שימושים היום".
// שקיפות מונעת תסכול כשמגיעים לתקרה.
import { Zap } from 'lucide-react';

export default function UsageMeter({ used, limit }) {
  const pct  = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const left = Math.max(0, limit - used);
  const low  = left <= 3;

  return (
    <div className="usage-meter" title={`נוצלו ${used} מתוך ${limit} שימושים היום`}>
      <Zap size={14} className={low ? 'usage-meter-icon low' : 'usage-meter-icon'} fill="currentColor"/>
      <div className="usage-meter-bar">
        <div className={`usage-meter-fill${low ? ' low' : ''}`} style={{ width: `${pct}%` }}/>
      </div>
      <span className={`usage-meter-text${low ? ' low' : ''}`}>{left}/{limit}</span>
    </div>
  );
}
