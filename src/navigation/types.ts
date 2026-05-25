export type AuthStackParamList = {
  Welcome: undefined;
  Register: { mode: 'login' | 'register' };
  Onboarding: undefined;
};

export type FeedStackParamList = {
  FeedHome: undefined;
  DiscussionDetail: { discussionId: string; question: string };
  Notifications: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  DiscussionDetail: { discussionId: string; question: string };
};

export type TabParamList = {
  Feed: undefined;
  NewDiscussion: undefined;
  Profile: undefined;
};
