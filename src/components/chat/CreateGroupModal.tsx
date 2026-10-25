import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, Users, Lock, Globe } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUP_ICONS = ['💬', '🎮', '🚀', '☕', '📚', '🍕', '🎵', '🏆', '🍿', '🎨', '💡', '🔥', '🏖️', '⚡', '🐱'];

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const { createGroup, allUsers } = useChat();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(GROUP_ICONS[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group name');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        isPrivate,
      });
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="text-xl">✨</span>
            <span>Create a Squad / Group</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Group Icon
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#5e17eb]/20 border border-[#5e17eb]/40 flex items-center justify-center text-3xl shadow-inner">
                {icon}
              </div>
              <div className="flex flex-wrap gap-1.5 flex-1 max-h-24 overflow-y-auto p-1 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                {GROUP_ICONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setIcon(item)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-transform ${
                      icon === item
                        ? 'bg-[#5e17eb] text-white scale-110 shadow-sm'
                        : 'hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Minecraft Squad, Study Room, Family Chat"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Topic or Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group all about?"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
            />
          </div>

          {/* Privacy Switch */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-2.5">
              {isPrivate ? (
                <Lock size={18} className="text-amber-400" />
              ) : (
                <Globe size={18} className="text-emerald-400" />
              )}
              <div>
                <span className="text-xs font-bold text-white block">
                  {isPrivate ? 'Private Group' : 'Discoverable Group'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {isPrivate
                    ? 'Only people with the invite code can join'
                    : 'Any friend can discover and join this group'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isPrivate ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isPrivate ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-lg shadow-[#5e17eb]/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
