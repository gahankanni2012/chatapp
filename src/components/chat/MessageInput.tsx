import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../../types/chat';
import { useChat } from '../../context/ChatContext';
import { Send, Smile, Image as ImageIcon, X, Sparkles, Paperclip } from 'lucide-react';

interface MessageInputProps {
  replyingTo: Message | null;
  onCancelReply: () => void;
  placeholder: string;
  disabled?: boolean;
}

const EMOJI_PALETTE = ['❤️', '🔥', '😂', '🎉', '🚀', '✨', '👋', '💯', '🙌', '😎', '🍕', '🎮', '💡', '🌟', '👀', '🥳'];
const FUN_PRESETS = [
  { name: 'Celebration', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80' },
  { name: 'Coffee Hangout', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80' },
  { name: 'Gaming Setup', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80' },
  { name: 'Team Success', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80' },
];

export function MessageInput({
  replyingTo,
  onCancelReply,
  placeholder,
  disabled = false,
}: MessageInputProps) {
  const { sendMessage, sendTyping } = useChat();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    const val = e.target.value;
    setText(val);

    if (val.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        sendTyping(true);
      }
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTyping(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (disabled) return;
    const cleanText = text.trim();
    if (!cleanText && !mediaUrl) return;

    const replyData = replyingTo
      ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          text: replyingTo.text,
        }
      : undefined;

    sendMessage(cleanText, mediaUrl || undefined, replyData);

    setText('');
    setMediaUrl('');
    setShowEmojiPicker(false);
    setShowMediaPicker(false);
    isTypingRef.current = false;
    onCancelReply();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const addEmoji = (emoji: string) => {
    if (disabled) return;
    setText(prev => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="relative p-2.5 sm:p-4 bg-slate-900 border-t border-slate-800 pb-safe">
      {/* Replying Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-400">Replying to</span>
            <span className="font-bold text-indigo-400">@{replyingTo.senderName}</span>
            <span className="text-slate-400 italic truncate max-w-xs">"{replyingTo.text}"</span>
          </div>
          <button
            onClick={onCancelReply}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Media URL Attachment Banner */}
      {mediaUrl && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs">
          <div className="flex items-center gap-2 truncate">
            <ImageIcon size={14} className="text-indigo-400 shrink-0" />
            <span className="text-slate-300 truncate font-mono text-[11px]">{mediaUrl}</span>
          </div>
          <button
            onClick={() => setMediaUrl('')}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-indigo-900/50"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Input Box */}
      <div className={`flex items-end gap-1.5 sm:gap-2 border rounded-2xl p-1.5 sm:p-2 transition-all shadow-inner ${
        disabled
          ? 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'
          : 'bg-slate-800/90 border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
      }`}>
        {/* Media / Image Attach Button */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setShowMediaPicker(!showMediaPicker);
              setShowEmojiPicker(false);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Attach image or photo"
          >
            <ImageIcon size={19} />
          </button>

          {/* Media Picker Popover */}
          {showMediaPicker && !disabled && (
            <div className="absolute left-0 bottom-full mb-3 w-72 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-30 animate-in fade-in">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" /> Share Image
                </span>
                <button
                  onClick={() => setShowMediaPicker(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="Paste direct image URL..."
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <div className="text-[11px] font-semibold text-slate-400 pt-1">
                  Or pick a photo preset:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {FUN_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setMediaUrl(preset.url);
                        setShowMediaPicker(false);
                      }}
                      className="group text-left p-1 rounded-lg border border-slate-700/60 hover:border-indigo-500 bg-slate-800/50 hover:bg-slate-800 transition-all overflow-hidden"
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-12 object-cover rounded-md mb-1"
                      />
                      <span className="text-[10px] text-slate-300 block truncate group-hover:text-indigo-400">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          disabled={disabled}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none text-sm sm:text-base text-white placeholder-slate-500 resize-none py-2 px-1.5 sm:px-2 focus:outline-none max-h-32 leading-relaxed disabled:cursor-not-allowed"
        />

        {/* Emoji Button */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setShowEmojiPicker(!showEmojiPicker);
              setShowMediaPicker(false);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Emoji Palette"
          >
            <Smile size={19} />
          </button>

          {/* Emoji Popover */}
          {showEmojiPicker && !disabled && (
            <div className="absolute right-0 bottom-full mb-3 w-64 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-30 animate-in fade-in">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
                <span className="text-xs font-bold text-white">Quick Emojis</span>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_PALETTE.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-sm hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !mediaUrl)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 ${
            !disabled && (text.trim() || mediaUrl)
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-600 bg-slate-800/40 cursor-not-allowed'
          }`}
          title="Send message (Enter)"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
