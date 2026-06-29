import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { ColorPalette } from '../theme/colors';
import { Typography } from '../theme/typography';
import { pickVideo, VideoPickError, MAX_VIDEO_DURATION_S } from '../utils/pickVideo';

export interface AttachedVideo {
  uri: string;
  poster: string;
}

interface Props {
  value: AttachedVideo | null;
  onChange: (v: AttachedVideo | null) => void;
  // Hidden while photos are attached (a post carries photos OR a video).
  disabled?: boolean;
}

// Single-video attach control for the create-post / create-question sheets.
export default function VideoAttach({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (busy) return;
    setBusy(true);
    try {
      const picked = await pickVideo();
      if (picked) onChange({ uri: picked.uri, poster: picked.poster });
    } catch (e) {
      if (e instanceof VideoPickError) Alert.alert(t(e.key, { count: MAX_VIDEO_DURATION_S }));
      else Alert.alert(t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  if (disabled) return null;

  if (value) {
    return (
      <View style={styles.previewWrap}>
        {value.poster ? (
          <Image source={{ uri: value.poster }} style={styles.preview} />
        ) : (
          <View style={[styles.preview, styles.previewEmpty]}>
            <Ionicons name="videocam" size={22} color={colors.primary} />
          </View>
        )}
        <View style={styles.playBadge}>
          <Ionicons name="play" size={16} color="#fff" style={{ marginLeft: 2 }} />
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onChange(null)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="close" size={13} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.addTile} onPress={add} disabled={busy} activeOpacity={0.7}>
      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Ionicons name="videocam-outline" size={22} color={colors.primary} />
          <Text style={styles.addText}>{t('newPost.addVideo')}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function makeStyles(c: ColorPalette) {
  const SIZE = 76;
  return StyleSheet.create({
    previewWrap: { width: SIZE * 1.4, height: SIZE },
    preview: { width: SIZE * 1.4, height: SIZE, borderRadius: 12, backgroundColor: c.background },
    previewEmpty: { alignItems: 'center', justifyContent: 'center' },
    playBadge: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 30,
      height: 30,
      marginTop: -15,
      marginLeft: -15,
      borderRadius: 15,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeBtn: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: c.surface,
    },
    addTile: {
      height: 76,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.primary,
      borderStyle: 'dashed',
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    addText: { fontSize: Typography.fontSizeSM, color: c.primary, fontWeight: Typography.fontWeightSemiBold },
  });
}
