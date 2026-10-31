import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Camera, Check, AlertCircle, Sparkles, Lock, 
  Upload, RefreshCw, User as UserIcon, AtSign, FileText
} from 'lucide-react';
import { User, Language, Theme } from '../types';
import { translations } from '../translations';
import { checkUsernameAvailability, updateUserProfile } from '../firebase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  language: Language;
  onProfileUpdated: (updatedUser: User) => void;
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=cosmic_pioneer&backgroundColor=030307',
  'https://api.dicebear.com/7.x/bottts/svg?seed=hyper_nova&backgroundColor=1e1b4b',
  'https://api.dicebear.com/7.x/bottts/svg?seed=starlight_voyager&backgroundColor=311042',
  'https://api.dicebear.com/7.x/bottts/svg?seed=quantum_creator&backgroundColor=0f172a',
  'https://api.dicebear.com/7.x/bottts/svg?seed=solar_flare&backgroundColor=2e1065',
  'https://api.dicebear.com/7.x/bottts/svg?seed=cyber_galaxy&backgroundColor=022c22',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  onProfileUpdated,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [showPresets, setShowPresets] = useState(false);

  // Validation & async states
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'short'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Name edits remaining count (maximum 5 lifetime edits)
  const nameEditsUsed = currentUser.nameEditsCount || 0;
  const nameEditsRemaining = Math.max(0, 5 - nameEditsUsed);
  const isNameEditLocked = nameEditsRemaining === 0;

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentUser.displayName);
      setUsername(currentUser.username);
      setBio(currentUser.bio || '');
      setAvatarUrl(currentUser.avatarUrl);
      setUsernameStatus('idle');
      setErrorMessage(null);
      setSaveSuccess(false);
      setShowPresets(false);
    }
  }, [isOpen, currentUser]);

  // Debounced username availability checker
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus('idle');
      return;
    }

    if (clean === currentUser.username.toLowerCase()) {
      setUsernameStatus('available');
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('short');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(clean)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const check = await checkUsernameAvailability(clean, currentUser.id);
        if (check.available) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus(check.errorKey === 'usernameTaken' ? 'taken' : 'invalid');
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username, currentUser.id, currentUser.username]);

  // Handle local image file upload & square crop compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(language === 'ar' ? 'يرجى اختيار ملف صورة صالح.' : 'Please choose a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height, 400);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Center crop square
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);

        // Convert to optimized JPEG data url
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrl(dataUrl);
        setErrorMessage(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    // 1. Validation checks
    if (!cleanDisplayName) {
      setErrorMessage(language === 'ar' ? 'الاسم الظاهر لا يمكن أن يكون فارغاً.' : 'Display name cannot be empty.');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMessage(t.usernameTooShort);
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      setErrorMessage(t.usernameInvalid);
      return;
    }

    if (usernameStatus === 'taken') {
      setErrorMessage(t.usernameTaken);
      return;
    }

    if (cleanDisplayName !== currentUser.displayName && isNameEditLocked) {
      setErrorMessage(t.nameEditsExhausted);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateUserProfile(currentUser.id, {
        displayName: cleanDisplayName,
        username: cleanUsername,
        avatarUrl,
        bio: bio.trim(),
      });

      onProfileUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Update profile error:', err);
      if (err.message === 'usernameTaken') {
        setErrorMessage(t.usernameTaken);
      } else if (err.message === 'nameEditsExhausted') {
        setErrorMessage(t.nameEditsExhausted);
      } else {
        setErrorMessage(err.message || (language === 'ar' ? 'فشل تحديث البيانات. يرجى المحاولة ثانية.' : 'Failed to update profile.'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="edit-profile-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl cosmic-glass-active border border-purple-500/35 p-6 md:p-7 text-white shadow-2xl overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-600/25 text-purple-400 border border-purple-500/35 shadow-inner">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>{t.editProfileTitle}</span>
                  <span className="text-xs font-mono font-normal text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    #{currentUser.accountNumber}
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {language === 'ar' 
                    ? 'تعديل الصورة الشخصية، اسم المستخدم الفريد، والاسم'
                    : 'Edit profile photo, unique username, and display name'}
                </p>
              </div>
            </div>
            <button
              id="close-edit-profile-btn"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Avatar Customization */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/40 border border-purple-500/20">
              <div className="relative group mb-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-400 p-1 bg-black/60 shadow-xl">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  id="trigger-avatar-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity border-2 border-dashed border-purple-400"
                  title={t.changeAvatar}
                >
                  <Camera className="w-6 h-6 text-purple-300 mb-0.5" />
                  <span className="text-[10px] font-bold">{language === 'ar' ? 'تغيير' : 'Change'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rtl:left-0 rtl:right-auto p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white border-2 border-black shadow-lg transition-transform active:scale-95"
                  title={t.uploadPhoto}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="upload-custom-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t.uploadPhoto}</span>
                </button>
                <button
                  type="button"
                  id="toggle-preset-avatars-btn"
                  onClick={() => setShowPresets(!showPresets)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.choosePreset}</span>
                </button>
              </div>

              {/* Preset Avatars Row */}
              {showPresets && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto w-full justify-center p-1">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(url);
                        setShowPresets(false);
                      }}
                      className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-all ${
                        avatarUrl === url ? 'border-purple-400 scale-110 shadow-lg shadow-purple-500/50' : 'border-white/20 hover:border-white/60'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Display Name with 5-edits limit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t.displayName}</span>
                </label>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    isNameEditLocked
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : nameEditsRemaining <= 2
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isNameEditLocked ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>{t.nameEditsExhausted}</span>
                    </>
                  ) : (
                    <span>
                      {t.nameEditsRemaining.replace('{count}', String(nameEditsRemaining))}
                    </span>
                  )}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="edit-display-name-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isNameEditLocked}
                  maxLength={50}
                  className={`w-full py-2.5 px-3.5 rounded-xl border text-sm font-semibold transition-all ${
                    isNameEditLocked
                      ? 'bg-zinc-900/60 border-zinc-700/60 text-zinc-500 cursor-not-allowed select-none'
                      : 'bg-black/50 border-white/20 focus:border-purple-400 text-white focus:outline-none focus:ring-1 focus:ring-purple-400'
                  }`}
                  placeholder={t.displayNamePlaceholder}
                />
                {isNameEditLocked && (
                  <span className="absolute right-3 rtl:left-3 rtl:right-auto top-3 text-red-400">
                    <Lock className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {isNameEditLocked
                  ? t.nameEditsExhausted
                  : t.nameEditsWarning}
              </p>
            </div>

            {/* 3. Unique Username */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t.username}</span>
                </label>
                <span className="text-[10px] text-purple-300 font-mono">
                  {language === 'ar' ? 'فريد ومرتبط بحسابك فقط' : 'Unique to your account'}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-2.5 text-zinc-500 font-mono text-sm">
                  @
                </span>
                <input
                  type="text"
                  id="edit-username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={30}
                  className={`w-full py-2.5 px-8 rtl:pr-8 rtl:pl-10 rounded-xl border text-sm font-mono transition-all bg-black/50 text-white focus:outline-none ${
                    usernameStatus === 'available'
                      ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      : usernameStatus === 'taken' || usernameStatus === 'invalid'
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-white/20 focus:border-purple-400'
                  }`}
                  placeholder="star_creator"
                />
                <div className="absolute right-3 rtl:left-3 rtl:right-auto top-3">
                  {usernameStatus === 'checking' && (
                    <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                  )}
                  {usernameStatus === 'available' && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'short') && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>

              {/* Status Message */}
              <div className="mt-1 text-[11px]">
                {usernameStatus === 'checking' && (
                  <span className="text-purple-300">{t.checkingUsername}</span>
                )}
                {usernameStatus === 'available' && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {t.usernameAvailable}
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-red-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t.usernameTaken}
                  </span>
                )}
                {usernameStatus === 'short' && (
                  <span className="text-amber-400">{t.usernameTooShort}</span>
                )}
                {usernameStatus === 'invalid' && (
                  <span className="text-amber-400">{t.usernameInvalid}</span>
                )}
                {usernameStatus === 'idle' && (
                  <span className="text-zinc-400">{t.usernameUniqueNotice}</span>
                )}
              </div>
            </div>

            {/* 4. Bio */}
            <div>
              <label className="text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.bioLabel}</span>
              </label>
              <textarea
                id="edit-bio-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={300}
                className="w-full py-2.5 px-3.5 rounded-xl border border-white/20 bg-black/50 text-white text-xs leading-relaxed focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                placeholder={t.bioPlaceholder}
              />
              <div className="flex justify-end text-[10px] text-zinc-500 font-mono mt-0.5">
                {bio.length} / 300
              </div>
            </div>

            {/* Global Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Banner */}
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{t.profileUpdated}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                id="cancel-edit-profile-btn"
                onClick={onClose}
                disabled={isSaving}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-bold transition-colors"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                id="save-edit-profile-btn"
                disabled={isSaving || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'short'}
                className="py-2.5 px-6 rounded-xl btn-space-primary text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.saving}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.saveProfile}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
