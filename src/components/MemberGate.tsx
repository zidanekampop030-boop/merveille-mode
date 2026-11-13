import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_COVERS } from '../data/images';
import { useT } from '../i18n';
import { resolveImage } from '../lib/images';
import { fonts, radius, useColors, useStyles, type Palette } from '../theme';
import { Button } from './Button';

const TEASERS = ['chaussures', 'sacs'];

/** Pour les visiteurs : aperçu flouté d'autres articles + bouton pour se connecter et tout débloquer. */
export function MemberGate() {
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const login = () => router.push('/login');
  return (
    <View style={{ gap: 12 }}>
      <View style={s.teasers}>
        {TEASERS.map((k) => (
          <Pressable key={k} accessibilityRole="button" accessibilityLabel={t('Réservé aux membres')} onPress={login} style={s.tile}>
            <Image source={resolveImage(`local:${CATEGORY_COVERS[k]}`)} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={25} />
            <View style={s.tileShade} />
            <Ionicons name="lock-closed" size={26} color="#FFFFFF" />
            <Text style={s.tileTxt}>{t('Réservé aux membres')}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.box}>
        <Ionicons name="lock-closed" size={26} color={colors.gold} />
        <Text style={s.title}>{t("Plus d'articles vous attendent")}</Text>
        <Text style={s.text}>{t('Créez un compte gratuit ou connectez-vous avec Google pour découvrir tout le catalogue et les nouveautés.')}</Text>
        <Button label={t("Se connecter à l'application")} variant="gold" onPress={login} style={{ alignSelf: 'stretch', marginTop: 6 }} />
        <Button label={t('Créer un compte')} variant="onDark" onPress={() => router.push('/register')} style={{ alignSelf: 'stretch' }} />
      </View>
    </View>
  );
}

const styles = (colors: Palette) =>
  StyleSheet.create({
    teasers: { flexDirection: 'row', gap: 12 },
    tile: { flex: 1, height: 150, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primarySoft },
    tileShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,17,0.45)' },
    tileTxt: { fontFamily: fonts.sansBold, fontSize: 12, color: '#FFFFFF' },
    box: { backgroundColor: colors.banner, borderRadius: radius.lg, padding: 20, gap: 10, alignItems: 'center' },
    title: { fontFamily: fonts.serif, fontSize: 24, color: '#FFFFFF', textAlign: 'center' },
    text: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: '#EFE6D6', textAlign: 'center' },
  });
