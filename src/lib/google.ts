import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';

WebBrowser.maybeCompleteAuthSession();

const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const android = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const PLACEHOLDER = 'not-configured.apps.googleusercontent.com';
export const googleConfigured = Boolean(web || android || ios);

/** Connexion Google : récupère un jeton d'identité Google puis l'échange contre une session auprès de notre API. */
export function useGoogleSignIn() {
  const signInWithGoogleToken = useAuth((s) => s.signInWithGoogleToken);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: web ?? PLACEHOLDER,
    androidClientId: android ?? PLACEHOLDER,
    iosClientId: ios ?? PLACEHOLDER,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      if (!idToken) {
        setBusy(false);
        setError('Réponse Google inattendue.');
        return;
      }
      signInWithGoogleToken(idToken).then((r) => {
        setBusy(false);
        if (!r.ok) setError(r.error ?? 'Connexion Google impossible.');
      });
    } else {
      setBusy(false);
      if (response.type === 'error') setError('Connexion Google impossible.');
    }
  }, [response, signInWithGoogleToken]);

  const start = async () => {
    setError('');
    if (!googleConfigured) {
      setError("Google n'est pas configuré sur cette application.");
      return;
    }
    setBusy(true);
    try {
      await promptAsync();
    } catch {
      setBusy(false);
      setError('Connexion Google impossible.');
    }
  };

  return { start, busy, error };
}
