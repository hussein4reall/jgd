import React from 'react';
import { Sparkles, Crown, Award, Star, ShieldCheck } from 'lucide-react';
import { PioneerTierType, Language } from '../types';
import { translations } from '../translations';

interface PioneerBadgeProps {
  tier: PioneerTierType;
  accountNumber?: number;
  language: Language;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const PioneerBadge: React.FC<PioneerBadgeProps> = ({
  tier,
  accountNumber,
  language,
  size = 'md',
  showNumber = true,
}) => {
  const t = translations[language];

  const getTierStyles = () => {
    switch (tier) {
      case 'first_ever':
        return {
          bg: 'bg-gradient-to-r from-violet-600/30 via-fuchsia-500/30 to-indigo-600/30',
          border: 'border-fuchsia-400/70',
          text: 'text-fuchsia-300 font-extrabold',
          shadow: 'shadow-[0_0_20px_rgba(217,70,239,0.45)]',
          icon: <Crown className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />,
          label: t.pioneerFirstEver,
          shortLabel: language === 'ar' ? 'الرائد' : 'Pioneer',
        };
      case 'second_ever':
        return {
          bg: 'bg-gradient-to-r from-cyan-600/30 via-blue-500/30 to-indigo-600/30',
          border: 'border-cyan-400/70',
          text: 'text-cyan-300 font-extrabold',
          shadow: 'shadow-[0_0_20px_rgba(6,182,212,0.45)]',
          icon: <Crown className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />,
          label: language === 'ar' ? 'الرائد #2' : 'Pioneer #2',
          shortLabel: language === 'ar' ? 'الرائد' : 'Pioneer',
        };
      case 'third_ever':
        return {
          bg: 'bg-gradient-to-r from-amber-600/30 via-yellow-500/30 to-orange-600/30',
          border: 'border-amber-400/70',
          text: 'text-amber-300 font-extrabold',
          shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.45)]',
          icon: <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />,
          label: language === 'ar' ? 'الرائد #3' : 'Pioneer #3',
          shortLabel: language === 'ar' ? 'الرائد' : 'Pioneer',
        };
      case 'top_10':
        return {
          bg: 'bg-gradient-to-r from-indigo-500/25 via-purple-500/25 to-violet-600/25',
          border: 'border-indigo-400/60',
          text: 'text-indigo-300 font-bold',
          shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.35)]',
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
          label: t.pioneerTop10,
          shortLabel: language === 'ar' ? 'أوائل الـ 10' : 'Top 10',
        };
      case 'top_100':
        return {
          bg: 'bg-indigo-950/40',
          border: 'border-cyan-400/50',
          text: 'text-cyan-300 font-semibold',
          shadow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]',
          icon: <Star className="w-3 h-3 text-cyan-400" />,
          label: t.pioneerTop100,
          shortLabel: language === 'ar' ? 'أوائل الـ 100' : 'Top 100',
        };
      case 'top_1000':
        return {
          bg: 'bg-purple-950/40',
          border: 'border-purple-400/40',
          text: 'text-purple-300 font-medium',
          shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.25)]',
          icon: <Award className="w-3 h-3 text-purple-400" />,
          label: t.pioneerTop1000,
          shortLabel: language === 'ar' ? 'أوائل الـ 1K' : 'Top 1K',
        };
      case 'top_10000':
        return {
          bg: 'bg-slate-900/50',
          border: 'border-violet-500/30',
          text: 'text-violet-300',
          shadow: 'shadow-[0_0_8px_rgba(139,92,246,0.15)]',
          icon: <ShieldCheck className="w-3 h-3 text-violet-400" />,
          label: t.pioneerTop10000,
          shortLabel: language === 'ar' ? 'نادي 10K' : '10K Pioneer',
        };
      default:
        return {
          bg: 'bg-white/5',
          border: 'border-white/10',
          text: 'text-zinc-300',
          shadow: '',
          icon: <Star className="w-3 h-3 text-zinc-400" />,
          label: t.pioneerMember,
          shortLabel: language === 'ar' ? 'مستكشف' : 'Explorer',
        };
    }
  };

  const style = getTierStyles();

  return (
    <div
      id={`pioneer-badge-${accountNumber || tier}`}
      className={`pioneer-badge pioneer-tier-${tier.replace('_', '-')} inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md transition-all ${
        size === 'sm'
          ? 'px-2 py-0.5 text-[11px]'
          : size === 'lg'
          ? 'px-3.5 py-1.5 text-sm'
          : 'px-2.5 py-1 text-xs'
      } ${style.bg} ${style.border} ${style.text} ${style.shadow}`}
      title={style.label}
    >
      {style.icon}
      <span className="pioneer-badge-label font-bold">{size === 'lg' ? style.label : style.shortLabel}</span>
      {showNumber && accountNumber && (
        <span className="pioneer-badge-number opacity-90 font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full">
          #{accountNumber}
        </span>
      )}
    </div>
  );
};
