import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  avatarUrl?: string;
  avatarIcon?: string;
  avatarColor?: string;
  displayName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-xs rounded-lg',
  sm: 'w-8 h-8 text-sm rounded-xl',
  md: 'w-10 h-10 text-base rounded-xl',
  lg: 'w-12 h-12 text-xl rounded-2xl',
  xl: 'w-16 h-16 text-2xl rounded-2xl',
};

const DOT_SIZE = {
  xs: 'w-2 h-2 -bottom-0.5 -right-0.5 border',
  sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 border-2',
  md: 'w-3 h-3 -bottom-0.5 -right-0.5 border-2',
  lg: 'w-3.5 h-3.5 bottom-0 right-0 border-2',
  xl: 'w-4 h-4 bottom-0 right-0 border-2',
};

export function UserAvatar({
  avatarUrl,
  avatarIcon = '🦊',
  avatarColor = '#6366f1',
  displayName = 'User',
  size = 'md',
  isOnline,
  showStatus = false,
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const hasValidImage = Boolean(avatarUrl && avatarUrl.trim() && !imageError);

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`${SIZE_MAP[size]} overflow-hidden flex items-center justify-center font-bold text-white shadow-sm border border-white/10 select-none transition-transform`}
        style={{ backgroundColor: hasValidImage ? '#1e293b' : avatarColor }}
      >
        {hasValidImage ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{avatarIcon}</span>
        )}
      </div>

      {showStatus && (
        <span
          className={`absolute rounded-full border-slate-950 ${DOT_SIZE[size]} ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
