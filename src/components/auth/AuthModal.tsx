import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { UserAvatar } from '../common/UserAvatar';
import {
  Lock,
  User,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  Upload,
} from 'lucide-react';

const AVATAR_ICONS = ['🦊', '🚀', '🐼', '⚡', '🎮', '🎨', '🎧', '☕', '🐱', '🦄', '🔥', '🍕'];
const AVATAR_COLORS = [
  '#5e17eb',
  '#8b5cf6',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#14b8a6',
  '#ef4444',
];

export function AuthModal() {
  const { login, register } = useAuth();
  const { customLogoUrl } = useChat();
  const [appConfigLogo, setAppConfigLogo] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/app-config')
      .then(res => res.json())
      .then(data => {
        if (data.customLogoUrl) setAppConfigLogo(data.customLogoUrl);
      })
      .catch(() => {});
  }, []);

  const logoSrc = customLogoUrl || appConfigLogo || '/logo.svg';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarIcon, setAvatarIcon] = useState(AVATAR_ICONS[0]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarType, setAvatarType] = useState<'emoji' | 'custom'>('emoji');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle uploaded picture from device for profile pic
  const handleDeviceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarUrl(event.target?.result as string);
      setAvatarType('custom');
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (!displayName.trim()) {
        setError('Display Name is required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please ensure both password fields match.');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register({
          username,
          password,
          displayName: displayName.trim() || username,
          avatarColor,
          avatarIcon,
          avatarUrl: avatarType === 'custom' && avatarUrl.trim() ? avatarUrl.trim() : undefined,
          bio: bio || 'Chatting with friends on KirraK MuchatlU!',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 my-auto max-h-[96vh] flex flex-col">
        {/* Brand Header with prominent Logo matching screenshot */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative mb-3 group">
            {/* Ambient Purple Backlight matching screenshot */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#5e17eb] via-[#8b5cf6] to-[#ec4899] opacity-45 blur-lg group-hover:opacity-75 transition-opacity" />
            <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl overflow-hidden shadow-2xl shadow-[#5e17eb]/35 border-2 border-[#5e17eb]/50 bg-slate-950 flex items-center justify-center p-2">
              <img
                src={logoSrc}
                alt="KirraK MuchatlU Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/logo.svg';
                }}
              />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Sign In to KirraK MuchatlU' : 'Create an Account'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {mode === 'login'
              ? 'Welcome back! Enter your credentials to access your chats'
              : 'Real-time chat with your best friends and custom groups'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-800/80 p-1 mb-5 border border-slate-700/50">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-[#5e17eb] text-white shadow-md shadow-[#5e17eb]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-[#5e17eb] text-white shadow-md shadow-[#5e17eb]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 flex-1 overflow-y-auto no-scrollbar">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Username (Unique Handle) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. coolest_friend"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#5e17eb] transition-all"
              />
            </div>
          </div>

          {/* Registration: Display Name (Requirement 5: Unique Display Name) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Display Name (Must be Unique) *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Hunter"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#5e17eb] transition-all"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#5e17eb] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password (in Register mode) */}
          {mode === 'register' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Confirm Password *
                </label>
                {passwordsMatch && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                    <Check size={11} /> Passwords match
                  </span>
                )}
                {passwordsMismatch && (
                  <span className="text-[10px] text-red-400 font-medium">
                    Mismatch
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password..."
                  className={`w-full bg-slate-800/90 border rounded-xl pl-9 pr-9 py-2 text-white placeholder-slate-500 text-xs focus:outline-none transition-all ${
                    passwordsMismatch
                      ? 'border-red-500'
                      : passwordsMatch
                      ? 'border-emerald-500'
                      : 'border-slate-700 focus:border-[#5e17eb]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* Registration avatar picker with device photo support */}
          {mode === 'register' && (
            <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Profile Picture
                </label>
                <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAvatarType('custom')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      avatarType === 'custom' ? 'bg-[#5e17eb] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload Photo 📁
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarType('emoji')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      avatarType === 'emoji' ? 'bg-[#5e17eb] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Emoji
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarUrl={avatarType === 'custom' ? avatarUrl : undefined}
                  avatarIcon={avatarIcon}
                  avatarColor={avatarColor}
                  displayName={displayName || username}
                  size="lg"
                />

                {avatarType === 'custom' ? (
                  <div className="flex-1">
                    <label className="cursor-pointer flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#5e17eb]/20 hover:bg-[#5e17eb]/30 text-[#a78bfa] border border-[#5e17eb]/40 text-xs font-bold transition-all shadow-sm">
                      <Upload size={13} />
                      <span>{avatarUrl ? 'Photo Selected ✓' : 'Upload Downloaded Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDeviceUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap gap-1">
                      {AVATAR_ICONS.slice(0, 7).map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setAvatarIcon(icon)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all ${
                            avatarIcon === icon ? 'bg-slate-700 ring-2 ring-[#5e17eb] scale-110' : 'hover:bg-slate-700/60'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-lg shadow-[#5e17eb]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-block animate-spin mr-2">⏳</span>
            ) : (
              <ArrowRight size={16} />
            )}
            {mode === 'register' ? 'Create Account & Start' : 'Sign In to KirraK MuchatlU'}
          </button>

          {/* Quick toggle footer */}
          {mode === 'login' ? (
            <div className="pt-2 text-center">
              <p className="text-xs text-slate-400">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="text-[#a78bfa] hover:text-white font-bold underline transition-colors cursor-pointer ml-1"
                >
                  Create an account
                </button>
              </p>
            </div>
          ) : (
            <div className="pt-2 text-center">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-[#a78bfa] hover:text-white font-bold underline transition-colors cursor-pointer ml-1"
                >
                  Sign in here
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
