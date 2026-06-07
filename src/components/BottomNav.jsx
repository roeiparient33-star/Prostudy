import { LayoutDashboard, BookOpen, CheckSquare, CalendarDays, Users, Smile } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'בית',     icon: LayoutDashboard },
  { id: 'courses',   label: 'קורסים',  icon: BookOpen },
  { id: 'tasks',     label: 'משימות',  icon: CheckSquare },
  { id: 'friends',   label: 'חברים',   icon: Users },
  { id: 'avatar',    label: 'סוכן',    icon: Smile },
];

export default function BottomNav({ currentPage, onNavigate }) {
  return (
    <nav className="bottom-nav">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`bottom-nav-item${currentPage === id ? ' active' : ''}`}
          onClick={() => onNavigate(id)}
        >
          <Icon size={21} className="bottom-nav-icon" />
          <span className="bottom-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
