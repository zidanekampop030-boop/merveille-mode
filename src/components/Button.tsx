import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Palette, fonts, radius, useColors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'gold' | 'onDark';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const variants = (c: Palette) => ({
  primary: { bg: c.primary, fg: c.onPrimary, border: c.primary },
  gold: { bg: c.gold, fg: c.onGold, border: c.gold },
  outline: { bg: 'transparent', fg: c.primary, border: c.primary },
  ghost: { bg: 'transparent', fg: c.primary, border: 'transparent' },
  danger: { bg: 'transparent', fg: c.danger, border: c.danger },
  onDark: { bg: 'transparent', fg: '#FFFFFF', border: '#FFFFFF' },
});

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, style }: Props) {
  const colors = useColors();
  const v = variants(colors)[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: v.bg, borderColor: v.border, opacity: off ? 0.55 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : icon}
      <Text style={[s.label, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: { fontFamily: fonts.sansSemi, fontSize: 15 },
});
