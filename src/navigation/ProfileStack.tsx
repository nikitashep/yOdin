import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import DiscussionDetailScreen from '../screens/DiscussionDetailScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import FollowListScreen from '../screens/FollowListScreen';
import ReportsScreen from '../screens/ReportsScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  DiscussionDetail: { discussionId: string; question: string };
  UserProfile: { userId: string };
  FollowList: { userId: string; initialTab: 'followers' | 'following' };
  Reports: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="DiscussionDetail" component={DiscussionDetailScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="FollowList" component={FollowListScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}
