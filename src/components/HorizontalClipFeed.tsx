import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageSquare, Send, Trophy, Volume2, VolumeX, 
  ChevronLeft, ChevronRight, Sparkles, Plus, Check, Music2,
  Play, X, Trash2, AtSign, Hash, MoreVertical, ShieldCheck, Share2, Film, Flag
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
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
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

  const currentClip = clips[currentIndex];

  // Auto-clamp index if clips change
  useEffect(() => {
    if (currentIndex >= clips.length && clips.length > 0) {
      setCurrentIndex(clips.length - 1);
    }
  }, [clips.length, currentIndex]);

  // 15-second loop progress timer
  useEffect(() => {
    if (!currentClip || !isPlaying) return;

    setProgress(0);
    const duration = (currentClip.durationSeconds || 15) * 1000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0; // Loop back
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [currentIndex, isPlaying, currentClip]);

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
        setIsPlaying((p) => !p);
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

  // Double Tap to Like Video with Instagram-style scale heart animation
  const handleMediaClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
      setIsPlaying((p) => !p);
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
      {/* Horizontal Navigation Indicators */}
      <div className="flex items-center justify-between w-full max-w-sm sm:max-w-md px-3 py-1.5 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[11px] font-mono text-indigo-300 backdrop-blur-md">
          <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
          <span>{t.swipeHorizontalHint}</span>
          <ChevronRight className="w-3 h-3 rtl:rotate-180" />
        </div>
        <span className="text-xs font-mono font-bold text-white/80 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          {currentIndex + 1} / {clips.length}
        </span>
      </div>

      {/* Desktop Prev / Next Buttons */}
      <button
        id="prev-clip-btn"
        onClick={handlePrev}
        disabled={currentIndex === 0}
        aria-label={t.prevClip}
        className={`hidden md:flex absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full items-center justify-center transition-all ${
          currentIndex === 0
            ? 'opacity-20 cursor-not-allowed bg-black/40 text-white/30'
            : 'bg-black/70 hover:bg-indigo-600 text-white border border-white/20 hover:scale-110 shadow-xl'
        }`}
      >
        <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
      </button>

      <button
        id="next-clip-btn"
        onClick={handleNext}
        disabled={currentIndex === clips.length - 1}
        aria-label={t.nextClip}
        className={`hidden md:flex absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full items-center justify-center transition-all ${
          currentIndex === clips.length - 1
            ? 'opacity-20 cursor-not-allowed bg-black/40 text-white/30'
            : 'bg-black/70 hover:bg-indigo-600 text-white border border-white/20 hover:scale-110 shadow-xl'
        }`}
      >
        <ChevronRight className="w-6 h-6 rtl:rotate-180" />
      </button>

      {/* Main Clip Container with Full Viewport Immersive Presence */}
      <div className="relative w-full h-[calc(100vh-130px)] sm:h-[calc(100vh-140px)] max-w-none sm:max-w-[460px] md:max-w-[500px] rounded-none sm:rounded-[32px] overflow-hidden glass-card border-0 sm:border sm:border-white/15 bg-black shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col justify-between mx-auto my-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentClip.id}
            custom={direction}
            initial={{ opacity: 0, x: direction === 'next' ? 80 : -80, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction === 'next' ? -80 : 80, scale: 0.97 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative w-full h-full flex flex-col justify-between overflow-hidden"
          >
            {/* Top 15s Progress Bar */}
            <div className="absolute top-0 inset-x-0 z-30 h-1 bg-white/15">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Media Content (Video or 8K Photo Clip) with Double Tap Support */}
            <div
              className="absolute inset-0 z-0 bg-black flex items-center justify-center cursor-pointer select-none"
              onClick={handleMediaClick}
            >
              {currentClip.mediaType === 'video' ? (
                <video
                  ref={videoRef}
                  src={currentClip.mediaUrl}
                  playsInline
                  autoPlay
                  loop
                  muted={isMuted}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={currentClip.mediaUrl}
                  alt={currentClip.caption}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Pause overlay icon */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
                  <div className="p-4 rounded-full bg-black/60 border border-white/20 text-white shadow-2xl">
                    <Play className="w-8 h-8 fill-white/80" />
                  </div>
                </div>
              )}

              {/* Instagram Double Tap Heart Floating Animation */}
              {showDoubleTapHeart && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: 1 }}
                  exit={{ scale: 2.0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="absolute z-40 pointer-events-none"
                  style={{
                    left: doubleTapPos.x > 0 ? doubleTapPos.x - 36 : '50%',
                    top: doubleTapPos.y > 0 ? doubleTapPos.y - 36 : '50%',
                    transform: doubleTapPos.x === 0 ? 'translate(-50%, -50%)' : undefined,
                  }}
                >
                  <div className="w-18 h-18 rounded-full bg-purple-600/50 backdrop-blur-md flex items-center justify-center border border-purple-300 shadow-2xl">
                    <Heart className="w-10 h-10 fill-purple-400 text-white" />
                  </div>
                </motion.div>
              )}

              {/* Gradient overlays for crisp readability */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/85 via-black/30 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />
            </div>

            {/* Top Bar: Category, Season Badge, Options Menu, Sound Toggle */}
            <div className="relative z-20 p-3 sm:p-4 pt-2.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-black/65 border border-white/15 text-[10px] font-bold text-indigo-300 backdrop-blur-md shadow-sm">
                  #{currentClip.category}
                </span>

                {currentClip.inCompetition && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-300 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md shadow-sm">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span>{t.inCompetitionBadge}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Sound Toggle */}
                <button
                  id="toggle-sound-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((m) => !m);
                  }}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/75 border border-white/20 text-white backdrop-blur-md transition-all active:scale-95"
                  aria-label="Toggle Sound"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                {/* Options Menu Button */}
                <div className="relative">
                  <button
                    id="clip-options-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptionsMenu(!showOptionsMenu);
                    }}
                    className="p-2 rounded-full bg-black/50 hover:bg-black/75 border border-white/20 text-white backdrop-blur-md transition-all active:scale-95"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Options Dropdown */}
                  {showOptionsMenu && (
                    <div
                      className="absolute right-0 rtl:left-0 rtl:right-auto top-9 w-44 rounded-2xl bg-[#0e0e1a]/95 backdrop-blur-xl border border-white/15 p-1.5 shadow-2xl z-50 flex flex-col gap-1 text-xs"
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

                      {/* Moderation Report Option */}
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

            {/* Right/Left Action Sidebar - Cleanly organized, neatly spaced */}
            <div className="absolute right-2.5 rtl:left-2.5 rtl:right-auto bottom-5 z-20 flex flex-col items-center gap-2.5 text-white">
              {/* Creator Avatar with follow plus */}
              <div className="relative group cursor-pointer">
                <img
                  src={currentClip.user.avatarUrl}
                  alt={currentClip.user.displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400/80 shadow-lg"
                />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full btn-purple border border-white flex items-center justify-center text-white">
                  <Plus className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>

              {/* Like Button */}
              <button
                id={`like-clip-btn-${currentClip.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onLikeClip(currentClip.id);
                }}
                className="flex flex-col items-center gap-0.5 group"
              >
                <div
                  className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center backdrop-blur-md active:scale-90 ${
                    currentClip.isLiked
                      ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(124,58,237,0.7)] scale-105'
                      : 'bg-black/50 border-white/25 text-white hover:bg-white/20'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 stroke-[2] ${
                      currentClip.isLiked ? 'fill-white text-white' : 'text-white'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-white/90">
                  {currentClip.likesCount}
                </span>
              </button>

              {/* Season Award Voting Button - ONLY shown if clip is entered in active season competition */}
              {currentClip.inCompetition && (
                <button
                  id={`vote-clip-btn-${currentClip.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(currentClip.id);
                  }}
                  className="flex flex-col items-center gap-0.5 group"
                  title={language === 'ar' ? 'تصويت في المسابقة' : 'Vote in Competition'}
                >
                  <div
                    className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center backdrop-blur-md active:scale-90 ${
                      currentClip.isVoted
                        ? 'bg-amber-500 border-amber-300 text-white shadow-[0_0_15px_rgba(245,158,11,0.7)] scale-105'
                        : 'bg-black/50 border-amber-400/30 text-amber-400 hover:bg-amber-400/20'
                    }`}
                  >
                    <Trophy
                      className={`w-4 h-4 stroke-[2] ${currentClip.isVoted ? 'fill-white text-white' : 'text-amber-400'}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-300">
                    {currentClip.votesCount}
                  </span>
                </button>
              )}

              {/* Comments Button */}
              <button
                id={`comment-clip-btn-${currentClip.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCommentsForClipId(currentClip.id);
                }}
                className="flex flex-col items-center gap-0.5 group"
              >
                <div className="w-10 h-10 rounded-full bg-black/50 hover:bg-white/20 border border-white/25 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-90">
                  <MessageSquare className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-[10px] font-mono font-bold text-white/90">
                  {currentComments.length || currentClip.commentsCount}
                </span>
              </button>

              {/* Share Button - Fixed with universal share handler & Share2 icon */}
              <button
                id={`share-clip-btn-${currentClip.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareClip();
                }}
                className="flex flex-col items-center gap-0.5 group"
                title={t.shareTitle}
              >
                <div className="w-10 h-10 rounded-full bg-black/50 hover:bg-white/20 border border-white/25 flex items-center justify-center text-white backdrop-blur-md transition-all active:scale-90">
                  <Share2 className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-[9px] font-mono font-bold text-white/80">
                  {t.shares}
                </span>
              </button>

              {/* Spinning Disc Audio Track */}
              <div
                className="w-8 h-8 rounded-full bg-black/70 border border-indigo-400/50 flex items-center justify-center text-indigo-300 animate-spin shadow-md"
                style={{ animationDuration: '4s' }}
              >
                <Music2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Bottom Caption & Creator Info */}
            <div className="relative z-20 p-3 sm:p-4 pb-4 pr-16 rtl:pr-4 rtl:pl-16 text-white">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide drop-shadow-md">
                  @{currentClip.user.username}
                </span>
                <PioneerBadge
                  tier={currentClip.user.pioneerTier}
                  accountNumber={currentClip.user.accountNumber}
                  isFounder={currentClip.user.isFounder}
                  language={language}
                  size="sm"
                />
              </div>

              <p className="text-[11px] sm:text-xs text-zinc-100 mb-1.5 leading-relaxed line-clamp-2 drop-shadow-sm">
                {currentClip.caption}
              </p>

              {currentClip.musicTrack && (
                <div className="inline-flex items-center gap-1.5 text-[10px] text-purple-200 bg-black/60 px-2.5 py-0.5 rounded-full border border-purple-500/30 backdrop-blur-md max-w-full truncate">
                  <Music2 className="w-3 h-3 text-purple-400 animate-pulse flex-shrink-0" />
                  <span className="truncate">{currentClip.musicTrack.title} — {currentClip.musicTrack.artist}</span>
                </div>
              )}
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
