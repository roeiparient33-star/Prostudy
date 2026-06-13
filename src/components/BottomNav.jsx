import { LayoutDashboard, BookOpen, CheckSquare, Users, Sparkles } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'בית',     icon: LayoutDashboard },
  { id: 'courses',   label: 'קורסים',  icon: BookOpen },
  { id: 'tasks',     label: 'משימות',  icon: CheckSquare },
  { id: 'premium',   label: 'עוזר AI', icon: Sparkles, premium: true },
  { id: 'friends',   label: 'חברים',   icon: Users },
];

export default function BottomNav({ currentPage, onNavigate }) {
  return (
    <nav className="bottom-nav">
      {navItems.map(({ id, label, icon: Icon, premium }) => (
        <button
          key={id}
          className={`bottom-nav-item${currentPage === id ? ' active' : ''}${premium ? ' premium' : ''}`}
          onClick={() => onNavigate(id)}
        >
          <Icon size={21} className="bottom-nav-icon" />
          <span className="bottom-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
