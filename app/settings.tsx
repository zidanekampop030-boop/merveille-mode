import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, useAvatarUri } from '../src/components/Avatar';
import { Button } from '../src/components/Button';
import { Field } from '../src/components/Field';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Segmented } from '../src/components/Segmented';
import { useT } from '../src/i18n';
import { PAY_OPTIONS } from '../src/lib/payment';
import { useAuth } from '../src/store/auth';
import { useSettings } from '../src/store/settings';
import { fonts, radius, shadow, useColors, useStyles, type Palette } from '../src/theme';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const { user, updateAvatar } = useAuth();
  const avatarUri = useAvatarUri();
  const { lang, themePref, payMethod, payPhone, setLang, setThemePref, setPayMethod, setPayPhone } = useSettings();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const needsPhone = PAY_OPTIONS.find((o) => o.key === payMethod)?.needsPhone;

  const pickAvatar = async () => {
    setErr('');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('Autorisation requise'), t("Autorisez l'accès aux photos dans les réglages pour choisir une photo."));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    setBusy(true);
    const r = await updateAvatar({ uri: a.uri, mimeType: a.mimeType });
    setBusy(false);
    if (!r.ok) setErr(t(r.error ?? 'Photo impossible à enregistrer.'));
  };

  const removeAvatar = async () => {
    setErr('');
    setBusy(true);
    const r = await updateAvatar(null);
    setBusy(false);
    if (!r.ok) setErr(t(r.error ?? 'Photo impossible à enregistrer.'));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title={t('Paramètres')} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 + insets.bottom }}>
        {/* Photo de profil */}
        <View style={s.card}>
          <Text style={s.h} accessibilityRole="header">{t('Photo de profil')}</Text>
          {user ? (
            <View style={s.avatarRow}>
              <Avatar size={84} />
              <View style={{ flex: 1, gap: 8 }}>
                <Button
                  label={avatarUri ? t('Changer la photo') : t('Choisir une photo')}
                  variant="outline"
                  loading={busy}
                  onPress={pickAvatar}
                  icon={<Ionicons name="camera-outline" size={18} color={colors.primary} />}
                />
                {avatarUri && <Button label={t('Supprimer la photo')} variant="danger" disabled={busy} onPress={removeAvatar} />}
              </View>
            </View>
          ) : (
            <>
              <Text style={s.hint}>{t('Connectez-vous pour ajouter une photo de profil.')}</Text>
              <Button label={t('Se connecter')} onPress={() => router.push('/login')} />
            </>
          )}
          {!!err && <Text style={s.err} accessibilityRole="alert">{err}</Text>}
        </View>

        {/* Langue */}
        <View style={s.card}>
          <Text style={s.h} accessibilityRole="header">{t('Langue')}</Text>
          <Segmented
            groupLabel={t('Langue')}
            value={lang}
            onChange={setLang}
            options={[
              { key: 'fr', label: 'Français', icon: 'translate' },
              { key: 'en', label: 'English', icon: 'translate' },
            ]}
          />
        </View>

        {/* Apparence */}
        <View style={s.card}>
          <Text style={s.h} accessibilityRole="header">{t('Apparence')}</Text>
          <Segmented
            groupLabel={t('Apparence')}
            value={themePref}
            onChange={setThemePref}
            options={[
              { key: 'system', label: t('Système'), icon: 'cellphone' },
              { key: 'light', label: t('Clair'), icon: 'white-balance-sunny' },
              { key: 'dark', label: t('Sombre'), icon: 'weather-night' },
            ]}
          />
        </View>

        {/* Paiement préféré */}
        <View style={s.card}>
          <Text style={s.h} accessibilityRole="header">{t('Paiement préféré')}</Text>
          <Segmented
            groupLabel={t('Mode de paiement')}
            value={payMethod}
            onChange={setPayMethod}
            options={PAY_OPTIONS.map((o) => ({ key: o.key, label: t(o.label), icon: o.icon }))}
          />
          {needsPhone ? (
            <Field
              label={t('Numéro Mobile Money par défaut')}
              value={payPhone}
              onChangeText={setPayPhone}
              keyboardType="number-pad"
              maxLength={9}
              placeholder="6XXXXXXXX"
              hint={t('Enregistré automatiquement')}
            />
          ) : (
            <Text style={s.hint}>{t("Aucune carte n'est enregistrée dans l'application.")}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (colors: Palette) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12, ...shadow },
    h: { fontFamily: fonts.serif, fontSize: 24, color: colors.heading },
    hint: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    err: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.danger },
  });
