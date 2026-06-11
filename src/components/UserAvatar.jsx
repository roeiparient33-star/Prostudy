import { lazy, Suspense } from 'react';

// AvatarSVG imports two large SVG data files (1MB+).
// Lazy loading it keeps those files out of the initial bundle.
const AvatarSVG = lazy(() => import('./AvatarSVG'));

// Circular avatar — renders the user's chosen character, falls back to initials.
// Zooms on the face region of the 280x340 AvatarSVG viewBox.
export default function UserAvatar({ profile, size = 34, zoom = 1.55, className = '' }) {
  const cfg        = profile?.avatar_config    || {};
  const purchased  = profile?.avatar_purchased || {};
  const pid        = cfg?.presetId;
  const ownedItems = (pid != null && purchased[pid]) ? purchased[pid] : [];
  const hasAvatar  = cfg?.baseSelected && pid != null;

  const initials = profile?.name
    ? profile.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('')
    : '?';

  const Fallback = (
    <div className={`user-avatar-fallback ${className}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );

  if (!hasAvatar) return Fallback;

  return (
    <div className={`user-avatar-circle ${className}`} style={{ width: size, height: size }}>
      <Suspense fallback={Fallback}>
        <AvatarSVG
          config={cfg}
          purchased={ownedItems}
          style={{ transform: `scale(${zoom})`, transformOrigin: '50% 30%' }}
        />
      </Suspense>
    </div>
  );
}
