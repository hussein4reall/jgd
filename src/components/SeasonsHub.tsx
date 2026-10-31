import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Sparkles, Flame, Clock, CheckCircle2, ChevronRight, Award, Zap, HelpCircle, Film, Laugh, BookOpen, Scissors } from 'lucide-react';
import { SeasonInfo, Language, Clip } from '../types';
import { FIVE_SEASONS_DATA } from '../seasonsData';
import { translations } from '../translations';

interface SeasonsHubProps {
  language: Language;
  onSelectCategoryFilter: (category: string) => void;
  onOpenStudioWithCategory: (category: string) => void;
  clips: Clip[];
}

export const SeasonsHub: React.FC<SeasonsHubProps> = ({
  language,
  onSelectCategoryFilter,
  onOpenStudioWithCategory,
  clips,
}) => {
  const [selectedSeason, setSelectedSeason] = useState<SeasonInfo>(
    FIVE_SEASONS_DATA.find((s) => s.isActive) || FIVE_SEASONS_DATA[0]
  );
  const t = translations[language];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laugh':
        return <Laugh className="w-5 h-5" />;
      case 'Film':
        return <Film className="w-5 h-5" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Scissors':
        return <Scissors className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const competingClipsCount = clips.filter((c) => c.category === selectedSeason.id && c.inCompetition).length;

  return (
    <div
      id="seasons-hub-view"
      className="w-full max-w-5xl mx-auto px-4 py-6 md:py-10 text-white"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-3 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.seasonsHubTitle}</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
          {t.seasonsHubSubtitle}
        </h2>
      </div>

      {/* Algorithm Boost & Freedom to Post Alert Card */}
      <div className="mb-8 p-4 md:p-6 rounded-3xl cosmic-glass border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex-shrink-0">
            <Zap className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base text-white flex items-center gap-2 mb-1">
              <span>{t.algorithmBoostTitle}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono">
                {selectedSeason.bonusMultiplier} Algorithmic Boost
              </span>
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
              {t.algorithmBoostDesc}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 italic">
              ✦ {t.freedomToPostNote}
            </p>
          </div>
        </div>

        <button
          id="enter-active-season-btn"
          onClick={() => onOpenStudioWithCategory(selectedSeason.id)}
          className="w-full md:w-auto px-5 py-3 rounded-2xl btn-space-primary font-bold text-xs text-white whitespace-nowrap flex items-center justify-center gap-2 shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.enterContest}</span>
        </button>
      </div>

      {/* 5 Seasons Selector Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {FIVE_SEASONS_DATA.map((season) => {
          const isSelected = selectedSeason.id === season.id;
          return (
            <button
              key={season.id}
              id={`season-card-${season.id}`}
              onClick={() => setSelectedSeason(season)}
              className={`relative p-4 rounded-2xl text-left rtl:text-right transition-all border ${
                isSelected
                  ? 'cosmic-glass-active scale-[1.02]'
                  : 'bg-black/30 hover:bg-white/5 border-white/10'
              }`}
              style={{
                borderColor: isSelected ? season.color : undefined,
                boxShadow: isSelected ? `0 0 25px ${season.glowColor}` : undefined,
              }}
            >
              {season.isActive && (
                <span className="absolute top-3 right-3 rtl:left-3 rtl:right-auto px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                  {language === 'ar' ? 'نشط' : 'Active'}
                </span>
              )}

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white"
                style={{ backgroundColor: `${season.color}25`, color: season.color }}
              >
                {getIcon(season.iconName)}
              </div>

              <h4 className="font-bold text-sm text-white mb-1">
                {language === 'ar' ? season.nameAr : season.nameEn}
              </h4>
              <p className="text-[11px] text-zinc-400 line-clamp-2">
                {language === 'ar' ? season.taglineAr : season.taglineEn}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Season Detailed Spotlight */}
      <motion.div
        key={selectedSeason.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl cosmic-glass border p-6 md:p-8 relative overflow-hidden"
        style={{ borderColor: `${selectedSeason.color}50` }}
      >
        {/* Glow backdrop */}
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: selectedSeason.color }}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: `${selectedSeason.color}30`, color: selectedSeason.color }}
              >
                {selectedSeason.isActive ? t.activeSeasonBadge : t.upcomingSeason}
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {selectedSeason.daysRemaining} {t.seasonDaysLeft}
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
              {language === 'ar' ? selectedSeason.nameAr : selectedSeason.nameEn}
            </h3>
            <p className="text-sm text-zinc-300 max-w-2xl">
              {language === 'ar' ? selectedSeason.descriptionAr : selectedSeason.descriptionEn}
            </p>
          </div>

          {/* Grand Award Card */}
          <div className="p-4 rounded-2xl bg-black/50 border border-amber-400/30 flex items-center gap-4 min-w-[280px]">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <Trophy className="w-8 h-8 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                {t.awardPrizeTitle}
              </div>
              <div className="font-extrabold text-sm text-white">
                {language === 'ar' ? selectedSeason.awardTitleAr : selectedSeason.awardTitleEn}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                ✦ {competingClipsCount} {language === 'ar' ? 'مقاطع متنافسة' : 'clips in race'}
              </div>
            </div>
          </div>
        </div>

        {/* Season Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="post-in-season-btn"
            onClick={() => onOpenStudioWithCategory(selectedSeason.id)}
            className="py-3 px-6 rounded-xl btn-space-primary font-bold text-xs text-white flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.publishFirstClip} ({language === 'ar' ? selectedSeason.nameAr : selectedSeason.nameEn})</span>
          </button>

          <button
            id="view-season-clips-btn"
            onClick={() => onSelectCategoryFilter(selectedSeason.id)}
            className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-zinc-200 hover:text-white transition-all flex items-center gap-2"
          >
            <Film className="w-4 h-4 text-purple-400" />
            <span>{language === 'ar' ? 'عرض مقاطع هذا الموسم' : 'View Clips in this Season'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
