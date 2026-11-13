import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useColors, useStyles, type Palette } from '../theme';

export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const colors = useColors();
  const s = useStyles(styles);
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={10}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={s.back}
      >
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </Pressable>
      <Text style={s.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={s.right}>{right}</View>
    </View>
  );
}

const styles = (colors: Palette) => StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: fonts.serif, fontSize: 24, color: colors.heading },
  right: { minWidth: 44, alignItems: 'flex-end' },
});
