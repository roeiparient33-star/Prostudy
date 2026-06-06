import { useEffect } from 'react';

export default function LandingPage({ onSignup }) {
  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.action === 'signup') {
        onSignup();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSignup]);

  return (
    <iframe
      src="/landing.html"
      title="ProStudy"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        zIndex: 9999,
      }}
    />
  );
}
