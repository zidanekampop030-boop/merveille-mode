import type { ImageSourcePropType } from 'react-native';
import { LOCAL_IMAGES } from '../data/images';
import { mediaUrl } from './api';

export function resolveImage(ref?: string | null): ImageSourcePropType | undefined {
  if (!ref) return undefined;
  if (ref.startsWith('local:')) return LOCAL_IMAGES[ref.slice(6)];
  return { uri: mediaUrl(ref) };
}
