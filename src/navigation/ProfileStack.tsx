import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import DiscussionDetailScreen from '../screens/DiscussionDetailScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  DiscussionDetail: { discussionId: string; question: string };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="DiscussionDetail" component={DiscussionDetailScreen} />
    </Stack.Navigator>
  );
}
