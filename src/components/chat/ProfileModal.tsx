import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { UserAvatar } from '../common/UserAvatar';
import {
  X,
  LogOut,
  Check,
  User,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Upload,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminConsole?: () => void;
}

const AVATAR_ICONS = ['🦊', '🚀', '🐼', '⚡', '🎮', '🎨', '🎧', '☕', '🐱', '🦄', '🔥', '🍕', '🌸', '🕶️', '👾'];
const AVATAR_COLORS = [
  '#5e17eb',
  '#8b5cf6',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#14b8a6',
  '#ef4444',
  '#64748b',
];

export function ProfileModal({ isOpen, onClose, onOpenAdminConsole }: ProfileModalProps) {
  const { user, updateProfile, logout } = useAuth();
  const { isAdmin, claimAdmin, deleteMyAccount } = useChat();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#5e17eb');
  const [avatarIcon, setAvatarIcon] = useState(user?.avatarIcon || '🦊');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarMode, setAvatarMode] = useState<'emoji' | 'custom'>(user?.avatarUrl ? 'custom' : 'emoji');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !user) return null;

  // Handle uploading downloaded picture from device (Requirement 5/6)
  const handleDeviceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarUrl(dataUrl);
      setAvatarMode('custom');
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateProfile({
        displayName: displayName.trim() || user.username,
        avatarColor,
        avatarIcon,
        avatarUrl: avatarMode === 'custom' && avatarUrl.trim() ? avatarUrl.trim() : '',
        bio: bio.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteMyAccount();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete account');
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <span className="text-xl">👤</span>
            <span>Profile & Account Settings</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-3.5 overflow-y-auto no-scrollbar flex-1">
          {/* Admin Banner & Portal */}
          {user.isAdmin ? (
            <div className="p-3 rounded-2xl bg-[#5e17eb]/15 border border-[#5e17eb]/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Shield size={16} className="text-[#a78bfa]" />
                <span className="font-bold text-white">Administrator Access Active</span>
              </div>
              {onOpenAdminConsole && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminConsole();
                  }}
                  className="px-3 py-1 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-sm"
                >
                  Admin Console
                </button>
              )}
            </div>
          ) : (
            onOpenAdminConsole && (
              <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-300">Are you the app administrator?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminConsole();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-700 hover:bg-[#5e17eb] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Shield size={13} className="text-indigo-300" />
                  <span>Enter Password to Claim</span>
                </button>
              </div>
            )
          )}

          {/* Avatar Selector Section */}
          <div className="p-3.5 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Profile Picture
              </span>
              <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAvatarMode('custom')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    avatarMode === 'custom' ? 'bg-[#5e17eb] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Device Picture 📁
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarMode('emoji')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    avatarMode === 'emoji' ? 'bg-[#5e17eb] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Emoji
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <UserAvatar
                avatarUrl={avatarMode === 'custom' ? avatarUrl : undefined}
                avatarIcon={avatarIcon}
                avatarColor={avatarColor}
                displayName={displayName || user.username}
                size="xl"
              />

              {avatarMode === 'custom' ? (
                <div className="space-y-2 flex-1 min-w-0">
                  {/* File Upload Button from Device */}
                  <label className="cursor-pointer flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#5e17eb]/20 hover:bg-[#5e17eb]/30 text-[#a78bfa] border border-[#5e17eb]/40 text-xs font-bold transition-all shadow-sm">
                    <Upload size={14} />
                    <span>Upload Downloaded Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDeviceUpload}
                      className="hidden"
                    />
                  </label>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto"
                    >
                      <Trash2 size={12} />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 flex-1">
                  {/* Emojis */}
                  <div className="flex flex-wrap gap-1">
                    {AVATAR_ICONS.slice(0, 8).map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setAvatarIcon(icon)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all ${
                          avatarIcon === icon ? 'bg-slate-700 ring-2 ring-[#5e17eb] scale-110' : 'hover:bg-slate-700/50'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  {/* Colors */}
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_COLORS.map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setAvatarColor(col)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          avatarColor === col ? 'scale-125 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Username (Read Only) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Username (Unique Handle)
            </label>
            <input
              type="text"
              disabled
              value={`@${user.username}`}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-400 text-xs font-mono cursor-not-allowed"
            />
          </div>

          {/* Display Name (Must be Unique) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Display Name (Must be Unique)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => {
                setDisplayName(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#5e17eb]"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Status Bio
            </label>
            <input
              type="text"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="e.g. Chatting on KirraK MuchatlU!"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#5e17eb]"
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2.5">
            {confirmingLogout && (
              <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between text-xs animate-in fade-in">
                <span className="text-slate-300">Are you sure you want to sign out?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingLogout(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm"
                  >
                    Yes, Sign Out
                  </button>
                </div>
              </div>
            )}

            {confirmingDelete && (
              <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-between text-xs animate-in fade-in">
                <span className="text-red-300">Permanently delete your account & data?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteAccount}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {!confirmingLogout && !confirmingDelete && (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmingLogout(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Delete Account</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {savedSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <Check size={14} /> Saved!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
