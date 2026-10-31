import React from 'react';
import { Settings as SettingsIcon, Trophy, Sparkles } from 'lucide-react';
import { Language, User, Story } from '../types';
import { translations } from '../translations';
import { OfficialLogo } from './OfficialLogo';

interface TopHeaderProps {
  currentUser: User;
  language: Language;
  stories?: Story[];
  onOpenSettings: () => void;
  onOpenFounderModal: () => void;
  onOpenStories?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentUser,
  language,
  stories = [],
  onOpenSettings,
  onOpenFounderModal,
  onOpenStories,
}) => {
  const t = translations[language];
  const hasStories = stories.length > 0;

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-40 w-full bg-[#020205]/80 backdrop-blur-2xl border-b border-white/5 px-3 sm:px-6 md:px-8 py-2.5 flex items-center justify-between text-white select-none"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Brand & Founder Tribute Title */}
      <div
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={onOpenFounderModal}
        title={t.coFoundersTitle || 'Founder & Leadership'}
      >
        <OfficialLogo size="sm" />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1
              id="top-header-brand-title"
              className="text-base sm:text-lg font-black tracking-tight uppercase italic brand-glow select-none group-hover:brightness-110 transition-all"
              style={{ textShadow: '0 0 20px rgba(67, 85, 250, 0.6)' }}
            >
              {t.appName}
            </h1>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4355fa] animate-pulse" />
          </div>
          <span
            id="top-header-founder-subtitle"
            className="text-[10px] uppercase font-semibold text-indigo-300 group-hover:text-indigo-200 text-left rtl:text-right mt-0.5 select-none transition-colors"
          >
            {t.foundedByShort}
          </span>
        </div>
      </div>

      {/* Center: Current Active Season Indicator */}
      <div id="top-header-season-indicator" className="hidden md:flex flex-col items-center text-center">
        <div className="text-[10px] uppercase font-bold text-indigo-400">
          {language === 'ar' ? 'الموسم النشط حالياً' : 'Current Season'}
        </div>
        <div className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="season-name-text">{language === 'ar' ? 'موسم الكوميديا — الجولة الأولى' : 'Comedy Season — Round 1'}</span>
        </div>
      </div>

      {/* Right Controls: Dedicated Stories Button & Settings Button */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Stories Access Button */}
        {onOpenStories && (
          <button
            id="header-stories-btn"
            onClick={onOpenStories}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-400/30 text-white text-xs font-semibold backdrop-blur-md transition-all active:scale-95 shadow-sm"
          >
            <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>{t.storiesTitle || (language === 'ar' ? 'القصص' : 'Stories')}</span>
            {hasStories && (
              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded-full bg-purple-500/40 text-purple-200 border border-purple-400/30">
                {stories.length}
              </span>
            )}
          </button>
        )}

        {/* Settings Button */}
        <button
          id="header-settings-btn"
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all active:scale-95"
          title={t.settings}
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

