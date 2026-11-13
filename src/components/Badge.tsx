import { StyleSheet, Text, View } from 'react-native';
import { fonts, useColors } from '../theme';

export function Badge({ label, tone }: { label: string; tone: 'new' | 'promo' | 'dark' }) {
  const colors = useColors();
  const bg = tone === 'new' ? colors.primary : tone === 'promo' ? colors.promo : colors.banner;
  const fg = tone === 'new' ? colors.onPrimary : tone === 'promo' ? colors.onPromo : colors.white;
  return (
    <View style={[s.b, { backgroundColor: bg }]}>
      <Text style={[s.t, { color: fg }]}>{label}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  b: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  t: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.4 },
});
