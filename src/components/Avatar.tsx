import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../store/auth';
import { mediaUrl } from '../lib/api';
import { fonts, useColors } from '../theme';

/** Photo de profil de l'utilisateur connecté (serveur ou locale), sinon son initiale. */
export function useAvatarUri(): string | null {
  const user = useAuth((s) => s.user);
  return user?.avatarUrl ? mediaUrl(user.avatarUrl) : null;
}

export function Avatar({ size = 52 }: { size?: number }) {
  const colors = useColors();
  const user = useAuth((s) => s.user);
  const uri = useAvatarUri();
  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();
  return (
    <View
      style={[s.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary }]}
      accessible
      accessibilityLabel={user?.name ?? ''}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={200} />
      ) : (
        <Text style={[s.txt, { color: colors.onPrimary, fontSize: size * 0.5 }]}>{initial}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  txt: { fontFamily: fonts.serif },
});
