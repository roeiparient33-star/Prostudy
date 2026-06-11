import { useEffect } from 'react';

// The landing now lives at /landing.html as a real top-level page
// (crawlable, with its own meta/OG) instead of inside an iframe.
// Its CTA buttons come back to /?view=signup or /?view=login.
export default function LandingPage() {
  useEffect(() => {
    window.location.replace('/landing.html');
  }, []);

  return <div className="auth-loading"><div className="auth-spinner"/></div>;
}
