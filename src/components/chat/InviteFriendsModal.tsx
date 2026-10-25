import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { X, Copy, Check, UserPlus, Users, Search } from 'lucide-react';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteFriendsModal({ isOpen, onClose }: InviteFriendsModalProps) {
  const { user } = useAuth();
  const { currentGroup, allUsers, inviteFriendToGroup } = useChat();

  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  if (!isOpen || !currentGroup) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentGroup.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (friendId: string) => {
    try {
      await inviteFriendToGroup(currentGroup.id, friendId);
      setInvitedIds(prev => [...prev, friendId]);
    } catch (err) {
      console.error('Failed to invite friend:', err);
    }
  };

  const availableFriends = allUsers.filter(u => u.id !== user?.id);
  const filteredFriends = availableFriends.filter(u =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <UserPlus size={20} className="text-indigo-400" />
            <span>Invite Friends to {currentGroup.name}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Invite Code Box */}
        <div className="mt-4 p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl">
          <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
            Group Invite Code
          </label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-white tracking-widest flex-1">
              {currentGroup.inviteCode}
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Direct Add Friend List */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Or Add Directly
            </label>
            <span className="text-[11px] text-slate-500">
              {availableFriends.length} friends available
            </span>
          </div>

          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or username..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {filteredFriends.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No users found. Tell your friends to sign up with their username & password!
              </div>
            ) : (
              filteredFriends.map(friend => {
                const isAlreadyMember = currentGroup.memberIds.includes(friend.id) || invitedIds.includes(friend.id);

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm border border-white/10 shrink-0"
                        style={{ backgroundColor: friend.avatarColor }}
                      >
                        {friend.avatarIcon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {friend.displayName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          @{friend.username}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInvite(friend.id)}
                      disabled={isAlreadyMember}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                        isAlreadyMember
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-default'
                          : 'bg-[#5e17eb] hover:bg-[#4f12cb] text-white shadow-sm'
                      }`}
                    >
                      {isAlreadyMember ? 'Member' : 'Add'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
