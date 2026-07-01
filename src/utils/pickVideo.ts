import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { optimizeImage } from './imageOptimize';

// Keep clips short — this is the single biggest lever on stored size and load
// time. 60s at the medium export preset lands around 5–15 MB; the hard ceiling
// below rejects anything heavier so storage stays predictable.
export const MAX_VIDEO_DURATION_S = 60;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export interface PickedVideo {
  uri: string;
  poster: string;
  durationMs: number;
}

// Raised with a translation key so the caller can show a localized message.
export class VideoPickError extends Error {
  constructor(public key: string) {
    super(key);
  }
}

export async function pickVideo(): Promise<PickedVideo | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsMultipleSelection: false,
    // Re-encode to a smaller resolution/bitrate at pick time. iOS honours the
    // export preset; both platforms honour `quality`.
    quality: 0.5,
    videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
    videoMaxDuration: MAX_VIDEO_DURATION_S,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const durationMs = asset.duration ?? 0;

  // videoMaxDuration only caps in-app recording, not library picks — enforce it.
  if (durationMs > (MAX_VIDEO_DURATION_S + 1) * 1000) {
    throw new VideoPickError('errors.videoTooLong');
  }
  if ((asset.fileSize ?? 0) > MAX_VIDEO_BYTES) {
    throw new VideoPickError('errors.videoTooLarge');
  }

  // A small still from the first frame — shown in the feed so the video bytes
  // are only fetched when the user actually taps play.
  let poster = '';
  try {
    const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 0, quality: 0.6 });
    poster = await optimizeImage(thumb.uri, thumb.width, thumb.height);
  } catch {
    // Poster generation can fail on some codecs — fall back to no poster.
    poster = '';
  }

  return { uri: asset.uri, poster, durationMs };
}
