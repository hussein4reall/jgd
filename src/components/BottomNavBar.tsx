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
    <div className="fixed bottom-0 inset-x-0 z-40 px-2 sm:px-4 md:px-8 pb-2 sm:pb-3 md:pb-6 pointer-events-none">
      <nav
        id="bottom-nav-bar"
        className="pointer-events-auto max-w-4xl mx-auto h-16 md:h-18 bg-[#090914]/90 backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center justify-around px-2 sm:px-4 md:px-8 text-white select-none shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* 1. Clips Feed Tab */}
        <button
          id="nav-tab-feed"
          onClick={() => onTabChange('feed')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'feed'
              ? 'text-indigo-400 font-bold scale-105'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Film className={`w-5 h-5 ${activeTab === 'feed' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight">{t.clips}</span>
        </button>

        {/* 2. Search Tab */}
        <button
          id="nav-tab-search"
          onClick={() => onTabChange('search')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'search'
              ? 'text-indigo-400 font-bold scale-105'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Search className={`w-5 h-5 ${activeTab === 'search' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight">{t.searchTabTop}</span>
        </button>

        {/* 3. Center Camera Studio Plus Button */}
        <div className="relative -mt-6 flex items-center justify-center">
          <button
            id="nav-tab-camera-plus"
            onClick={onOpenStudio}
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl btn-purple flex items-center justify-center text-white shadow-xl shadow-indigo-950/70 transform hover:scale-110 active:scale-95 transition-all border border-white/20"
            aria-label={t.studio}
          >
            <Plus className="w-6 h-6 md:w-7 md:h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Five Seasons Tab */}
        <button
          id="nav-tab-seasons"
          onClick={() => onTabChange('seasons')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'seasons'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Trophy className={`w-5 h-5 ${activeTab === 'seasons' ? 'stroke-[2.5] text-amber-400' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight">{t.seasons}</span>
        </button>

        {/* 5. Messages Tab */}
        <button
          id="nav-tab-messages"
          onClick={() => onTabChange('messages')}
          className={`relative flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'messages'
              ? 'text-indigo-400 font-bold scale-105'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight">{t.messages}</span>
        </button>

        {/* 6. Profile Tab */}
        <button
          id="nav-tab-profile"
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'profile'
              ? 'text-indigo-400 font-bold scale-105'
              : 'text-white/40 hover:text-white/80'
          }`}
        >
          <UserIcon className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight">{t.profile}</span>
        </button>
      </nav>
    </div>
  );
};
