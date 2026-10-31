export type Language = 'en' | 'ar';
export type Theme = 'dark' | 'light';

export type SeasonType = 'comedy' | 'drama' | 'literature' | 'editor' | 'random';

export type PioneerTierType = 
  | 'first_ever'      // Account #1
  | 'second_ever'     // Account #2
  | 'third_ever'      // Account #3
  | 'top_10'          // Accounts #4 - #10
  | 'top_100'         // Accounts #11 - #100
  | 'top_1000'        // Accounts #101 - #1,000
  | 'top_10000'       // Accounts #1,001 - #10,000
  | 'member';         // Account > #10,000

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio: string;
  accountNumber: number;
  registeredAt?: string;
  joinedDate?: string;
  pioneerTier: PioneerTierType;
  followersCount?: number;
  followingCount?: number;
  totalLikes?: number;
  awardsWon?: string[];
  nameEditsCount?: number;
}

export interface Story {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    pioneerTier: PioneerTierType;
    accountNumber: number;
  };
  mediaUrl: string;
  mediaType: 'video' | 'photo';
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewsCount?: number;
  likesCount?: number;
  isViewed?: boolean;
}

export interface SeasonInfo {
  id: SeasonType;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  descriptionEn: string;
  descriptionAr: string;
  awardTitleEn: string;
  awardTitleAr: string;
  color: string;
  glowColor: string;
  iconName: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  bonusMultiplier: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  genre: string;
  coverUrl?: string;
}

export interface ClipComment {
  id: string;
  clipId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userPioneerTier: PioneerTierType;
  userAccountNumber: number;
  text: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  likedBy?: string[];
  taggedUsers?: string[];
  repliesCount?: number;
}

export interface Clip {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    accountNumber: number;
    pioneerTier: PioneerTierType;
  };
  mediaUrl: string;
  mediaType: 'video' | 'photo';
  caption: string;
  tags: string[];
  category: SeasonType;
  inCompetition: boolean;
  durationSeconds: number;
  likesCount: number;
  isLiked: boolean;
  likedBy?: string[];
  votesCount: number;
  isVoted: boolean;
  votedBy?: string[];
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  musicTrack?: {
    title: string;
    artist: string;
  };
  filterApplied?: string;
  aspectRatio?: string;
  textOverlay?: string;
  speed?: number;
  reportsCount?: number;
  reportedBy?: string[];
  isReported?: boolean;
  moderationStatus?: 'clean' | 'pending_review' | 'flagged' | 'reviewed';
  lastReportedAt?: string;
}

export type ReportReason = 
  | 'inappropriate'
  | 'harassment'
  | 'copyright'
  | 'spam'
  | 'misleading'
  | 'violence'
  | 'other';

export interface ClipReport {
  id: string;
  clipId: string;
  clipCaption?: string;
  clipMediaUrl?: string;
  reporterId: string;
  reporterUsername?: string;
  reportedUserId: string;
  reason: ReportReason;
  details?: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isFromMe: boolean;
}

export interface Conversation {
  id: string;
  withUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    pioneerTier: PioneerTierType;
    accountNumber: number;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'vote' | 'like' | 'comment' | 'pioneer' | 'award' | 'founder' | 'system';
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  createdAt: string;
  read: boolean;
  clipId?: string;
}

export type SearchTab = 'top' | 'accounts' | 'clips' | 'hashtags' | 'seasons';
