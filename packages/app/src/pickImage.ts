import { launchImageLibraryAsync } from 'expo-image-picker';
import { Platform } from 'react-native';

export type ImageKind = 'avatar' | 'banner';

/**
 * Native: the system photo library. Returns a local file URI, or undefined if cancelled.
 * iOS's cropper is always square (`aspect` is Android-only), so banners skip cropping
 * there and rely on `resizeMode="cover"` instead.
 */
export async function pickImage(kind: ImageKind): Promise<string | undefined> {
  const crop = kind === 'avatar' || Platform.OS === 'android';
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: crop,
    aspect: kind === 'avatar' ? [1, 1] : [3, 1],
    quality: 0.8,
  });
  return result.canceled ? undefined : result.assets[0]?.uri;
}
