import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { WHATSAPP_NUMBER, BRAND } from '../../src/config';
import { useT } from '../../src/i18n';
import { useAuth } from '../../src/store/auth';
import { fonts, radius, shadow, useColors, useStyles, type Palette } from '../../src/theme';

export default function Account() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const { user, signOut } = useAuth();

  const whatsapp = () =>
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`).catch(() => Alert.alert(t('WhatsApp indisponible'), t("Impossible d'ouvrir WhatsApp.")));

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
      <Text style={s.title} accessibilityRole="header">
        {t('Mon compte')}
      </Text>

      {user ? (
        <View style={s.card}>
          <Avatar size={56} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{user.name || t('Client')}</Text>
            <Text style={s.email}>{user.email}</Text>
            {user.role === 'admin' && <Text style={s.role}>{t('Administrateur')}</Text>}
          </View>
        </View>
      ) : (
        <View style={[s.card, { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
          <Text style={s.name}>{t('Vous êtes en mode visiteur')}</Text>
          <Text style={s.email}>{t('Connectez-vous pour accéder à tous les articles et nouveautés.')}</Text>
          <Button label={t('Se connecter')} onPress={() => router.push('/login')} />
          <Button label={t('Créer un compte')} variant="outline" onPress={() => router.push('/register')} />
        </View>
      )}

      <Button
        label={t('Paramètres')}
        variant="outline"
        onPress={() => router.push('/settings')}
        icon={<Ionicons name="settings-outline" size={20} color={colors.primary} />}
      />

      {user?.role === 'admin' && (
        <Button
          label={t('Tableau de bord administrateur')}
          variant="gold"
          onPress={() => router.push('/admin')}
          icon={<Ionicons name="speedometer-outline" size={20} color={colors.onGold} />}
        />
      )}

      <View style={s.card}>
        <Ionicons name="logo-whatsapp" size={26} color={colors.success} />
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{t('Nous écrire sur WhatsApp')}</Text>
          <Text style={s.email}>+{WHATSAPP_NUMBER}</Text>
        </View>
        <Button label={t('Écrire')} variant="outline" onPress={whatsapp} style={{ minHeight: 40, paddingHorizontal: 16 }} />
      </View>

      {user && <Button label={t('Se déconnecter')} variant="danger" onPress={signOut} />}

      <Text style={s.foot}>{BRAND.fullName} · v1.1</Text>
    </ScrollView>
  );
}

const styles = (colors: Palette) =>
  StyleSheet.create({
    title: { fontFamily: fonts.serif, fontSize: 34, color: colors.heading },
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow },
    name: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.text },
    email: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
    role: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.goldText, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
    foot: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 12 },
  });
