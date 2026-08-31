import { Clock } from 'lucide-react';
import { useTimer } from '../contexts/TimerContext';
import ModalPortal from './ModalPortal';

// "עדיין לומדים?" — מוצג אחרי ~שעה של טיימר רצוף.
// בלי אישור תוך 10 דקות הסשן נעצר אוטומטית (הלוגיקה ב-useStudyTimer).
export default function StudyCheckinModal() {
  const { needsCheckin, confirmCheckin, stop } = useTimer();
  if (!needsCheckin) return null;

  return (
    <ModalPortal>
      <div className="modal-overlay" style={{ zIndex: 1200 }}>
        <div className="modal-box" style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👀</div>
          <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>עדיין לומדים?</h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 18 }}>
            השעון רץ כבר שעה. אשר שאתה עדיין כאן —<br/>
            אחרת הסשן ייעצר אוטומטית בעוד 10 דקות.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="modal-btn-primary" onClick={confirmCheckin} style={{ minWidth: 130 }}>
              כן, ממשיך ללמוד 💪
            </button>
            <button className="modal-btn-ghost" onClick={stop}>
              <Clock size={14} style={{ marginLeft: 4 }}/> סיים סשן
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
