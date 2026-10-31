import React, { useState, useEffect, useMemo } from 'react';
import { Clip, User, Language, SearchTab, SeasonType } from '../types';
import { translations } from '../translations';
import { 
  Search, 
  X, 
  TrendingUp, 
  Hash, 
  Users, 
  Play, 
  Heart, 
  MessageSquare, 
  Sparkles, 
  Film, 
  Layers,
  Check,
  UserPlus,
  History,
  Clock
} from 'lucide-react';
import { PioneerBadge } from './PioneerBadge';
import { seasonsList } from '../seasonsData';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface SearchViewProps {
  clips: Clip[];
  users: User[];
  currentUser: User;
  language: Language;
  onSelectClip: (clip: Clip) => void;
  onSelectUser: (user: User) => void;
  onSelectSeason?: (seasonId: SeasonType) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  clips,
  users,
  currentUser,
  language,
  onSelectClip,
  onSelectUser,
  onSelectSeason,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('top');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // 1. Real-time Firestore sync for recent search queries
  useEffect(() => {
    if (!currentUser?.id) return;
    const historyRef = doc(db, 'search_history', currentUser.id);
    const unsubscribe = onSnapshot(
      historyRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.queries)) {
            setRecentSearches(data.queries);
          }
        } else {
          setRecentSearches([]);
        }
      },
      (err) => {
        console.warn('Search history sync notice:', err);
      }
    );
    return () => unsubscribe();
  }, [currentUser?.id]);

  // 2. Save search query to Firestore (deduplicated, max 10 recent items)
  const saveSearchQuery = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed || trimmed.length < 2 || !currentUser?.id) return;

    const updated = [
      trimmed,
      ...recentSearches.filter((q) => q.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 10);

    setRecentSearches(updated);

    try {
      await setDoc(doc(db, 'search_history', currentUser.id), {
        userId: currentUser.id,
        queries: updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to save search history to Firestore:', e);
    }
  };

  // 3. Remove single query from history
  const removeSearchQuery = async (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id) return;
    const updated = recentSearches.filter((q) => q !== queryToRemove);
    setRecentSearches(updated);

    try {
      await setDoc(doc(db, 'search_history', currentUser.id), {
        userId: currentUser.id,
        queries: updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to remove query from Firestore history:', e);
    }
  };

  // 4. Clear all search history
  const clearAllSearchHistory = async () => {
    if (!currentUser?.id) return;
    setRecentSearches([]);

    try {
      await setDoc(doc(db, 'search_history', currentUser.id), {
        userId: currentUser.id,
        queries: [],
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to clear search history in Firestore:', e);
    }
  };

  const trendingTags = [
    { tag: '#FiveSeasons', count: '1.2M', season: 'random' },
    { tag: '#Cosmic8K', count: '890K', season: 'editor' },
    { tag: '#ComedyPioneers', count: '654K', season: 'comedy' },
    { tag: '#GalacticDrama', count: '430K', season: 'drama' },
    { tag: '#SpacePoetry', count: '310K', season: 'literature' },
    { tag: '#HusseinAliYousef', count: '980K', season: 'random' },
  ];

  const handleToggleFollow = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowingMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Filtered Results
  const query = searchQuery.trim().toLowerCase();
  const isHashSearch = query.startsWith('#');
  const isUserSearch = query.startsWith('@');
  const cleanQuery = query.replace(/^[@#]/, '');

  const filteredUsers = useMemo(() => {
    if (!cleanQuery) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(cleanQuery) ||
        u.displayName.toLowerCase().includes(cleanQuery) ||
        u.bio.toLowerCase().includes(cleanQuery)
    );
  }, [users, cleanQuery]);

  const filteredClips = useMemo(() => {
    if (!cleanQuery) return clips;
    return clips.filter((c) => {
      const matchCaption = c.caption.toLowerCase().includes(cleanQuery);
      const matchTags = c.tags.some((tag) =>
        tag.toLowerCase().includes(cleanQuery)
      );
      const matchAuthor =
        c.user.displayName.toLowerCase().includes(cleanQuery) ||
        c.user.username.toLowerCase().includes(cleanQuery);
      const matchCategory = c.category.toLowerCase().includes(cleanQuery);
      return matchCaption || matchTags || matchAuthor || matchCategory;
    });
  }, [clips, cleanQuery]);

  const filteredTags = useMemo(() => {
    if (!cleanQuery) return trendingTags;
    return trendingTags.filter((t) =>
      t.tag.toLowerCase().includes(cleanQuery)
    );
  }, [trendingTags, cleanQuery]);

  return (
    <div
      id="search-view-container"
      className="w-full max-w-xl mx-auto px-3.5 py-4 pb-28 flex flex-col gap-4 select-none"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Search Input Bar with Enter key and submit support */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery.trim()) {
            saveSearchQuery(searchQuery);
          }
        }}
        className="relative"
      >
        <Search className="absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
        <input
          id="global-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              saveSearchQuery(searchQuery);
            }
          }}
          placeholder={t.searchPlaceholder}
          className="w-full bg-white/[0.06] border border-white/15 focus:border-indigo-400 rounded-full py-3 px-11 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            id="clear-search-query-btn"
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 rtl:left-3.5 rtl:right-auto top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Recent Searches Tags from Firestore */}
      {recentSearches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 flex flex-col gap-2 shadow-lg backdrop-blur-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.recentSearches}</span>
              <span className="text-[10px] font-mono text-white/40">({recentSearches.length})</span>
            </div>
            <button
              id="clear-all-search-history-btn"
              type="button"
              onClick={clearAllSearchHistory}
              className="text-[11px] font-medium text-white/40 hover:text-red-400 transition-colors"
            >
              {t.clearAll}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-0.5">
            {recentSearches.map((queryTag) => (
              <div
                key={queryTag}
                id={`history-tag-${encodeURIComponent(queryTag)}`}
                onClick={() => {
                  setSearchQuery(queryTag);
                  saveSearchQuery(queryTag);
                }}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-400/50 text-xs text-white/90 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Clock className="w-3 h-3 text-indigo-400/70 group-hover:text-indigo-300 transition-colors" />
                <span className="font-medium truncate max-w-[140px] sm:max-w-[200px]">{queryTag}</span>
                <button
                  type="button"
                  id={`remove-tag-${encodeURIComponent(queryTag)}`}
                  onClick={(e) => removeSearchQuery(queryTag, e)}
                  className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center text-white/40 hover:text-white transition-colors ml-0.5 rtl:mr-0.5 rtl:ml-0"
                  title="Remove"
                >
                  <X className="w-2.5 h-2.5 stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/10 overflow-x-auto no-scrollbar">
        {(['top', 'accounts', 'clips', 'hashtags', 'seasons'] as SearchTab[]).map(
          (tab) => (
            <button
              key={tab}
              id={`search-tab-${tab}-btn`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'btn-purple text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab === 'top' && t.searchTabTop}
              {tab === 'accounts' && t.searchTabAccounts}
              {tab === 'clips' && t.searchTabClips}
              {tab === 'hashtags' && t.searchTabHashtags}
              {tab === 'seasons' && t.searchTabSeasons}
            </button>
          )
        )}
      </div>

      {/* Content depending on Active Tab & Search Query */}
      {/* 1. TOP TAB */}
      {activeTab === 'top' && (
        <div className="flex flex-col gap-5">
          {/* Trending Hashtags Carousel */}
          {!searchQuery && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                <TrendingUp className="w-4 h-4 text-pink-400" />
                <span>{t.trendingTopics}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {trendingTags.map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => {
                      setSearchQuery(item.tag);
                      saveSearchQuery(item.tag);
                      setActiveTab('clips');
                    }}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-left rtl:text-right group transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                        <Hash className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                          {item.tag}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono">
                          {item.count} {language === 'ar' ? 'مقطع' : 'clips'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Featured Creators Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-white/80">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>{t.suggestedPioneers}</span>
              </div>
              <button
                onClick={() => setActiveTab('accounts')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                {language === 'ar' ? 'عرض الكل' : 'View all'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredUsers.slice(0, 4).map((user) => {
                const isFollowed = followingMap[user.id];
                return (
                  <div
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-11 h-11 rounded-full object-cover border border-white/10"
                      />
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-white truncate">
                            {user.displayName}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/50 font-mono truncate">
                          @{user.username}
                        </span>
                        <div className="mt-0.5">
                          <PioneerBadge
                            tier={user.pioneerTier}
                            accountNumber={user.accountNumber}
                            language={language}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>

                    {user.id !== currentUser.id && (
                      <button
                        onClick={(e) => handleToggleFollow(user.id, e)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 ${
                          isFollowed
                            ? 'bg-white/10 text-white/70 border border-white/20'
                            : 'btn-purple text-white shadow-sm'
                        }`}
                      >
                        {isFollowed ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>{t.followingBtn}</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>{t.follow}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Video Clips Grid */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white/80">
              <Film className="w-4 h-4 text-purple-400" />
              <span>{t.clips}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredClips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => onSelectClip(clip)}
                  className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-black/60 border border-white/10 cursor-pointer shadow-lg"
                >
                  <img
                    src={clip.mediaUrl}
                    alt={clip.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Play icon indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Play className="w-5 h-5 fill-white" />
                    </div>
                  </div>

                  {/* Stats Overlay at Bottom */}
                  <div className="absolute bottom-2 inset-x-2 flex flex-col gap-1">
                    <p className="text-[11px] font-bold text-white line-clamp-1">
                      {clip.caption}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-white/70">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-pink-400" />
                        <span>{clip.likesCount}</span>
                      </div>
                      <span className="font-mono">{clip.durationSeconds}s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ACCOUNTS TAB */}
      {activeTab === 'accounts' && (
        <div className="flex flex-col gap-2">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-xs">{t.noSearchResults}</div>
          ) : (
            filteredUsers.map((user) => {
              const isFollowed = followingMap[user.id];
              return (
                <div
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full object-cover border border-white/10"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {user.displayName}
                        </span>
                        <PioneerBadge
                          tier={user.pioneerTier}
                          accountNumber={user.accountNumber}
                          language={language}
                          size="sm"
                          showLabel={false}
                        />
                      </div>
                      <span className="text-xs text-white/50 font-mono">@{user.username}</span>
                      <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5 max-w-xs">
                        {user.bio}
                      </p>
                    </div>
                  </div>

                  {user.id !== currentUser.id && (
                    <button
                      onClick={(e) => handleToggleFollow(user.id, e)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                        isFollowed
                          ? 'bg-white/10 text-white/70 border border-white/20'
                          : 'btn-purple text-white shadow-sm'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{t.followingBtn}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>{t.follow}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. CLIPS TAB */}
      {activeTab === 'clips' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredClips.length === 0 ? (
            <div className="col-span-full p-8 text-center text-white/40 text-xs">
              {t.noSearchResults}
            </div>
          ) : (
            filteredClips.map((clip) => (
              <div
                key={clip.id}
                onClick={() => onSelectClip(clip)}
                className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-black/60 border border-white/10 cursor-pointer shadow-lg"
              >
                <img
                  src={clip.mediaUrl}
                  alt={clip.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute bottom-2 inset-x-2 flex flex-col gap-1">
                  <p className="text-[11px] font-bold text-white line-clamp-1">{clip.caption}</p>
                  <div className="flex items-center justify-between text-[10px] text-white/70">
                    <span className="truncate">@{clip.user.username}</span>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-pink-400" />
                      <span>{clip.likesCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. HASHTAGS TAB */}
      {activeTab === 'hashtags' && (
        <div className="flex flex-col gap-2">
          {filteredTags.map((item) => (
            <div
              key={item.tag}
              onClick={() => {
                setSearchQuery(item.tag);
                setActiveTab('clips');
              }}
              className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">{item.tag}</div>
                  <div className="text-[11px] text-white/40">
                    {item.count} {language === 'ar' ? 'مقطع 8K منشور' : '8K clips published'}
                  </div>
                </div>
              </div>
              <Play className="w-4 h-4 text-white/40 rtl:rotate-180" />
            </div>
          ))}
        </div>
      )}

      {/* 5. SEASONS TAB */}
      {activeTab === 'seasons' && (
        <div className="flex flex-col gap-3">
          {seasonsList.map((season) => (
            <div
              key={season.id}
              onClick={() => {
                if (onSelectSeason) onSelectSeason(season.id);
              }}
              className="p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                  style={{
                    backgroundColor: season.color,
                    boxShadow: `0 0 20px ${season.glowColor}`,
                  }}
                >
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {language === 'ar' ? season.nameAr : season.nameEn}
                    </span>
                    {season.isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                        {t.activeSeasonBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 line-clamp-1 mt-0.5">
                    {language === 'ar' ? season.descriptionAr : season.descriptionEn}
                  </p>
                </div>
              </div>
              <Play className="w-4 h-4 text-white/40 rtl:rotate-180" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
