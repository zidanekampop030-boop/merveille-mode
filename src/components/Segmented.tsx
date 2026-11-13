import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, useColors, useStyles, type Palette } from '../theme';

export interface SegOption<T extends string> {
  key: T;
  label: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

/** Groupe d'options exclusives (langue, thème, paiement…). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  groupLabel,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  groupLabel: string;
}) {
  const colors = useColors();
  const s = useStyles(styles);
  return (
    <View style={s.row} accessibilityRole="radiogroup" accessibilityLabel={groupLabel}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, checked: on }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.key)}
            style={[s.opt, on && s.optOn]}
          >
            {o.icon && <MaterialCommunityIcons name={o.icon} size={20} color={on ? colors.onPrimary : colors.primary} />}
            <Text style={[s.txt, on && { color: colors.onPrimary }]} numberOfLines={2}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 8 },
    opt: {
      flex: 1,
      minHeight: 56,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    optOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    txt: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.text, textAlign: 'center' },
  });
