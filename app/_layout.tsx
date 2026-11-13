import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from '@expo-google-fonts/montserrat';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../src/store/auth';
import { useProducts } from '../src/store/products';
import { useSettings } from '../src/store/settings';
import { useColors, useIsDark } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const { init, ready, user } = useAuth();
  const fetchProducts = useProducts((s) => s.fetch);
  const settingsReady = useSettings((s) => s.hydrated);
  const colors = useColors();
  const isDark = useIsDark();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);

  // Recharge le catalogue à chaque changement de compte (les droits d'accès changent)
  useEffect(() => {
    if (ready) fetchProducts(user);
  }, [ready, user?.id, user?.role, fetchProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  const loaded = fontsLoaded && ready && settingsReady;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded]);

  // Une fois connecté, on quitte les écrans de connexion. Les visiteurs arrivent directement sur l'aperçu du catalogue.
  useEffect(() => {
    if (loaded && user && segments[0] === '(auth)') router.replace('/');
  }, [loaded, user, segments, router]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
