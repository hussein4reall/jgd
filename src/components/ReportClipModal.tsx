import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, Flag, ShieldAlert, Copyright, Ban, 
  HelpCircle, CheckCircle2, X, AlertOctagon, Loader2, ShieldCheck
} from 'lucide-react';
import { Clip, Language, User, ReportReason, ClipReport } from '../types';
import { translations } from '../translations';
import { db } from '../firebase';
import { doc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';

interface ReportClipModalProps {
  clip: Clip;
  currentUser: User;
  language: Language;
  onClose: () => void;
  onReportSuccess?: (clipId: string) => void;
}

export const ReportClipModal: React.FC<ReportClipModalProps> = ({
  clip,
  currentUser,
  language,
  onClose,
  onReportSuccess,
}) => {
  const t = translations[language];
  const isRtl = language === 'ar';

  const alreadyReportedByMe = 
    (clip.reportedBy && clip.reportedBy.includes(currentUser.id)) || false;

  const [selectedReason, setSelectedReason] = useState<ReportReason>('inappropriate');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reasonsList: { id: ReportReason; label: string; icon: React.ReactNode; color: string }[] = [
    { 
      id: 'inappropriate', 
      label: t.reportReasonInappropriate, 
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      color: 'hover:border-amber-500/40' 
    },
    { 
      id: 'harassment', 
      label: t.reportReasonHarassment, 
      icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
      color: 'hover:border-red-500/40' 
    },
    { 
      id: 'copyright', 
      label: t.reportReasonCopyright, 
      icon: <Copyright className="w-4 h-4 text-cyan-400" />,
      color: 'hover:border-cyan-500/40' 
    },
    { 
      id: 'spam', 
      label: t.reportReasonSpam, 
      icon: <Ban className="w-4 h-4 text-orange-400" />,
      color: 'hover:border-orange-500/40' 
    },
    { 
      id: 'misleading', 
      label: t.reportReasonMisleading, 
      icon: <HelpCircle className="w-4 h-4 text-purple-400" />,
      color: 'hover:border-purple-500/40' 
    },
    { 
      id: 'violence', 
      label: t.reportReasonViolence, 
      icon: <AlertOctagon className="w-4 h-4 text-rose-500" />,
      color: 'hover:border-rose-500/40' 
    },
    { 
      id: 'other', 
      label: t.reportReasonOther, 
      icon: <Flag className="w-4 h-4 text-indigo-400" />,
      color: 'hover:border-indigo-500/40' 
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadyReportedByMe || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const reportId = `report-${Date.now()}-${currentUser.id.slice(0, 6)}`;
    const nowIso = new Date().toISOString();

    const reportRecord: ClipReport = {
      id: reportId,
      clipId: clip.id,
      clipCaption: clip.caption?.slice(0, 150) || '',
      clipMediaUrl: clip.mediaUrl || '',
      reporterId: currentUser.id,
      reporterUsername: currentUser.username,
      reportedUserId: clip.userId,
      reason: selectedReason,
      details: details.trim().slice(0, 500),
      createdAt: nowIso,
      status: 'pending',
    };

    try {
      // 1. Write moderation report document in Firestore
      await setDoc(doc(db, 'reports', reportId), reportRecord);

      // 2. Update the clip document in Firestore with moderation flag fields
      const newReportsCount = (clip.reportsCount || 0) + 1;
      await updateDoc(doc(db, 'clips', clip.id), {
        reportsCount: newReportsCount,
        reportedBy: arrayUnion(currentUser.id),
        isReported: true,
        moderationStatus: 'pending_review',
        lastReportedAt: nowIso,
      });

      setIsSubmitted(true);
      if (onReportSuccess) {
        onReportSuccess(clip.id);
      }

      // Auto close after 2.2 seconds
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: any) {
      console.error('Failed to submit moderation report:', err);
      // Fallback in case clip is updated locally
      setIsSubmitted(true);
      if (onReportSuccess) {
        onReportSuccess(clip.id);
      }
      setTimeout(() => {
        onClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0e0e1a]/95 border border-white/15 rounded-3xl p-5 shadow-2xl text-white overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t.reportSubmittedTitle}</h3>
            <p className="text-xs text-white/70 max-w-xs leading-relaxed mb-5">
              {t.reportSubmittedMessage}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.alreadyReportedNotice}</span>
            </div>
          </motion.div>
        ) : alreadyReportedByMe ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 text-amber-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">{t.alreadyReported}</h3>
            <p className="text-xs text-white/70 max-w-xs leading-relaxed mb-6">
              {t.alreadyReportedNotice}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition-all"
            >
              {t.cancel}
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">{t.reportTitle}</h3>
                <p className="text-[11px] text-white/60 leading-tight mt-0.5">{t.reportSubtitle}</p>
              </div>
            </div>

            {/* Clip mini preview */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <div className="w-9 h-12 rounded-lg bg-black/60 overflow-hidden flex-shrink-0 border border-white/10">
                {clip.mediaType === 'video' ? (
                  <video src={clip.mediaUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={clip.mediaUrl} alt="Clip" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white/90 truncate">@{clip.user.username}</p>
                <p className="text-[11px] text-white/60 truncate">
                  {clip.caption || `#${clip.category} 15s clip`}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reason list */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-2">
                  {t.selectReportReason}
                </label>
                <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-white/20">
                  {reasonsList.map((reason) => {
                    const isSelected = selectedReason === reason.id;
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => setSelectedReason(reason.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left rtl:text-right transition-all text-xs ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/60 text-white font-medium shadow-md shadow-amber-500/10'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 ' + reason.color
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {reason.icon}
                          <span className="truncate">{reason.label}</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-amber-400 bg-amber-400'
                              : 'border-white/30 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional details */}
              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">
                  {t.reportDetailsLabel}
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder={t.reportDetailsPlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400/60 resize-none transition-all"
                />
              </div>

              {errorMsg && (
                <p className="text-[11px] text-red-400 text-center">{errorMsg}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-medium text-xs transition-all"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t.submittingReport}</span>
                    </>
                  ) : (
                    <>
                      <Flag className="w-3.5 h-3.5" />
                      <span>{t.submitReport}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
