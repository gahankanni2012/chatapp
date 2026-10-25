import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types/chat';
import {
  Shield,
  X,
  Users,
  MessageSquare,
  Image as ImageIcon,
  Ban,
  CheckCircle,
  Hash,
  AlertTriangle,
  Search,
  Upload,
  RefreshCw,
  Trash2,
  ExternalLink,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminConsoleModal({ isOpen, onClose }: AdminConsoleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto pointer-events-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col relative text-slate-100">
        <ErrorBoundary fallbackTitle="Administrator Console Encountered an Issue" onReset={onClose}>
          <AdminConsoleModalInner isOpen={isOpen} onClose={onClose} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

function AdminConsoleModalInner({ isOpen, onClose }: AdminConsoleModalProps) {
  const { user } = useAuth();
  const {
    isAdmin,
    claimAdmin,
    fetchAdminUsers,
    blockUser,
    unblockUser,
    deleteUserByAdmin,
    purgeTestAccounts,
    fetchAdminAllChats,
    updateCustomLogo,
    customLogoUrl,
    selectChannel,
    selectDirectChat,
    deleteChannel,
    updateAdminPassword,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'users' | 'chats' | 'logo'>('users');
  const [adminUsersList, setAdminUsersList] = useState<User[]>([]);
  const [chatsData, setChatsData] = useState<{
    groupChats: any[];
    directConversations: any[];
    totalMessages: number;
  }>({
    groupChats: [],
    directConversations: [],
    totalMessages: 0,
  });

  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [selectedGroupChannel, setSelectedGroupChannel] = useState<{
    groupId?: string;
    channelId?: string;
    groupName: string;
    channelName: string;
    messages: any[];
  } | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Claim admin password prompt state
  const [claimPassword, setClaimPassword] = useState('');
  const [showClaimPassword, setShowClaimPassword] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // Security password management state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showNewAdminPass, setShowNewAdminPass] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passUpdateSuccess, setPassUpdateSuccess] = useState(false);

  // In-modal confirmation prompt state (avoiding window.confirm in iframes)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Logo upload state
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const users = await fetchAdminUsers();
      if (Array.isArray(users)) {
        setAdminUsersList(users);
      }
      const allChats = await fetchAdminAllChats();
      if (allChats) {
        setChatsData({
          groupChats: Array.isArray(allChats.groupChats) ? allChats.groupChats : [],
          directConversations: Array.isArray(allChats.directConversations) ? allChats.directConversations : [],
          totalMessages: typeof allChats.totalMessages === 'number' ? allChats.totalMessages : 0,
        });
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setErrorMessage(err?.message || 'Failed to load administrator data. Please verify your admin session.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.isAdmin) {
      loadData();
    }
  }, [isOpen, user?.isAdmin]);

  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleBlockToggle = (targetUser: User) => {
    const isCurrentlyBlocked = Boolean(targetUser.isBlocked);
    setConfirmDialog({
      title: isCurrentlyBlocked ? 'Unblock User' : 'Block User',
      description: isCurrentlyBlocked
        ? `Are you sure you want to unblock ${targetUser.displayName} (@${targetUser.username})? They will regain access to chat.`
        : `Are you sure you want to block ${targetUser.displayName} (@${targetUser.username})? Their active sessions will be terminated immediately.`,
      confirmText: isCurrentlyBlocked ? 'Unblock Account' : 'Block Account',
      isDanger: !isCurrentlyBlocked,
      onConfirm: async () => {
        if (isCurrentlyBlocked) {
          await unblockUser(targetUser.id);
          showToast(`Unblocked @${targetUser.username}`);
        } else {
          await blockUser(targetUser.id);
          showToast(`Blocked @${targetUser.username}`);
        }
        await loadData();
      },
    });
  };

  const handleDeleteUser = (targetUser: User) => {
    setConfirmDialog({
      title: 'Permanently Delete User',
      description: `Are you sure you want to permanently delete @${targetUser.username} (${targetUser.displayName}) and all of their messages? This action cannot be reversed.`,
      confirmText: 'Delete Permanently',
      isDanger: true,
      onConfirm: async () => {
        await deleteUserByAdmin(targetUser.id);
        showToast(`Account @${targetUser.username} was permanently removed.`);
        await loadData();
      },
    });
  };

  const handlePurgeTestAccounts = () => {
    setConfirmDialog({
      title: 'Purge All Test Accounts',
      description: 'Remove all placeholder and test accounts (usernames containing test, demo, sample, guest, temp)? Real user accounts will remain untouched.',
      confirmText: 'Purge Test Accounts',
      isDanger: true,
      onConfirm: async () => {
        const count = await purgeTestAccounts();
        showToast(`Purged ${count} test account(s).`);
        await loadData();
      },
    });
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewLogoPreview(event.target?.result as string);
      setLogoSaveSuccess(false);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogo = async () => {
    if (!newLogoPreview) return;
    setIsSavingLogo(true);
    setErrorMessage(null);
    try {
      await updateCustomLogo(newLogoPreview);
      setLogoSaveSuccess(true);
      showToast('Application logo updated successfully across the app!');
      setTimeout(() => setLogoSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update application logo');
    } finally {
      setIsSavingLogo(false);
    }
  };

  const safeUsersList = Array.isArray(adminUsersList) ? adminUsersList : [];
  const filteredUsers = safeUsersList.filter(u => {
    if (!u) return false;
    const dName = (u.displayName || '').toLowerCase();
    const uName = (u.username || '').toLowerCase();
    const query = (userSearch || '').trim().toLowerCase();
    return dName.includes(query) || uName.includes(query);
  });

  const handleClaimSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!claimPassword.trim()) {
      setClaimError('Please enter the administrator security password.');
      return;
    }
    setIsClaiming(true);
    setClaimError(null);
    try {
      await claimAdmin(claimPassword.trim());
      setClaimPassword('');
    } catch (err: any) {
      setClaimError(err?.message || 'Incorrect administrator password. Access denied.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword.trim() || newAdminPassword.trim().length < 4) {
      setErrorMessage('New password must be at least 4 characters long.');
      return;
    }
    setIsUpdatingPass(true);
    setErrorMessage(null);
    try {
      if (updateAdminPassword) {
        await updateAdminPassword(newAdminPassword.trim());
        setPassUpdateSuccess(true);
        setNewAdminPassword('');
        showToast('Administrator security password updated successfully!');
        setTimeout(() => setPassUpdateSuccess(false), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update administrator password');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto bg-slate-900 w-full max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-[#5e17eb]/20 border border-[#5e17eb]/40 flex items-center justify-center text-[#a78bfa] shadow-inner relative">
          <Shield size={32} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-[#5e17eb]/50 flex items-center justify-center text-amber-300">
            <Lock size={12} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Administrator Verification</h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Please enter the Administrator Security Password to claim administrator rights and access the Central Console.
          </p>
        </div>

        <form onSubmit={handleClaimSubmit} className="w-full space-y-3 pt-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <KeyRound size={16} />
            </div>
            <input
              type={showClaimPassword ? 'text' : 'password'}
              autoFocus
              value={claimPassword}
              onChange={e => {
                setClaimPassword(e.target.value);
                setClaimError(null);
              }}
              placeholder="Enter administrator password..."
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-[#5e17eb] focus:ring-1 focus:ring-[#5e17eb] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowClaimPassword(!showClaimPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showClaimPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {claimError && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 text-left">
              <AlertTriangle size={14} className="shrink-0 text-red-400" />
              <span>{claimError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isClaiming || !claimPassword.trim()}
              className="px-5 py-2 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Shield size={14} />
              <span>{isClaiming ? 'Verifying...' : 'Verify & Unlock'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#5e17eb]/20 text-[#a78bfa] border border-[#5e17eb]/40 flex items-center justify-center shadow-inner">
              <Shield size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Administrator Central Console
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#5e17eb] text-white">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Full authority: Monitor all chats, block/unblock users, and customize app logo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Console"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Global Toast or Error alerts */}
        {actionSuccessMessage && (
          <div className="mx-4 mt-3 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} />
              <span>{actionSuccessMessage}</span>
            </div>
            <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="px-2.5 py-1 bg-red-900 hover:bg-red-800 text-white rounded-lg text-[11px] font-bold shrink-0 ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'users'
                ? 'border-[#5e17eb] text-[#a78bfa] bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={15} />
            <span>User Management ({safeUsersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'chats'
                ? 'border-[#5e17eb] text-[#a78bfa] bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={15} />
            <span>Monitor All Chats</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logo')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'logo'
                ? 'border-[#5e17eb] text-[#a78bfa] bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon size={15} />
            <span>Application Logo</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar bg-slate-900/40">
          {/* TAB 1: USER MANAGEMENT & BLOCKING */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by username or display name..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5e17eb]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePurgeTestAccounts}
                    title="Remove all accounts with test, demo, sample, or guest handles"
                    className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Trash2 size={13} />
                    <span>Purge Test Accounts</span>
                  </button>

                  <div className="text-xs text-slate-400 hidden sm:block">
                    Total: <strong className="text-white">{safeUsersList.length}</strong> · Blocked:{' '}
                    <strong className="text-red-400">{safeUsersList.filter(u => u?.isBlocked).length}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-400">
                      {safeUsersList.length === 0 ? 'No registered user accounts found.' : 'No users match your search query.'}
                    </p>
                  </div>
                )}
                {filteredUsers.map(u => {
                  if (!u) return null;
                  const isSelf = u.id === user?.id;
                  const isBlocked = Boolean(u.isBlocked);

                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isBlocked
                          ? 'bg-red-950/20 border-red-500/30'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          avatarUrl={u.avatarUrl}
                          avatarIcon={u.avatarIcon || '👤'}
                          avatarColor={u.avatarColor || '#5e17eb'}
                          displayName={u.displayName || u.username}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-white truncate">
                              {u.displayName || u.username}
                            </span>
                            {u.isAdmin && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#5e17eb]/20 text-[#a78bfa] border border-[#5e17eb]/30">
                                Admin 👑
                              </span>
                            )}
                            {isBlocked && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                Blocked
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono truncate block">
                            @{u.username}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelf ? (
                          <span className="text-xs text-slate-500 italic px-2">You (Current Admin)</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleBlockToggle(u)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                isBlocked
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                              }`}
                            >
                              {isBlocked ? (
                                <>
                                  <CheckCircle size={14} />
                                  <span>Unblock</span>
                                </>
                              ) : (
                                <>
                                  <Ban size={14} />
                                  <span>Block</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              title="Delete Account Permanently"
                              className="p-1.5 rounded-xl text-xs font-bold transition-all bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white border border-slate-700 hover:border-transparent shadow-sm active:scale-95"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MONITOR ALL CHATS */}
          {activeTab === 'chats' && (
            <div className="space-y-5">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed">
                🛡️ <strong>Admin Live Inspection:</strong> As the Administrator, you have complete visibility over all group channel conversations and all private direct messages sent between users.
              </div>

              {/* Direct Messages Between Users */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Private 1-on-1 Direct Conversations
                </h3>

                {!chatsData?.directConversations || chatsData.directConversations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-950/30 rounded-xl border border-slate-800/40">
                    No direct conversations recorded yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {chatsData.directConversations.map((conv, idx) => {
                      if (!conv) return null;
                      const uAName = conv.userA?.displayName || conv.userA?.username || 'User A';
                      const uBName = conv.userB?.displayName || conv.userB?.username || 'User B';
                      const msgsCount = Array.isArray(conv.messages) ? conv.messages.length : 0;
                      const lastMsg = msgsCount > 0 ? conv.messages[msgsCount - 1] : null;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedConversation(conv);
                            setSelectedGroupChannel(null);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            selectedConversation === conv
                              ? 'bg-[#5e17eb]/20 border-[#5e17eb] shadow-md shadow-[#5e17eb]/20'
                              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-white truncate">
                              {uAName} ↔ {uBName}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {msgsCount} msgs
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            Last: "{lastMsg?.text || (lastMsg?.mediaUrl ? 'Attachment' : 'No messages')}"
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Squad Group Channels */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Squad Channels
                </h3>

                {!chatsData?.groupChats || chatsData.groupChats.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-950/30 rounded-xl border border-slate-800/40">
                    No squad groups created yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {chatsData.groupChats.map(group => {
                      if (!group) return null;
                      const channels = Array.isArray(group.channels) ? group.channels : [];

                      return (
                        <div key={group.groupId} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{group.groupIcon || '💬'}</span>
                            <span className="font-bold text-xs sm:text-sm text-white">{group.groupName || 'Squad'}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {channels.map((ch: any) => (
                              <div
                                key={ch.channelId}
                                className={`flex items-center rounded-xl overflow-hidden transition-all ${
                                  selectedGroupChannel?.channelName === ch.channelName && selectedGroupChannel?.groupName === group.groupName
                                    ? 'bg-[#5e17eb] text-white shadow-sm'
                                    : 'bg-slate-800 text-slate-300 hover:text-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedGroupChannel({
                                      groupId: group.groupId,
                                      channelId: ch.channelId,
                                      groupName: group.groupName,
                                      channelName: ch.channelName,
                                      messages: Array.isArray(ch.messages) ? ch.messages : [],
                                    });
                                    setSelectedConversation(null);
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                                >
                                  <Hash size={13} />
                                  <span>{ch.channelName}</span>
                                  <span className="text-[10px] opacity-75">
                                    ({Array.isArray(ch.messages) ? ch.messages.length : 0})
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (channels.length <= 1) {
                                      setConfirmDialog({
                                        title: 'Cannot Delete Only Channel',
                                        description: `#${ch.channelName} is the only channel in ${group.groupName}. Squads must have at least one channel. Create another channel first, or delete the entire squad.`,
                                        confirmText: 'Understood',
                                        isDanger: false,
                                        onConfirm: async () => {},
                                      });
                                    } else {
                                      setConfirmDialog({
                                        title: 'Delete Channel',
                                        description: `Delete channel #${ch.channelName} from ${group.groupName}? All messages inside will be permanently deleted.`,
                                        confirmText: 'Delete Channel',
                                        isDanger: true,
                                        onConfirm: async () => {
                                          await deleteChannel(group.groupId, ch.channelId);
                                          showToast(`Deleted channel #${ch.channelName}`);
                                          await loadData();
                                        },
                                      });
                                    }
                                  }}
                                  title={`Delete #${ch.channelName}`}
                                  className="px-2 py-1.5 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chat Message Viewer Inspector */}
              {(selectedConversation || selectedGroupChannel) && (
                <div className="mt-4 p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-2 flex-wrap">
                    <span className="font-bold text-xs text-white">
                      {selectedConversation
                        ? `Viewing DMs: ${selectedConversation.userA?.displayName || selectedConversation.userA?.username} & ${selectedConversation.userB?.displayName || selectedConversation.userB?.username}`
                        : `Viewing Squad Channel: ${selectedGroupChannel?.groupName} #${selectedGroupChannel?.channelName}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedConversation) {
                            const targetId = selectedConversation.userA?.id === user?.id
                              ? selectedConversation.userB?.id
                              : selectedConversation.userA?.id;
                            if (targetId) selectDirectChat(targetId);
                          } else if (selectedGroupChannel?.groupId && selectedGroupChannel?.channelId) {
                            selectChannel(selectedGroupChannel.groupId, selectedGroupChannel.channelId);
                          }
                          onClose();
                        }}
                        className="px-3 py-1 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-[11px] font-bold shadow-sm transition-all"
                      >
                        Open in Main Chat Area
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedConversation(null);
                          setSelectedGroupChannel(null);
                        }}
                        className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 no-scrollbar p-1">
                    {((selectedConversation?.messages || selectedGroupChannel?.messages) || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 text-center">No messages in this conversation yet.</p>
                    ) : (
                      ((selectedConversation?.messages || selectedGroupChannel?.messages) || []).map((m: any) => (
                        <div key={m.id || Math.random()} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#a78bfa]">
                              {m.senderName || 'User'} <span className="text-[10px] text-slate-400">(@{m.senderUsername || 'user'})</span>
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-slate-200">{m.text}</p>
                          {m.mediaUrl && (
                            <img src={m.mediaUrl} alt="attachment" className="mt-1.5 max-h-36 rounded-lg object-contain" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: APPLICATION LOGO */}
          {activeTab === 'logo' && (
            <div className="space-y-4 max-w-lg mx-auto py-2">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-center">
                <h3 className="text-sm font-bold text-white">Current Application Logo</h3>
                <div className="w-24 h-24 mx-auto rounded-3xl overflow-hidden border-2 border-[#5e17eb]/40 shadow-xl shadow-[#5e17eb]/20 bg-slate-950 flex items-center justify-center p-1 my-3">
                  <img
                    src={newLogoPreview || customLogoUrl || '/logo.svg'}
                    alt="Application Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.svg';
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The application logo appears in the top navigation, login screen, and app launcher.
                </p>
              </div>

              {/* Choose New Logo File */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-white">Upload New Logo Photo from Device</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-2 transition-all">
                    <Upload size={14} />
                    <span>Select Photo from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>
                  {newLogoPreview && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle size={13} /> Photo ready
                    </span>
                  )}
                </div>

                {newLogoPreview && (
                  <button
                    type="button"
                    disabled={isSavingLogo}
                    onClick={handleApplyLogo}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 transition-all disabled:opacity-50"
                  >
                    {isSavingLogo ? 'Saving...' : 'Save & Apply as Application Logo'}
                  </button>
                )}

                {logoSaveSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
                    ✓ Application logo updated successfully across the app!
                  </div>
                )}
              </div>

              {/* Administrator Security Password Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-[#a78bfa]" />
                  <label className="block text-xs font-bold text-white">Administrator Security Password</label>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This password protects the Administrator Central Console. Any device or user wishing to claim administrative rights must supply this password.
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-3 pt-1">
                  <div className="relative">
                    <input
                      type={showNewAdminPass ? 'text' : 'password'}
                      value={newAdminPassword}
                      onChange={e => setNewAdminPassword(e.target.value)}
                      placeholder="Enter new administrator password (min 4 chars)..."
                      className="w-full bg-slate-900 border border-slate-700 focus:border-[#5e17eb] focus:ring-1 focus:ring-[#5e17eb] rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAdminPass(!showNewAdminPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showNewAdminPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPass || !newAdminPassword.trim()}
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-[#5e17eb] text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isUpdatingPass ? 'Updating...' : 'Update Security Password'}
                  </button>

                  {passUpdateSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
                      ✓ Administrator security password updated successfully!
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>

        {/* In-Modal Confirmation Dialog */}
        {confirmDialog && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <AlertTriangle size={18} className={confirmDialog.isDanger ? 'text-red-400' : 'text-amber-400'} />
                <span>{confirmDialog.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {confirmDialog.description}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={() => setConfirmDialog(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={async () => {
                    setIsConfirming(true);
                    try {
                      await confirmDialog.onConfirm();
                      setConfirmDialog(null);
                    } catch (err: any) {
                      setErrorMessage(err?.message || 'Operation failed');
                    } finally {
                      setIsConfirming(false);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                    confirmDialog.isDanger
                      ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                      : 'bg-[#5e17eb] hover:bg-[#4f12cb] shadow-[#5e17eb]/30'
                  }`}
                >
                  {isConfirming ? 'Processing...' : confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
