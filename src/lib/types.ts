

import { type Timestamp } from 'firebase/firestore';

export type Forum = {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  creatorProfileVisibility?: 'public' | 'private';
  visibility: 'public' | 'private';
  status: 'active' | 'suspended';
  createdAt: Timestamp | Date;
};

export type Thread = {
  id: string;
  title: string;
  body: string;
  intent: 'question' | 'discussion' | 'announcement' | 'feedback' | 'help';
  authorId: string;
  authorVisibility?: 'public' | 'private';
  author?: UserProfile; // Optional: denormalized author data
  categoryId: string;
  forumId: string;
  tags: string[];
  status: 'published' | 'hidden' | 'deleted';
  isLocked: boolean;
  isPinned: boolean;
  replyCount: number;
  latestReplyAt: Timestamp | Date | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  moderatorNotes?: string;
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
  replyToAuthorId?: string; // For nested replies
  parentReplyId: string | null;
  status: 'published' | 'hidden' | 'deleted';
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  moderatorNotes?: string;
  pending?: boolean; // For optimistic UI
};

export type ChatMessage = {
  id: string;
  senderId: string;
  type: 'text' | 'image';
  text?: string;
  imageUrl?: string;
  reactions?: { [emoji: string]: string[] }; // emoji: list of user UIDs
  status: 'visible' | 'deleted';
  createdAt: Timestamp | Date;
  senderProfile?: Pick<UserProfile, 'displayName' | 'avatarUrl'>; // Denormalized for chat UI
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
  role: 'member' | 'admin';
  profileVisibility: 'public' | 'private';
  emailVerified: boolean;
  profileScore: number;
  postCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  email?: string | null;
  company?: string;
  isMuted?: boolean;
  isBanned?: boolean;
};

export type Group = {
    id: string;
    name: string;
    type: 'public' | 'private';
    createdBy: string;
    createdAt: Timestamp | Date;
    memberCount: number;
    members: { [uid: string]: 'owner' | 'admin' | 'member' };
    muted?: { [uid: string]: Timestamp | Date };
    lastMessage?: {
      text: string;
      sender: string;
      timestamp: Timestamp | Date;
    }
};

export type Member = {
    uid: string;
    role: 'owner' | 'admin' | 'member';
    mutedUntil?: Timestamp | Date | null;
    joinedAt: Timestamp | Date;
    userProfile?: UserProfile; // Denormalized for UI
};

export type TypingIndicator = {
    isTyping: boolean;
    updatedAt: Timestamp | Date;
    user: Pick<UserProfile, 'uid' | 'displayName'>;
};

// Feed-related types
export type Post = {
    id: string;
    authorId: string;
    content: string;
    media?: string[];
    visibility: 'public' | 'group-only';
    groupId?: string;
    status: 'active' | 'deleted' | 'reported';
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
    // Denormalized author data for easy display
    author?: Pick<UserProfile, 'displayName' | 'avatarUrl' | 'username'>;
    // For real-time updates on the client
    isLiked?: boolean;
};

export type PostComment = {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    parentCommentId: string | null;
    createdAt: Date | Timestamp;
    author?: Pick<UserProfile, 'displayName' | 'avatarUrl' | 'username'>;
};

export type PostLike = {
    userId: string;
    createdAt: Date | Timestamp;
};

    