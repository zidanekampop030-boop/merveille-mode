import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { Logo } from '../../src/components/Logo';
import { useT } from '../../src/i18n';
import { isApiConfigured } from '../../src/lib/api';
import { useGoogleSignIn } from '../../src/lib/google';
import { useAuth } from '../../src/store/auth';
import { fonts, radius, useColors, useStyles, type Palette } from '../../src/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const signIn = useAuth((st) => st.signIn);
  const google = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) e.email = t('Entrez une adresse e-mail valide.');
    if (password.length < 6) e.password = t('Le mot de passe doit contenir au moins 6 caractères.');
    setErrors(e);
    setFormError('');
    if (Object.keys(e).length) return;
    setBusy(true);
    const r = await signIn(email, password);
    setBusy(false);
    if (!r.ok) setFormError(t(r.error ?? 'Connexion impossible.'));
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const shownError = formError || (google.error ? t(google.error) : '');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[s.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Logo size={40} />
        <Text style={s.title}>{t('Bienvenue')}</Text>
        <Text style={s.sub}>{t('Connectez-vous pour accéder à tout le catalogue, aux nouveautés et à vos favoris.')}</Text>

        {!isApiConfigured && (
          <View style={s.warn} accessibilityRole="alert">
            <Ionicons name="construct-outline" size={18} color={colors.goldText} />
            <Text style={s.warnTxt}>{t("Le serveur n'est pas encore configuré : renseignez EXPO_PUBLIC_API_URL (voir le README).")}</Text>
          </View>
        )}

        <Button
          label={t('Continuer avec Google')}
          variant="outline"
          loading={google.busy}
          disabled={busy}
          onPress={google.start}
          icon={<Ionicons name="logo-google" size={18} color={colors.primary} />}
        />

        <View style={s.sep}>
          <View style={s.line} />
          <Text style={s.or}>{t('ou par e-mail')}</Text>
          <View style={s.line} />
        </View>

        <Field
          label={t('Adresse e-mail')}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Field
          label={t('Mot de passe')}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={submit}
        />
        {!!shownError && (
          <Text style={s.formError} accessibilityRole="alert">
            {shownError}
          </Text>
        )}
        <Button label={t('Se connecter')} loading={busy} disabled={google.busy} onPress={submit} />

        <View style={s.rowCenter}>
          <Text style={s.small}>{t('Pas encore de compte ? ')}</Text>
          <Link href="/register" style={s.link} accessibilityRole="link">
            {t("S'inscrire")}
          </Link>
        </View>

        <Button label={t('Continuer en visiteur')} variant="ghost" onPress={back} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: Palette) =>
  StyleSheet.create({
    container: { paddingHorizontal: 24, gap: 14 },
    title: { fontFamily: fonts.serif, fontSize: 38, color: colors.heading, marginTop: 20 },
    sub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.muted, marginBottom: 6 },
    sep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
    line: { flex: 1, height: 1, backgroundColor: colors.border },
    or: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted },
    formError: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.danger },
    rowCenter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
    small: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted },
    link: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary },
    warn: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.warnBg, alignItems: 'center' },
    warnTxt: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.goldText },
  });
