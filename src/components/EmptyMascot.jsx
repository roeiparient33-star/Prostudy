import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';

// Friendly empty state — the user's own avatar with a speech bubble.
// Falls back gracefully (initials circle) if no avatar was chosen yet.
export default function EmptyMascot({ text, actionLabel, onAction, size = 64 }) {
  const { profile } = useAuth();
  return (
    <div className="empty-mascot">
      <UserAvatar profile={profile} size={size} zoom={1.5}/>
      <div className="empty-mascot-bubble">
        <span>{text}</span>
        {actionLabel && onAction && (
          <button className="empty-mascot-action" onClick={onAction}>{actionLabel}</button>
        )}
      </div>
    </div>
  );
}
