import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { BRAND } from '../config';
import { fonts, useColors, useStyles, type Palette } from '../theme';

export function Logo({ light = false, size = 28 }: { light?: boolean; size?: number }) {
  const colors = useColors();
  const s = useStyles(styles);
  const c = light ? colors.white : colors.primary;
  return (
    <View style={s.row} accessible accessibilityRole="header" accessibilityLabel={BRAND.fullName}>
      <MaterialCommunityIcons name="hanger" size={size + 6} color={light ? colors.gold : colors.primary} />
      <View>
        <Text style={[s.name, { color: c, fontSize: size }]}>{BRAND.name}</Text>
        <Text style={[s.tag, { color: light ? colors.gold : colors.goldText }]}>{BRAND.tagline}</Text>
      </View>
    </View>
  );
}

const styles = (colors: Palette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.serif, lineHeight: 30 },
  tag: { fontFamily: fonts.sansSemi, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' },
});
