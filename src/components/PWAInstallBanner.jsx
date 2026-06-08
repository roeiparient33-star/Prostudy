import { useState, useEffect } from 'react';
import { X, Share, Plus, Download } from 'lucide-react';

const LS_KEY = 'ps_pwa_dismissed';

function isMobile() {
  return window.innerWidth <= 768;
}
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function PWAInstallBanner() {
  const [show,           setShow]           = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Only mobile, not already installed, not dismissed before
    if (!isMobile() || isStandalone() || localStorage.getItem(LS_KEY)) return;

    // Capture Android install prompt
    function onBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Show after 4 seconds — not immediately
    const timer = setTimeout(() => setShow(true), 4000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(LS_KEY, '1');
    setShow(false);
  }

  async function installAndroid() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
    setDeferredPrompt(null);
  }

  if (!show) return null;

  const ios     = isIOS();
  const android = !ios;

  return (
    <div className="pwa-banner">
      {/* Close */}
      <button className="pwa-banner-close" onClick={dismiss} aria-label="סגור">
        <X size={16} />
      </button>

      {/* App icon + title */}
      <div className="pwa-banner-head">
        <div className="pwa-banner-icon">
          <img src="/icons/icon-192.png" alt="ProStudy" onError={e => e.target.style.display='none'} />
          <span className="pwa-banner-icon-fallback">PS</span>
        </div>
        <div>
          <div className="pwa-banner-title">הוסף ל-מסך הבית</div>
          <div className="pwa-banner-sub">גישה מהירה ללא דפדפן</div>
        </div>
      </div>

      {/* iOS instructions */}
      {ios && (
        <div className="pwa-banner-steps">
          <div className="pwa-banner-step">
            <span className="pwa-step-num">1</span>
            <span>לחץ על כפתור השיתוף</span>
            <span className="pwa-step-icon"><Share size={15}/></span>
            <span className="pwa-step-hint">בתחתית Safari</span>
          </div>
          <div className="pwa-banner-step">
            <span className="pwa-step-num">2</span>
            <span>בחר</span>
            <span className="pwa-step-bold">"הוסף למסך הבית"</span>
            <Plus size={13} style={{ flexShrink: 0 }}/>
          </div>
          <div className="pwa-banner-step">
            <span className="pwa-step-num">3</span>
            <span>לחץ "הוסף" — וזהו 🎉</span>
          </div>
        </div>
      )}

      {/* Android — native prompt or manual */}
      {android && deferredPrompt && (
        <button className="pwa-banner-install-btn" onClick={installAndroid}>
          <Download size={16} />
          התקן אפליקציה
        </button>
      )}

      {android && !deferredPrompt && (
        <div className="pwa-banner-steps">
          <div className="pwa-banner-step">
            <span className="pwa-step-num">1</span>
            <span>לחץ על תפריט</span>
            <span className="pwa-step-bold">⋮</span>
            <span className="pwa-step-hint">ב-Chrome</span>
          </div>
          <div className="pwa-banner-step">
            <span className="pwa-step-num">2</span>
            <span>בחר</span>
            <span className="pwa-step-bold">"הוסף למסך הבית"</span>
          </div>
        </div>
      )}

      <button className="pwa-banner-dismiss" onClick={dismiss}>
        לא עכשיו
      </button>
    </div>
  );
}
