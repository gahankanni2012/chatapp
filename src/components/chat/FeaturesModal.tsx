import React from 'react';
import {
  X,
  Sparkles,
  Users,
  Hash,
  MessageSquare,
  KeyRound,
  Compass,
  UserCheck,
  Smile,
  ArrowRight,
  Shield,
  Zap,
  Trash2,
  Camera,
} from 'lucide-react';

interface FeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (
    feature: 'createGroup' | 'joinGroup' | 'addChannel' | 'inviteFriends' | 'directMessage' | 'profile' | 'chat'
  ) => void;
}

interface FeatureItem {
  id: 'createGroup' | 'joinGroup' | 'addChannel' | 'inviteFriends' | 'directMessage' | 'profile' | 'chat';
  title: string;
  badge: string;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
  actionText: string;
  actionClass: string;
}

export function FeaturesModal({ isOpen, onClose, onNavigateTo }: FeaturesModalProps) {
  if (!isOpen) return null;

  const features: FeatureItem[] = [
    {
      id: 'createGroup',
      title: 'Group Admin & Delete Group Controls',
      badge: 'Admin & Moderation',
      icon: <Shield size={22} className="text-red-400" />,
      iconBg: 'bg-red-500/20 border-red-500/30',
      description:
        'The creator is crowned Group Admin 👑 with exclusive authority to delete the group or moderate settings, while members can leave safely.',
      actionText: 'Manage Groups',
      actionClass: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
    },
    {
      id: 'profile',
      title: 'Custom Profile Pictures & Password Security',
      badge: 'Profile & Security',
      icon: <Camera size={22} className="text-pink-400" />,
      iconBg: 'bg-pink-500/20 border-pink-500/30',
      description:
        'Paste any custom image URL, pick from avatar presets, or choose emojis with custom theme colors. Includes confirm password validation for account security.',
      actionText: 'Customize Profile Pic',
      actionClass: 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/30',
    },
    {
      id: 'createGroup',
      title: 'Create Custom Groups & Squads',
      badge: 'Squads',
      icon: <Users size={22} className="text-emerald-400" />,
      iconBg: 'bg-emerald-500/20 border-emerald-500/30',
      description:
        'Set up custom groups for gaming, homework, clubs, or hangout rooms with custom icons, topics, and public/private privacy controls.',
      actionText: 'Create a Group',
      actionClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
    },
    {
      id: 'addChannel',
      title: 'Multi-Topic Text Channels',
      badge: 'Channels',
      icon: <Hash size={22} className="text-indigo-400" />,
      iconBg: 'bg-indigo-500/20 border-indigo-500/30',
      description:
        'Organize conversations into dedicated topic channels like #general-chat, #memes-and-fun, #gaming, or #links within any group.',
      actionText: 'Add New Channel',
      actionClass: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30',
    },
    {
      id: 'directMessage',
      title: 'Direct 1-on-1 Messages (DMs)',
      badge: 'Private Chat',
      icon: <MessageSquare size={22} className="text-purple-400" />,
      iconBg: 'bg-purple-500/20 border-purple-500/30',
      description:
        'Chat privately one-on-one with any registered friend. View online/offline status dots and manage direct conversation histories.',
      actionText: 'Start Direct Message',
      actionClass: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
    },
    {
      id: 'inviteFriends',
      title: 'Shareable Friend Join Codes',
      badge: 'Invite Codes',
      icon: <KeyRound size={22} className="text-amber-400" />,
      iconBg: 'bg-amber-500/20 border-amber-500/30',
      description:
        'Every squad automatically gets a unique invite code (e.g. SQUAD-4912). Share it with friends or add friends directly with 1 click.',
      actionText: 'View Group Invite Code',
      actionClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
    },
    {
      id: 'joinGroup',
      title: 'Explore & Join Public Groups',
      badge: 'Discovery',
      icon: <Compass size={22} className="text-cyan-400" />,
      iconBg: 'bg-cyan-500/20 border-cyan-500/30',
      description:
        'Discover public groups created by other users or enter an invite code you received from a friend to immediately join.',
      actionText: 'Join / Explore Groups',
      actionClass: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30',
    },
    {
      id: 'chat',
      title: 'Real-Time Reactions, Media & Typing',
      badge: 'Live Messaging',
      icon: <Zap size={22} className="text-yellow-400" />,
      iconBg: 'bg-yellow-500/20 border-yellow-500/30',
      description:
        'Live WebSocket sync across devices, emoji reactions (👍, ❤️, 😂, 🔥, 🎉), quote replies, photo attachments, and real-time typing indicators.',
      actionText: 'Jump into Active Chat',
      actionClass: 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>KirraK MuchatlU Features</span>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Feature Directory
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Explore everything this app can do. Click any button to jump directly into that feature!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Features Grid */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {features.map((item) => (
            <div
              key={item.title}
              className="p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${item.iconBg}`}
                >
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-white">{item.title}</h3>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action Button that redirects directly to that feature */}
              <button
                type="button"
                onClick={() => {
                  onNavigateTo(item.id);
                  onClose();
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 ${item.actionClass}`}
              >
                <span>{item.actionText}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Powered by real-time WebSockets & persistent storage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
