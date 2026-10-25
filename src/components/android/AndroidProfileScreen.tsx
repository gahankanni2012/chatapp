import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { UserAvatar } from '../common/UserAvatar';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { DeviceModeToggle } from '../common/DeviceModeToggle';
import {
  User,
  Settings,
  Sparkles,
  LogOut,
  Smartphone,
  Shield,
  Edit3,
  ExternalLink,
  Laptop,
} from 'lucide-react';

interface AndroidProfileScreenProps {
  onOpenEditProfile: () => void;
  onOpenFeatures: () => void;
  onOpenAdminConsole?: () => void;
}

export function AndroidProfileScreen({
  onOpenEditProfile,
  onOpenFeatures,
  onOpenAdminConsole,
}: AndroidProfileScreenProps) {
  const { user, logout } = useAuth();
  const { customLogoUrl } = useChat();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Header */}
      <header className="px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl overflow-hidden shadow-md shadow-[#5e17eb]/30 border border-[#5e17eb]/40 bg-slate-950 flex items-center justify-center p-0.5 shrink-0">
            <img src={customLogoUrl || '/logo.svg'} alt="KM Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Your Profile</h1>
            <p className="text-[11px] text-slate-400">Account settings & customization</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenEditProfile}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#a78bfa] transition-colors"
          title="Edit Profile"
        >
          <Edit3 size={16} />
        </button>
      </header>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {/* User Card */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-4">
          <UserAvatar
            avatarUrl={user.avatarUrl}
            avatarIcon={user.avatarIcon}
            avatarColor={user.avatarColor}
            displayName={user.displayName}
            size="xl"
            showStatus
            isOnline={true}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate">{user.displayName}</h2>
              {user.isAdmin && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5e17eb] text-white">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-[#a78bfa] font-mono">@{user.username}</p>
            <p className="text-xs text-slate-300 italic mt-1 line-clamp-2">
              "{user.bio || 'Chatting on KirraK MuchatlU!'}"
            </p>
          </div>
        </div>

        {/* Admin Console Card */}
        {user.isAdmin && onOpenAdminConsole && (
          <button
            type="button"
            onClick={onOpenAdminConsole}
            className="w-full p-3.5 rounded-2xl bg-[#5e17eb]/20 hover:bg-[#5e17eb]/30 border border-[#5e17eb]/40 text-left flex items-center justify-between transition-all group shadow-md shadow-[#5e17eb]/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5e17eb] text-white flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#a78bfa] transition-colors">
                  Administrator Central Console
                </div>
                <div className="text-[11px] text-slate-300">
                  Monitor all chats, block/unblock users & update logo
                </div>
              </div>
            </div>
            <ExternalLink size={15} className="text-[#a78bfa] group-hover:text-white shrink-0" />
          </button>
        )}

        {!user.isAdmin && onOpenAdminConsole && (
          <button
            type="button"
            onClick={onOpenAdminConsole}
            className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-[#5e17eb]/50 text-left flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-[#5e17eb] group-hover:text-white transition-colors flex items-center justify-center">
                <Shield size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#a78bfa] transition-colors">
                  Administrator Verification
                </div>
                <div className="text-[11px] text-slate-400">
                  Enter password to activate administrator access
                </div>
              </div>
            </div>
            <ExternalLink size={14} className="text-slate-500 group-hover:text-white shrink-0" />
          </button>
        )}

        {/* Edit Avatar Button */}
        <button
          type="button"
          onClick={onOpenEditProfile}
          className="w-full py-2.5 px-4 rounded-2xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 flex items-center justify-center gap-2 transition-all"
        >
          <Edit3 size={15} />
          <span>Edit Profile & Avatar Picture</span>
        </button>

        {/* Install Android PWA Banner */}
        <PWAInstallButton variant="banner" />

        {/* Feature Directory Banner */}
        <button
          type="button"
          onClick={onOpenFeatures}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-indigo-500/30 hover:border-indigo-400 transition-all text-left flex items-center justify-between group active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-lg">
              ✨
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                Explore All Features
              </div>
              <div className="text-[11px] text-slate-400">
                View guide for groups, channels, admin controls & avatars
              </div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-400 group-hover:text-white shrink-0" />
        </button>

        {/* Device Mode Switcher */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Laptop size={14} className="text-indigo-400" />
              <span>Device View Format</span>
            </span>
            <span className="text-[10px] text-slate-400">Phone & Laptop</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Auto-adapts to your device when logging in from phone or laptop.
          </p>
          <div className="pt-1 flex justify-center">
            <DeviceModeToggle />
          </div>
        </div>

        {/* Device & Android info */}
        <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>App Edition</span>
            <span className="font-semibold text-white">Android Phone Edition</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Real-time Sync</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Account Security</span>
            <span className="text-indigo-300 font-mono text-[11px]">PBKDF2 Salted</span>
          </div>
        </div>

        {/* Sign Out Section */}
        {showLogoutConfirm ? (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 animate-in fade-in">
            <p className="text-xs text-slate-300 text-center font-medium">
              Are you sure you want to sign out of KirraK MuchatlU?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <LogOut size={15} />
            <span>Sign Out of Account</span>
          </button>
        )}
      </div>
    </div>
  );
}
