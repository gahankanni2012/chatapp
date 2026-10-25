import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { X, Search, MessageSquare, UserPlus, ArrowRight } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFriend?: (friendId: string) => void;
  onOpenAddFriend?: () => void;
}

export function DirectMessageModal({
  isOpen,
  onClose,
  onSelectFriend,
  onOpenAddFriend,
}: DirectMessageModalProps) {
  const { user } = useAuth();
  const { allUsers, onlineUserIds, selectDirectChat } = useChat();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const friends = allUsers.filter(u => u.id !== user?.id);
  const filteredFriends = friends.filter(
    u =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartChat = (friendId: string) => {
    selectDirectChat(friendId);
    onSelectFriend?.(friendId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <MessageSquare size={18} className="text-[#a78bfa]" />
            <span>Direct Message a Friend</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="mt-3.5 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search connected friends..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5e17eb]"
          />
        </div>

        {/* Friends List */}
        <div className="mt-3 space-y-1 max-h-64 overflow-y-auto pr-1 no-scrollbar flex-1">
          {filteredFriends.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 space-y-3">
              {friends.length === 0 ? (
                <>
                  <p className="font-semibold text-white">No Connected Friends Yet</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Under privacy rules, you must send a Friend Request and have it accepted before you can see and chat with each other!
                  </p>
                  {onOpenAddFriend && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAddFriend();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 transition-all"
                    >
                      <UserPlus size={14} />
                      <span>Send a Friend Request</span>
                    </button>
                  )}
                </>
              ) : (
                'No friends match your search.'
              )}
            </div>
          ) : (
            filteredFriends.map(friend => {
              const isOnline = onlineUserIds.includes(friend.id);

              return (
                <button
                  key={friend.id}
                  onClick={() => handleStartChat(friend.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-800 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      avatarUrl={friend.avatarUrl}
                      avatarIcon={friend.avatarIcon}
                      avatarColor={friend.avatarColor}
                      displayName={friend.displayName}
                      size="md"
                      showStatus
                      isOnline={isOnline}
                    />

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate group-hover:text-[#a78bfa]">
                        {friend.displayName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        @{friend.username}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-[#a78bfa] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <span>Chat</span>
                    <ArrowRight size={13} />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
