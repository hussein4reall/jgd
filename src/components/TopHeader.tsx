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

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-40 w-full bg-[#0b0c13]/95 backdrop-blur-2xl border-b border-white/5 px-3.5 sm:px-6 py-1.5 flex items-center justify-between text-white select-none"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Left: 5S Logo & Founder Details */}
      <div
        className="flex items-center gap-1.5 cursor-pointer group select-none"
        onClick={onOpenFounderModal}
        title={t.coFoundersTitle || 'Founder Documentation'}
      >
        {/* 5S Circular Badge (compact 28px) */}
        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center font-black text-black text-[11px] tracking-tight shadow shrink-0">
          5S
        </div>
        {/* Brand titles */}
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1">
            <span className="font-black text-[13px] tracking-tight text-white font-sans uppercase leading-none">
              {t.appName || 'FIVE SEASONS'}
            </span>
          </div>
          <span className="text-[7.5px] font-semibold text-gray-400 uppercase tracking-tight mt-0.5 leading-none">
            {language === 'ar' ? 'حسين علي يوسف / المؤسس' : 'HUSSEIN ALI YOUSEF / FOUNDER'}
          </span>
        </div>
      </div>

      {/* Right: Stories Pill & Settings Cog */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Stories Gradient Pill */}
        {onOpenStories && (
          <button
            id="header-stories-btn"
            aria-label="Stories"
            onClick={onOpenStories}
            className="relative group flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 backdrop-blur-md border border-purple-400/30 shadow-[0_0_8px_rgba(168,85,247,0.4)] text-white transition"
            type="button"
          >
            <span className="font-bold tracking-tight text-[11px] text-white leading-none">
              {language === 'ar' ? 'القصص' : 'Stories'}
            </span>
            {stories.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            )}
          </button>
        )}

        {/* Compact Settings Cog Button */}
        <button
          id="header-settings-btn"
          aria-label="Settings"
          onClick={onOpenSettings}
          className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 flex items-center justify-center text-gray-300 transition shrink-0"
          type="button"
          title={t.settings}
        >
          <SettingsIcon className="w-3.5 h-3.5 stroke-[1.8]" />
        </button>
      </div>
    </header>
  );
};

