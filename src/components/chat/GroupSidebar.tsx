import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';
import {
  Hash,
  Plus,
  Users,
  Copy,
  Check,
  ChevronDown,
  LogOut,
  Trash2,
  Crown,
  Shield,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  AlertTriangle,
  X,
  UserPlus,
} from 'lucide-react';

interface GroupSidebarProps {
  onOpenAddChannel: () => void;
  onOpenProfile: () => void;
  onOpenDirectMessages: () => void;
  onToggleMembers: () => void;
  onOpenFeatures: () => void;
  onOpenFriendRequests?: () => void;
  onSelectChatMobile?: () => void;
  onCloseMobileDrawer?: () => void;
  isMobileDrawer?: boolean;
}

export function GroupSidebar({
  onOpenAddChannel,
  onOpenProfile,
  onOpenDirectMessages,
  onToggleMembers,
  onOpenFeatures,
  onOpenFriendRequests,
  onSelectChatMobile,
  onCloseMobileDrawer,
  isMobileDrawer = false,
}: GroupSidebarProps) {
  const { user } = useAuth();
  const {
    activeChat,
    currentGroup,
    allUsers,
    onlineUserIds,
    friendRequests,
    selectChannel,
    selectDirectChat,
    leaveGroup,
    deleteGroup,
    deleteChannel,
    customLogoUrl,
  } = useChat();

  const [copiedCode, setCopiedCode] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [channelToDelete, setChannelToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingChannel, setIsDeletingChannel] = useState(false);
  const [channelDeleteError, setChannelDeleteError] = useState<string | null>(null);

  const isDirect = activeChat.type === 'direct';

  const isGroupAdmin = Boolean(
    currentGroup &&
      (currentGroup.createdBy === user?.id ||
        (currentGroup.adminIds && currentGroup.adminIds.includes(user?.id || '')) ||
        user?.isAdmin ||
        currentGroup.memberIds.includes(user?.id || ''))
  );

  const handleDeleteChannelConfirm = async () => {
    if (!currentGroup || !channelToDelete) return;
    setIsDeletingChannel(true);
    setChannelDeleteError(null);
    try {
      await deleteChannel(currentGroup.id, channelToDelete.id);
      setChannelToDelete(null);
    } catch (err: any) {
      setChannelDeleteError(err.message || 'Failed to delete channel');
    } finally {
      setIsDeletingChannel(false);
    }
  };

  const copyInviteCode = () => {
    if (currentGroup?.inviteCode) {
      navigator.clipboard.writeText(currentGroup.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDeleteGroup = async () => {
    if (!currentGroup) return;
    setIsDeleting(true);
    setDeleteGroupError(null);
    try {
      await deleteGroup(currentGroup.id);
      setShowDeleteModal(false);
      setShowGroupMenu(false);
    } catch (err: any) {
      setDeleteGroupError(err.message || 'Failed to delete group');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentGroup) return;
    setIsLeaving(true);
    try {
      await leaveGroup(currentGroup.id);
      setShowLeaveModal(false);
      setShowGroupMenu(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLeaving(false);
    }
  };

  // Filter friends for DM sidebar
  const otherUsers = allUsers.filter(u => u.id !== user?.id);
  const filteredUsers = otherUsers.filter(u =>
    u.displayName.toLowerCase().includes(dmSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(dmSearch.toLowerCase())
  );

  return (
    <>
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none shrink-0">
        {/* Top Header */}
        {!isDirect && currentGroup ? (
          <div className="relative border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setShowGroupMenu(!showGroupMenu)}
              className="flex-1 h-14 px-4 flex items-center justify-between hover:bg-slate-800/60 transition-colors text-left min-w-0"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-xl shrink-0">{currentGroup.icon}</span>
                <div className="truncate">
                  <span className="font-bold text-white text-sm truncate tracking-tight block">
                    {currentGroup.name}
                  </span>
                  {isGroupAdmin && (
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      <Crown size={11} /> Group Admin
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform shrink-0 ml-1 ${showGroupMenu ? 'rotate-180' : ''}`}
              />
            </button>
            {isMobileDrawer && onCloseMobileDrawer && (
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="p-2 mr-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            )}

            {/* Group Dropdown Menu */}
            {showGroupMenu && (
              <div className="absolute top-14 left-2 right-2 z-30 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Admin Status Pill */}
                {isGroupAdmin && (
                  <div className="px-3 py-1.5 mb-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                    <Shield size={14} className="text-amber-400" />
                    <span>You are the Group Admin</span>
                  </div>
                )}

                {/* Copy Invite Code item */}
                <button
                  onClick={() => {
                    copyInviteCode();
                    setShowGroupMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-indigo-400 hover:bg-indigo-600/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Copy size={14} />
                    <span>Invite Code: <span className="font-mono text-white">{currentGroup.inviteCode}</span></span>
                  </div>
                  {copiedCode ? <Check size={14} className="text-emerald-400" /> : null}
                </button>

                <button
                  onClick={() => {
                    onOpenAddChannel();
                    setShowGroupMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <Plus size={14} />
                  <span>Create Channel</span>
                </button>

                <button
                  onClick={() => {
                    onToggleMembers();
                    setShowGroupMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <Users size={14} />
                  <span>View Group Members ({currentGroup.memberIds.length})</span>
                </button>

                <button
                  onClick={() => {
                    onOpenFeatures();
                    setShowGroupMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  <Sparkles size={14} />
                  <span>App Features & Guide</span>
                </button>

                <div className="h-[1px] bg-slate-800 my-1" />

                {/* Delete Channel Option */}
                {isGroupAdmin && (
                  <button
                    onClick={() => {
                      const ch = currentGroup.channels.find(c => c.id === activeChat.channelId) || currentGroup.channels[0];
                      if (ch) {
                        setChannelToDelete({ id: ch.id, name: ch.name });
                      }
                      setShowGroupMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Delete Text Channel</span>
                  </button>
                )}

                {/* Delete Group (Admin only) OR Leave Group (Members) */}
                {isGroupAdmin ? (
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowGroupMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/15 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Delete Group (Admin)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowLeaveModal(true);
                      setShowGroupMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Leave Group</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-white font-bold text-sm min-w-0">
              <div className="w-7 h-7 rounded-xl overflow-hidden shadow-sm border border-[#5e17eb]/40 bg-slate-950 flex items-center justify-center p-0.5 shrink-0">
                <img
                  src={customLogoUrl || '/logo.svg'}
                  alt="KM Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="truncate">Direct Messages</span>
            </div>
            <div className="flex items-center gap-1.5">
              {onOpenFriendRequests && (
                <button
                  onClick={onOpenFriendRequests}
                  title="Friends & Friend Requests"
                  className="relative p-1.5 rounded-lg bg-slate-800 hover:bg-[#5e17eb] text-slate-300 hover:text-white transition-colors"
                >
                  <UserPlus size={16} />
                  {friendRequests.incoming.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {friendRequests.incoming.length}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={onOpenFeatures}
                title="View App Features"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
              >
                <Sparkles size={16} />
              </button>
              <button
                onClick={onOpenDirectMessages}
                title="Start new DM"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#5e17eb] text-slate-300 hover:text-white transition-colors"
              >
                <Plus size={16} />
              </button>
              {isMobileDrawer && onCloseMobileDrawer && (
                <button
                  type="button"
                  onClick={onCloseMobileDrawer}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  aria-label="Close drawer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Middle Content List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4">
          {!isDirect && currentGroup ? (
            <>
              {/* Invite Code banner */}
              <div className="p-3 bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-900/40 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                    Friend Join Code
                  </span>
                  <span className="font-mono text-sm font-bold text-white tracking-widest">
                    {currentGroup.inviteCode}
                  </span>
                </div>
                <button
                  onClick={copyInviteCode}
                  className="p-2 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white transition-colors shadow-sm"
                  title="Copy Invite Code to share with friends"
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              {/* Channels Section */}
              <div>
                <div className="flex items-center justify-between px-2 mb-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Text Channels</span>
                  <button
                    onClick={onOpenAddChannel}
                    title="Create Channel"
                    className="hover:text-white transition-colors p-0.5 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="space-y-1">
                  {currentGroup.channels.map(channel => {
                    const isActive =
                      activeChat.type === 'channel' && activeChat.channelId === channel.id;
                    const canDeleteThisChannel = isGroupAdmin;

                    return (
                      <div
                        key={channel.id}
                        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-[#5e17eb] text-white shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            selectChannel(currentGroup.id, channel.id);
                            onSelectChatMobile?.();
                          }}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left py-0.5"
                        >
                          <Hash
                            size={16}
                            className={isActive ? 'text-white shrink-0' : 'text-slate-500 group-hover:text-slate-300 shrink-0'}
                          />
                          <span className="truncate">{channel.name}</span>
                        </button>

                        {canDeleteThisChannel && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChannelToDelete({ id: channel.id, name: channel.name });
                            }}
                            title={`Delete #${channel.name}`}
                            className={`p-1.5 rounded-lg transition-all shrink-0 ml-1.5 ${
                              isActive
                                ? 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20'
                                : 'text-slate-400 hover:text-red-400 hover:bg-slate-700/80'
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group Info pill */}
              <div className="pt-2 border-t border-slate-800/60 px-2">
                <p className="text-xs text-slate-400 italic line-clamp-2">
                  "{currentGroup.description}"
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <Users size={12} />
                  <span>{currentGroup.memberIds.length} members</span>
                  <span>•</span>
                  <span>Created by {currentGroup.creatorName}</span>
                </div>
              </div>
            </>
          ) : (
            /* Direct Messages Friends List */
            <div className="space-y-3">
              {/* Search filter */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={dmSearch}
                  onChange={e => setDmSearch(e.target.value)}
                  placeholder="Find a friend..."
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5e17eb]"
                />
              </div>

              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Friends ({otherUsers.length})
              </div>

              <div className="space-y-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    {otherUsers.length === 0 ? (
                      <>
                        <p>No other friends yet!</p>
                        <p className="mt-1 text-[11px] text-[#a78bfa]">
                          Send a friend request to connect!
                        </p>
                      </>
                    ) : (
                      'No friends match your search.'
                    )}
                  </div>
                ) : (
                  filteredUsers.map(friend => {
                    const isOnline = onlineUserIds.includes(friend.id);
                    const isActive = activeChat.type === 'direct' && activeChat.friendId === friend.id;

                    return (
                      <button
                        key={friend.id}
                        onClick={() => {
                          selectDirectChat(friend.id);
                          onSelectChatMobile?.();
                        }}
                        className={`w-full flex items-center gap-3 px-2.5 py-2.5 sm:py-2 rounded-xl text-left transition-all min-h-[44px] ${
                          isActive
                            ? 'bg-[#5e17eb] text-white shadow-sm'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {/* Avatar with custom picture & status badge */}
                        <UserAvatar
                          avatarUrl={friend.avatarUrl}
                          avatarIcon={friend.avatarIcon}
                          avatarColor={friend.avatarColor}
                          displayName={friend.displayName}
                          size="sm"
                          showStatus
                          isOnline={isOnline}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs truncate">
                              {friend.displayName}
                            </span>
                          </div>
                          <span className={`text-[11px] truncate block ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                            @{friend.username}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Status Bar Bottom Dock */}
        <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:bg-slate-800/80 p-1.5 rounded-xl transition-colors text-left"
          >
            <UserAvatar
              avatarUrl={user?.avatarUrl}
              avatarIcon={user?.avatarIcon}
              avatarColor={user?.avatarColor}
              displayName={user?.displayName}
              size="sm"
              showStatus
              isOnline={true}
            />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.displayName}
              </p>
              <p className="text-[11px] text-slate-400 truncate leading-tight">
                @{user?.username}
              </p>
            </div>
          </button>

          <button
            onClick={onOpenProfile}
            title="Account Settings & Profile"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Delete Group Confirmation Modal (Admin only) */}
      {showDeleteModal && currentGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl p-6">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Group</h3>
                <span className="text-xs text-red-400 font-semibold">Admin Authorization Required</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-white">{currentGroup.name}</strong>? This action will permanently remove all text channels, messages, and membership for everyone. This cannot be undone.
            </p>

            {deleteGroupError && (
              <p className="text-xs text-red-400 font-medium mb-3">
                {deleteGroupError}
              </p>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteGroupError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Group'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Confirmation Modal */}
      {showLeaveModal && currentGroup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
                <LogOut size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Leave Group</h3>
                <span className="text-xs text-slate-400">Exit this squad</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to leave <strong className="text-white">{currentGroup.name}</strong>? You can rejoin later using the invite code.
            </p>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                disabled={isLeaving}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLeaveGroup}
                disabled={isLeaving}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                <LogOut size={14} />
                <span>{isLeaving ? 'Leaving...' : 'Yes, Leave'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Channel Confirmation Modal */}
      {channelToDelete && (
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
                      #{channelToDelete.name} is the only channel
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 leading-relaxed">
                  Every squad requires at least one channel for conversation. To delete <strong className="text-white">#{channelToDelete.name}</strong>, create another channel first (or delete the entire squad).
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setChannelToDelete(null);
                      setChannelDeleteError(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Got It
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChannelToDelete(null);
                      onOpenAddChannel();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Create Another Channel</span>
                  </button>
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
                      Are you sure you want to delete <span className="font-mono text-indigo-400 font-bold">#{channelToDelete.name}</span>?
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 leading-relaxed">
                  ⚠️ All messages and media in <strong className="text-white">#{channelToDelete.name}</strong> will be permanently removed.
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
                      setChannelToDelete(null);
                      setChannelDeleteError(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingChannel}
                    onClick={handleDeleteChannelConfirm}
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
    </>
  );
}
