import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Crown, Shield, Globe, Lock, Mail, User as UserIcon, ArrowRight, CheckCircle2, AlertCircle, Sun, Moon } from 'lucide-react';
import { Language, User, PioneerTierType, Theme } from '../types';
import { translations, getPioneerTier } from '../translations';
import { PioneerBadge } from './PioneerBadge';
import { OfficialLogo } from './OfficialLogo';
import { signInWithGoogle, signUpWithEmail, logInWithEmail } from '../firebase';

interface AuthScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  onAuthSuccess: (user: User) => void;
  onOpenFounderModal: () => void;
  totalRegisteredUsers: number;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  language,
  onLanguageChange,
  theme = 'dark',
  onThemeChange,
  onAuthSuccess,
  onOpenFounderModal,
  totalRegisteredUsers,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[language];

  // Calculated next priority account number
  const nextAccountNumber = totalRegisteredUsers + 1;
  const projectedTier: PioneerTierType = getPioneerTier(nextAccountNumber);

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (val.length > 0 && val.length < 8) {
      setError(t.passwordTooShort);
    } else {
      setError(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError(t.passwordTooShort);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const user = await signUpWithEmail(
          email.trim(),
          password,
          username.trim() || email.split('@')[0],
          displayName.trim() || username.trim() || email.split('@')[0]
        );
        onAuthSuccess(user);
      } else {
        const user = await logInWithEmail(email.trim(), password);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err?.message || 'Authentication failed';
      if (err?.code === 'auth/email-already-in-use') {
        msg = language === 'ar' ? 'البريد الإلكتروني مسجل بالفعل' : 'This email is already registered.';
      } else if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/user-not-found'
      ) {
        msg = language === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = language === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email address.';
      } else if (err?.code === 'auth/weak-password') {
        msg = language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password is too weak.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onAuthSuccess(user);
    } catch (err: any) {
      console.error('Google Auth error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(
          language === 'ar'
            ? 'تعذر تسجيل الدخول بحساب Google. تأكد من فتح نافذة تسجيل الدخول.'
            : 'Google sign in could not be completed.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-screen-container"
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 z-10"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Navbar with Language Switcher */}
      <div className="w-full max-w-5xl flex items-center justify-between py-4 mb-4">
        {/* Official Brand Logo */}
        <div className="flex items-center gap-3">
          <OfficialLogo size="md" />
          <div>
            <h1 className="text-xl font-black tracking-wider text-white">
              {t.appName}
            </h1>
          </div>
        </div>

        {/* Top Controls: Theme Switcher & Language Selector */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          {onThemeChange && (
            <button
              id="auth-theme-toggle-btn"
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all active:scale-95 shadow-sm"
              title={theme === 'dark' ? t.lightMode : t.darkMode}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>
          )}

          {/* Language Selector Dropdown */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
            <Globe className="w-3.5 h-3.5 text-indigo-400 ml-2 rtl:mr-2 rtl:ml-0" />
            <button
              id="lang-btn-en"
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              id="lang-btn-ar"
              onClick={() => onLanguageChange('ar')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                language === 'ar'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              العربية
            </button>
          </div>
        </div>
      </div>

      {/* Main Glass Card */}
      <motion.div
        id="auth-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-[36px] glass-card border border-white/10 p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
      >
        {/* Decorative cosmic orb */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Priority Pioneer Badge Preview (For Sign Up) */}
        {isSignUp && (
          <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between backdrop-blur-md">
            <div>
              <div className="text-[11px] text-indigo-300 font-medium">
                {t.yourPioneerNumber}
              </div>
              <div className="font-mono text-sm font-bold text-white flex items-center gap-1.5">
                <span>{t.accountNumberLabel}{nextAccountNumber}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
            <PioneerBadge tier={projectedTier} accountNumber={nextAccountNumber} language={language} size="sm" />
          </div>
        )}

        {/* Header Title */}
        <div className="text-center mb-6">
          <h2
            id="auth-header-title"
            className="text-2xl md:text-3xl font-black uppercase italic brand-glow text-white mb-2"
            style={{ textShadow: '0 0 20px rgba(79, 70, 229, 0.6)' }}
          >
            {isSignUp ? t.createAccount : t.welcomeBack}
          </h2>
          <p className="text-xs text-white/50 leading-relaxed">
            {isSignUp ? t.signUpDesc : t.signInDesc}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 bg-white/5 rounded-full border border-white/10 mb-6">
          <button
            id="tab-signin-btn"
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${
              !isSignUp
                ? 'btn-purple text-white shadow-md'
                : 'text-white/40 hover:text-white'
            }`}
          >
            {t.signIn}
          </button>
          <button
            id="tab-signup-btn"
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${
              isSignUp
                ? 'btn-purple text-white shadow-md'
                : 'text-white/40 hover:text-white'
            }`}
          >
            {t.signUp}
          </button>
        </div>

        {/* Google One-Click Register / Login */}
        <button
          id="google-auth-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm mb-4"
        >
          {/* Google Color G SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{t.googleAuth}</span>
        </button>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-white/10" />
          <span className="flex-shrink mx-3 text-[10px] text-zinc-500 font-medium">
            {t.orContinueWith}
          </span>
          <div className="flex-grow border-t border-white/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-3.5">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {t.displayName}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                  <input
                    id="signup-displayname-input"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-400 rounded-full py-2.5 px-10 text-xs text-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {t.username}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-xs font-mono text-indigo-400">
                    @
                  </span>
                  <input
                    id="signup-username-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-400 rounded-full py-2.5 px-10 text-xs text-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              {t.email}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-400 rounded-full py-2.5 px-10 text-xs text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-white/80">
                {t.password}
              </label>
              <span className="text-[10px] text-white/40 font-mono">
                {t.passwordRequirement}
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
              <input
                id="auth-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`w-full bg-white/[0.04] border rounded-full py-2.5 px-10 text-xs text-white focus:outline-none transition-all ${
                  password.length > 0 && password.length < 8
                    ? 'border-red-500/50 focus:border-red-400'
                    : password.length >= 8
                    ? 'border-emerald-500/50 focus:border-emerald-400'
                    : 'border-white/10 focus:border-indigo-400'
                }`}
              />
              {password.length >= 8 && (
                <CheckCircle2 className="absolute right-3.5 rtl:left-3.5 rtl:right-auto top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button with blue-purple interactive animation */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading || password.length < 8}
            className={`w-full py-3.5 px-6 rounded-full font-bold uppercase tracking-widest text-xs text-white flex items-center justify-center gap-2 transition-all mt-3 ${
              password.length < 8
                ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                : 'btn-purple cursor-pointer shadow-lg shadow-indigo-950/60'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? t.signUp : t.signIn}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Founder Tribute Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <button
          type="button"
          id="founder-tribute-text"
          onClick={onOpenFounderModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/30 text-xs font-semibold text-white/80 hover:text-white select-none shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.foundedBy}</span>
        </button>
      </motion.div>
    </div>
  );
};
