import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { UserAvatar } from '../common/UserAvatar';
import {
  UserPlus,
  X,
  Check,
  Ban,
  Clock,
  Send,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FriendRequestsModal({ isOpen, onClose }: FriendRequestsModalProps) {
  const {
    friendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'add' | 'incoming' | 'outgoing'>('incoming');
  const [targetInput, setTargetInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const msg = await sendFriendRequest(targetInput.trim());
      setSuccessMsg(msg || 'Friend request sent successfully!');
      setTargetInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send friend request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const incomingCount = friendRequests.incoming.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5e17eb]/20 text-[#a78bfa] border border-[#5e17eb]/30 flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Friends & Requests</h2>
              <p className="text-[11px] text-slate-400">
                Mutual connection required to see each other's accounts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/60 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('incoming');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'incoming'
                ? 'bg-[#5e17eb] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>Incoming</span>
            {incomingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {incomingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('add');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-[#5e17eb] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UserPlus size={13} />
            <span>Add Friend</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('outgoing');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'outgoing'
                ? 'bg-[#5e17eb] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>Sent ({friendRequests.outgoing.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto no-scrollbar space-y-4">
          {/* TAB 1: INCOMING REQUESTS */}
          {activeTab === 'incoming' && (
            <div className="space-y-3">
              {friendRequests.incoming.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <UserPlus size={32} className="mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-semibold text-white mb-1">No Pending Requests</p>
                  <p className="text-[11px] text-slate-400">
                    When someone sends you a friend request, it will appear here for you to accept.
                  </p>
                </div>
              ) : (
                friendRequests.incoming.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar
                        avatarUrl={req.senderAvatarUrl}
                        avatarIcon={req.senderAvatarIcon}
                        avatarColor={req.senderAvatarColor}
                        displayName={req.senderName}
                        size="md"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-white truncate block">
                          {req.senderName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate block">
                          @{req.senderUsername}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => acceptFriendRequest(req.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 flex items-center gap-1 transition-all"
                      >
                        <Check size={13} />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectFriendRequest(req.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="Decline"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: SEND FRIEND REQUEST */}
          {activeTab === 'add' && (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white">
                  Enter Friend's Username or Display Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="e.g. alex or alex_gamer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5e17eb]"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  You will only be able to view their account and chat once they accept your request.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle size={15} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !targetInput.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Sending Request...' : 'Send Friend Request'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: OUTGOING REQUESTS */}
          {activeTab === 'outgoing' && (
            <div className="space-y-3">
              {friendRequests.outgoing.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Clock size={32} className="mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-semibold text-white mb-1">No Pending Sent Requests</p>
                  <p className="text-[11px] text-slate-400">
                    Requests you send will stay here until the recipient accepts or declines.
                  </p>
                </div>
              ) : (
                friendRequests.outgoing.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-xs text-white block">
                        {req.receiverName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        @{req.receiverUsername}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock size={11} /> Pending
                      </span>
                      <button
                        type="button"
                        onClick={() => rejectFriendRequest(req.id)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-700/50 hover:border-red-500/30 text-[11px] font-medium transition-all"
                        title="Cancel friend request"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
