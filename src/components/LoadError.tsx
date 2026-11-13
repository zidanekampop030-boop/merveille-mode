import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useT } from '../i18n';
import { fonts, radius, useColors, useStyles, type Palette } from '../theme';
import { Button } from './Button';

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  return (
    <View style={s.box} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={28} color={colors.goldText} />
      <Text style={s.txt}>{t(message)}</Text>
      <Button label={t('Réessayer')} variant="outline" onPress={onRetry} />
    </View>
  );
}

const styles = (colors: Palette) =>
  StyleSheet.create({
    box: { margin: 16, padding: 20, borderRadius: radius.lg, backgroundColor: colors.warnBg, alignItems: 'center', gap: 10 },
    txt: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text, textAlign: 'center' },
  });
