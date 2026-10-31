import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Plus, Play } from 'lucide-react';
import { Story, User, Language } from '../types';
import { translations } from '../translations';

interface StoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  currentUser: User;
  language: Language;
  onOpenStory: (story: Story) => void;
  onAddStory: () => void;
}

export const StoriesModal: React.FC<StoriesModalProps> = ({
  isOpen,
  onClose,
  stories,
  currentUser,
  language,
  onOpenStory,
  onAddStory,
}) => {
  const t = translations[language];
  if (!isOpen) return null;

  const userStory = stories.find((s) => s.userId === currentUser.id);
  const otherStories = stories.filter((s) => s.userId !== currentUser.id);

  return (
    <AnimatePresence>
      <div
        id="stories-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-3xl bg-[#0e0e1a]/95 border border-purple-500/30 p-6 text-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 text-white shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {language === 'ar' ? 'قصص الرواد (24 ساعة)' : 'Pioneer Stories (24h)'}
                </h3>
                <span className="text-[10px] text-purple-300/80 font-mono">
                  {stories.length} {language === 'ar' ? 'قصص نشطة' : 'Active Stories'}
                </span>
              </div>
            </div>
            <button
              id="close-stories-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stories Grid / Carousel */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2 max-h-[60vh] overflow-y-auto no-scrollbar">
            {/* 1. Add / View Your Story */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div
                onClick={() => {
                  onClose();
                  if (userStory) {
                    onOpenStory(userStory);
                  } else {
                    onAddStory();
                  }
                }}
                className="relative"
              >
                <div
                  className={`w-16 h-16 rounded-full p-[2.5px] ${
                    userStory
                      ? 'bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'bg-white/15 group-hover:bg-white/25'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-black">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onAddStory();
                  }}
                  className="absolute -bottom-1 right-0 rtl:left-0 rtl:right-auto w-5 h-5 rounded-full bg-indigo-600 border-2 border-black flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition-transform"
                  title={t.addToStory}
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
              <span className="text-xs font-semibold text-white/90 truncate max-w-[80px] text-center">
                {t.yourStory}
              </span>
            </div>

            {/* 2. Other Active Stories */}
            {otherStories.map((story) => (
              <motion.div
                key={story.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onClose();
                  onOpenStory(story);
                }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div
                  className={`w-16 h-16 rounded-full p-[2.5px] transition-all ${
                    story.isViewed
                      ? 'bg-white/20'
                      : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(124,58,237,0.5)]'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-black">
                    <img
                      src={story.user.avatarUrl}
                      alt={story.user.displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-white/80 group-hover:text-white truncate max-w-[80px] text-center">
                  {story.user.displayName}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Bottom Action */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-white/40">
              {language === 'ar' ? 'تختفي القصص تلقائياً بعد 24 ساعة' : 'Stories disappear after 24h'}
            </span>
            <button
              onClick={() => {
                onClose();
                onAddStory();
              }}
              className="btn-purple px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إضافة قصة' : 'Add Story'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
