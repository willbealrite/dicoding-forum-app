import { useState } from 'react';

function UserAvatar({ user, size = 'medium' }) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState(null);
  const name = user?.name?.trim() || 'Pengguna';
  const initial = name.charAt(0).toUpperCase() || '?';
  const avatarUrl = user?.avatar;

  if (avatarUrl && failedAvatarUrl !== avatarUrl) {
    return (
      <img
        key={avatarUrl}
        className={`user-avatar user-avatar-${size}`}
        src={avatarUrl}
        alt={`Avatar ${name}`}
        onError={() => setFailedAvatarUrl(avatarUrl)}
      />
    );
  }

  return (
    <span
      className={`user-avatar user-avatar-fallback user-avatar-${size}`}
      role="img"
      aria-label={`Avatar ${name}`}
    >
      {initial}
    </span>
  );
}

export default UserAvatar;
