

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
  displayName: string;
  avatarUrl: string | null;
  role: 'member' | 'admin' | 'moderator';
  profileVisibility: 'public' | 'private';
  emailVerified: boolean;
  postCount: number;
  commentCount: number;
  lastActiveAt: Date;
  isMuted?: boolean;
  isBanned?: boolean;

  // Fields from external JSON
  memberId?: number;
  memberTitle?: string | null;
  memberFirstName?: string;
  memberLastName?: string;
  memberEmailAddress?: string;
  memberMobileNumber?: string;
  memberExperience?: string;
  memberType?: string;
  memberOTP?: string | null;
  memberStatus?: string;
  firstReminder?: number;
  finalReminder?: number;
  createdAt: string | Date | Timestamp;
  modified_at?: string;
};

export type Group = {
    id: string;
    name: string;
    type: 'public' | 'private';
    createdBy: string;
    createdAt: Timestamp | Date;
    memberCount: number;
    members: { [uid: string]: true }; 
    memberRoles: { [uid: string]: 'owner' | 'admin' | 'member' };
    muted?: { [uid: string]: Timestamp | Date };
    lastMessage?: {
      text: string;
      sender: string;
      timestamp: Timestamp | Date;
    };
    activeMeeting?: {
      roomUrl: string;
      startedBy: string;
      startedAt: Timestamp | Date;
      isLive: boolean;
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
    status: 'active' | 'draft' | 'deleted' | 'reported';
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    repostsCount: number;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
    // Denormalized author data for easy display
    author?: Pick<UserProfile, 'displayName' | 'avatarUrl' | 'memberId'>;
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
    author?: Pick<UserProfile, 'displayName' | 'avatarUrl' | 'memberId'>;
};

export type PostLike = {
    userId: string;
    createdAt: Date | Timestamp;
};

export type DemoBooking = {
    id: string;
    name: string;
    email: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    slotId: string;
    uid: string;
    notes?: string;
    status: 'pending' | 'scheduled' | 'denied';
    createdAt: Date | Timestamp;
};

export type DemoSlot = {
    id: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    status: 'available' | 'pending' | 'booked';
    lockedByRequestId?: string | null;
};

export type Notification = {
    id: string;
    recipientId: string;
    senderId: string | null;
    type: string;
    title: string;
    message: string;
    entityType: 'post' | 'group' | 'discussion' | 'chat' | 'demo';
    entityId: string;
    actionUrl: string;
    isRead: boolean;
    createdAt: Timestamp | Date;
    priority: 'low' | 'normal' | 'high';
    sender?: Pick<UserProfile, 'displayName' | 'avatarUrl'>;
};

export type NotificationPreferences = {
    userId: string;
    postNotifications: boolean;
    groupNotifications: boolean;
    chatNotifications: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
};

export type ModerationLog = {
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    performedBy: string; // UID of moderator
    timestamp: Timestamp | Date;
    reason?: string;
};

export type NewsletterSubscription = {
    email: string;
    createdAt: Timestamp | Date;
    source: string;
};
