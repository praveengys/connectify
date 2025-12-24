import { type Timestamp } from 'firebase/firestore';

export type Forum = {
  id: string;
  name: string;
  description: string;
  createdBy: string;
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
  author?: UserProfile; // Optional: denormalized author data
  categoryId: string;
  forumId: string;
  tags: string[];
  status: 'published' | 'hidden' | 'deleted';
  isLocked: boolean;
  isPinned: boolean;
  replyCount: number;
  replies: Reply[]; // Embedded replies
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
  author?: UserProfile; // Optional: denormalized author data
  replyToAuthorId?: string; // UID of the user this reply is directed at
  status: 'published' | 'hidden' | 'deleted';
  createdAt: Timestamp | Date;
  moderatorNotes?: string;
  moderation?: {
    status: 'clean' | 'under_review' | 'action_taken';
    moderatorId: string;
    actionReason: string;
  };
  pending?: boolean; // For optimistic UI
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: Timestamp | Date;
  status: 'active' | 'deleted';
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
};
