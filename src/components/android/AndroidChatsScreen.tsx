import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  Search,
  MessageSquare,
  Hash,
  Sparkles,
  Plus,
  Users,
  Crown,
  KeyRound,
  Copy,
  Check,
  UserPlus,
  Shield,
} from 'lucide-react';

interface AndroidChatsScreenProps {
  onSelectChannel: (groupId: string, channelId: string) => void;
  onSelectFriend: (friendId: string) => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onOpenFeatures: () => void;
  onOpenDirectMessagesModal: () => void;
  onOpenFriendRequests?: () => void;
  onOpenAdminConsole?: () => void;
}

export function AndroidChatsScreen({
  onSelectChannel,
  onSelectFriend,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onOpenFeatures,
  onOpenDirectMessagesModal,
  onOpenFriendRequests,
  onOpenAdminConsole,
}: AndroidChatsScreenProps) {
  const { user } = useAuth();
  const {
    myGroups,
    allUsers,
    onlineUserIds,
    friendRequests,
    customLogoUrl,
    isAdmin,
  } = useChat();

  const [activeSegment, setActiveSegment] = useState<'direct' | 'channels'>('direct');
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const friends = allUsers.filter(u => u.id !== user?.id);
  const filteredFriends = friends.filter(
    f =>
      f.displayName.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = myGroups.filter(
    g =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.channels.some(c => c.name.toLowerCase().includes(search.toLowerCase()))
  );

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const incomingReqCount = friendRequests.incoming.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Android Top App Bar */}
      <header className="px-4 pt-2 pb-3 bg-slate-900/90 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl overflow-hidden shadow-md shadow-[#5e17eb]/30 border border-[#5e17eb]/40 bg-slate-950 flex items-center justify-center p-0.5">
              <img src={customLogoUrl || '/logo.svg'} alt="KM Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                KirraK MuchatlU
              </h1>
              <span className="text-[10px] text-slate-400 font-medium">Android Phone Edition</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Friend Requests Button */}
            {onOpenFriendRequests && (
              <button
                type="button"
                onClick={onOpenFriendRequests}
                className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#a78bfa] transition-colors"
                title="Friend Requests"
              >
                <UserPlus size={16} />
                {incomingReqCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-slate-900">
                    {incomingReqCount}
                  </span>
                )}
              </button>
            )}

            {/* Admin Console Trigger */}
            {onOpenAdminConsole && (
              <button
                type="button"
                onClick={onOpenAdminConsole}
                className={`p-2 rounded-xl border transition-colors ${
                  isAdmin
                    ? 'bg-[#5e17eb]/20 hover:bg-[#5e17eb]/30 text-[#a78bfa] border-[#5e17eb]/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
                title={isAdmin ? "Administrator Console" : "Claim Admin (Enter Password)"}
              >
                <Shield size={16} />
              </button>
            )}

            <PWAInstallButton />

            <button
              type="button"
              onClick={onOpenFeatures}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
              title="Features Directory"
            >
              <Sparkles size={16} />
            </button>
          </div>
        </div>

        {/* Android Search Bar */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats, channels, friends..."
            className="w-full bg-slate-800/90 border border-slate-700/60 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#5e17eb]"
          />
        </div>

        {/* Material 3 Segmented Pill Filter */}
        <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/50">
          <button
            type="button"
            onClick={() => setActiveSegment('direct')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSegment === 'direct'
                ? 'bg-[#5e17eb] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={13} />
            <span>Direct Messages ({friends.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSegment('channels')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSegment === 'channels'
                ? 'bg-[#5e17eb] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hash size={13} />
            <span>Group Channels ({myGroups.length})</span>
          </button>
        </div>
      </header>

      {/* Main Content List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
        {activeSegment === 'direct' ? (
          /* Direct Messages List */
          filteredFriends.length === 0 ? (
            <div className="p-8 text-center text-slate-400 my-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#5e17eb]/15 border border-[#5e17eb]/20 text-[#a78bfa] flex items-center justify-center text-2xl mx-auto">
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">No Connected Friends Yet</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Only upon sending a request and having it accepted can you see each other's accounts and message!
                </p>
              </div>
              <div className="flex flex-col gap-2 max-w-xs mx-auto pt-1">
                {onOpenFriendRequests && (
                  <button
                    type="button"
                    onClick={onOpenFriendRequests}
                    className="px-4 py-2.5 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    <UserPlus size={14} />
                    <span>Send Friend Request</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredFriends.map(friend => {
                const isOnline = onlineUserIds.includes(friend.id);

                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => onSelectFriend(friend.id)}
                    className="w-full p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-left active:scale-[0.98]"
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
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white truncate">
                            {friend.displayName}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 truncate block">
                          @{friend.username}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isOnline
                            ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-slate-500'
                        }`}
                      >
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          /* Group Channels List */
          filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-slate-400 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#5e17eb]/15 border border-[#5e17eb]/20 text-[#a78bfa] flex items-center justify-center text-2xl mx-auto mb-3">
                👥
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No Groups Joined Yet</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Create your first squad or enter a friend's join code to get started.
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={onOpenCreateGroup}
                  className="px-4 py-2.5 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus size={14} />
                  <span>Create a Squad</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenJoinGroup}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                >
                  <KeyRound size={14} />
                  <span>Join with Code</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map(group => {
                const isGroupAdmin = group.createdBy === user?.id || (group.adminIds && group.adminIds.includes(user?.id || ''));

                return (
                  <div
                    key={group.id}
                    className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5"
                  >
                    {/* Squad Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{group.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-white truncate">
                              {group.name}
                            </h3>
                            {isGroupAdmin && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/15 border border-amber-500/20 px-1 rounded font-semibold shrink-0 flex items-center gap-0.5">
                                <Crown size={10} /> Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {group.memberIds.length} members · {group.description}
                          </span>
                        </div>
                      </div>

                      {/* Invite Code button */}
                      <button
                        type="button"
                        onClick={() => copyCode(group.inviteCode)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-bold text-[#a78bfa] border border-slate-700 flex items-center gap-1 shrink-0"
                        title="Copy Invite Code"
                      >
                        <KeyRound size={11} />
                        <span>{group.inviteCode}</span>
                        {copiedCode === group.inviteCode && <Check size={11} className="text-emerald-400" />}
                      </button>
                    </div>

                    {/* Channels Pill list */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/80">
                      {group.channels.map(channel => (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => onSelectChannel(group.id, channel.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors text-xs text-slate-300 group active:scale-[0.99]"
                        >
                          <Hash size={14} className="text-slate-500 group-hover:text-[#a78bfa] shrink-0" />
                          <span className="font-medium truncate flex-1">{channel.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">Tap to chat</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Floating Action Button (FAB) at bottom-right */}
      <div className="absolute right-4 bottom-20 z-20">
        <button
          type="button"
          onClick={activeSegment === 'direct' ? (onOpenFriendRequests || onOpenDirectMessagesModal) : onOpenCreateGroup}
          className="w-14 h-14 rounded-2xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white shadow-xl shadow-[#5e17eb]/40 flex items-center justify-center transition-all border border-[#5e17eb]/40"
          title={activeSegment === 'direct' ? 'Add Friend / New Chat' : 'Create Squad'}
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}
