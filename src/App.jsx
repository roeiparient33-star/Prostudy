import { useState, lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import MobileTimerBar from './components/MobileTimerBar';
import Topbar from './components/Topbar';
import ToastHost from './components/ToastHost';
import { isAdmin } from './lib/admin';

// Auth screens stay eagerly loaded (first thing unauthenticated users see)
import Login from './pages/Login';
import Signup from './pages/Signup';
const OnboardingTour = lazy(() => import('./onboarding/OnboardingTour'));

// Onboarding uses 1MB of avatar SVG data — lazy-load it
const AvatarOnboarding = lazy(() => import('./components/AvatarOnboarding'));
import HelpButton from './onboarding/HelpButton';
import PWAInstallBanner from './components/PWAInstallBanner';
import AchievementWatcher from './components/AchievementWatcher';

// Pages are lazy-loaded — each becomes its own JS chunk
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Courses        = lazy(() => import('./pages/Courses'));
const Tasks          = lazy(() => import('./pages/Tasks'));
const Friends        = lazy(() => import('./pages/Friends'));
const Avatar         = lazy(() => import('./pages/Avatar'));
const Schedule       = lazy(() => import('./pages/Schedule'));
const Achievements   = lazy(() => import('./pages/Achievements'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));
const LandingPage    = lazy(() => import('./pages/LandingPage'));

// Capture referral code from URL on app load
const urlParams = new URLSearchParams(window.location.search);
const urlRef = urlParams.get('ref');
if (urlRef) localStorage.setItem('ps_ref', urlRef);

// Landing CTA buttons arrive at /?view=signup or /?view=login —
// open the right screen and strip only the view param (keep ?code= etc. for OAuth)
const urlView = ['signup', 'login'].includes(urlParams.get('view')) ? urlParams.get('view') : null;
if (urlView) {
  urlParams.delete('view');
  const qs = urlParams.toString();
  window.history.replaceState({}, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
}

const PAGE_MAP = {
  dashboard:    { component: Dashboard,    title: 'דשבורד' },
  courses:      { component: Courses,      title: 'קורסים' },
  tasks:        { component: Tasks,        title: 'משימות' },
  schedule:     { component: Schedule,     title: 'מערכת שעות' },
  friends:      { component: Friends,      title: 'חברים' },
  avatar:       { component: Avatar,       title: 'סוכן הלימודים שלי' },
  achievements: { component: Achievements, title: 'ארון הגביעים' },
  admin:        { component: AdminDashboard, title: 'חמ"ל' },
};

export default function App() {
  const { user, profile, loading, updateProfile, isRecovery, clearRecovery } = useAuth();
  const { dataLoading } = useData();
  const [page, setPage]         = useState('dashboard');
  const [authView, setAuthView] = useState(urlView || 'landing');

  if (loading || (user && dataLoading)) {
    return <div className="auth-loading"><div className="auth-spinner"/></div>;
  }

  if (isRecovery) {
    return <Suspense fallback={<div className="auth-loading"><div className="auth-spinner"/></div>}><ResetPassword onDone={clearRecovery} /></Suspense>;
  }

  if (!user) {
    if (authView === 'landing') return <Suspense fallback={<div className="auth-loading"><div className="auth-spinner"/></div>}><LandingPage onSignup={() => setAuthView('signup')} onLogin={() => setAuthView('login')}/></Suspense>;
    return authView === 'login'
      ? <Login onSwitchToSignup={() => setAuthView('signup')}/>
      : <Signup onSwitchToLogin={() => setAuthView('login')}/>;
  }

  // Show onboarding if user has no avatar selected yet
  const needsOnboarding = profile && !profile.avatar_config?.baseSelected;

  if (needsOnboarding) {
    return (
      <Suspense fallback={<div className="auth-loading"><div className="auth-spinner"/></div>}>
      <AvatarOnboarding
        onSelect={async (presetIdx) => {
          await updateProfile({
            avatar_config:     { baseSelected: true, presetId: presetIdx, presetCfgs: {} },
            presets_purchased: [presetIdx],
          });
        }}
      />
      </Suspense>
    );
  }

  // admin page is reserved for admins only
  const safePage = page === 'admin' && !isAdmin(user) ? 'dashboard' : page;
  const { component: Page, title } = PAGE_MAP[safePage] ?? PAGE_MAP.dashboard;

  return (
    <>
      <div className="app-layout">
        <Sidebar currentPage={safePage} onNavigate={setPage}/>
        <div className="main-wrapper">
          <Topbar title={title} onNavigate={setPage}/>
          <main className="main-content">
            <Suspense fallback={<div className="page-spinner"><div className="auth-spinner"/></div>}>
              <Page key={safePage} onNavigate={setPage}/>
            </Suspense>
          </main>
        </div>
        <MobileTimerBar/>
        <BottomNav currentPage={page} onNavigate={setPage}/>
      </div>
      <Suspense fallback={null}><OnboardingTour page={page} setPage={setPage}/></Suspense>
      <HelpButton page={page}/>
      <PWAInstallBanner/>
      <ToastHost/>
      <AchievementWatcher/>
    </>
  );
}
