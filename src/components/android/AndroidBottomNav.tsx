import React from 'react';
import { MessageSquare, Users, PlusCircle, User, Sparkles } from 'lucide-react';

export type AndroidTab = 'chats' | 'squads' | 'create' | 'profile';

interface AndroidBottomNavProps {
  currentTab: AndroidTab;
  onSelectTab: (tab: AndroidTab) => void;
  unreadCount?: number;
}

export function AndroidBottomNav({
  currentTab,
  onSelectTab,
  unreadCount = 0,
}: AndroidBottomNavProps) {
  const tabs = [
    {
      id: 'chats' as AndroidTab,
      label: 'Chats',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'squads' as AndroidTab,
      label: 'Squads',
      icon: Users,
    },
    {
      id: 'create' as AndroidTab,
      label: 'Create',
      icon: PlusCircle,
    },
    {
      id: 'profile' as AndroidTab,
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav className="bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-lg select-none shrink-0 z-30 pb-safe">
      <div className="grid grid-cols-4 items-center h-15 px-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className="flex flex-col items-center justify-center py-1 group min-h-[48px] transition-all"
            >
              {/* Material 3 active pill background */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? 'bg-[#5e17eb] text-white shadow-md shadow-[#5e17eb]/30'
                    : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/50'
                }`}
              >
                <IconComponent size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'} />

                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-900">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Android Gesture Navigation Bar Pill */}
      <div className="py-1 flex justify-center">
        <div className="w-32 h-1 bg-slate-500/50 hover:bg-slate-400 rounded-full transition-colors" />
      </div>
    </nav>
  );
}
