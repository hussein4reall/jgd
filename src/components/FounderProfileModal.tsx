import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, Shield, X } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface FounderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const FounderProfileModal: React.FC<FounderProfileModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="founder-profile-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
        onClick={onClose}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <motion.div
          id="founder-profile-card"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl cosmic-glass-active border border-purple-500/40 p-6 md:p-8 text-white shadow-[0_0_60px_rgba(124,58,237,0.35)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            id="close-founder-modal-btn"
            onClick={onClose}
            className="absolute top-5 right-5 rtl:right-auto rtl:left-5 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Glowing Background Radial */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header & Title */}
          <div className="flex flex-col items-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-[11px] font-bold uppercase tracking-widest mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.coFoundersTitle}</span>
            </div>
          </div>

          {/* Founder Documentation Details */}
          <div className="relative flex flex-col items-center text-center">
            {/* Crown Embellishment */}
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-purple-600/30 to-indigo-600/20 border border-amber-400/40 flex items-center justify-center shadow-xl">
                <Crown className="w-10 h-10 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-amber-500 rounded-full border-2 border-[#020206] shadow-md">
                <Sparkles className="w-3 h-3 text-black" />
              </span>
            </div>

            {/* Explicitly Formatted Founder Title */}
            <div className="text-xl md:text-2xl font-black text-white mb-1">
              Hussein Ali Yousef
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold mb-3">
              Hussein Ali Yousef / Founder
            </div>

            {/* Role badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-200 text-xs font-semibold mb-4">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.founderRole}</span>
            </div>

            {/* Bio & Vision Quote */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-left rtl:text-right mb-5 text-xs leading-relaxed text-zinc-200 backdrop-blur-md w-full space-y-2">
              <p className="italic text-indigo-200 font-medium">
                "{t.founderMessage}"
              </p>
              <p className="text-zinc-400 text-[11px] pt-2 border-t border-white/10">
                {t.founderBio}
              </p>
            </div>
          </div>

          {/* 5 Seasons Universe Badges */}
          <div className="w-full grid grid-cols-5 gap-1.5 mb-5 text-center text-[10px] text-zinc-300 font-medium">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-2">
              <span className="text-base block mb-0.5">🎭</span>
              <span>{language === 'ar' ? 'كوميديا' : 'Comedy'}</span>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2">
              <span className="text-base block mb-0.5">🎬</span>
              <span>{language === 'ar' ? 'دراما' : 'Drama'}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2">
              <span className="text-base block mb-0.5">📜</span>
              <span>{language === 'ar' ? 'أدب' : 'Literature'}</span>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-2">
              <span className="text-base block mb-0.5">✂️</span>
              <span>{language === 'ar' ? 'مونتاج' : 'Editor'}</span>
            </div>
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-2">
              <span className="text-base block mb-0.5">🌌</span>
              <span>{language === 'ar' ? 'منوع' : 'Random'}</span>
            </div>
          </div>

          {/* Platform Charter Note */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-950/40 border border-purple-500/20 text-center mb-5 text-[11px] text-zinc-300">
            <div className="font-semibold text-purple-300 mb-0.5">
              {language === 'ar' ? 'وثيقة التأسيس والريادة الرسمية' : 'Official Founding Charter & Attribution'}
            </div>
            <div className="text-[10px] text-amber-300 font-mono font-bold">
              Hussein Ali Yousef / Founder
            </div>
          </div>

          {/* Close Action */}
          <div className="w-full flex items-center justify-center">
            <button
              id="close-founder-dialog-btn"
              onClick={onClose}
              className="w-full py-3 px-6 rounded-2xl btn-space-primary font-bold text-xs text-white shadow-lg transition-all"
            >
              {t.close}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
