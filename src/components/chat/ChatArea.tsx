import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types/chat';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { UserAvatar } from '../common/UserAvatar';
import { DeviceModeToggle } from '../common/DeviceModeToggle';
import {
  Hash,
  Users,
  Search,
  UserPlus,
  Radio,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Plus,
  Compass,
  Menu,
  ChevronLeft,
  Shield,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface ChatAreaProps {
  onToggleMembers: () => void;
  showMembers: boolean;
  onOpenInviteModal: () => void;
  onOpenFeatures: () => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onOpenAddChannel?: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenAdminConsole?: () => void;
  onBack?: () => void;
}

export function ChatArea({
  onToggleMembers,
  showMembers,
  onOpenInviteModal,
  onOpenFeatures,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onOpenAddChannel,
  onOpenMobileSidebar,
  onOpenAdminConsole,
  onBack,
}: ChatAreaProps) {
  const { user } = useAuth();
  const {
    activeChat,
    currentGroup,
    currentChannel,
    currentFriend,
    messages,
    isLoadingMessages,
    typingUsers,
    onlineUserIds,
    customLogoUrl,
    deleteChannel,
  } = useChat();

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDeleteChannelModal, setShowDeleteChannelModal] = useState(false);
  const [isDeletingChannel, setIsDeletingChannel] = useState(false);
  const [channelDeleteError, setChannelDeleteError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const isDirect = activeChat.type === 'direct';
  const isFriendOnline = currentFriend ? onlineUserIds.includes(currentFriend.id) : false;

  const isGroupAdmin = Boolean(
    currentGroup &&
      (currentGroup.createdBy === user?.id ||
        (currentGroup.adminIds && currentGroup.adminIds.includes(user?.id || '')) ||
        user?.isAdmin ||
        currentGroup.memberIds.includes(user?.id || ''))
  );

  const canDeleteCurrentChannel =
    !isDirect &&
    Boolean(currentGroup && currentChannel && isGroupAdmin);

  const handleDeleteCurrentChannel = async () => {
    if (!currentGroup || !currentChannel) return;
    setIsDeletingChannel(true);
    setChannelDeleteError(null);
    try {
      await deleteChannel(currentGroup.id, currentChannel.id);
      setShowDeleteChannelModal(false);
    } catch (err: any) {
      setChannelDeleteError(err.message || 'Failed to delete channel');
    } finally {
      setIsDeletingChannel(false);
    }
  };

  // Filter messages if search active
  const filteredMessages = searchQuery.trim()
    ? messages.filter(
        m =>
          m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-950 min-w-0">
      {/* Top Header */}
      <header className="h-14 px-3 sm:px-4 border-b border-slate-800 flex items-center justify-between select-none bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center w-9 h-9 -ml-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors shrink-0 active:scale-95"
              aria-label="Back to chats"
              title="Back"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {onOpenMobileSidebar && !onBack && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shrink-0"
              aria-label="Open Groups and Channels Menu"
              title="Open menu"
            >
              <Menu size={18} />
            </button>
          )}

          {!isDirect && currentChannel ? (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-white text-sm sm:text-base truncate leading-tight">
                <Hash size={16} className="text-indigo-400 shrink-0" />
                <span className="truncate">{currentChannel.name}</span>
                {canDeleteCurrentChannel && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteChannelModal(true)}
                    title={`Delete channel #${currentChannel.name}`}
                    className="p-1 px-2 rounded-xl text-slate-300 hover:text-red-400 bg-slate-800/80 hover:bg-red-500/15 border border-slate-700/80 hover:border-red-500/40 transition-all ml-2 flex items-center gap-1 shrink-0 shadow-sm"
                  >
                    <Trash2 size={13} className="text-red-400" />
                    <span className="text-[11px] font-semibold text-slate-200 hover:text-red-300">
                      Delete Channel
                    </span>
                  </button>
                )}
              </div>
              {currentGroup && (
                <span className="text-[10px] text-slate-400 truncate block leading-none mt-0.5">
                  {currentGroup.icon} {currentGroup.name}
                </span>
              )}
            </div>
          ) : isDirect && currentFriend ? (
            <div className="flex items-center gap-2.5">
              <UserAvatar
                avatarUrl={currentFriend.avatarUrl}
                avatarIcon={currentFriend.avatarIcon}
                avatarColor={currentFriend.avatarColor}
                displayName={currentFriend.displayName}
                size="sm"
                showStatus
                isOnline={isFriendOnline}
              />
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span>{currentFriend.displayName}</span>
                  <span className="text-xs text-slate-400 font-normal">(@{currentFriend.username})</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {isFriendOnline ? (
                    <span className="text-emerald-400 font-medium">Online now</span>
                  ) : (
                    <span>Offline</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-950 border border-[#5e17eb]/40 p-1 flex items-center justify-center shadow-md shadow-[#5e17eb]/20 shrink-0">
                <img
                  src={customLogoUrl || '/logo.svg'}
                  alt="KirraK MuchatlU Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-white font-bold text-sm tracking-tight">KirraK MuchatlU</div>
                <div className="text-slate-400 text-[11px]">Select a group channel or friend conversation</div>
              </div>
            </div>
          )}
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search toggle */}
          {showSearch ? (
            <div className="relative flex items-center animate-in fade-in">
              <Search size={14} className="absolute left-2.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-40 sm:w-56 bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-7 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="absolute right-2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              title="Search chat"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Search size={18} />
            </button>
          )}

          {/* Admin Central Console Shield */}
          {onOpenAdminConsole && (
            <button
              type="button"
              onClick={onOpenAdminConsole}
              title={user?.isAdmin ? "Administrator Central Console" : "Administrator Verification (Enter Password)"}
              className={`p-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
                user?.isAdmin
                  ? 'bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white shadow-md shadow-[#5e17eb]/30'
                  : 'bg-slate-800 hover:bg-[#5e17eb] text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Shield size={16} />
              <span className="hidden xl:inline text-xs font-semibold">
                {user?.isAdmin ? 'Admin Console' : 'Claim Admin'}
              </span>
            </button>
          )}

          {/* All Features Guide Button */}
          <button
            onClick={onOpenFeatures}
            title="Explore All Application Features & Shortcuts"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all hover:scale-105 shrink-0"
          >
            <Sparkles size={14} className="text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">All Features</span>
          </button>

          {!isDirect && (
            <>
              {/* Invite Friend button */}
              <button
                onClick={onOpenInviteModal}
                title="Invite friend to group"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5e17eb]/20 hover:bg-[#5e17eb]/30 text-[#a78bfa] hover:text-white border border-[#5e17eb]/40 rounded-xl text-xs font-semibold transition-colors"
              >
                <UserPlus size={15} />
                <span className="hidden sm:inline">Invite</span>
              </button>

              {/* Members toggle button */}
              <button
                onClick={onToggleMembers}
                title="Toggle group members list"
                className={`p-2 rounded-xl transition-colors ${
                  showMembers
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users size={18} />
              </button>
            </>
          )}

          {/* Device Format Switcher */}
          <DeviceModeToggle variant="compact" />
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-1 select-text"
      >
        {/* Clickable Features Directory Banner (Replaces old welcome message) */}
        <div
          onClick={onOpenFeatures}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onOpenFeatures();
          }}
          className="group mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/15 transition-all cursor-pointer select-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-[#5e17eb]/40 flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 shadow-lg shadow-[#5e17eb]/30 transition-transform">
                <img
                  src={customLogoUrl || '/logo.svg'}
                  alt="KirraK MuchatlU Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                    Explore All Features of KirraK MuchatlU
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Click to Open
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Click here to view the full features directory and quickly jump to create groups, add channels, invite friends with codes, start direct messages, or edit your profile!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFeatures();
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 shrink-0 transition-transform group-hover:translate-x-1"
            >
              <span>View Features</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Empty state when user is not in any group and has no active DM */}
        {!currentChannel && !currentFriend && (
          <div className="py-12 px-4 max-w-md mx-auto text-center flex flex-col items-center animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-[#5e17eb]/40 flex items-center justify-center p-2.5 mb-4 shadow-xl shadow-[#5e17eb]/20">
              <img
                src={customLogoUrl || '/logo.svg'}
                alt="KirraK MuchatlU Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Groups Joined Yet</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              You don't have any groups in your account right now. You can create your own custom squad or join a friend's group with their invite code!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onOpenCreateGroup}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <Plus size={15} />
                <span>Create Group</span>
              </button>
              <button
                type="button"
                onClick={onOpenJoinGroup}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <Compass size={15} />
                <span>Join with Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoadingMessages && (
          <div className="flex items-center justify-center py-8 text-slate-500 text-xs">
            Loading message history...
          </div>
        )}

        {/* Message Items */}
        {filteredMessages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onReply={(replyMsg) => setReplyingTo(replyMsg)}
          />
        ))}

        {/* Search empty result */}
        {searchQuery.trim() && filteredMessages.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs">
            No messages matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-1 text-xs text-slate-400 flex items-center gap-2 bg-slate-900/40">
          <span className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          <span>
            <strong className="text-indigo-300">
              {typingUsers.map(t => t.userName).join(', ')}
            </strong>{' '}
            {typingUsers.length === 1 ? 'is typing...' : 'are typing...'}
          </span>
        </div>
      )}

      {/* Bottom Input Area */}
      <MessageInput
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={!currentChannel && !currentFriend}
        placeholder={
          !isDirect && currentChannel
            ? `Message #${currentChannel.name}`
            : isDirect && currentFriend
            ? `Message @${currentFriend.displayName}`
            : 'Select a squad channel or friend to start chatting...'
        }
      />

      {/* Android Gesture Bar */}
      <div className="py-1 bg-slate-900 flex justify-center pb-safe shrink-0">
        <div className="w-28 h-1 bg-slate-600/50 rounded-full" />
      </div>

      {/* Delete Channel Confirmation Modal */}
      {showDeleteChannelModal && currentChannel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            {currentGroup && currentGroup.channels.length <= 1 ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Cannot Delete Only Channel</h3>
                    <p className="text-xs text-slate-400">
                      #{currentChannel.name} is the only channel
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 leading-relaxed">
                  Every squad requires at least one channel for conversation. To delete <strong className="text-white">#{currentChannel.name}</strong>, create another channel first (or delete the entire squad).
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteChannelModal(false);
                      setChannelDeleteError(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Got It
                  </button>
                  {onOpenAddChannel && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteChannelModal(false);
                        onOpenAddChannel();
                      }}
                      className="px-4 py-2 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 transition-all flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Create Another Channel</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Delete Channel</h3>
                    <p className="text-xs text-slate-400">
                      Are you sure you want to delete <span className="font-mono text-indigo-400 font-bold">#{currentChannel.name}</span>?
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 leading-relaxed">
                  ⚠️ All messages and media in <strong className="text-white">#{currentChannel.name}</strong> will be permanently deleted.
                </p>

                {channelDeleteError && (
                  <p className="text-xs text-red-400 font-medium px-1">
                    {channelDeleteError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isDeletingChannel}
                    onClick={() => {
                      setShowDeleteChannelModal(false);
                      setChannelDeleteError(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingChannel}
                    onClick={handleDeleteCurrentChannel}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all disabled:opacity-50"
                  >
                    {isDeletingChannel ? 'Deleting...' : 'Delete Channel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
