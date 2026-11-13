import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { Logo } from '../../src/components/Logo';
import { useT } from '../../src/i18n';
import { useGoogleSignIn } from '../../src/lib/google';
import { useAuth } from '../../src/store/auth';
import { fonts, useColors, useStyles, type Palette } from '../../src/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const signUp = useAuth((st) => st.signUp);
  const google = useGoogleSignIn();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = t('Entrez votre nom.');
    if (!EMAIL_RE.test(email.trim())) e.email = t('Entrez une adresse e-mail valide.');
    if (password.length < 6) e.password = t('Au moins 6 caractères.');
    if (confirm !== password) e.confirm = t('Les mots de passe ne correspondent pas.');
    setErrors(e);
    setFormError('');
    if (Object.keys(e).length) return;
    setBusy(true);
    const r = await signUp(name, email, password);
    setBusy(false);
    if (!r.ok) setFormError(t(r.error ?? 'Inscription impossible.'));
  };

  const shownError = formError || (google.error ? t(google.error) : '');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[s.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Logo size={34} />
        <Text style={s.title}>{t('Créer un compte')}</Text>
        <Text style={s.sub}>{t('Gratuit et rapide. Vous aurez accès à tous les articles.')}</Text>

        <Button
          label={t("S'inscrire avec Google")}
          variant="outline"
          loading={google.busy}
          disabled={busy}
          onPress={google.start}
          icon={<Ionicons name="logo-google" size={18} color={colors.primary} />}
        />
        <Text style={s.or}>{t('ou avec votre e-mail')}</Text>

        <Field label={t('Nom complet')} value={name} onChangeText={setName} error={errors.name} autoComplete="name" textContentType="name" />
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
        <Field label={t('Mot de passe')} value={password} onChangeText={setPassword} error={errors.password} secureTextEntry textContentType="newPassword" />
        <Field label={t('Confirmer le mot de passe')} value={confirm} onChangeText={setConfirm} error={errors.confirm} secureTextEntry textContentType="newPassword" onSubmitEditing={submit} />

        {!!shownError && (
          <Text style={s.error} accessibilityRole="alert">
            {shownError}
          </Text>
        )}

        <Button label={t('Créer mon compte')} loading={busy} disabled={google.busy} onPress={submit} />

        <View style={s.rowCenter}>
          <Text style={s.small}>{t('Déjà un compte ? ')}</Text>
          <Link href="/login" style={s.link} accessibilityRole="link">
            {t('Se connecter')}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: Palette) =>
  StyleSheet.create({
    container: { paddingHorizontal: 24, gap: 14 },
    title: { fontFamily: fonts.serif, fontSize: 36, color: colors.heading, marginTop: 14 },
    sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted },
    or: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted, textAlign: 'center' },
    error: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.danger },
    rowCenter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    small: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted },
    link: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary },
  });
