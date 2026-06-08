import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { PAGE_HELP } from './pageHelp';

export default function HelpButton({ page }) {
  const [open, setOpen] = useState(false);
  const help = PAGE_HELP[page];
  if (!help) return null;

  return (
    <>
      <button
        className="help-fab"
        onClick={() => setOpen(true)}
        aria-label="עזרה על הדף הנוכחי"
        title="עזרה"
      >
        <HelpCircle size={20} />
      </button>

      {open && (
        <div className="help-overlay" onClick={() => setOpen(false)}>
          <div className="help-panel" onClick={e => e.stopPropagation()}>
            <div className="help-panel-head">
              <span className="help-panel-title">{help.title}</span>
              <button
                className="modal-close-btn"
                onClick={() => setOpen(false)}
                aria-label="סגור"
              >
                <X size={17} />
              </button>
            </div>
            <p className="help-panel-body">{help.body}</p>
            {help.tip && (
              <div className="help-panel-tip">
                <span className="help-tip-icon">💡</span>
                <span><strong>טיפ:</strong> {help.tip}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
