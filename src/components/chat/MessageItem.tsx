import React, { useState } from 'react';
import { Message } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { UserAvatar } from '../common/UserAvatar';
import { Reply, Smile, Copy, Check, MoreHorizontal } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onReply: (message: Message) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '🎉', '🚀'];

export function MessageItem({ message, onReply }: MessageItemProps) {
  const { user } = useAuth();
  const { reactToMessage } = useChat();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const isCurrentUser = message.senderId === user?.id;
  const isSystem = message.senderId === 'system';

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyText = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isSystem) {
    return (
      <div className="flex items-center gap-3 my-3 px-4 py-2 bg-indigo-950/20 border border-indigo-800/30 rounded-2xl text-xs text-indigo-300">
        <span className="text-base">{message.senderAvatarIcon || '🤖'}</span>
        <span className="flex-1 font-medium">{message.text}</span>
        <span className="text-[10px] text-indigo-400/70">{formatTime(message.createdAt)}</span>
      </div>
    );
  }

  return (
    <div className="group relative flex gap-3.5 px-4 py-2 hover:bg-slate-800/40 rounded-2xl transition-colors">
      {/* Sender Avatar */}
      <div className="shrink-0 mt-0.5">
        <UserAvatar
          avatarUrl={message.senderAvatarUrl}
          avatarIcon={message.senderAvatarIcon}
          avatarColor={message.senderAvatarColor}
          displayName={message.senderName}
          size="md"
        />
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        {/* Reply context if present */}
        {message.replyTo && (
          <div className="flex items-center gap-2 mb-1 text-xs text-slate-400 pl-2 border-l-2 border-indigo-500/60">
            <Reply size={12} className="rotate-180 text-indigo-400" />
            <span className="font-semibold text-indigo-300">@{message.replyTo.senderName}</span>
            <span className="truncate italic text-slate-500">"{message.replyTo.text}"</span>
          </div>
        )}

        {/* Sender Info & Timestamp */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-sm text-white hover:underline cursor-pointer">
            {message.senderName}
          </span>
          <span className="text-xs text-slate-500">
            @{message.senderUsername}
          </span>
          <span className="text-[11px] text-slate-500">
            {formatTime(message.createdAt)}
          </span>
          {isCurrentUser && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              You
            </span>
          )}
        </div>

        {/* Message Content */}
        <div className="text-sm text-slate-200 leading-relaxed break-words whitespace-pre-wrap selection:bg-indigo-600">
          {message.text}
        </div>

        {/* Media / Image preview if attached */}
        {message.mediaUrl && (
          <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
            <img
              src={message.mediaUrl}
              alt="attachment"
              className="max-h-64 w-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Reactions List */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.reactions.map((reaction) => {
              const hasReacted = user && reaction.userIds.includes(user.id);
              return (
                <button
                  key={reaction.emoji}
                  onClick={() => reactToMessage(message.id, reaction.emoji)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                    hasReacted
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={`${reaction.userIds.length} reaction${reaction.userIds.length > 1 ? 's' : ''}`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-[11px] font-bold">{reaction.userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Hover Actions Bar */}
      <div className="absolute right-4 -top-3 hidden group-hover:flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-1.5 py-1 shadow-xl z-10 backdrop-blur-sm">
        {/* Quick Emoji Buttons */}
        {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
          <button
            key={emoji}
            onClick={() => reactToMessage(message.id, emoji)}
            className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-sm transition-transform hover:scale-125"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}

        {/* Emoji picker trigger */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
            title="More reactions"
          >
            <Smile size={15} />
          </button>

          {showEmojiPicker && (
            <div className="absolute right-0 bottom-full mb-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 grid grid-cols-6 gap-1 z-30 w-52 animate-in fade-in">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    reactToMessage(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-base hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reply button */}
        <button
          onClick={() => onReply(message)}
          className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          title="Reply to message"
        >
          <Reply size={15} />
        </button>

        {/* Copy text */}
        <button
          onClick={copyText}
          className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          title="Copy message text"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
