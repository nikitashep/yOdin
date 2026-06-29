export interface User {
  uid: string;
  email?: string;
  firstName: string;
  lastName: string;
  nationality: string;
  countryCode: string;
  location: string;
  photoURL?: string;
  languages?: string[];
  points?: number;
  createdAt: number;
  following?: string[];
}

export type PostCategory = 'news' | 'events' | 'places' | 'lifestyle';

export const POST_CATEGORIES: PostCategory[] = ['news', 'events', 'places', 'lifestyle'];

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorNationality: string;
  authorCountryCode: string;
  title: string;
  description: string;
  category: PostCategory;
  imageURLs?: string[];
  location: string;
  createdAt: number;
  likes?: string[];
  dislikes?: string[];
  commentCount?: number;
  savedBy?: string[];
  // Event RSVP. Only set on `events` posts whose author turned on a sign-up
  // sheet. `participantLimit` null/absent = unlimited; `participants` holds the
  // UIDs of everyone who tapped "I'm going".
  signupEnabled?: boolean;
  participantLimit?: number | null;
  participants?: string[];
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorNationality: string;
  authorCountryCode: string;
  text: string;
  createdAt: number;
}

export interface Discussion {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorNationality: string;
  authorCountryCode: string;
  question: string;
  imageURLs?: string[];
  location?: string;
  createdAt: number;
  replyCount: number;
  // Total activity under the question (replies + their likes/dislikes), kept by
  // Cloud Functions. Used to pick the "question of the day".
  engagement?: number;
  savedBy?: string[];
  acceptedReplyId?: string;
  acceptedReplyText?: string;
  acceptedReplyAuthorName?: string;
}

export interface Reply {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorNationality: string;
  authorCountryCode: string;
  text: string;
  createdAt: number;
  likes?: string[];
  dislikes?: string[];
  // Reddit-style threading: null/absent = top-level reply to the question,
  // otherwise the id of the reply this one answers.
  parentReplyId?: string | null;
}

export interface AppNotification {
  id: string;
  type: 'reply' | 'accepted' | 'participant';
  toUserId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  // Forum notifications (reply/accepted) carry the discussion they belong to.
  discussionId?: string;
  discussionQuestion?: string;
  // Event sign-up notifications (participant) carry the post instead.
  postId?: string;
  postTitle?: string;
  createdAt: number;
  read: boolean;
}

export type ReportStatus = 'pending' | 'removed' | 'kept';

export interface Report {
  id: string;
  targetType: 'post' | 'discussion';
  targetId: string;
  targetTitle: string;
  targetAuthorId: string;
  reportedBy: string;
  reason: string;
  status: ReportStatus;
  createdAt: number;
}
