import React from 'react';
import { Film, Trophy, Plus, MessageSquare, Bell, User as UserIcon, Search } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

export type NavTab = 'feed' | 'search' | 'seasons' | 'messages' | 'notifications' | 'profile';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenStudio: () => void;
  language: Language;
  unreadCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onOpenStudio,
  language,
  unreadCount = 0,
}) => {
  const t = translations[language];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-2 sm:px-4 md:px-8 pb-2 sm:pb-3 pointer-events-none">
      <nav
        id="bottom-nav-bar"
        aria-label="Main Navigation"
        className="pointer-events-auto max-w-lg mx-auto px-3 py-1.5 rounded-full select-none shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(235, 240, 248, 0.16), rgba(210, 218, 228, 0.22))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(147, 197, 253, 0.55) rgba(255, 255, 255, 0.25) rgba(255, 255, 255, 0.25)',
          boxShadow: 'rgba(0, 0, 0, 0.37) 0px 8px 32px 0px, rgba(255, 255, 255, 0.45) 0px 1px 1px 0px inset, rgba(59, 130, 246, 0.35) 0px 0px 16px -2px',
        }}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between max-w-full mx-auto">
          {/* Tab 1: Clips Feed */}
          <button
            id="nav-tab-feed"
            onClick={() => onTabChange('feed')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition group ${
              activeTab === 'feed'
                ? 'text-purple-400 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-bold mt-1 tracking-tight">
              {t.clips || 'Clips'}
            </span>
          </button>

          {/* Tab 2: Top / Discover */}
          <button
            id="nav-tab-search"
            onClick={() => onTabChange('search')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition group ${
              activeTab === 'search'
                ? 'text-purple-400 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4 stroke-[2] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-medium mt-1 tracking-tight">
              {language === 'ar' ? 'استكشف' : 'Top'}
            </span>
          </button>

          {/* Center: Plus Button (Studio) */}
          <div className="flex items-center justify-center px-1.5 sm:px-2">
            <button
              id="nav-tab-camera-plus"
              aria-label="Create new clip"
              onClick={onOpenStudio}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.6)] border border-purple-300/30 flex items-center justify-center text-white active:scale-90 hover:brightness-110 transition cursor-pointer"
              type="button"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Tab 3: Seasons Hub */}
          <button
            id="nav-tab-seasons"
            onClick={() => onTabChange('seasons')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition group ${
              activeTab === 'seasons'
                ? 'text-purple-400 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 stroke-[2] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-medium mt-1 tracking-tight">
              {t.seasons || 'Seasons'}
            </span>
          </button>

          {/* Tab 4: Messages */}
          <button
            id="nav-tab-messages"
            onClick={() => onTabChange('messages')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition group relative ${
              activeTab === 'messages'
                ? 'text-purple-400 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 stroke-[2] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-medium mt-1 tracking-tight">
              {t.messages || 'Messages'}
            </span>
          </button>

          {/* Tab 5: Profile */}
          <button
            id="nav-tab-profile"
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition group ${
              activeTab === 'profile'
                ? 'text-purple-400 font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4 stroke-[2] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-medium mt-1 tracking-tight">
              {t.profile || 'Profile'}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};
