import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';
import { MessageSquare, Plus, Compass, Sparkles, Hash, Radio, LogOut, Settings, Shield, UserPlus } from 'lucide-react';

interface SidebarProps {
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onOpenProfile: () => void;
  onOpenDirectMessages: () => void;
  onOpenFeatures: () => void;
  onOpenAdminConsole?: () => void;
  onOpenFriendRequests?: () => void;
  isMobileDrawer?: boolean;
}

export function Sidebar({
  onOpenCreateGroup,
  onOpenJoinGroup,
  onOpenProfile,
  onOpenDirectMessages,
  onOpenFeatures,
  onOpenAdminConsole,
  onOpenFriendRequests,
  isMobileDrawer = false,
}: SidebarProps) {
  const { user } = useAuth();
  const { myGroups, activeChat, selectChannel, selectDirectChat, isConnected, friendRequests, isAdmin, customLogoUrl } = useChat();

  const isDirectActive = activeChat.type === 'direct';

  return (
    <aside className="w-16 sm:w-18 bg-slate-950 border-r border-slate-800/80 flex flex-col items-center py-3 select-none z-20 shrink-0 h-full">
      {/* App Logo / Home (Direct Messages) */}
      <button
        type="button"
        onClick={onOpenDirectMessages}
        title="KirraK MuchatlU - Home & Direct Messages"
        aria-label="KirraK MuchatlU Home and Direct Messages"
        className={`relative w-11 h-11 sm:w-12 sm:h-12 min-h-[44px] min-w-[44px] rounded-2xl flex items-center justify-center text-white transition-all group overflow-hidden ${
          isDirectActive
            ? 'bg-[#5e17eb] rounded-2xl shadow-lg shadow-[#5e17eb]/50 ring-2 ring-[#a78bfa]'
            : 'bg-slate-900 hover:bg-[#5e17eb]/40 rounded-3xl hover:rounded-2xl border border-slate-800 hover:border-[#5e17eb]/60'
        }`}
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
          <img
            src={customLogoUrl || '/logo.svg'}
            alt="KirraK MuchatlU Logo"
            className="w-full h-full object-contain rounded-xl drop-shadow"
          />
        </div>
        {/* Active Pill Indicator */}
        {isDirectActive && (
          <span className="absolute -left-2.5 sm:-left-3 top-1/2 -translate-y-1/2 w-1.5 h-7 sm:h-8 bg-[#a78bfa] rounded-r-full" />
        )}
      </button>

      {/* Friend Requests Button */}
      {onOpenFriendRequests && (
        <button
          onClick={onOpenFriendRequests}
          title="Friend Requests & Add Friends"
          className="relative w-11 h-11 sm:w-12 sm:h-12 min-h-[44px] min-w-[44px] rounded-3xl hover:rounded-2xl bg-slate-800 hover:bg-[#5e17eb] text-slate-300 hover:text-white flex items-center justify-center transition-all mt-2 group shadow-sm"
        >
          <UserPlus size={20} />
          {friendRequests.incoming.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-900 animate-pulse">
              {friendRequests.incoming.length}
            </span>
          )}
        </button>
      )}

      {/* Admin Central Console Shield Button */}
      {onOpenAdminConsole && (
        <button
          onClick={onOpenAdminConsole}
          title={
            isAdmin
              ? 'Administrator Central Console (Monitor All Chats & Block Users)'
              : 'Administrator Verification (Click to Enter Password)'
          }
          className={`w-11 h-11 sm:w-12 sm:h-12 min-h-[44px] min-w-[44px] rounded-3xl hover:rounded-2xl flex items-center justify-center transition-all mt-2 group ring-2 ${
            isAdmin
              ? 'bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white shadow-md shadow-[#5e17eb]/40 ring-[#5e17eb]/50'
              : 'bg-slate-800 hover:bg-[#5e17eb] text-slate-400 hover:text-white ring-slate-700/60'
          }`}
        >
          <Shield size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Features Directory Button */}
      <button
        onClick={onOpenFeatures}
        title="View All Application Features & Guide"
        className="w-11 h-11 sm:w-12 sm:h-12 min-h-[44px] min-w-[44px] rounded-3xl hover:rounded-2xl bg-gradient-to-tr from-indigo-900/60 to-purple-900/60 hover:from-indigo-600 hover:to-purple-600 text-amber-300 hover:text-white flex items-center justify-center transition-all border border-indigo-500/30 hover:border-transparent mt-2 shadow-sm group"
      >
        <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Divider */}
      <div className="w-8 h-[2px] bg-slate-800 my-2.5 rounded-full" />

      {/* User's Groups List */}
      <div className="flex-1 w-full flex flex-col items-center gap-2.5 overflow-y-auto no-scrollbar px-2">
        {myGroups.map((group) => {
          const isActive = activeChat.type === 'channel' && activeChat.groupId === group.id;

          return (
            <div key={group.id} className="relative group flex items-center justify-center w-full">
              {/* Active pill */}
              <span
                className={`absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full transition-all duration-200 ${
                  isActive
                    ? 'h-8 bg-[#5e17eb]'
                    : 'h-2 bg-slate-400 scale-0 group-hover:scale-100 group-hover:h-5'
                }`}
              />

              <button
                onClick={() => {
                  const defaultCh = group.channels[0]?.id || 'general';
                  selectChannel(group.id, defaultCh);
                }}
                className={`relative w-12 h-12 flex items-center justify-center text-xl transition-all duration-200 ${
                  isActive
                    ? 'rounded-2xl bg-[#5e17eb] text-white shadow-lg shadow-[#5e17eb]/30 ring-2 ring-[#a78bfa]'
                    : 'rounded-3xl bg-slate-800 hover:rounded-2xl hover:bg-slate-700 text-slate-200'
                }`}
                title={group.name}
              >
                <span>{group.icon || '👥'}</span>
              </button>

              {/* Tooltip on hover */}
              <div className="absolute left-16 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                {group.name}
              </div>
            </div>
          );
        })}

        {/* Create Group Button */}
        <button
          onClick={onOpenCreateGroup}
          title="Create a New Group"
          className="w-12 h-12 rounded-3xl hover:rounded-2xl bg-slate-800/80 hover:bg-[#5e17eb] text-[#a78bfa] hover:text-white flex items-center justify-center transition-all border border-dashed border-slate-700 hover:border-transparent mt-1"
        >
          <Plus size={22} />
        </button>

        {/* Join / Explore Groups Button */}
        <button
          onClick={onOpenJoinGroup}
          title="Join or Explore Groups"
          className="w-12 h-12 rounded-3xl hover:rounded-2xl bg-slate-800/80 hover:bg-[#5e17eb] text-[#a78bfa] hover:text-white flex items-center justify-center transition-all border border-dashed border-slate-700 hover:border-transparent"
        >
          <Compass size={20} />
        </button>
      </div>

      {/* Bottom User Profile & Status */}
      <div className="mt-auto pt-3 border-t border-slate-800 flex flex-col items-center gap-2">
        {/* Connection status indicator */}
        <div
          title={isConnected ? 'Connected in real-time' : 'Reconnecting to chat server...'}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px]"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-slate-400 font-medium">
            {isConnected ? 'LIVE' : 'SYNC'}
          </span>
        </div>

        {/* Current User avatar trigger */}
        <button
          onClick={onOpenProfile}
          title={`${user?.displayName} (@${user?.username}) - Settings`}
          className="hover:scale-105 transition-transform"
        >
          <UserAvatar
            avatarUrl={user?.avatarUrl}
            avatarIcon={user?.avatarIcon}
            avatarColor={user?.avatarColor}
            displayName={user?.displayName}
            size="lg"
            showStatus
            isOnline={true}
          />
        </button>
      </div>
    </aside>
  );
}
