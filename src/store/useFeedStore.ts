import { create } from 'zustand';
import { Discussion } from '../types';

interface FeedState {
  discussions: Discussion[];
  isLoading: boolean;
  hasMore: boolean;
  setDiscussions: (discussions: Discussion[]) => void;
  appendDiscussions: (discussions: Discussion[]) => void;
  prependDiscussion: (discussion: Discussion) => void;
  setLoading: (v: boolean) => void;
  setHasMore: (v: boolean) => void;
  incrementReplyCount: (discussionId: string) => void;
  setAcceptedReply: (
    discussionId: string,
    replyId: string,
    text?: string,
    authorName?: string,
  ) => void;
  toggleSaved: (discussionId: string, userId: string) => void;
  removeDiscussion: (discussionId: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  discussions: [],
  isLoading: false,
  hasMore: true,
  setDiscussions: (discussions) => set({ discussions }),
  appendDiscussions: (more) =>
    set((state) => {
      // Drop any ids already in the list — feedScore re-ranking between pages
      // can otherwise surface the same doc twice (duplicate FlatList keys).
      const seen = new Set(state.discussions.map((d) => d.id));
      return { discussions: [...state.discussions, ...more.filter((d) => !seen.has(d.id))] };
    }),
  prependDiscussion: (discussion) =>
    set((state) => ({ discussions: [discussion, ...state.discussions] })),
  setLoading: (isLoading) => set({ isLoading }),
  setHasMore: (hasMore) => set({ hasMore }),
  incrementReplyCount: (discussionId) =>
    set((state) => ({
      discussions: state.discussions.map((d) =>
        d.id === discussionId ? { ...d, replyCount: d.replyCount + 1 } : d,
      ),
    })),
  setAcceptedReply: (discussionId, replyId, text, authorName) =>
    set((state) => ({
      discussions: state.discussions.map((d) =>
        d.id === discussionId
          ? {
              ...d,
              acceptedReplyId: replyId,
              acceptedReplyText: text ?? d.acceptedReplyText,
              acceptedReplyAuthorName: authorName ?? d.acceptedReplyAuthorName,
            }
          : d,
      ),
    })),
  toggleSaved: (discussionId, userId) =>
    set((state) => ({
      discussions: state.discussions.map((d) => {
        if (d.id !== discussionId) return d;
        const savedBy = d.savedBy ?? [];
        const isSaved = savedBy.includes(userId);
        return {
          ...d,
          savedBy: isSaved ? savedBy.filter((id) => id !== userId) : [...savedBy, userId],
        };
      }),
    })),
  removeDiscussion: (discussionId) =>
    set((state) => ({
      discussions: state.discussions.filter((d) => d.id !== discussionId),
    })),
}));
