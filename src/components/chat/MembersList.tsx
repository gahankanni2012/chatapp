import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';
import { Crown, MessageSquare, Copy, Check, UserPlus, Shield, X, Users } from 'lucide-react';

interface MembersListProps {
  onClose: () => void;
  onOpenInviteModal: () => void;
  isMobileDrawer?: boolean;
}

export function MembersList({ onClose, onOpenInviteModal }: MembersListProps) {
  const { user } = useAuth();
  const { currentGroup, allUsers, onlineUserIds, selectDirectChat } = useChat();

  const [copiedCode, setCopiedCode] = useState(false);

  if (!currentGroup) return null;

  // Split members into online and offline
  const groupMembers = allUsers.filter(u => currentGroup.memberIds.includes(u.id));
  const onlineMembers = groupMembers.filter(m => onlineUserIds.includes(m.id));
  const offlineMembers = groupMembers.filter(m => !onlineUserIds.includes(m.id));

  const copyInvite = () => {
    navigator.clipboard.writeText(currentGroup.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isMemberAdmin = (memberId: string) => {
    return (
      memberId === currentGroup.createdBy ||
      (currentGroup.adminIds && currentGroup.adminIds.includes(memberId))
    );
  };

  return (
    <aside className="w-full md:w-60 bg-slate-900 border-l border-slate-800 flex flex-col h-full select-none shrink-0 overflow-y-auto no-scrollbar p-3 space-y-4">
      {/* Header with Close */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Users size={14} className="text-indigo-400" />
          <span>Members ({groupMembers.length})</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close members list"
        >
          <X size={16} />
        </button>
      </div>

      {/* Share Invite Code Widget */}
      <div className="p-3 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-indigo-800/40 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Invite Friends
          </span>
          <button
            onClick={onOpenInviteModal}
            className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 font-medium"
          >
            <UserPlus size={12} /> Add
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-2">
          Give friends this code to let them join:
        </p>
        <button
          onClick={copyInvite}
          className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900/90 border border-indigo-700/60 hover:border-indigo-500 text-white font-mono text-xs flex items-center justify-between transition-colors shadow-inner"
        >
          <span className="font-bold tracking-widest">{currentGroup.inviteCode}</span>
          {copiedCode ? (
            <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-sans">
              <Check size={13} /> Copied!
            </span>
          ) : (
            <span className="text-indigo-400 flex items-center gap-1 text-[11px] font-sans">
              <Copy size={13} /> Copy
            </span>
          )}
        </button>
      </div>

      {/* Online Members */}
      <div>
        <div className="px-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Online — {onlineMembers.length}</span>
        </div>

        <div className="space-y-1">
          {onlineMembers.map(member => {
            const isAdmin = isMemberAdmin(member.id);
            const isSelf = member.id === user?.id;

            return (
              <div
                key={member.id}
                className="group flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar
                    avatarUrl={member.avatarUrl}
                    avatarIcon={member.avatarIcon}
                    avatarColor={member.avatarColor}
                    displayName={member.displayName}
                    size="sm"
                    showStatus
                    isOnline={true}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1 truncate">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {member.displayName}
                      </span>
                      {isAdmin && (
                        <span title="Group Admin" className="shrink-0 flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-500/15 px-1 rounded font-semibold border border-amber-500/20">
                          <Crown size={10} /> Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 truncate block">
                      @{member.username} {isSelf && '(You)'}
                    </span>
                  </div>
                </div>

                {!isSelf && (
                  <button
                    onClick={() => selectDirectChat(member.id)}
                    title={`Message @${member.username}`}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-400 transition-opacity"
                  >
                    <MessageSquare size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline Members */}
      {offlineMembers.length > 0 && (
        <div>
          <div className="px-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Offline — {offlineMembers.length}
          </div>

          <div className="space-y-1 opacity-70">
            {offlineMembers.map(member => {
              const isAdmin = isMemberAdmin(member.id);
              const isSelf = member.id === user?.id;

              return (
                <div
                  key={member.id}
                  className="group flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                      avatarUrl={member.avatarUrl}
                      avatarIcon={member.avatarIcon}
                      avatarColor={member.avatarColor}
                      displayName={member.displayName}
                      size="sm"
                      showStatus
                      isOnline={false}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1 truncate">
                        <span className="text-xs font-semibold text-slate-300 truncate">
                          {member.displayName}
                        </span>
                        {isAdmin && (
                          <span title="Group Admin" className="shrink-0 flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-500/15 px-1 rounded font-semibold border border-amber-500/20">
                            <Crown size={10} /> Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block">
                        @{member.username}
                      </span>
                    </div>
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() => selectDirectChat(member.id)}
                      title={`Message @${member.username}`}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-400 transition-opacity"
                    >
                      <MessageSquare size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
