import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { useNotificationStore } from '../store/useNotificationStore';
import FeedStack from './FeedStack';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NewDiscussionModal from '../screens/NewDiscussionModal';

const Tab = createBottomTabNavigator();

function TabBarIcon({ focused, emoji }: { focused: boolean; emoji: string }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

function NotificationsIcon({ focused }: { focused: boolean }) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  return (
    <View>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

function EmptyScreen() {
  return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
}

export default function TabNavigator() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Feed"
          component={FeedStack}
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} emoji="🌐" />,
          }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            tabBarIcon: ({ focused }) => <NotificationsIcon focused={focused} />,
          }}
        />
        <Tab.Screen
          name="NewDiscussion"
          component={EmptyScreen}
          options={{
            tabBarButton: () => (
              <TouchableOpacity
                style={styles.plusWrap}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}
              >
                <View style={styles.plusBtn}>
                  <Text style={styles.plusText}>+</Text>
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} emoji="👤" />,
          }}
        />
      </Tab.Navigator>

      <NewDiscussionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 64,
    paddingBottom: 8,
  },
  plusWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  plusText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.notification,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
