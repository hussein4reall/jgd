import React, { useState, useEffect } from 'react';
import { CosmicStarfield } from './components/CosmicStarfield';
import { AuthScreen } from './components/AuthScreen';
import { TopHeader } from './components/TopHeader';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { HorizontalClipFeed } from './components/HorizontalClipFeed';
import { SeasonsHub } from './components/SeasonsHub';
import { CameraStudioModal } from './components/CameraStudioModal';
import { ProfileView } from './components/ProfileView';
import { MessagesView } from './components/MessagesView';
import { NotificationsView } from './components/NotificationsView';
import { SearchView } from './components/SearchView';
import { StoryViewerModal } from './components/StoryViewerModal';
import { StoriesModal } from './components/StoriesModal';
import { FounderProfileModal } from './components/FounderProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { EditProfileModal } from './components/EditProfileModal';
import { OfficialLogo } from './components/OfficialLogo';
import { User, Language, Clip, Story, Theme } from './types';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, query, orderBy, onSnapshot, doc, setDoc, 
  deleteDoc, updateDoc, getDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { auth, db, getOrCreateUserProfile, logOut } from './firebase';

export default function App() {
  // App-wide language state (English default, selectable in Auth & Settings)
  const [language, setLanguage] = useState<Language>('en');

  // App-wide theme state (dark / light mode)
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('fiveseasons_theme') as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('fiveseasons_theme', newTheme);
    } catch {}
  };

  // Authentication & Persistence State
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [registeredUsersCount, setRegisteredUsersCount] = useState<number>(0);

  // Active view tab in bottom nav
  const [activeTab, setActiveTab] = useState<NavTab>('feed');

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isFounderModalOpen, setIsFounderModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isStoriesModalOpen, setIsStoriesModalOpen] = useState(false);
  const [studioInitialCategory, setStudioInitialCategory] = useState<string | undefined>(undefined);

  // Active viewing story modal
  const [viewingStory, setViewingStory] = useState<Story | null>(null);

  // Community Users List: Purely from real Firebase Firestore registrations (No mock accounts)
  const [communityUsers, setCommunityUsers] = useState<User[]>([]);

  // Stories State: Purely from real Firebase Firestore (No mock stories)
  const [stories, setStories] = useState<Story[]>([]);

  // Clips state: Purely from real Firebase Firestore (Clean start, persists user clips)
  const [clips, setClips] = useState<Clip[]>([]);

  // Clean legacy demo/mock data from localStorage on initial load
  useEffect(() => {
    try {
      localStorage.removeItem('fiveseasons_mock_users');
      localStorage.removeItem('fiveseasons_mock_clips');
      localStorage.removeItem('fiveseasons_mock_stories');
      localStorage.removeItem('fiveseasons_registered_users');
    } catch {}
  }, []);

  // 1. Firebase Auth listener for accurate persistent authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await getOrCreateUserProfile(fbUser);
          setCurrentUser(profile);
        } catch (error) {
          console.error('Failed to load user profile from Firestore:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore sync for registered users
  useEffect(() => {
    const usersQuery = query(collection(db, 'users'), orderBy('accountNumber', 'asc'));
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersList = snapshot.docs.map((docSnap) => docSnap.data() as User);
        setCommunityUsers(usersList);
        setRegisteredUsersCount(usersList.length);
      },
      (error) => {
        console.warn('Realtime users listener notice:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Real-time Firestore sync for published clips
  useEffect(() => {
    const clipsQuery = query(collection(db, 'clips'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      clipsQuery,
      (snapshot) => {
        const clipsList = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Clip;
          const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
          const votedBy = Array.isArray(data.votedBy) ? data.votedBy : [];
          const isLiked = currentUser ? likedBy.includes(currentUser.id) : false;
          const isVoted = currentUser ? votedBy.includes(currentUser.id) : false;
          return {
            ...data,
            likedBy,
            votedBy,
            likesCount: typeof data.likesCount === 'number' ? data.likesCount : likedBy.length,
            votesCount: typeof data.votesCount === 'number' ? data.votesCount : votedBy.length,
            isLiked,
            isVoted,
          };
        });
        setClips(clipsList);
      },
      (error) => {
        console.warn('Realtime clips listener notice:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Keep isLiked and isVoted in sync whenever currentUser changes
  useEffect(() => {
    setClips((prev) =>
      prev.map((c) => ({
        ...c,
        isLiked: currentUser ? (c.likedBy || []).includes(currentUser.id) : false,
        isVoted: currentUser ? (c.votedBy || []).includes(currentUser.id) : false,
      }))
    );
  }, [currentUser?.id]);

  // 4. Real-time Firestore sync for 24h stories
  useEffect(() => {
    const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      storiesQuery,
      (snapshot) => {
        const now = new Date().toISOString();
        const activeStories = snapshot.docs
          .map((docSnap) => docSnap.data() as Story)
          .filter((story) => story.expiresAt > now);
        setStories(activeStories);
      },
      (error) => {
        console.warn('Realtime stories listener notice:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update HTML dir and lang attributes when language changes
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Auth Handlers
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCommunityUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev;
      return [...prev, user];
    });
  };

  const handleLogOut = async () => {
    try {
      await logOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUser(null);
    setActiveTab('feed');
  };

  // Helper to deep clean undefined values from any Firestore document before setDoc/updateDoc
  const cleanFirestoreData = <T extends Record<string, any>>(obj: T): T => {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          cleaned[key] = cleanFirestoreData(value);
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  };

  // Clips Handlers with Firestore Persistence
  const handlePublishClip = async (newClip: Clip) => {
    try {
      const sanitized = cleanFirestoreData(newClip);
      await setDoc(doc(db, 'clips', newClip.id), sanitized);
    } catch (e) {
      console.error('Failed to save clip to Firestore:', e);
      setClips((prev) => [newClip, ...prev]);
    }
    setActiveTab('feed');
  };

  const handleDeleteClip = async (clipId: string) => {
    try {
      const clipRef = doc(db, 'clips', clipId);
      const snap = await getDoc(clipRef);
      if (snap.exists()) {
        await deleteDoc(clipRef);
      }
    } catch (e) {
      console.warn('Clip delete notice:', e);
    }
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  };

  const handleLikeClip = async (clipId: string) => {
    if (!currentUser) return;
    const target = clips.find((c) => c.id === clipId);
    if (!target) return;

    const likedByList = Array.isArray(target.likedBy) ? target.likedBy : [];
    const alreadyLiked = likedByList.includes(currentUser.id) || target.isLiked;

    const newLiked = !alreadyLiked;
    const newLikes = newLiked
      ? (target.likesCount || 0) + 1
      : Math.max(0, (target.likesCount || 1) - 1);
    const newLikedBy = newLiked
      ? [...likedByList.filter((uid) => uid !== currentUser.id), currentUser.id]
      : likedByList.filter((uid) => uid !== currentUser.id);

    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? { ...c, isLiked: newLiked, likesCount: newLikes, likedBy: newLikedBy }
          : c
      )
    );

    try {
      const clipRef = doc(db, 'clips', clipId);
      if (newLiked) {
        await updateDoc(clipRef, {
          likesCount: newLikes,
          likedBy: arrayUnion(currentUser.id),
        });
      } else {
        await updateDoc(clipRef, {
          likesCount: newLikes,
          likedBy: arrayRemove(currentUser.id),
        });
      }
    } catch (e) {
      console.warn('Like sync notice:', e);
    }
  };

  const handleVoteClip = async (clipId: string) => {
    if (!currentUser) return;
    const target = clips.find((c) => c.id === clipId);
    if (!target) return;

    const votedByList = Array.isArray(target.votedBy) ? target.votedBy : [];
    const alreadyVoted = votedByList.includes(currentUser.id) || target.isVoted;

    const newVoted = !alreadyVoted;
    const newVotes = newVoted
      ? (target.votesCount || 0) + 1
      : Math.max(0, (target.votesCount || 1) - 1);
    const newVotedBy = newVoted
      ? [...votedByList.filter((uid) => uid !== currentUser.id), currentUser.id]
      : votedByList.filter((uid) => uid !== currentUser.id);

    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? { ...c, isVoted: newVoted, votesCount: newVotes, votedBy: newVotedBy }
          : c
      )
    );

    try {
      const clipRef = doc(db, 'clips', clipId);
      if (newVoted) {
        await updateDoc(clipRef, {
          votesCount: newVotes,
          votedBy: arrayUnion(currentUser.id),
        });
      } else {
        await updateDoc(clipRef, {
          votesCount: newVotes,
          votedBy: arrayRemove(currentUser.id),
        });
      }
    } catch (e) {
      console.warn('Vote sync notice:', e);
    }
  };

  const handleAddComment = (clipId: string, _text: string) => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id === clipId) {
          const newCommentsCount = (c.commentsCount || 0) + 1;
          updateDoc(doc(db, 'clips', clipId), { commentsCount: newCommentsCount }).catch(() => {});
          return {
            ...c,
            commentsCount: newCommentsCount,
          };
        }
        return c;
      })
    );
  };

  const handleDeleteComment = (clipId: string, _commentId: string) => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id === clipId) {
          const newCommentsCount = Math.max(0, (c.commentsCount || 0) - 1);
          updateDoc(doc(db, 'clips', clipId), { commentsCount: newCommentsCount }).catch(() => {});
          return {
            ...c,
            commentsCount: newCommentsCount,
          };
        }
        return c;
      })
    );
  };

  // Story Handlers with Firestore Persistence
  const handleOpenStory = (story: Story) => {
    setViewingStory(story);
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, isViewed: true } : s))
    );
  };

  const handleAddStory = () => {
    setIsCameraOpen(true);
  };

  const handleShareToStory = async (clip: Clip) => {
    if (!currentUser) return;
    const newStory: Story = {
      id: `story_${Date.now()}`,
      userId: currentUser.id,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        pioneerTier: currentUser.pioneerTier,
        accountNumber: currentUser.accountNumber,
      },
      mediaUrl: clip.mediaUrl,
      mediaType: clip.mediaType,
      caption: `Shared from @${clip.user.username}: ${clip.caption}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      viewsCount: 1,
      likesCount: 0,
      isViewed: false,
    };

    try {
      await setDoc(doc(db, 'stories', newStory.id), newStory);
    } catch (e) {
      console.warn('Story save notice:', e);
      setStories((prev) => [newStory, ...prev]);
    }
  };

  const handleSendDirect = (_clip: Clip, _targetUser: User) => {
    setActiveTab('messages');
  };

  const handleOpenStudioWithCategory = (cat: string) => {
    setStudioInitialCategory(cat);
    setIsCameraOpen(true);
  };

  return (
    <div
      id="five-seasons-app"
      className={`relative min-h-screen w-full ${
        theme === 'light'
          ? 'theme-light bg-white text-slate-900'
          : 'theme-dark bg-[#020205] text-white space-bg'
      } flex flex-col justify-between overflow-x-hidden font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-300`}
    >
      {/* 8K Cinematic Cosmic Starfield Canvas - Dark Mode Only */}
      {theme === 'dark' && <CosmicStarfield />}

      {/* Artistic Space Nebulas - Dark Mode Only */}
      {theme === 'dark' && (
        <>
          <div className="nebula -top-20 -left-20" />
          <div className="nebula-indigo top-1/3 -right-24" />
          <div className="nebula -bottom-24 -left-12" />
        </>
      )}

      {/* Main Flow: Splash Loader, Auth Screen, OR Logged In Experience */}
      {authLoading ? (
        <div className="relative z-20 min-h-screen flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="p-8 rounded-3xl bg-black/60 border border-purple-500/30 backdrop-blur-2xl flex flex-col items-center gap-4 shadow-2xl">
            <OfficialLogo size="lg" />
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
              <span className="text-xs font-mono tracking-widest text-white/80 uppercase">
                {language === 'ar' ? 'جاري الاتصال بقاعدة البيانات...' : 'Connecting to Five Seasons...'}
              </span>
            </div>
          </div>
        </div>
      ) : !currentUser ? (
        <AuthScreen
          language={language}
          onLanguageChange={setLanguage}
          theme={theme}
          onThemeChange={handleThemeChange}
          onAuthSuccess={handleAuthSuccess}
          onOpenFounderModal={() => setIsFounderModalOpen(true)}
          totalRegisteredUsers={registeredUsersCount}
        />
      ) : (
        <div className="relative z-10 flex-1 flex flex-col pb-20">
          {/* Top Sticky Header */}
          <TopHeader
            currentUser={currentUser}
            language={language}
            stories={stories}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenFounderModal={() => setIsFounderModalOpen(true)}
            onOpenStories={() => setIsStoriesModalOpen(true)}
          />

          {/* Active Tab View */}
          <main className="flex-1 flex flex-col">
            {/* 1. CLIPS FEED TAB */}
            {activeTab === 'feed' && (
              <HorizontalClipFeed
                clips={clips}
                currentUser={currentUser}
                allUsers={communityUsers}
                stories={stories}
                language={language}
                onOpenStudio={() => {
                  setStudioInitialCategory(undefined);
                  setIsCameraOpen(true);
                }}
                onLikeClip={handleLikeClip}
                onVoteClip={handleVoteClip}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onDeleteClip={handleDeleteClip}
                onShareToStory={handleShareToStory}
                onSendDirect={handleSendDirect}
                onOpenStory={handleOpenStory}
                onAddStory={handleAddStory}
                onOpenFounderModal={() => setIsFounderModalOpen(true)}
              />
            )}

            {/* 2. SEARCH & EXPLORE TAB */}
            {activeTab === 'search' && (
              <SearchView
                clips={clips}
                users={communityUsers}
                currentUser={currentUser}
                language={language}
                onSelectClip={(_clip) => {
                  setActiveTab('feed');
                }}
                onSelectUser={(user) => {
                  if (user.isFounder) {
                    setIsFounderModalOpen(true);
                  }
                }}
                onSelectSeason={(_seasonId) => {
                  setActiveTab('seasons');
                }}
              />
            )}

            {/* 3. FIVE SEASONS TOURNAMENT TAB */}
            {activeTab === 'seasons' && (
              <SeasonsHub
                language={language}
                onSelectCategoryFilter={(_cat) => {
                  setActiveTab('feed');
                }}
                onOpenStudioWithCategory={handleOpenStudioWithCategory}
                clips={clips}
              />
            )}

            {/* 4. MESSAGES TAB */}
            {activeTab === 'messages' && (
              <MessagesView
                currentUser={currentUser}
                language={language}
                allUsers={communityUsers}
              />
            )}

            {/* 5. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <NotificationsView
                currentUser={currentUser}
                language={language}
              />
            )}

            {/* 6. PROFILE TAB */}
            {activeTab === 'profile' && (
              <ProfileView
                currentUser={currentUser}
                userClips={clips.filter((c) => c.userId === currentUser.id)}
                language={language}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenStudio={() => {
                  setStudioInitialCategory(undefined);
                  setIsCameraOpen(true);
                }}
                onOpenFounderModal={() => setIsFounderModalOpen(true)}
                onOpenEditProfile={() => setIsEditProfileOpen(true)}
              />
            )}
          </main>

          {/* Fixed Bottom Navigation Bar with Search tab */}
          <BottomNavBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onOpenStudio={() => {
              setStudioInitialCategory(undefined);
              setIsCameraOpen(true);
            }}
            language={language}
          />
        </div>
      )}

      {/* Stories Modal (Opens from Stories button in TopHeader) */}
      {currentUser && (
        <StoriesModal
          isOpen={isStoriesModalOpen}
          onClose={() => setIsStoriesModalOpen(false)}
          stories={stories}
          currentUser={currentUser}
          language={language}
          onOpenStory={handleOpenStory}
          onAddStory={handleAddStory}
        />
      )}

      {/* Story Viewer Modal (Instagram-style stories player) */}
      {viewingStory && (
        <StoryViewerModal
          story={viewingStory}
          language={language}
          onClose={() => setViewingStory(null)}
          onNextStory={() => {
            const currentIdx = stories.findIndex((s) => s.id === viewingStory.id);
            if (currentIdx < stories.length - 1) {
              setViewingStory(stories[currentIdx + 1]);
            } else {
              setViewingStory(null);
            }
          }}
          onPrevStory={() => {
            const currentIdx = stories.findIndex((s) => s.id === viewingStory.id);
            if (currentIdx > 0) {
              setViewingStory(stories[currentIdx - 1]);
            }
          }}
        />
      )}

      {/* Camera Studio Modal (15s limits, Speed, Filters, Text, Audio, AI Upscale) */}
      {currentUser && (
        <CameraStudioModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          currentUser={currentUser}
          language={language}
          initialCategory={studioInitialCategory}
          onPublishClip={handlePublishClip}
          availableFriends={communityUsers}
        />
      )}

      {/* Official Founder Documentation Modal */}
      <FounderProfileModal
        isOpen={isFounderModalOpen}
        onClose={() => setIsFounderModalOpen(false)}
        language={language}
      />

      {/* Settings Modal */}
      {currentUser && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentUser={currentUser}
          language={language}
          onLanguageChange={setLanguage}
          theme={theme}
          onThemeChange={handleThemeChange}
          onLogOut={handleLogOut}
          onOpenFounderModal={() => setIsFounderModalOpen(true)}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
        />
      )}

      {/* Edit Profile Modal */}
      {currentUser && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={currentUser}
          language={language}
          onProfileUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            setCommunityUsers((prev) =>
              prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
            );
          }}
        />
      )}
    </div>
  );
}
