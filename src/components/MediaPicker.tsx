import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../hooks/useTheme';
import { ColorPalette } from '../theme/colors';
import { Typography } from '../theme/typography';
import { optimizeImage } from '../utils/imageOptimize';
import { processVideoAsset, videoPickerOptions, VideoPickError, MAX_VIDEO_DURATION_S } from '../utils/pickVideo';

export interface AttachedVideo {
  uri: string;
  poster: string;
}

interface Props {
  images: string[];
  onChangeImages: (uris: string[]) => void;
  video: AttachedVideo | null;
  onChangeVideo: (v: AttachedVideo | null) => void;
  maxPhotos: number;
}

// One control for all media: photos AND a single video share a single "+" tile.
// The OS picker shows both; images are cropped and compressed, a video gets a
// poster still. Thumbnails (photos + the video) sit in one horizontal strip.
export default function MediaPicker({ images, onChangeImages, video, onChangeVideo, maxPhotos }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [busy, setBusy] = useState(false);

  const canAdd = images.length < maxPhotos || !video;

  async function add() {
    if (busy || !canAdd) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    // One item at a time so the built-in crop/trim step is available (native
    // editing is incompatible with multi-select).
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.7,
      ...videoPickerOptions,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    setBusy(true);
    try {
      if (asset.type === 'video') {
        const v = await processVideoAsset(asset);
        onChangeVideo({ uri: v.uri, poster: v.poster });
      } else {
        if (images.length >= maxPhotos) {
          Alert.alert(t('newPost.maxPhotos', { count: maxPhotos }));
          return;
        }
        const optimized = await optimizeImage(asset.uri, asset.width, asset.height);
        onChangeImages([...images, optimized].slice(0, maxPhotos));
      }
    } catch (e) {
      if (e instanceof VideoPickError) Alert.alert(t(e.key, { count: MAX_VIDEO_DURATION_S }));
      else Alert.alert(t('errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  function removeImageAt(index: number) {
    onChangeImages(images.filter((_, i) => i !== index));
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {images.map((uri, i) => (
        <View key={`${uri}-${i}`} style={styles.thumbWrap}>
          <Image source={{ uri }} style={styles.thumb} />
          <TouchableOpacity style={styles.removeBtn} onPress={() => removeImageAt(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close" size={13} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}

      {video ? (
        <View style={styles.thumbWrap}>
          {video.poster ? (
            <Image source={{ uri: video.poster }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.videoFallback]}>
              <Ionicons name="videocam" size={22} color={colors.primary} />
            </View>
          )}
          <View style={styles.playBadge}>
            <Ionicons name="play" size={14} color="#fff" style={{ marginLeft: 2 }} />
          </View>
          <TouchableOpacity style={styles.removeBtn} onPress={() => onChangeVideo(null)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close" size={13} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}

      {canAdd && (
        <TouchableOpacity style={styles.addTile} onPress={add} disabled={busy} activeOpacity={0.7}>
          {busy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="images-outline" size={22} color={colors.primary} />
              <Text style={styles.addText}>{t('newPost.addMedia')}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function makeStyles(c: ColorPalette) {
  const SIZE = 76;
  return StyleSheet.create({
    row: { gap: 10, paddingVertical: 2, alignItems: 'center' },
    thumbWrap: { width: SIZE, height: SIZE },
    thumb: { width: SIZE, height: SIZE, borderRadius: 12, backgroundColor: c.background },
    videoFallback: { alignItems: 'center', justifyContent: 'center' },
    playBadge: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 26,
      height: 26,
      marginTop: -13,
      marginLeft: -13,
      borderRadius: 13,
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
      width: SIZE,
      height: SIZE,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.primary,
      borderStyle: 'dashed',
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingHorizontal: 4,
    },
    addText: { fontSize: Typography.fontSizeXS, color: c.primary, fontWeight: Typography.fontWeightSemiBold, textAlign: 'center' },
  });
}
