import React, { useState, useEffect, useRef } from 'react';
import { Story, Language } from '../types';
import { translations } from '../translations';
import { X, Heart, Send, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { PioneerBadge } from './PioneerBadge';
import { motion, AnimatePresence } from 'motion/react';

interface StoryViewerModalProps {
  story: Story;
  allStories: Story[];
  language: Language;
  onClose: () => void;
  onReply: (storyId: string, text: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  story,
  allStories,
  language,
  onClose,
  onReply,
}) => {
  const t = translations[language];
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, allStories.findIndex((s) => s.id === story.id))
  );
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  const currentStory = allStories[currentIndex] || story;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Story Duration: 6 seconds per story
  const DURATION_MS = 6000;
  const INTERVAL_MS = 50;

  useEffect(() => {
    setProgress(0);
    setIsLiked(false);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (INTERVAL_MS / DURATION_MS) * 100;
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, allStories.length]);

  const handleNext = () => {
    if (currentIndex < allStories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(currentStory.id, replyText);
    setReplyText('');
    setIsPaused(false);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (!isLiked) {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="story-viewer-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center select-none"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Story Card Container */}
        <div className="relative w-full max-w-sm md:max-w-md h-full md:h-[90vh] md:max-h-[820px] md:rounded-[36px] overflow-hidden bg-[#0a0a14] border border-white/10 flex flex-col justify-between shadow-2xl">
          {/* Top Progress Segment Bars */}
          <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
            {allStories.map((s, idx) => (
              <div
                key={s.id}
                className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      idx < currentIndex
                        ? '100%'
                        : idx === currentIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top User Bar & Close Button */}
          <div className="relative z-30 pt-7 px-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <img
                src={currentStory.user.avatarUrl}
                alt={currentStory.user.displayName}
                className="w-9 h-9 rounded-full object-cover border-2 border-indigo-400"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold">{currentStory.user.displayName}</span>
                  <PioneerBadge
                    tier={currentStory.user.pioneerTier}
                    accountNumber={currentStory.user.accountNumber}
                    language={language}
                    size="sm"
                    showLabel={false}
                  />
                </div>
                <span className="text-[10px] text-white/50 font-mono">
                  {new Date(currentStory.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Close 'X' Button */}
            <button
              id="close-story-viewer-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
              aria-label={t.close}
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Media Viewport */}
          <div
            className="absolute inset-0 z-10 cursor-pointer overflow-hidden flex items-center justify-center"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {currentStory.mediaType === 'video' ? (
              <video
                src={currentStory.mediaUrl}
                autoPlay
                playsInline
                loop
                muted={false}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
              />
            )}

            {/* Floating Heart Like Animation */}
            {showHeartAnim && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
              >
                <div className="w-24 h-24 rounded-full bg-purple-600/40 backdrop-blur-md flex items-center justify-center border border-purple-400">
                  <Heart className="w-16 h-16 fill-purple-500 text-purple-400" />
                </div>
              </motion.div>
            )}

            {/* Left & Right Tap Zones for Navigation */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-0 top-16 bottom-20 w-1/3 z-20"
            />
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-0 top-16 bottom-20 w-1/3 z-20"
            />

            {/* Caption Banner (if available) */}
            {currentStory.caption && (
              <div className="absolute bottom-20 inset-x-4 z-20 p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs leading-relaxed">
                {currentStory.caption}
              </div>
            )}
          </div>

          {/* Bottom Reply Bar & Like Reaction */}
          <div className="relative z-30 p-3 md:p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center gap-2">
            <form onSubmit={handleSendReply} className="flex-1 flex items-center gap-2">
              <input
                id="story-reply-input"
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder={t.replyToStory}
                className="flex-1 bg-white/10 border border-white/15 focus:border-indigo-400 rounded-full py-2.5 px-4 text-xs text-white placeholder:text-white/40 focus:outline-none backdrop-blur-md transition-all"
              />
              <button
                id="send-story-reply-btn"
                type="submit"
                disabled={!replyText.trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all ${
                  replyText.trim()
                    ? 'btn-purple shadow-md'
                    : 'bg-white/5 text-white/30 border border-white/10'
                }`}
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>

            {/* Instagram-style Heart Button */}
            <button
              id="like-story-btn"
              type="button"
              onClick={handleLike}
              className={`w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-md transition-all ${
                isLiked
                  ? 'bg-purple-600 border-purple-400 text-white shadow-lg'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  isLiked ? 'fill-white text-white' : 'text-white'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
