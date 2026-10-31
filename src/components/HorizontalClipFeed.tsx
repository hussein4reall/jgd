import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageSquare, Send, Trophy, Volume2, VolumeX, 
  ChevronLeft, ChevronRight, Sparkles, Plus, Check, Music2,
  Play, X, Trash2, AtSign, Hash, MoreVertical, ShieldCheck, Share2, Film, Flag,
  Maximize2, Minimize2
} from 'lucide-react';
import { Clip, Language, User, ClipComment, Story } from '../types';
import { translations } from '../translations';
import { PioneerBadge } from './PioneerBadge';
import { StoriesBar } from './StoriesBar';
import { ShareSheetModal } from './ShareSheetModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ReportClipModal } from './ReportClipModal';
import confetti from 'canvas-confetti';
import { db } from '../firebase';
import { 
  collection, query, where, onSnapshot, doc, setDoc, 
  deleteDoc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';

interface HorizontalClipFeedProps {
  clips: Clip[];
  currentUser: User;
  allUsers?: User[];
  stories?: Story[];
  language: Language;
  onOpenStudio: () => void;
  onLikeClip: (clipId: string) => void;
  onVoteClip: (clipId: string) => void;
  onAddComment: (clipId: string, text: string) => void;
  onDeleteComment?: (clipId: string, commentId: string) => void;
  onDeleteClip?: (clipId: string) => void;
  onShareToStory?: (clip: Clip) => void;
  onSendDirect?: (clip: Clip, targetUser: User) => void;
  onOpenStory?: (story: Story) => void;
  onAddStory?: () => void;
  onOpenFounderModal: () => void;
  onOpenUserBio?: (user: any) => void;
}

export const HorizontalClipFeed: React.FC<HorizontalClipFeedProps> = ({
  clips,
  currentUser,
  allUsers = [],
  stories = [],
  language,
  onOpenStudio,
  onLikeClip,
  onVoteClip,
  onAddComment,
  onDeleteComment,
  onDeleteClip,
  onShareToStory,
  onSendDirect,
  onOpenStory,
  onAddStory,
  onOpenFounderModal,
  onOpenUserBio,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [progress, setProgress] = useState(0);
  const [showCommentsForClipId, setShowCommentsForClipId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [doubleTapPos, setDoubleTapPos] = useState({ x: 0, y: 0 });
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteClipModal, setShowDeleteClipModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<ClipComment | null>(null);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Local comments store per clip (No mock users or accounts)
  const [localComments, setLocalComments] = useState<Record<string, ClipComment[]>>({});

  // Real-time Firestore sync for comments when comments modal is opened
  useEffect(() => {
    if (!showCommentsForClipId) return;
    const clipId = showCommentsForClipId;
    const q = query(collection(db, 'comments'), where('clipId', '==', clipId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const comms: ClipComment[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const likedBy = Array.isArray(d.likedBy) ? d.likedBy : [];
          const isLiked = currentUser ? likedBy.includes(currentUser.id) : false;
          return {
            id: docSnap.id,
            clipId: d.clipId,
            userId: d.userId,
            userName: d.userName,
            userAvatar: d.userAvatar,
            userPioneerTier: d.userPioneerTier,
            userAccountNumber: d.userAccountNumber,
            text: d.text,
            createdAt: d.createdAt,
            likes: typeof d.likes === 'number' ? d.likes : likedBy.length,
            likedBy,
            isLiked,
          };
        });
        comms.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setLocalComments((prev) => ({
          ...prev,
          [clipId]: comms,
        }));
      },
      (error) => {
        console.warn('Comments realtime listener notice:', error);
      }
    );
    return () => unsubscribe();
  }, [showCommentsForClipId, currentUser?.id]);

  const t = translations[language];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  const currentClip = clips[currentIndex];

  // Auto-clamp index if clips change
  useEffect(() => {
    if (currentIndex >= clips.length && clips.length > 0) {
      setCurrentIndex(clips.length - 1);
    }
  }, [clips.length, currentIndex]);

  // Synchronize HTML video element playback directly with isPlaying state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
    if (bgVideoRef.current) {
      if (isPlaying) {
        bgVideoRef.current.play().catch(() => {});
      } else {
        bgVideoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Synchronize audio muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Reset playback and progress when switching to another clip
  useEffect(() => {
    setIsPlaying(true);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    if (bgVideoRef.current) {
      bgVideoRef.current.currentTime = 0;
      bgVideoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  // Real-time synchronization of the progress bar with the actual video currentTime
  useEffect(() => {
    let animId: number;

    const syncWithVideo = () => {
      const v = videoRef.current;
      if (v && v.duration && !isNaN(v.duration) && v.duration > 0) {
        const pct = (v.currentTime / v.duration) * 100;
        setProgress(Math.min(100, Math.max(0, pct)));
      }
      if (isPlaying) {
        animId = requestAnimationFrame(syncWithVideo);
      }
    };

    if (currentClip?.mediaType === 'video') {
      if (isPlaying) {
        animId = requestAnimationFrame(syncWithVideo);
      } else {
        const v = videoRef.current;
        if (v && v.duration && !isNaN(v.duration) && v.duration > 0) {
          setProgress(Math.min(100, Math.max(0, (v.currentTime / v.duration) * 100)));
        }
      }
    } else {
      // Fallback for image clips (15s duration)
      if (!isPlaying) return;
      const duration = (currentClip?.durationSeconds || 15) * 1000;
      const intervalTime = 50;
      const step = (intervalTime / duration) * 100;
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + step));
      }, intervalTime);
      return () => clearInterval(interval);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, currentIndex, currentClip]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    if (videoRef.current && videoRef.current.duration) {
      const targetTime = ratio * videoRef.current.duration;
      videoRef.current.currentTime = targetTime;
      if (bgVideoRef.current) {
        bgVideoRef.current.currentTime = targetTime;
      }
    }
    setProgress(ratio * 100);
  };

  const handleNext = () => {
    if (currentIndex < clips.length - 1) {
      setDirection('next');
      setCurrentIndex((prev) => prev + 1);
      setShowOptionsMenu(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection('prev');
      setCurrentIndex((prev) => prev - 1);
      setShowOptionsMenu(false);
    }
  };

  // Toggle Play/Pause imperative handler with instant HTML video response
  const togglePlayPause = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (videoRef.current) {
        if (next) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
      if (bgVideoRef.current) {
        if (next) {
          bgVideoRef.current.play().catch(() => {});
        } else {
          bgVideoRef.current.pause();
        }
      }
      return next;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (language === 'ar') handlePrev();
        else handleNext();
      } else if (e.key === 'ArrowLeft') {
        if (language === 'ar') handleNext();
        else handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, clips.length, language]);

  // Touch Swipe gestures for mobile horizontal swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        if (language === 'ar') handlePrev();
        else handleNext();
      } else {
        if (language === 'ar') handleNext();
        else handlePrev();
      }
    }
    setTouchStartX(null);
  };

  // Double Tap to Like Video with Instagram-style scale heart animation, or Single Tap to Play/Pause
  const handleMediaClick = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapTime < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (currentClip) {
        if (!currentClip.isLiked) {
          onLikeClip(currentClip.id);
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setDoubleTapPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setShowDoubleTapHeart(true);
        setTimeout(() => setShowDoubleTapHeart(false), 800);
      }
    } else {
      // Single tap -> Play / Pause
      togglePlayPause();
    }
    setLastTapTime(now);
  };

  const handleVote = (clipId: string) => {
    onVoteClip(clipId);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#7c3aed', '#ec4899', '#3b82f6'],
    });
  };

  // Video Share Handler (Native Share with automatic fallback to ShareSheetModal)
  const handleShareClip = async () => {
    if (!currentClip) return;
    const shareUrl = `${window.location.origin}/#clip-${currentClip.id}`;

    // Update sharesCount in Firestore
    try {
      await updateDoc(doc(db, 'clips', currentClip.id), {
        sharesCount: (currentClip.sharesCount || 0) + 1,
      });
    } catch {}

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Five Seasons — ${currentClip.caption.slice(0, 45)}`,
          text: currentClip.caption,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fall back to modal sheet
      }
    }
    setShowShareModal(true);
  };

  // Comment Like Toggle (Each account can like once, clicking again unlikes)
  const handleToggleLikeComment = async (commentId: string) => {
    if (!currentClip || !currentUser) return;
    const list = localComments[currentClip.id] || [];
    const targetComment = list.find((c) => c.id === commentId);
    if (!targetComment) return;

    const likedByList = Array.isArray(targetComment.likedBy) ? targetComment.likedBy : [];
    const isCurrentlyLiked = likedByList.includes(currentUser.id) || !!targetComment.isLiked;

    const newLiked = !isCurrentlyLiked;
    const newLikes = newLiked
      ? (targetComment.likes || 0) + 1
      : Math.max(0, (targetComment.likes || 1) - 1);
    const newLikedBy = newLiked
      ? [...likedByList.filter((uid) => uid !== currentUser.id), currentUser.id]
      : likedByList.filter((uid) => uid !== currentUser.id);

    // Optimistic UI update
    setLocalComments((prev) => {
      const currentList = prev[currentClip.id] || [];
      const updated = currentList.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: newLiked,
            likes: newLikes,
            likedBy: newLikedBy,
          };
        }
        return c;
      });
      return {
        ...prev,
        [currentClip.id]: updated,
      };
    });

    try {
      const commRef = doc(db, 'comments', commentId);
      if (newLiked) {
        await updateDoc(commRef, {
          likes: newLikes,
          likedBy: arrayUnion(currentUser.id),
        });
      } else {
        await updateDoc(commRef, {
          likes: newLikes,
          likedBy: arrayRemove(currentUser.id),
        });
      }
    } catch (err) {
      console.warn('Comment like Firestore update notice:', err);
    }
  };

  // Comment Handling with Tagging & Firestore persistence
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentClip) return;

    const commId = `comm-${Date.now()}`;
    const newComm: ClipComment = {
      id: commId,
      clipId: currentClip.id,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatarUrl,
      userPioneerTier: currentUser.pioneerTier,
      userAccountNumber: currentUser.accountNumber,
      text: commentInput.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      likedBy: [],
    };

    setLocalComments((prev) => ({
      ...prev,
      [currentClip.id]: [...(prev[currentClip.id] || []), newComm],
    }));

    onAddComment(currentClip.id, commentInput.trim());
    setCommentInput('');
    setShowTagSuggestions(false);

    try {
      await setDoc(doc(db, 'comments', commId), {
        clipId: currentClip.id,
        userId: currentUser.id,
        userName: currentUser.displayName,
        userAvatar: currentUser.avatarUrl,
        userPioneerTier: currentUser.pioneerTier,
        userAccountNumber: currentUser.accountNumber,
        text: newComm.text,
        createdAt: newComm.createdAt,
        likes: 0,
        likedBy: [],
      });
    } catch (e) {
      console.warn('Comment save Firestore notice:', e);
    }
  };

  const handleDeleteCommentConfirm = async () => {
    if (!commentToDelete || !currentClip) return;
    const commId = commentToDelete.id;
    setLocalComments((prev) => ({
      ...prev,
      [currentClip.id]: (prev[currentClip.id] || []).filter((c) => c.id !== commId),
    }));

    try {
      await deleteDoc(doc(db, 'comments', commId));
    } catch (e) {
      console.warn('Comment delete Firestore notice:', e);
    }

    if (onDeleteComment) {
      onDeleteComment(currentClip.id, commId);
    }
    setCommentToDelete(null);
  };

  const handleDeleteClipConfirm = () => {
    if (!currentClip) return;
    if (onDeleteClip) {
      onDeleteClip(currentClip.id);
    }
    setShowDeleteClipModal(false);
  };

  const handleInsertTag = (username: string) => {
    setCommentInput((prev) => `${prev}@${username} `);
    setShowTagSuggestions(false);
  };

  // 1. EMPTY FEED STATE
  if (!clips || clips.length === 0) {
    return (
      <div
        id="empty-feed-container"
        className="w-full flex-1 flex flex-col items-center justify-center p-4 pb-28 pt-6 relative min-h-[480px]"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative max-w-md w-full glass-card border border-white/10 rounded-[36px] p-8 md:p-10 text-center flex flex-col items-center shadow-2xl"
        >
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-400/40 flex items-center justify-center mb-6 bg-white/[0.02]">
            <Film className="w-8 h-8 text-indigo-400" />
          </div>

          <h2 className="text-xl md:text-2xl font-black brand-glow text-white mb-2">
            {t.noClipsYet}
          </h2>

          <p className="text-xs text-white/50 leading-relaxed max-w-xs mb-8">
            {t.emptyFeedSubtitle}
          </p>

          <button
            id="publish-first-clip-btn"
            onClick={onOpenStudio}
            className="btn-purple px-8 py-3.5 rounded-full font-bold text-xs text-white shadow-lg shadow-indigo-900/40 flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t.publishFirstClip}</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const currentComments = (currentClip && localComments[currentClip.id]) || [];

  return (
    <div
      id="horizontal-clip-feed"
      className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden p-0 sm:py-2 select-none h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Symmetrical Outer Side Navigation Buttons (Desktop & Tablets) */}
      <button
        id="desktop-prev-clip-btn"
        onClick={handlePrev}
        disabled={currentIndex === 0}
        aria-label={t.prevClip}
        className={`hidden md:flex absolute left-4 lg:left-12 xl:left-20 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full items-center justify-center transition-all ${
          currentIndex === 0
            ? 'opacity-20 cursor-not-allowed bg-black/30 text-white/30 border border-white/5'
            : 'bg-black/70 hover:bg-indigo-600 text-white border border-white/20 hover:scale-110 active:scale-95 shadow-xl backdrop-blur-xl'
        }`}
      >
        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
      </button>

      <button
        id="desktop-next-clip-btn"
        onClick={handleNext}
        disabled={currentIndex === clips.length - 1}
        aria-label={t.nextClip}
        className={`hidden md:flex absolute right-4 lg:right-12 xl:right-20 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full items-center justify-center transition-all ${
          currentIndex === clips.length - 1
            ? 'opacity-20 cursor-not-allowed bg-black/30 text-white/30 border border-white/5'
            : 'bg-black/70 hover:bg-indigo-600 text-white border border-white/20 hover:scale-110 active:scale-95 shadow-xl backdrop-blur-xl'
        }`}
      >
        <ChevronRight className="w-5 h-5 rtl:rotate-180" />
      </button>

      {/* Main Clip Frame: Matches max-w-[430px] exact proportion from design */}
      <div className="relative w-full max-w-[430px] h-[calc(100dvh-130px)] sm:h-[780px] bg-black sm:rounded-[36px] overflow-hidden shadow-2xl border-0 sm:border-[4px] border-[#1e1e2d] flex flex-col justify-between mx-auto my-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentClip.id}
            custom={direction}
            initial={{ opacity: 0, x: direction === 'next' ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 'next' ? -40 : 40 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full h-full flex flex-col justify-between overflow-hidden"
          >
            {/* Top Section: Progress Bar + Sub-header Tag & Controls Bar */}
            <div className="relative z-30 px-3 pt-2 bg-gradient-to-b from-[#0b0c13]/90 via-[#0b0c13]/70 to-transparent">
              {/* Progress Status Line directly synchronized with Video Playback */}
              <div
                className="w-full py-1 -my-1 cursor-pointer select-none flex items-center group"
                onClick={handleSeek}
                title={language === 'ar' ? 'انقر للتقديم أو الإرجاع' : 'Click to seek'}
              >
                <div className="w-full h-[2.5px] bg-white/15 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                  <div className="h-full bg-transparent flex-1" />
                </div>
              </div>

              {/* Tag Filters and Quick Action Controls Header Bar */}
              <div className="flex items-center justify-between pt-1 mt-1">
                {/* Badges on Left */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Category Tag */}
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white font-bold text-[11px] tracking-tight">
                    #{currentClip.category}
                  </span>

                  {/* Competing in Season Tag */}
                  {currentClip.inCompetition && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/60 text-amber-300 font-bold text-[11px]">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 3h14v2H5V3zm2 4h10v2a5 5 0 0 1-4 4.9V17h3v2H8v-2h3v-3.1A5 5 0 0 1 7 9V7zm-4 2h2v4a3 3 0 0 1-2-2.8V9zm18 0v1.2a3 3 0 0 1-2 2.8V9h2z" />
                      </svg>
                      <span>{language === 'ar' ? 'منافسة في الموسم' : 'Competing in Season'}</span>
                    </span>
                  )}
                </div>

                {/* Quick Video Controls on Right */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Expand Fullscreen / Fit Toggle Icon */}
                  <button
                    id="toggle-fit-mode-btn"
                    aria-label={fitMode === 'contain' ? t.fillView : t.fullView}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFitMode((m) => (m === 'contain' ? 'cover' : 'contain'));
                    }}
                    className={`w-7 h-7 rounded-full border flex items-center justify-center text-white active:scale-90 transition ${
                      fitMode === 'contain'
                        ? 'bg-indigo-600/70 border-indigo-400/40 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                        : 'bg-black/50 border-white/10'
                    }`}
                    type="button"
                    title={fitMode === 'contain' ? t.fillView : t.fullView}
                  >
                    <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15m-11.25 5.25v-4.5m0 4.5h4.5m-4.5 0L9 15"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* Mute / Unmute Audio Icon */}
                  <button
                    id="toggle-sound-btn"
                    aria-label="Sound control"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted((m) => !m);
                    }}
                    className="w-7 h-7 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-gray-300 active:scale-90 transition hover:text-white"
                    type="button"
                  >
                    {isMuted ? (
                      <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" x2="17" y1="9" y2="15" />
                        <line x1="17" x2="23" y1="9" y2="15" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    )}
                  </button>

                  {/* More Options (Three Dots) */}
                  <div className="relative">
                    <button
                      id="clip-options-btn"
                      aria-label="Options"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptionsMenu(!showOptionsMenu);
                      }}
                      className="w-7 h-7 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-gray-300 active:scale-90 transition hover:text-white"
                      type="button"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.8" />
                        <circle cx="12" cy="12" r="1.8" />
                        <circle cx="12" cy="19" r="1.8" />
                      </svg>
                    </button>

                    {/* Options Dropdown Menu */}
                    {showOptionsMenu && (
                      <div
                        className="absolute right-0 rtl:left-0 rtl:right-auto top-8 w-44 rounded-2xl bg-[#0e0e1a]/95 backdrop-blur-xl border border-white/15 p-1.5 shadow-2xl z-50 flex flex-col gap-1 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {currentClip.userId === currentUser.id && (
                          <button
                            onClick={() => {
                              setShowOptionsMenu(false);
                              setShowDeleteClipModal(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/15 transition-all text-left rtl:text-right font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t.deleteClip}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowOptionsMenu(false);
                            setShowShareModal(true);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/90 hover:bg-white/10 transition-all text-left rtl:text-right font-medium"
                        >
                          <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{t.shareTitle}</span>
                        </button>

                        <button
                          id={`report-clip-btn-${currentClip.id}`}
                          onClick={() => {
                            setShowOptionsMenu(false);
                            setShowReportModal(true);
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-amber-400 hover:bg-amber-500/15 transition-all text-left rtl:text-right font-medium"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Flag className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <span className="truncate">{t.reportClip}</span>
                          </div>
                          {currentClip.reportedBy?.includes(currentUser.id) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                              {t.reportedBadge}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Video Viewport Canvas with Realistic Atmosphere */}
            <div
              className="relative flex-1 w-full video-viewport-bg flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={handleMediaClick}
            >
              {/* Blurred Ambient Scenery Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none">
                {currentClip.mediaType === 'video' ? (
                  <video
                    ref={bgVideoRef}
                    src={currentClip.mediaUrl}
                    playsInline
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-cover blur-3xl opacity-35 scale-125 pointer-events-none"
                  />
                ) : (
                  <img
                    src={currentClip.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover blur-3xl opacity-35 scale-125"
                  />
                )}
              </div>

              {/* Foreground Media Player */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {currentClip.mediaType === 'video' ? (
                  <video
                    ref={videoRef}
                    src={currentClip.mediaUrl}
                    playsInline
                    autoPlay
                    loop
                    muted={isMuted}
                    onTimeUpdate={(e) => {
                      const v = e.currentTarget;
                      if (v.duration && !isNaN(v.duration) && v.duration > 0) {
                        setProgress((v.currentTime / v.duration) * 100);
                      }
                    }}
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      if (v.duration && !isNaN(v.duration) && v.duration > 0) {
                        setProgress((v.currentTime / v.duration) * 100);
                      }
                    }}
                    className={`w-full h-full transition-all duration-300 pointer-events-none ${
                      fitMode === 'contain' ? 'object-contain' : 'object-cover'
                    }`}
                  />
                ) : (
                  <img
                    src={currentClip.mediaUrl}
                    alt={currentClip.caption}
                    className={`w-full h-full transition-all duration-300 pointer-events-none ${
                      fitMode === 'contain' ? 'object-contain' : 'object-cover'
                    }`}
                  />
                )}
              </div>

              {/* Central Frosted Play/Pause Icon Button from user design */}
              {!isPlaying && (
                <button
                  aria-label="Play video"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMediaClick(e);
                  }}
                  className="relative z-20 flex items-center justify-center text-white hover:scale-105 active:scale-90 transition cursor-pointer bg-transparent border-0"
                  type="button"
                >
                  <svg className="w-16 h-16 fill-white drop-shadow translate-x-0.5" viewBox="0 0 24 24">
                    <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.67-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z" />
                  </svg>
                </button>
              )}

              {/* Double Tap Heart Floating Animation */}
              {showDoubleTapHeart && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: 1 }}
                  exit={{ scale: 2.0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="absolute z-40 pointer-events-none"
                  style={{
                    left: doubleTapPos.x > 0 ? doubleTapPos.x - 32 : '50%',
                    top: doubleTapPos.y > 0 ? doubleTapPos.y - 32 : '50%',
                    transform: doubleTapPos.x === 0 ? 'translate(-50%, -50%)' : undefined,
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-purple-600/60 backdrop-blur-md flex items-center justify-center border border-purple-300 shadow-2xl">
                    <Heart className="w-8 h-8 fill-purple-400 text-white" />
                  </div>
                </motion.div>
              )}

              {/* Readability Scrims */}
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              {/* Right Action Sidebar (mirrored for RTL) */}
              <aside className="absolute right-3 rtl:right-auto rtl:left-3 bottom-6 z-20 flex flex-col items-center gap-2.5">
                {/* User Avatar with Follow (+) Purple Dot */}
                <div
                  className="relative cursor-pointer group mb-1 active:scale-95 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenUserBio) onOpenUserBio(currentClip.user);
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-700 via-purple-700 to-amber-600 p-[1.5px] shadow-lg">
                    <div className="w-full h-full rounded-full bg-[#8f6d63] flex items-center justify-center font-bold text-white text-base overflow-hidden">
                      {currentClip.user.avatarUrl ? (
                        <img
                          src={currentClip.user.avatarUrl}
                          alt={currentClip.user.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        currentClip.user.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                  {/* Plus Icon Badge */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-white border border-black shadow">
                    <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Like / Heart Button */}
                <div className="flex flex-col items-center">
                  <button
                    id={`like-clip-btn-${currentClip.id}`}
                    aria-label="Like clip"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLikeClip(currentClip.id);
                    }}
                    className="w-10 h-9 rounded-full active:scale-90 flex items-center justify-center text-white transition bg-transparent"
                    type="button"
                  >
                    <svg
                      className={`w-6 h-6 drop-shadow transition-colors ${
                        currentClip.isLiked ? 'fill-red-500 text-red-500' : 'fill-white text-white'
                      }`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                  <span className="text-[11px] font-bold text-white tracking-tight drop-shadow">
                    {currentClip.likesCount}
                  </span>
                </div>

                {/* Trophy / Competition Button */}
                {currentClip.inCompetition && (
                  <div className="flex flex-col items-center">
                    <button
                      id={`vote-clip-btn-${currentClip.id}`}
                      aria-label="Support in season"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(currentClip.id);
                      }}
                      className="w-10 h-9 rounded-full active:scale-90 flex items-center justify-center text-white transition bg-transparent"
                      type="button"
                      title={language === 'ar' ? 'تصويت في المسابقة' : 'Vote in Competition'}
                    >
                      <svg
                        className={`w-6 h-6 drop-shadow transition-colors ${
                          currentClip.isVoted ? 'fill-amber-400 text-amber-400' : 'fill-white text-white'
                        }`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H8v2h8v-2h-3v-3.1c1.8-.39 3.23-1.82 3.61-3.96C19.08 11.63 21 9.55 21 7V5c0-1.1-.9-2-2-2zm-14 3V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                      </svg>
                    </button>
                    <span className="text-[11px] font-bold text-amber-300 tracking-tight drop-shadow">
                      {currentClip.votesCount}
                    </span>
                  </div>
                )}

                {/* Comment Button */}
                <div className="flex flex-col items-center">
                  <button
                    id={`comment-clip-btn-${currentClip.id}`}
                    aria-label="Comments"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCommentsForClipId(currentClip.id);
                    }}
                    className="w-10 h-9 rounded-full active:scale-90 flex items-center justify-center text-white transition bg-transparent border-0"
                    type="button"
                  >
                    <svg className="w-6 h-6 stroke-[2] fill-transparent drop-shadow" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <span className="text-[11px] font-bold text-white tracking-tight drop-shadow">
                    {currentComments.length || currentClip.commentsCount}
                  </span>
                </div>

                {/* Share Button */}
                <div className="flex flex-col items-center">
                  <button
                    id={`share-clip-btn-${currentClip.id}`}
                    aria-label="Share video"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareClip();
                    }}
                    className="w-10 h-9 rounded-full active:scale-90 flex items-center justify-center text-white transition bg-transparent border-0"
                    type="button"
                  >
                    <svg className="w-6 h-6 stroke-[2] drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
                      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                    </svg>
                  </button>
                  <span className="text-[10px] font-semibold text-gray-200 drop-shadow">
                    {language === 'ar' ? 'مشاركة' : 'Share'}
                  </span>
                </div>
              </aside>

              {/* Video Meta Details: Author, Pioneer Badge, Caption Overlay */}
              <div className="absolute left-3 rtl:left-auto rtl:right-3 rtl:text-right bottom-4 z-20 max-w-[70%]">
                {/* Author handle & Pioneer badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-white drop-shadow">
                    @{currentClip.user.username}
                  </span>
                  {/* Glowing Purple Pioneer Pill Tag */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                    <svg className="w-3 h-3 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                    </svg>
                    <span className="text-[10px] font-bold text-purple-200">
                      {language === 'ar' ? 'رائد' : 'Pioneer'}
                    </span>
                    <span className="text-[9px] font-extrabold text-white bg-purple-700/80 px-1 rounded-sm">
                      #{currentClip.user.accountNumber || 1}
                    </span>
                  </div>
                </div>

                {/* Caption Description */}
                <p className="text-xs text-gray-200 mt-1 font-medium leading-relaxed drop-shadow line-clamp-2">
                  {currentClip.caption}
                </p>

                {/* Soundtrack Ticker */}
                {currentClip.musicTrack && (
                  <div className="inline-flex items-center gap-1.5 text-[10px] text-purple-200 bg-black/60 px-2 py-0.5 rounded-full border border-purple-500/30 backdrop-blur-md max-w-full truncate mt-1">
                    <Music2 className="w-3 h-3 text-purple-400 animate-pulse flex-shrink-0" />
                    <span className="truncate">
                      {currentClip.musicTrack.title} — {currentClip.musicTrack.artist}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* TIKTOK-STYLE EXPANDED COMMENTS MODAL (75% screen height with close X & tagging) */}
      <AnimatePresence>
        {showCommentsForClipId && (
          <div
            id="comments-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center select-none"
            onClick={() => setShowCommentsForClipId(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-lg h-[75vh] max-h-[640px] rounded-t-[36px] bg-[#0c0c18] border-t border-x border-white/10 p-5 flex flex-col justify-between shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle & Header with 'X' Close Button */}
              <div>
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-sm text-white">
                      {t.comments} ({currentComments.length})
                    </h3>
                  </div>
                  <button
                    id="close-comments-btn"
                    onClick={() => setShowCommentsForClipId(null)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                    aria-label={t.close}
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Comments list with Deletion & Like options */}
              <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 no-scrollbar">
                {currentComments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/40">
                    {t.noCommentsYet}
                  </div>
                ) : (
                  currentComments.map((comm) => {
                    const canDelete =
                      comm.userId === currentUser.id ||
                      (currentClip && currentClip.userId === currentUser.id);

                    return (
                      <div
                        key={comm.id}
                        className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-xs transition-all flex items-start justify-between gap-2.5"
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <img
                            src={comm.userAvatar}
                            alt={comm.userName}
                            className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="font-bold text-indigo-300">
                                {comm.userName}
                              </span>
                              <PioneerBadge
                                tier={comm.userPioneerTier}
                                accountNumber={comm.userAccountNumber}
                                language={language}
                                size="sm"
                                showLabel={false}
                              />
                              <span className="text-[10px] text-white/40 font-mono">
                                {new Date(comm.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-white/90 leading-relaxed break-words">
                              {comm.text}
                            </p>
                          </div>
                        </div>

                        {/* Comment Actions: Like Button with counter starting from 0, and Delete icon */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Comment Like Button */}
                          <button
                            id={`like-comm-btn-${comm.id}`}
                            type="button"
                            onClick={() => handleToggleLikeComment(comm.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 transition-all active:scale-90"
                            title={language === 'ar' ? 'إعجاب بالتعليق' : 'Like comment'}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 transition-colors ${
                                comm.isLiked
                                  ? 'fill-rose-500 text-rose-500'
                                  : 'text-white/40 hover:text-white/70'
                              }`}
                            />
                            <span
                              className={`text-[11px] font-mono font-bold ${
                                comm.isLiked ? 'text-rose-400' : 'text-white/60'
                              }`}
                            >
                              {comm.likes || 0}
                            </span>
                          </button>

                          {/* Delete icon (if author or clip owner) */}
                          {canDelete && (
                            <button
                              id={`del-comm-btn-${comm.id}`}
                              onClick={() => setCommentToDelete(comm)}
                              className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                              title={t.deleteComment}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Tag Autocomplete Popover */}
              {showTagSuggestions && (
                <div className="mb-2 p-2 rounded-2xl bg-black/90 border border-indigo-500/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-indigo-300 font-bold px-1">
                    {t.insertTag}:
                  </span>
                  {allUsers.slice(0, 5).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleInsertTag(u.username)}
                      className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-indigo-600 text-white text-[11px] font-mono flex items-center gap-1"
                    >
                      @{u.username}
                    </button>
                  ))}
                </div>
              )}

              {/* Add Comment Input with Tag helper */}
              <form onSubmit={handleCommentSubmit} className="pt-3 border-t border-white/10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTagSuggestions(!showTagSuggestions)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                    showTagSuggestions
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-white/5 border-white/10 text-indigo-400 hover:bg-white/10'
                  }`}
                  title={t.tagFriend}
                >
                  <AtSign className="w-4 h-4" />
                </button>

                <input
                  id="clip-comment-input"
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder={t.writeComment}
                  className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-400 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none transition-all"
                />

                <button
                  id="submit-comment-btn"
                  type="submit"
                  disabled={!commentInput.trim()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${
                    commentInput.trim()
                      ? 'btn-purple shadow-md'
                      : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4 rtl:rotate-180" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE MODAL SHEET */}
      {showShareModal && currentClip && (
        <ShareSheetModal
          clip={currentClip}
          currentUser={currentUser}
          friendsList={allUsers}
          language={language}
          onClose={() => setShowShareModal(false)}
          onShareToStory={(c) => {
            if (onShareToStory) onShareToStory(c);
          }}
          onSendDirect={(c, u) => {
            if (onSendDirect) onSendDirect(c, u);
          }}
        />
      )}

      {/* DELETE COMMENT CONFIRMATION MODAL */}
      {commentToDelete && (
        <DeleteConfirmModal
          title={t.deleteComment}
          description={t.deleteCommentConfirm}
          language={language}
          onConfirm={handleDeleteCommentConfirm}
          onCancel={() => setCommentToDelete(null)}
        />
      )}

      {/* DELETE CLIP CONFIRMATION MODAL */}
      {showDeleteClipModal && (
        <DeleteConfirmModal
          title={t.deleteClip}
          description={t.deleteClipConfirm}
          language={language}
          onConfirm={handleDeleteClipConfirm}
          onCancel={() => setShowDeleteClipModal(false)}
        />
      )}

      {/* MODERATION REPORT CLIP MODAL */}
      <AnimatePresence>
        {showReportModal && currentClip && (
          <ReportClipModal
            clip={currentClip}
            currentUser={currentUser}
            language={language}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
