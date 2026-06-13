import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { useFeedStore } from '../store/useFeedStore';
import {
  fetchDiscussionById,
  fetchReplies,
  addReply,
  saveDiscussion,
  unsaveDiscussion,
  voteReply,
  acceptReply,
} from '../services/discussionService';
import { createNotification } from '../services/notificationService';
import { Reply, Discussion } from '../types';
import { getFlagEmoji } from '../utils/flagEmoji';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { ColorPalette } from '../theme/colors';
import { Typography } from '../theme/typography';
import { TAB_BAR_HEIGHT } from '../constants/layout';

const ROOT_KEY = '__root__';
const INDENT_STEP = 16;
const MAX_INDENT_DEPTH = 5;

export default function DiscussionDetailScreen({ route, navigation }: any) {
  const { discussionId, question: questionParam } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets.top);
  const { profile } = useAuthStore();
  const { incrementReplyCount, toggleSaved, setAcceptedReply } = useFeedStore();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [replyingTo, setReplyingTo] = useState<Reply | null>(null);
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadAll();
  }, []);

  // KeyboardAvoidingView misreads its frame inside the material-top-tabs pager,
  // so we lift the composer manually. The bar sits above the bottom tab bar, so
  // the lift is the keyboard height minus the tab bar it already clears.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) =>
      setKeyboardHeight(e.endCoordinates?.height ?? 0),
    );
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const keyboardLift =
    keyboardHeight > 0 ? Math.max(keyboardHeight - TAB_BAR_HEIGHT - insets.bottom, 0) : 0;

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const disc = await fetchDiscussionById(discussionId);
      if (disc) setDiscussion(disc);
      const reps = await fetchReplies(discussionId);
      setReplies(reps);
    } catch (e: any) {
      setError(e.message ?? t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  // Flatten the reply tree (Reddit-style threading) into an ordered list with a
  // depth per node. `replies` already arrives in chronological order, so we keep
  // insertion order within each parent bucket. The accepted answer is pinned to
  // the top among the top-level replies.
  const threadedReplies = useMemo(() => {
    const ids = new Set(replies.map((r) => r.id));
    const byParent = new Map<string, Reply[]>();
    for (const r of replies) {
      const key = r.parentReplyId && ids.has(r.parentReplyId) ? r.parentReplyId : ROOT_KEY;
      const bucket = byParent.get(key);
      if (bucket) bucket.push(r);
      else byParent.set(key, [r]);
    }
    const acceptedId = discussion?.acceptedReplyId;
    const roots = byParent.get(ROOT_KEY) ?? [];
    const orderedRoots = acceptedId
      ? [...roots.filter((r) => r.id === acceptedId), ...roots.filter((r) => r.id !== acceptedId)]
      : roots;
    const out: { reply: Reply; depth: number }[] = [];
    const walk = (node: Reply, depth: number) => {
      out.push({ reply: node, depth });
      for (const child of byParent.get(node.id) ?? []) walk(child, depth + 1);
    };
    for (const r of orderedRoots) walk(r, 0);
    return out;
  }, [replies, discussion?.acceptedReplyId]);

  const isAnswered = !!discussion?.acceptedReplyId;
  const isQuestionAuthor = discussion?.authorId === profile?.uid;

  async function sendReply() {
    if (!text.trim() || !profile || !discussion) return;
    setSending(true);
    setSendError('');
    try {
      const replyData: Omit<Reply, 'id' | 'createdAt'> = {
        discussionId,
        authorId: profile.uid,
        authorName: `${profile.firstName} ${profile.lastName}`,
        authorPhoto: profile.photoURL ?? '',
        authorNationality: profile.nationality,
        authorCountryCode: profile.countryCode,
        text: text.trim(),
        likes: [],
        dislikes: [],
        parentReplyId: replyingTo?.id ?? null,
      };

      const replyId = await addReply(discussionId, replyData);

      // Notify whoever is being answered: the parent reply's author for a
      // threaded reply, otherwise the question author.
      const recipientId = replyingTo?.authorId ?? discussion.authorId;
      if (recipientId !== profile.uid) {
        await createNotification({
          toUserId: recipientId,
          fromUserId: profile.uid,
          fromUserName: `${profile.firstName} ${profile.lastName}`,
          fromUserPhoto: profile.photoURL ?? '',
          discussionId,
          discussionQuestion: discussion.question,
        });
      }

      setReplies((prev) => [
        ...prev,
        { id: replyId, ...replyData, createdAt: Date.now() },
      ]);
      incrementReplyCount(discussionId);
      setText('');
      setReplyingTo(null);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      setSendError(e?.message ?? t('errors.generic'));
    } finally {
      setSending(false);
    }
  }

  async function handleVote(reply: Reply, vote: 'like' | 'dislike') {
    if (!profile?.uid || reply.authorId === profile.uid) return;
    const uid = profile.uid;
    const liked = reply.likes?.includes(uid) ?? false;
    const disliked = reply.dislikes?.includes(uid) ?? false;

    function applyVote(r: Reply): Reply {
      let likes = (r.likes ?? []).filter((id) => id !== uid);
      let dislikes = (r.dislikes ?? []).filter((id) => id !== uid);
      if (vote === 'like' && !liked) likes = [...likes, uid];
      if (vote === 'dislike' && !disliked) dislikes = [...dislikes, uid];
      return { ...r, likes, dislikes };
    }

    const prevReplies = replies;
    setReplies((prev) => prev.map((r) => (r.id === reply.id ? applyVote(r) : r)));
    try {
      await voteReply(discussionId, reply.id, uid, vote, { liked, disliked });
    } catch {
      setReplies(prevReplies);
    }
  }

  async function handleAccept(reply: Reply) {
    if (!profile || !discussion || accepting || discussion.acceptedReplyId) return;
    setAccepting(true);
    const prevDiscussion = discussion;
    setDiscussion({
      ...discussion,
      acceptedReplyId: reply.id,
      acceptedReplyText: reply.text,
      acceptedReplyAuthorName: reply.authorName,
    });
    try {
      await acceptReply(discussionId, reply.id, reply.authorId, reply.text, reply.authorName);
      setAcceptedReply(discussionId, reply.id, reply.text, reply.authorName);
      if (reply.authorId !== profile.uid) {
        await createNotification(
          {
            toUserId: reply.authorId,
            fromUserId: profile.uid,
            fromUserName: `${profile.firstName} ${profile.lastName}`,
            fromUserPhoto: profile.photoURL ?? '',
            discussionId,
            discussionQuestion: discussion.question,
          },
          'accepted',
        );
      }
      setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
    } catch {
      setDiscussion(prevDiscussion);
    } finally {
      setAccepting(false);
    }
  }

  const isSaved = discussion?.savedBy?.includes(profile?.uid ?? '') ?? false;

  async function handleSave() {
    if (!profile?.uid || !discussion) return;
    const saved = discussion.savedBy?.includes(profile.uid) ?? false;
    setDiscussion((prev) => {
      if (!prev) return prev;
      const savedBy = prev.savedBy ?? [];
      return {
        ...prev,
        savedBy: saved ? savedBy.filter((id) => id !== profile.uid) : [...savedBy, profile.uid],
      };
    });
    toggleSaved(discussion.id, profile.uid);
    try {
      if (saved) await unsaveDiscussion(profile.uid, discussion.id);
      else await saveDiscussion(profile.uid, discussion.id);
    } catch {
      setDiscussion((prev) => {
        if (!prev) return prev;
        const savedBy = prev.savedBy ?? [];
        return {
          ...prev,
          savedBy: saved ? [...savedBy, profile.uid] : savedBy.filter((id) => id !== profile.uid),
        };
      });
      toggleSaved(discussion.id, profile.uid);
    }
  }

  const flag = getFlagEmoji;

  function startReplyTo(reply: Reply) {
    setReplyingTo(reply);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function renderReply({ item }: { item: { reply: Reply; depth: number } }) {
    const { reply, depth } = item;
    const isMe = reply.authorId === profile?.uid;
    const isAccepted = reply.id === discussion?.acceptedReplyId;
    const initials = reply.authorName?.split(' ').map((w) => w[0]).join('').toUpperCase() ?? '?';
    const liked = reply.likes?.includes(profile?.uid ?? '') ?? false;
    const disliked = reply.dislikes?.includes(profile?.uid ?? '') ?? false;
    const likeCount = reply.likes?.length ?? 0;
    const dislikeCount = reply.dislikes?.length ?? 0;
    const canAccept = isQuestionAuthor && !isAnswered && !isMe && depth === 0;
    const indent = Math.min(depth, MAX_INDENT_DEPTH) * INDENT_STEP;

    return (
      <View style={{ marginLeft: indent }}>
        <View
          style={[
            styles.replyCard,
            depth > 0 && styles.replyCardNested,
            isAccepted && styles.replyCardAccepted,
          ]}
        >
          {isAccepted && (
            <View style={styles.acceptedHeader}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.acceptedHeaderText}>{t('discussion.acceptedAnswer')}</Text>
            </View>
          )}
          <View style={styles.replyHeader}>
            <View style={styles.replyAvatar}>
              {reply.authorPhoto ? (
                <Image source={{ uri: reply.authorPhoto }} style={styles.replyAvatarImage} />
              ) : (
                <Text style={styles.replyAvatarText}>{initials}</Text>
              )}
            </View>
            <Text style={styles.replyAuthor} numberOfLines={1}>
              {reply.authorName}  {flag(reply.authorCountryCode)}
            </Text>
          </View>

          <Text style={styles.replyText}>{reply.text}</Text>

          <View style={styles.replyActions}>
            <TouchableOpacity
              style={styles.voteBtn}
              onPress={() => handleVote(reply, 'like')}
              disabled={isMe}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
                size={16}
                color={liked ? colors.primary : colors.textSecondary}
              />
              {likeCount > 0 && (
                <Text style={[styles.voteCount, liked && { color: colors.primary }]}>{likeCount}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.voteBtn}
              onPress={() => handleVote(reply, 'dislike')}
              disabled={isMe}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={disliked ? 'thumbs-down' : 'thumbs-down-outline'}
                size={16}
                color={disliked ? colors.notification : colors.textSecondary}
              />
              {dislikeCount > 0 && (
                <Text style={[styles.voteCount, disliked && { color: colors.notification }]}>{dislikeCount}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.voteBtn}
              onPress={() => startReplyTo(reply)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="arrow-undo-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.voteCount}>{t('discussion.reply')}</Text>
            </TouchableOpacity>
            {canAccept && (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(reply)}
                disabled={accepting}
              >
                <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
                <Text style={styles.acceptBtnText}>{t('discussion.markHelped')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('discussion.title')}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <>
          <View style={styles.questionBlock}>
            <Text style={styles.questionText}>{questionParam}</Text>
          </View>
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        </>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: colors.notification, textAlign: 'center', padding: 24 }}>{error}</Text>
        </View>
      ) : (
        <>
          {discussion && (
            <View style={[styles.questionBlock, isAnswered && styles.questionBlockAnswered]}>
              <View style={styles.questionAuthorRow}>
                <View style={styles.qAvatar}>
                  {discussion.authorPhoto ? (
                    <Image source={{ uri: discussion.authorPhoto }} style={styles.qAvatarImage} />
                  ) : (
                    <Text style={styles.qAvatarText}>
                      {discussion.authorName?.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qAuthorName}>{discussion.authorName}</Text>
                  <Text style={styles.qAuthorMeta}>
                    {flag(discussion.authorCountryCode)}  {discussion.authorNationality}
                  </Text>
                </View>
                {isAnswered && (
                  <View style={styles.answeredBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                    <Text style={styles.answeredBadgeText}>{t('forum.answered')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.questionText}>{discussion.question}</Text>
            </View>
          )}

          <FlatList
            ref={listRef}
            data={threadedReplies}
            keyExtractor={(item) => item.reply.id}
            renderItem={renderReply}
            contentContainerStyle={styles.repliesList}
            ListEmptyComponent={
              <View style={styles.emptyReplies}>
                <Text style={styles.emptyText}>{t('discussion.firstReply')}</Text>
              </View>
            }
          />
        </>
      )}

      {sendError ? (
        <Text style={styles.sendErrorText}>{sendError}</Text>
      ) : null}
      {replyingTo ? (
        <View style={styles.replyingToBar}>
          <Ionicons name="arrow-undo-outline" size={14} color={colors.primary} />
          <Text style={styles.replyingToText} numberOfLines={1}>
            {t('discussion.replyingTo', { name: replyingTo.authorName })}
          </Text>
          <TouchableOpacity
            onPress={() => setReplyingTo(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : null}
      <View
        style={[
          styles.inputBar,
          {
            marginBottom: keyboardLift,
            paddingBottom: keyboardHeight > 0 ? 12 : undefined,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={t('discussion.replyPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={(v) => { setText(v); if (sendError) setSendError(''); }}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendReply}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.sendText}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette, topInset: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: topInset + 12,
      paddingBottom: 12,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    backBtn: { padding: 4 },
    backText: { fontSize: 24, color: c.textPrimary },
    headerTitle: {
      fontSize: Typography.fontSizeLG,
      fontWeight: Typography.fontWeightBold,
      color: c.textPrimary,
      flex: 1,
    },
    saveBtn: { padding: 4 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    questionBlock: {
      backgroundColor: c.surface,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    questionBlockAnswered: {
      backgroundColor: c.success + '18',
      borderBottomColor: c.success,
      borderBottomWidth: 1.5,
    },
    questionAuthorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    qAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qAvatarText: {
      fontSize: Typography.fontSizeMD,
      fontWeight: Typography.fontWeightBold,
      color: c.primary,
    },
    qAvatarImage: { width: 40, height: 40, borderRadius: 20 },
    replyAvatarImage: { width: 28, height: 28, borderRadius: 14 },
    qAuthorName: {
      fontSize: Typography.fontSizeMD,
      fontWeight: Typography.fontWeightSemiBold,
      color: c.textPrimary,
    },
    qAuthorMeta: { fontSize: Typography.fontSizeSM, color: c.textSecondary },
    answeredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.success,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    answeredBadgeText: {
      color: '#fff',
      fontSize: Typography.fontSizeXS,
      fontWeight: Typography.fontWeightSemiBold,
    },
    questionText: {
      fontSize: Typography.fontSizeLG,
      color: c.textPrimary,
      lineHeight: 26,
      fontWeight: Typography.fontWeightMedium,
    },
    repliesList: { padding: 16, gap: 10, flexGrow: 1 },
    emptyReplies: { alignItems: 'center', paddingTop: 40 },
    emptyText: { fontSize: Typography.fontSizeMD, color: c.textSecondary },
    replyCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
    },
    replyCardNested: {
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      borderTopLeftRadius: 4,
      borderBottomLeftRadius: 4,
    },
    replyCardAccepted: {
      borderColor: c.success,
      borderWidth: 1.5,
      backgroundColor: c.success + '0F',
    },
    acceptedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    acceptedHeaderText: {
      fontSize: Typography.fontSizeSM,
      fontWeight: Typography.fontWeightSemiBold,
      color: c.success,
    },
    replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    replyAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    replyAvatarText: {
      fontSize: Typography.fontSizeXS,
      fontWeight: Typography.fontWeightBold,
      color: c.primary,
    },
    replyAuthor: {
      flex: 1,
      fontSize: Typography.fontSizeSM,
      fontWeight: Typography.fontWeightSemiBold,
      color: c.textPrimary,
    },
    replyText: { fontSize: Typography.fontSizeMD, color: c.textPrimary, lineHeight: 21 },
    replyActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      marginTop: 10,
    },
    voteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    voteCount: {
      fontSize: Typography.fontSizeXS,
      color: c.textSecondary,
      fontWeight: Typography.fontWeightMedium,
    },
    acceptBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.success,
    },
    acceptBtnText: {
      fontSize: Typography.fontSizeXS,
      fontWeight: Typography.fontWeightSemiBold,
      color: c.success,
    },
    replyingToBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: c.primaryLight,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    replyingToText: {
      flex: 1,
      fontSize: Typography.fontSizeSM,
      color: c.primary,
      fontWeight: Typography.fontWeightMedium,
    },
    sendErrorText: {
      fontSize: Typography.fontSizeSM,
      color: c.notification,
      paddingHorizontal: 20,
      paddingVertical: 6,
      backgroundColor: c.surface,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: Platform.OS === 'ios' ? 28 : 12,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
      gap: 10,
    },
    input: {
      flex: 1,
      backgroundColor: c.background,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: Typography.fontSizeMD,
      color: c.textPrimary,
      maxHeight: 100,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendText: { color: '#fff', fontSize: 20, fontWeight: Typography.fontWeightBold },
  });
}
