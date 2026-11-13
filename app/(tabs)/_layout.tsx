import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../src/store/cart';
import { fonts, useColors, type Palette } from '../../src/theme';
import { useT } from '../../src/i18n';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icon = (on: IconName, off: IconName) =>
  function TabIcon({ color, focused, size }: { color: string; focused: boolean; size: number }) {
    return <Ionicons name={focused ? on : off} size={size} color={color} />;
  };

export default function TabsLayout() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.sansSemi, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 58 + insets.bottom,
          paddingBottom: Platform.OS === 'android' ? 6 + insets.bottom : insets.bottom,
          paddingTop: 6,
        },
        tabBarBadgeStyle: { backgroundColor: colors.promo, color: colors.onPromo, fontFamily: fonts.sansBold },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("Accueil"), tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="shop" options={{ title: t("Boutique"), tabBarIcon: icon('grid', 'grid-outline') }} />
      <Tabs.Screen name="favorites" options={{ title: t("Favoris"), tabBarIcon: icon('heart', 'heart-outline') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("Panier"),
          tabBarIcon: icon('bag', 'bag-outline'),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarAccessibilityLabel: t(count > 1 ? 'Panier, {n} articles' : 'Panier, {n} article', { n: count }),
        }}
      />
      <Tabs.Screen name="account" options={{ title: t("Compte"), tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}
