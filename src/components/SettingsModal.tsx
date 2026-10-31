import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, Globe, LogOut, AlertTriangle, 
  Shield, Sparkles, Check, X, Moon, Sun, Monitor, User as UserIcon
} from 'lucide-react';
import { Language, User, Theme } from '../types';
import { translations } from '../translations';
import { PioneerBadge } from './PioneerBadge';
import { repairCurrentAccountToOne } from '../firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  onLogOut: () => void;
  onOpenFounderModal: () => void;
  onOpenEditProfile?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  onLanguageChange,
  theme = 'dark',
  onThemeChange,
  onLogOut,
  onOpenFounderModal,
  onOpenEditProfile,
}) => {
  const [showLogOutConfirm, setShowLogOutConfirm] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairedSuccess, setRepairedSuccess] = useState(false);
  const t = translations[language];

  const handleRepairAccount = async () => {
    setIsRepairing(true);
    try {
      const res = await repairCurrentAccountToOne(currentUser.id);
      if (res) {
        setRepairedSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 600);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRepairing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="settings-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-3xl cosmic-glass-active border border-purple-500/30 p-6 text-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-white">
                {t.settingsTitle}
              </h3>
            </div>
            <button
              id="close-settings-btn"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Account Snapshot */}
          <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-400"
                />
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{currentUser.displayName}</span>
                    <span className="text-xs font-normal text-purple-300">@{currentUser.username}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    {t.accountNumberLabel}{currentUser.accountNumber}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PioneerBadge
                  tier={currentUser.pioneerTier}
                  accountNumber={currentUser.accountNumber}
                  language={language}
                  size="sm"
                />
              </div>
            </div>

            {/* Quick Edit Profile Action */}
            <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center justify-between">
              <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>{language === 'ar' ? 'تعديل بيانات الحساب والصورة' : 'Profile photo & details'}</span>
              </span>
              <button
                id="settings-open-edit-profile-btn"
                onClick={() => {
                  onClose();
                  onOpenEditProfile?.();
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-600/30 hover:bg-purple-600/45 text-white border border-purple-400/50 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>{t.editProfile}</span>
              </button>
            </div>

            {/* If user got account #2 due to the previous race condition */}
            {currentUser.accountNumber !== 1 && (
              <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center justify-between">
                <span className="text-[11px] text-amber-300 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {language === 'ar' ? 'تصحيح رقم الحساب إلى #1:' : 'Claim Account #1:'}
                </span>
                <button
                  id="repair-account-pioneer-1-btn"
                  onClick={handleRepairAccount}
                  disabled={isRepairing}
                  className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors shadow-sm"
                >
                  {repairedSuccess 
                    ? (language === 'ar' ? '✓ تم التعيين #1 بنجاح' : '✓ Claimed #1!') 
                    : isRepairing 
                    ? (language === 'ar' ? 'جاري التعديل...' : 'Updating...') 
                    : (language === 'ar' ? 'تعيين كالحساب الأول #1' : 'Set as Pioneer #1')}
                </button>
              </div>
            )}
          </div>

          {/* Language Selection Setting */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>{t.appLanguage}</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="settings-lang-en-btn"
                onClick={() => onLanguageChange('en')}
                className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  language === 'en'
                    ? 'btn-space-primary text-white border-purple-400 shadow-md'
                    : 'bg-black/40 hover:bg-white/5 text-zinc-400 border-white/10'
                }`}
              >
                <span>English</span>
                {language === 'en' && <Check className="w-4 h-4 text-white" />}
              </button>
              <button
                id="settings-lang-ar-btn"
                onClick={() => onLanguageChange('ar')}
                className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  language === 'ar'
                    ? 'btn-space-primary text-white border-purple-400 shadow-md'
                    : 'bg-black/40 hover:bg-white/5 text-zinc-400 border-white/10'
                }`}
              >
                <span>العربية</span>
                {language === 'ar' && <Check className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          {/* Day / Night Theme Selection Setting */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span>{t.appTheme}</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="settings-theme-dark-btn"
                type="button"
                onClick={() => onThemeChange && onThemeChange('dark')}
                className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'btn-space-primary text-white border-indigo-400 shadow-md'
                    : 'bg-black/40 hover:bg-white/5 text-zinc-400 border-white/10'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-300" />
                <span>{t.darkMode}</span>
                {theme === 'dark' && <Check className="w-4 h-4 text-white" />}
              </button>
              <button
                id="settings-theme-light-btn"
                type="button"
                onClick={() => onThemeChange && onThemeChange('light')}
                className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  theme === 'light'
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white border-amber-400 shadow-md'
                    : 'bg-black/40 hover:bg-white/5 text-zinc-400 border-white/10'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-300" />
                <span>{t.lightMode}</span>
                {theme === 'light' && <Check className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          {/* 8K Quality & Space Aesthetics */}
          <div className="mb-6 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-white block">{t.graphicQuality}</span>
                <span className="text-[11px] text-purple-300">{t.graphicQuality8K}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-[10px] font-mono font-bold">
              ACTIVE
            </span>
          </div>

          {/* Founder Documentation Link */}
          <div className="mb-6">
            <button
              id="settings-founder-link-btn"
              onClick={() => {
                onClose();
                onOpenFounderModal();
              }}
              className="w-full p-4 rounded-2xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-400/30 text-left rtl:text-right transition-all flex flex-col gap-2 group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                  {t.coFoundersTitle}
                </span>
                <span className="text-amber-400 text-xs">★</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{t.founderHusseinDoc}</span>
              </div>
            </button>
          </div>

          {/* Red Log Out Button (User Required Custom Design & Confirmation) */}
          <div className="pt-2 border-t border-white/10">
            <button
              id="settings-logout-btn"
              onClick={() => setShowLogOutConfirm(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 hover:text-red-300 text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] transform hover:scale-[1.01]"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>{t.logoutBtn}</span>
            </button>
          </div>

          {/* WARNING MODAL: "Are you sure?" confirmation dialog */}
          <AnimatePresence>
            {showLogOutConfirm && (
              <div
                id="logout-confirm-dialog"
                className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="p-4 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 mb-4 animate-bounce">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-white mb-2">
                  {t.logoutWarningTitle}
                </h4>
                <p className="text-xs text-zinc-300 mb-6 leading-relaxed max-w-xs">
                  {t.logoutWarningDesc}
                </p>

                <div className="w-full flex flex-col gap-2.5">
                  <button
                    id="confirm-logout-action-btn"
                    onClick={() => {
                      setShowLogOutConfirm(false);
                      onClose();
                      onLogOut();
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg transition-all"
                  >
                    {t.confirmLogout}
                  </button>
                  <button
                    id="cancel-logout-action-btn"
                    onClick={() => setShowLogOutConfirm(false)}
                    className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white font-semibold text-xs transition-all"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
