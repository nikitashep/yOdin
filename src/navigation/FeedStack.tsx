import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/FeedScreen';

export type FeedStackParamList = {
  FeedHome: undefined;
};

const Stack = createNativeStackNavigator<FeedStackParamList>();

export default function FeedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FeedHome" component={FeedScreen} />
    </Stack.Navigator>
  );
}
