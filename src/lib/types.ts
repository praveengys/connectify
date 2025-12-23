import { type Timestamp } from 'firebase/firestore';

export type Thread = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  author?: UserProfile; // Optional: denormalized author data
  categoryId: string;
  tags: string[];
  status: 'published' | 'hidden' | 'deleted';
  isLocked: boolean;
  isPinned: boolean;
  replyCount: number;
  latestReplyAt: Timestamp | Date | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  moderation?: {
    status: 'clean' | 'under_review' | 'action_taken';
    moderatorId: string;
    actionReason: string;
  };
};

export type Reply = {
  id: string;
  threadId: string;
  body: string;
  authorId: string;
  author?: UserProfile; // Optional: denormalized author data
  status: 'published' | 'hidden' | 'deleted';
  createdAt: Timestamp | Date;
  moderation?: {
    status: 'clean' | 'under_review' | 'action_taken';
    moderatorId: string;
    actionReason: string;
  };
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  threadCount: number;
};

export type Tag = {
  name: string;
  threadCount: number;
};

export type Report = {
  id: string;
  reporterId: string;
  contentType: 'thread' | 'reply';
  contentId: string;
  threadId?: string;
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'other';
  comment?: string;
  status: 'open' | 'in_review' | 'resolved';
  createdAt: Timestamp | Date;
};

export type UserProfile = {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  interests: string[];
  skills: string[];
  languages: string[];
  location: string;
  currentlyExploring: string;
  role: 'member' | 'moderator' | 'admin';
  profileVisibility: 'public' | 'private';
  emailVerified: boolean;
  profileScore: number;
  postCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  email?: string | null;
};
