import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import FeedStack from './FeedStack';
import ForumStack from './ForumStack';
import ProfileStack from './ProfileStack';
import NewPostModal from '../screens/NewPostModal';
import NewDiscussionModal from '../screens/NewDiscussionModal';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Feed');

  // The floating "+" posts to whatever section the user is in:
  // Forum → ask a question; anywhere else → post to the feed.
  function handleAddPress() {
    if (activeTab === 'Forum') setQuestionModalVisible(true);
    else setPostModalVisible(true);
  }

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [styles.tabBar, { backgroundColor: colors.tabBar }],
          tabBarShowLabel: false,
        }}
        screenListeners={{
          state: (e: any) => {
            const navState = e.data?.state;
            if (!navState) return;
            const route = navState.routes[navState.index];
            if (route?.name) setActiveTab(route.name);
          },
        }}
      >
        <Tab.Screen
          name="Feed"
          component={FeedStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'earth' : 'earth-outline'}
                size={24}
                color={focused ? colors.tabBarActive : colors.tabBarInactive}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Forum"
          component={ForumStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={24}
                color={focused ? colors.tabBarActive : colors.tabBarInactive}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={24}
                color={focused ? colors.tabBarActive : colors.tabBarInactive}
              />
            ),
          }}
        />
      </Tab.Navigator>

      {activeTab !== 'Profile' && (
        <TouchableOpacity
          style={[
            styles.fab,
            { bottom: insets.bottom + 84, backgroundColor: colors.primary, shadowColor: colors.primary },
          ]}
          onPress={handleAddPress}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}

      <NewPostModal visible={postModalVisible} onClose={() => setPostModalVisible(false)} />
      <NewDiscussionModal visible={questionModalVisible} onClose={() => setQuestionModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    height: 72,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});