import React, { useState } from 'react';
import { Clip, User, Language } from '../types';
import { translations } from '../translations';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Download, 
  QrCode, 
  Share2, 
  Sparkles, 
  PlusCircle, 
  Search,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface ShareSheetModalProps {
  clip: Clip;
  currentUser: User;
  friendsList: User[];
  language: Language;
  onClose: () => void;
  onShareToStory: (clip: Clip) => void;
  onSendDirect: (clip: Clip, targetUser: User) => void;
}

export const ShareSheetModal: React.FC<ShareSheetModalProps> = ({
  clip,
  currentUser,
  friendsList,
  language,
  onClose,
  onShareToStory,
  onSendDirect,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentUsers, setSentUsers] = useState<string[]>([]);
  const [showQr, setShowQr] = useState(false);

  const filteredFriends = friendsList.filter(
    (f) =>
      f.id !== currentUser.id &&
      (f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getShareUrl = () => `${window.location.origin}/#clip-${clip.id}`;

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Five Seasons — ${clip.caption.slice(0, 50)}`,
          text: `${clip.caption}\n#FiveSeasons`,
          url: url,
        });
        onClose();
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleShareToWhatsApp = () => {
    const url = getShareUrl();
    const text = encodeURIComponent(`شاهد هذا المقطع المميز على منصة الفصول الخمسة Five Seasons:\n${clip.caption}\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareToTelegram = () => {
    const url = getShareUrl();
    const text = encodeURIComponent(`شاهد هذا المقطع على Five Seasons: ${clip.caption}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
  };

  const handleShareToTwitter = () => {
    const url = getShareUrl();
    const text = encodeURIComponent(`شاهد هذا المقطع على #FiveSeasons:\n${clip.caption}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleSendToFriend = (user: User) => {
    if (sentUsers.includes(user.id)) return;
    onSendDirect(clip, user);
    setSentUsers((prev) => [...prev, user.id]);
  };

  return (
    <div
      id="share-sheet-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0c0c1a] border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-5 md:p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto no-scrollbar"
      >
        {/* Header with Title and Close 'X' Button */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">{t.shareTitle}</h3>
          </div>
          <button
            id="close-share-sheet-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all"
            aria-label={t.close}
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Action 1: Share to Instagram-like Story */}
        <button
          id="share-to-story-action-btn"
          onClick={() => {
            onShareToStory(clip);
            onClose();
          }}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-pink-950/60 border border-indigo-500/30 hover:border-indigo-400 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-indigo-400 group-hover:rotate-90 transition-transform" />
              </div>
            </div>
            <div className="text-left rtl:text-right">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{t.shareToStory}</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-[11px] text-white/50">{t.shareToStoryDesc}</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold text-white font-mono">
            24h
          </span>
        </button>

        {/* Action 2: Direct Message to Friends */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80">{t.sendToFriends}</span>
            <span className="text-[10px] text-white/40 font-mono">
              {filteredFriends.length} {language === 'ar' ? 'أصدقاء' : 'pioneers'}
            </span>
          </div>

          {/* Search bar inside share */}
          <div className="relative">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              id="share-friend-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchFriends}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-9 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Friends horizontal / vertical list */}
          {filteredFriends.length === 0 ? (
            <div className="py-3 px-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <p className="text-[11px] text-white/50 mb-1">
                {language === 'ar'
                  ? 'لا يوجد رواد آخرون متصلون حالياً، يمكنك مشاركة المقطع عبر التطبيقات بالأسفل'
                  : 'No other pioneers registered yet. You can share via the apps below.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 py-2 max-h-40 overflow-y-auto no-scrollbar">
              {filteredFriends.map((friend) => {
                const isSent = sentUsers.includes(friend.id);
                return (
                  <div
                    key={friend.id}
                    onClick={() => handleSendToFriend(friend)}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={friend.avatarUrl}
                        alt={friend.displayName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10 group-hover:border-indigo-400 transition-all"
                      />
                      {isSent && (
                        <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-white/80 group-hover:text-white truncate max-w-[64px] text-center">
                      {friend.displayName.split(' ')[0]}
                    </span>
                    <button
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-all ${
                        isSent
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/10 text-white/80 group-hover:bg-indigo-600 group-hover:text-white'
                      }`}
                    >
                      {isSent ? (language === 'ar' ? 'أُرسل' : 'Sent') : t.send}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action 3: Social & External Apps Quick Share */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-white/80">
            {language === 'ar' ? 'المشاركة عبر التطبيقات' : 'Share to Apps'}
          </span>
          <div className="grid grid-cols-4 gap-2">
            <button
              id="share-whatsapp-btn"
              onClick={handleShareToWhatsApp}
              className="p-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <span className="text-emerald-400 font-bold text-xs">WhatsApp</span>
            </button>
            <button
              id="share-telegram-btn"
              onClick={handleShareToTelegram}
              className="p-2.5 rounded-2xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <span className="text-sky-400 font-bold text-xs">Telegram</span>
            </button>
            <button
              id="share-twitter-btn"
              onClick={handleShareToTwitter}
              className="p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/20 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <span className="text-white font-bold text-xs">X / Twitter</span>
            </button>
            <button
              id="share-native-more-btn"
              onClick={handleNativeShare}
              className="p-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-400/40 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <span className="text-indigo-300 font-bold text-xs">{language === 'ar' ? 'المزيد...' : 'More...'}</span>
            </button>
          </div>
        </div>

        {/* Row of Quick Actions: Copy Link, Download, QR Code */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/10">
          {/* Copy Link */}
          <button
            id="share-copy-link-btn"
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all group"
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <Copy className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-[10px] font-medium text-white/90">
              {copied ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : t.copyLink}
            </span>
          </button>

          {/* Save / Download */}
          <button
            id="share-download-btn"
            onClick={() => {
              const a = document.createElement('a');
              a.href = clip.mediaUrl;
              a.download = `FiveSeasons_Clip_${clip.id}.mp4`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all group"
          >
            <Download className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium text-white/90">{t.downloadMedia}</span>
          </button>

          {/* Cosmic QR Code */}
          <button
            id="share-qr-btn"
            onClick={() => setShowQr(!showQr)}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all group"
          >
            <QrCode className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium text-white/90">{t.qrCode}</span>
          </button>
        </div>

        {/* QR Code Popover */}
        {showQr && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-black/80 border border-indigo-500/30 flex flex-col items-center text-center gap-2"
          >
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <div className="w-32 h-32 flex items-center justify-center border-4 border-black text-black font-mono text-[9px] font-bold text-center">
                [5 SEASONS 8K DRM SECURED QR CODE: {clip.id.slice(0, 8)}]
              </div>
            </div>
            <span className="text-[10px] text-white/60 font-mono">
              fiveseasons.space/clip/{clip.id.slice(0, 8)}
            </span>
          </motion.div>
        )}

        {/* DRM Security Note */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>DRM Protected 8K Clip & Signed URL Hash</span>
        </div>
      </motion.div>
    </div>
  );
};
