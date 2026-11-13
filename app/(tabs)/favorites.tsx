import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { ProductCard } from '../../src/components/ProductCard';
import { useFavorites } from '../../src/store/favorites';
import { useProducts } from '../../src/store/products';
import { fonts, useColors, useStyles, type Palette } from '../../src/theme';
import { useT } from '../../src/i18n';

export default function Favorites() {
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const insets = useSafeAreaInsets();
  const ids = useFavorites((s) => s.ids);
  const products = useProducts((s) => s.products);
  const list = products.filter((p) => ids.includes(p.id));
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 8 }}>
      <Text style={s.title} accessibilityRole="header">
        {t("Mes favoris")}
      </Text>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        renderItem={({ item, index }) => (
          <View style={{ flex: 1 }}>
            <ProductCard product={item} index={index} />
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="heart-outline" size={48} color={colors.primary} />
            <Text style={s.emptyT}>{t("Aucun favori pour l'instant")}</Text>
            <Text style={s.emptyS}>{t("Touchez le cœur sur un article pour le retrouver ici.")}</Text>
            <Button label={t("Découvrir la boutique")} onPress={() => router.push('/shop')} />
          </View>
        }
      />
    </View>
  );
}

const styles = (colors: Palette) => StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.heading, paddingHorizontal: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 60 },
  emptyT: { fontFamily: fonts.serif, fontSize: 26, color: colors.heading },
  emptyS: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 8 },
});
