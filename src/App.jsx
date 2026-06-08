import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import MobileTimerBar from './components/MobileTimerBar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Tasks from './pages/Tasks';
import Friends from './pages/Friends';
import Avatar from './pages/Avatar';
import Schedule from './pages/Schedule';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import AvatarOnboarding from './components/AvatarOnboarding';
import Achievements from './pages/Achievements';
import OnboardingTour from './onboarding/OnboardingTour';
import HelpButton from './onboarding/HelpButton';
import PWAInstallBanner from './components/PWAInstallBanner';

// Capture referral code from URL on app load
const urlRef = new URLSearchParams(window.location.search).get('ref');
if (urlRef) localStorage.setItem('ps_ref', urlRef);

const PAGE_MAP = {
  dashboard:    { component: Dashboard,    title: 'דשבורד' },
  courses:      { component: Courses,      title: 'קורסים' },
  tasks:        { component: Tasks,        title: 'משימות' },
  schedule:     { component: Schedule,     title: 'מערכת שעות' },
  friends:      { component: Friends,      title: 'חברים' },
  avatar:       { component: Avatar,       title: 'סוכן הלימודים שלי' },
  achievements: { component: Achievements, title: 'ארון הגביעים' },
};

export default function App() {
  const { user, profile, loading, updateProfile } = useAuth();
  const { dataLoading } = useData();
  const [page, setPage]         = useState('dashboard');
  const [authView, setAuthView] = useState('landing');

  if (loading || (user && dataLoading)) {
    return <div className="auth-loading"><div className="auth-spinner"/></div>;
  }

  if (!user) {
    if (authView === 'landing') return <LandingPage onSignup={() => setAuthView('signup')}/>;
    return authView === 'login'
      ? <Login onSwitchToSignup={() => setAuthView('signup')}/>
      : <Signup onSwitchToLogin={() => setAuthView('login')}/>;
  }

  // Show onboarding if user has no avatar selected yet
  const needsOnboarding = profile && !profile.avatar_config?.baseSelected;

  if (needsOnboarding) {
    return (
      <AvatarOnboarding
        onSelect={async (presetIdx) => {
          await updateProfile({
            avatar_config:     { baseSelected: true, presetId: presetIdx, presetCfgs: {} },
            presets_purchased: [presetIdx],
          });
        }}
      />
    );
  }

  const { component: Page, title } = PAGE_MAP[page] ?? PAGE_MAP.dashboard;

  return (
    <>
      <div className="app-layout">
        <Sidebar currentPage={page} onNavigate={setPage}/>
        <div className="main-wrapper">
          <Topbar title={title}/>
          <main className="main-content">
            <Page key={page} onNavigate={setPage}/>
          </main>
        </div>
        <MobileTimerBar/>
        <BottomNav currentPage={page} onNavigate={setPage}/>
      </div>
      <OnboardingTour page={page} setPage={setPage}/>
      <HelpButton page={page}/>
      <PWAInstallBanner/>
    </>
  );
}
