import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, Settings as SettingsIcon, Film, Bookmark, 
  Trophy, Heart, Plus, Sparkles, Award, Grid3X3, Eye, Edit3, Camera
} from 'lucide-react';
import { User, Language, Clip } from '../types';
import { translations } from '../translations';
import { PioneerBadge } from './PioneerBadge';

interface ProfileViewProps {
  currentUser: User;
  userClips: Clip[];
  language: Language;
  onOpenSettings: () => void;
  onOpenStudio: () => void;
  onOpenFounderModal: () => void;
  onOpenEditProfile: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  userClips,
  language,
  onOpenSettings,
  onOpenStudio,
  onOpenFounderModal,
  onOpenEditProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'clips' | 'saved' | 'awards'>('clips');
  const t = translations[language];

  return (
    <div
      id="profile-view"
      className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 text-white"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header Profile Card */}
      <div className="relative rounded-3xl cosmic-glass border border-purple-500/30 p-6 md:p-8 mb-8 shadow-2xl overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Avatar & Pioneer Ring */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left rtl:sm:text-right">
            <div className="relative group cursor-pointer" onClick={onOpenEditProfile} title={t.changeAvatar}>
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-purple-400 p-1 bg-black/40 shadow-xl transition-transform group-hover:scale-105">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                <Camera className="w-6 h-6 text-purple-300" />
                <span className="text-[10px] font-bold mt-0.5">{language === 'ar' ? 'تعديل' : 'Edit'}</span>
              </div>
              <span className="absolute bottom-1 right-1 rtl:left-1 rtl:right-auto p-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 border border-white text-white shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h2 className="text-xl md:text-2xl font-black text-white">
                  {currentUser.displayName}
                </h2>
                <PioneerBadge
                  tier={currentUser.pioneerTier}
                  accountNumber={currentUser.accountNumber}
                  language={language}
                  size="md"
                />
              </div>

              <div className="text-xs text-purple-300 font-mono mb-2">
                @{currentUser.username} • {t.accountNumberLabel}{currentUser.accountNumber}
              </div>

              <p className="text-xs text-zinc-300 max-w-md leading-relaxed">
                {currentUser.bio}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              id="profile-edit-profile-btn"
              onClick={onOpenEditProfile}
              className="py-2.5 px-4 rounded-2xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-400/50 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Edit3 className="w-4 h-4 text-purple-300" />
              <span>{t.editProfile}</span>
            </button>
            <button
              id="profile-create-clip-btn"
              onClick={onOpenStudio}
              className="py-2.5 px-4 rounded-2xl btn-space-primary font-bold text-xs text-white flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>{t.publishFirstClip}</span>
            </button>
            <button
              id="profile-open-settings-btn"
              onClick={onOpenSettings}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white transition-all"
              title={t.settings}
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-8 pt-6 border-t border-white/10 text-center">
          <div className="p-2 rounded-2xl bg-white/5">
            <div className="text-lg md:text-xl font-mono font-black text-white">
              {userClips.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              {t.totalClips}
            </div>
          </div>
          <div className="p-2 rounded-2xl bg-white/5">
            <div className="text-lg md:text-xl font-mono font-black text-white">
              {userClips.reduce((acc, c) => acc + c.likesCount, 0)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              {t.likes}
            </div>
          </div>
          <div className="p-2 rounded-2xl bg-white/5">
            <div className="text-lg md:text-xl font-mono font-black text-amber-300">
              {userClips.reduce((acc, c) => acc + c.votesCount, 0)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
              {t.votes}
            </div>
          </div>
          <div className="p-2 rounded-2xl bg-white/5">
            <div className="text-lg md:text-xl font-mono font-black text-purple-300">
              {currentUser.followersCount}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              {t.followers}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 mb-6 border-b border-white/10 pb-3">
        <button
          id="profile-tab-clips"
          onClick={() => setActiveTab('clips')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'clips'
              ? 'btn-space-primary text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>{t.myClips} ({userClips.length})</span>
        </button>

        <button
          id="profile-tab-awards"
          onClick={() => setActiveTab('awards')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'awards'
              ? 'btn-space-primary text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-300" />
          <span>{t.awardsShelf}</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'clips' && (
        <div>
          {userClips.length === 0 ? (
            <div className="text-center py-12 rounded-3xl cosmic-glass border border-white/10 p-8">
              <Film className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 mb-4">{t.noClipsOnProfile}</p>
              <button
                onClick={onOpenStudio}
                className="px-5 py-2.5 rounded-xl btn-space-primary text-xs font-bold text-white inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t.publishFirstClip}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {userClips.map((clip) => (
                <div
                  key={clip.id}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-purple-500/30 bg-black group shadow-lg"
                >
                  {clip.mediaType === 'video' ? (
                    <video
                      src={clip.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                    />
                  ) : (
                    <img
                      src={clip.mediaUrl}
                      alt={clip.caption}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-90 group-hover:opacity-100 transition-opacity" />

                  {/* Top Tag */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-[10px] font-mono text-purple-300 backdrop-blur-md">
                    #{clip.category}
                  </div>

                  {clip.inCompetition && (
                    <div className="absolute top-2 right-2 p-1 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/40">
                      <Trophy className="w-3 h-3" />
                    </div>
                  )}

                  {/* Bottom Stats */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-[11px] font-bold text-white">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                      {clip.likesCount}
                    </span>
                    <span className="flex items-center gap-1 text-amber-300">
                      <Trophy className="w-3.5 h-3.5 fill-amber-400" />
                      {clip.votesCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'awards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl cosmic-glass border border-amber-400/30 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-amber-500/20 text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase font-mono">
                Pioneer Creator Award
              </div>
              <div className="text-sm font-black text-white">
                Five Seasons Inaugural Pioneer
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Granted for claiming priority Pioneer account #{currentUser.accountNumber}.
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl cosmic-glass border border-purple-500/30 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-purple-500/20 text-purple-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-300 uppercase font-mono">
                Active Season Contender
              </div>
              <div className="text-sm font-black text-white">
                Comedy Season 2026
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Competing for Best Comedy Video of the Year.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
