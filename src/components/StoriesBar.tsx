import React from 'react';
import { Story, User, Language } from '../types';
import { translations } from '../translations';
import { Plus, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface StoriesBarProps {
  stories: Story[];
  currentUser: User;
  language: Language;
  onOpenStory: (story: Story) => void;
  onAddStory: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  currentUser,
  language,
  onOpenStory,
  onAddStory,
}) => {
  const t = translations[language];

  // Check if current user has an active story
  const userStory = stories.find((s) => s.userId === currentUser.id);
  const otherStories = stories.filter((s) => s.userId !== currentUser.id);

  return (
    <div
      id="stories-bar-container"
      className="w-full max-w-sm sm:max-w-md mx-auto py-1.5 px-3 flex items-center gap-3 overflow-x-auto no-scrollbar select-none bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* 1. Current User Story / Add Story Circle */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0 cursor-pointer group">
        <div
          onClick={() => {
            if (userStory) {
              onOpenStory(userStory);
            } else {
              onAddStory();
            }
          }}
          className="relative"
        >
          <div
            className={`w-12 h-12 rounded-full p-[2px] ${
              userStory
                ? 'bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-500 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
                : 'bg-white/10 group-hover:bg-white/20'
            }`}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-black/80 border border-black">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          </div>

          {/* Plus Badge */}
          <button
            id="add-story-plus-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddStory();
            }}
            className="absolute -bottom-0.5 right-0 rtl:left-0 rtl:right-auto w-4 h-4 rounded-full bg-indigo-600 border border-black flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition-transform"
            title={t.addToStory}
          >
            <Plus className="w-2.5 h-2.5 stroke-[3]" />
          </button>
        </div>
        <span className="text-[10px] font-medium text-white/80 truncate max-w-[58px] text-center">
          {t.yourStory}
        </span>
      </div>

      {/* 2. Other Active Pioneer Stories */}
      {otherStories.map((story) => (
        <motion.div
          key={story.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onOpenStory(story)}
          className="flex flex-col items-center gap-0.5 flex-shrink-0 cursor-pointer group"
        >
          <div
            className={`w-12 h-12 rounded-full p-[2px] transition-all ${
              story.isViewed
                ? 'bg-white/20'
                : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(124,58,237,0.4)]'
            }`}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-black/80 border border-black">
              <img
                src={story.user.avatarUrl}
                alt={story.user.displayName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          </div>
          <span className="text-[10px] font-medium text-white/70 group-hover:text-white truncate max-w-[58px] text-center">
            {story.user.displayName.split(' ')[0]}
          </span>
        </motion.div>
      ))}

      {otherStories.length === 0 && (
        <div className="text-[10px] text-white/30 italic flex items-center gap-1.5 px-2">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>{language === 'ar' ? 'انشر أول قصة في فصول خمسة' : 'Publish your first 24h Story'}</span>
        </div>
      )}
    </div>
  );
};
