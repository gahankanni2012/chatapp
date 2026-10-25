import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Plus,
  KeyRound,
  Compass,
  Crown,
  Hash,
  Copy,
  Check,
  LogOut,
  Trash2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface AndroidSquadsScreenProps {
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onSelectChannel: (groupId: string, channelId: string) => void;
}

export function AndroidSquadsScreen({
  onOpenCreateGroup,
  onOpenJoinGroup,
  onSelectChannel,
}: AndroidSquadsScreenProps) {
  const { user } = useAuth();
  const { myGroups, exploreGroups, joinGroup, leaveGroup, deleteGroup, customLogoUrl } = useChat();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteModalGroup, setDeleteModalGroup] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [leaveModalGroup, setLeaveModalGroup] = useState<any | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = async () => {
    if (!deleteModalGroup) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteGroup(deleteModalGroup.id);
      setDeleteModalGroup(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Could not delete group');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeave = async () => {
    if (!leaveModalGroup) return;
    setIsLeaving(true);
    try {
      await leaveGroup(leaveModalGroup.id);
      setLeaveModalGroup(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Header */}
      <header className="px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl overflow-hidden shadow-md shadow-[#5e17eb]/30 border border-[#5e17eb]/40 bg-slate-950 flex items-center justify-center p-0.5 shrink-0">
              <img src={customLogoUrl || '/logo.svg'} alt="KM Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                Squads & Groups
              </h1>
              <p className="text-[11px] text-slate-400">Manage your groups or explore communities</p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="py-2.5 px-3 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus size={15} />
            <span>Create Squad</span>
          </button>
          <button
            type="button"
            onClick={onOpenJoinGroup}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-[#5e17eb] active:bg-[#430fae] text-slate-200 hover:text-white text-xs font-bold border border-slate-700 hover:border-transparent flex items-center justify-center gap-1.5 transition-all"
          >
            <KeyRound size={15} />
            <span>Join with Code</span>
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4">
        {/* Section 1: My Squads */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
            My Squads ({myGroups.length})
          </div>

          {myGroups.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
              <span className="text-3xl block mb-2">🏝️</span>
              <p className="text-xs font-bold text-white mb-1">No Squads Yet</p>
              <p className="text-[11px] text-slate-400">
                You haven't created or joined any squads yet. Tap "Create Squad" or enter a join code above!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myGroups.map(group => {
                const isAdmin =
                  group.createdBy === user?.id ||
                  (group.adminIds && group.adminIds.includes(user?.id || ''));

                return (
                  <div
                    key={group.id}
                    className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{group.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white truncate">
                              {group.name}
                            </span>
                            {isAdmin && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-semibold shrink-0 flex items-center gap-0.5">
                                <Crown size={10} /> Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {group.memberIds.length} members · {group.channels.length} channels
                          </span>
                        </div>
                      </div>

                      {/* Invite Code button */}
                      <button
                        type="button"
                        onClick={() => copyCode(group.inviteCode)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-bold text-indigo-300 border border-slate-700 flex items-center gap-1 shrink-0"
                        title="Copy Invite Code"
                      >
                        <KeyRound size={11} />
                        <span>{group.inviteCode}</span>
                        {copiedCode === group.inviteCode && (
                          <Check size={11} className="text-emerald-400" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 italic px-1">"{group.description}"</p>

                    {/* Squad Channels chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1 px-1">
                      {group.channels.map(ch => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => onSelectChannel(group.id, ch.id)}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-[#5e17eb] text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <Hash size={11} className="text-indigo-400" />
                          <span>#{ch.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() =>
                          onSelectChannel(group.id, group.channels[0]?.id || 'general')
                        }
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <span>Open Channels</span>
                        <ArrowRight size={13} />
                      </button>

                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => setDeleteModalGroup(group)}
                          className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 size={13} />
                          <span>Delete Squad</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLeaveModalGroup(group)}
                          className="text-xs font-semibold text-slate-400 hover:text-red-400 flex items-center gap-1"
                        >
                          <LogOut size={13} />
                          <span>Leave</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Explore Public Squads */}
        <div className="pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Explore Public Squads
          </div>

          {exploreGroups.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/30 text-center text-xs text-slate-500">
              No new public squads available.
            </div>
          ) : (
            <div className="space-y-2">
              {exploreGroups.map(group => (
                <div
                  key={group.id}
                  className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/90 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0">{group.icon}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-white truncate block">
                        {group.name}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate block">
                        {group.memberIds.length} members · {group.description}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => joinGroup({ groupId: group.id })}
                    className="px-3.5 py-1.5 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-sm transition-all shrink-0"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl p-5">
            <div className="flex items-center gap-2.5 text-red-400 mb-2">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold text-white">Delete Squad</h3>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Delete squad <strong className="text-white">{deleteModalGroup.name}</strong>? This action cannot be undone.
            </p>
            {deleteError && (
              <p className="text-xs text-red-400 font-medium mb-3">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalGroup(null);
                  setDeleteError(null);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {leaveModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5">
            <div className="flex items-center gap-2.5 text-amber-400 mb-2">
              <LogOut size={20} />
              <h3 className="text-sm font-bold text-white">Leave Squad</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Leave squad <strong className="text-white">{leaveModalGroup.name}</strong>? You can rejoin later with the invite code.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLeaveModalGroup(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLeave}
                disabled={isLeaving}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 disabled:opacity-50"
              >
                {isLeaving ? 'Leaving...' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
