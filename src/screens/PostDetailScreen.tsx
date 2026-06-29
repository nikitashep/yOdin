import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchPostById } from '../services/postService';
import PostDetailModal from './PostDetailModal';
import { Post } from '../types';
import { useTheme } from '../hooks/useTheme';

// Thin wrapper so a post can be opened as a navigation target (e.g. from an
// event sign-up notification). Reuses the same modal the feed uses.
export default function PostDetailScreen({ route, navigation }: any) {
  const { postId } = route.params as { postId: string };
  const { colors } = useTheme();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPostById(postId)
      .then((p) => { if (active) { setPost(p); setLoading(false); if (!p) navigation.goBack(); } })
      .catch(() => { if (active) { setLoading(false); navigation.goBack(); } });
    return () => { active = false; };
  }, [postId]);

  // The modal is a native overlay, so it must be hidden before navigating to a
  // profile (otherwise it covers the pushed screen). Re-show it on return.
  useFocusEffect(useCallback(() => { setVisible(true); }, []));

  if (loading || !post) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <PostDetailModal
      visible={visible}
      postId={postId}
      fallbackPost={post}
      onClose={() => navigation.goBack()}
      onOpenProfile={(userId) => {
        setVisible(false);
        setTimeout(() => navigation.push('UserProfile', { userId }), 250);
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
