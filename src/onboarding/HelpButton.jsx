import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { PAGE_HELP } from './pageHelp';

const PAGE_ICONS = {
  dashboard:    '📊',
  tasks:        '✅',
  schedule:     '🗓️',
  courses:      '📚',
  friends:      '🤝',
  avatar:       '🎨',
  achievements: '🏆',
};

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

            {/* Gradient header */}
            <div className="help-panel-header">
              <div className="help-panel-header-left">
                <div className="help-panel-icon-wrap">
                  {PAGE_ICONS[page] ?? '❓'}
                </div>
                <span className="help-panel-title">{help.title}</span>
              </div>
              <button
                className="help-panel-close"
                onClick={() => setOpen(false)}
                aria-label="סגור"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <p className="help-panel-body">{help.body}</p>

            {/* Tip */}
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
