import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { X, KeyRound, Compass, Users, ArrowRight } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinGroupModal({ isOpen, onClose }: JoinGroupModalProps) {
  const { joinGroup, exploreGroups } = useChat();

  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inviteCode.trim().toUpperCase();
    if (!clean) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await joinGroup({ inviteCode: clean });
      setInviteCode('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid invite code or group not found');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinExploreGroup = async (groupId: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await joinGroup({ groupId });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not join group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Compass size={22} className="text-purple-400" />
            <span>Join a Group</span>
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

        {/* Section 1: Join with Friend Invite Code */}
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <KeyRound size={14} className="text-indigo-400" />
            <span>Have an Invite Code?</span>
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Ask your friend for their squad's invite code (e.g. <span className="font-mono text-indigo-300 font-semibold">SQUAD-1234</span>)
          </p>

          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. SQUAD-7482"
              className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono placeholder-slate-500 text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting || !inviteCode.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>Join</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-[1px] bg-slate-800 flex-1" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Or Discover
          </span>
          <div className="h-[1px] bg-slate-800 flex-1" />
        </div>

        {/* Section 2: Explore Public Groups */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Explore Squads ({exploreGroups.length})
          </h3>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {exploreGroups.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800">
                You've already joined all public groups, or none are available right now.
              </div>
            ) : (
              exploreGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                      {group.icon || '👥'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs truncate">
                        {group.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {group.description || 'Welcome to this squad!'}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {group.memberIds.length} members
                        </span>
                        <span>•</span>
                        <span>Code: {group.inviteCode}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinExploreGroup(group.id)}
                    disabled={isSubmitting}
                    className="ml-3 px-3 py-1.5 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-sm transition-colors shrink-0"
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
