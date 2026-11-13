import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadError } from '../../src/components/LoadError';
import { MemberGate } from '../../src/components/MemberGate';
import { ProductCard } from '../../src/components/ProductCard';
import { CATEGORIES } from '../../src/config';
import { effectivePrice } from '../../src/lib/format';
import { useAuth } from '../../src/store/auth';
import { useProducts } from '../../src/store/products';
import { fonts, radius, useColors, useStyles, type Palette } from '../../src/theme';
import { useT } from '../../src/i18n';

type Sort = 'recent' | 'asc' | 'desc';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'recent', label: 'Récents' },
  { key: 'asc', label: 'Prix croissant' },
  { key: 'desc', label: 'Prix décroissant' },
];

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Shop() {
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ cat?: string }>();
  const user = useAuth((s) => s.user);
  const { products, loading, error, fetch } = useProducts();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('recent');
  const [onlyPromo, setOnlyPromo] = useState(false);

  useEffect(() => {
    setCat(params.cat ?? null);
  }, [params.cat]);

  const data = useMemo(() => {
    let list = products.filter((p) => (cat ? p.category === cat : true));
    if (q.trim()) list = list.filter((p) => norm(p.name + ' ' + p.description).includes(norm(q.trim())));
    if (onlyPromo) list = list.filter((p) => effectivePrice(p) < p.price);
    return [...list].sort((a, b) =>
      sort === 'asc' ? effectivePrice(a) - effectivePrice(b) : sort === 'desc' ? effectivePrice(b) - effectivePrice(a) : b.createdAt.localeCompare(a.createdAt),
    );
  }, [products, q, cat, sort, onlyPromo]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 8 }}>
      <Text style={s.title} accessibilityRole="header">
        {t("Boutique")}
      </Text>
      <View style={s.search}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          accessibilityLabel={t("Rechercher un produit")}
          placeholder={t("Rechercher un produit…")}
          placeholderTextColor={colors.placeholder}
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
          style={s.input}
        />
        {!!q && (
          <Pressable accessibilityRole="button" accessibilityLabel={t("Effacer la recherche")} hitSlop={10} onPress={() => setQ('')}>
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        <Chip label={t("Tout")} on={!cat} onPress={() => setCat(null)} />
        {CATEGORIES.map((c) => (
          <Chip key={c.key} label={t(c.label)} on={cat === c.key} onPress={() => setCat(cat === c.key ? null : c.key)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.chips, { paddingTop: 0 }]}>
        {SORTS.map((x) => (
          <Chip key={x.key} label={t(x.label)} on={sort === x.key} onPress={() => setSort(x.key)} subtle />
        ))}
        <Chip label={t("Promotions")} on={onlyPromo} onPress={() => setOnlyPromo(!onlyPromo)} subtle />
      </ScrollView>

      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        numColumns={2}
        refreshing={loading}
        onRefresh={() => fetch(user)}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
        renderItem={({ item, index }) => (
          <View style={{ flex: 1 }}>
            <ProductCard product={item} index={index} />
          </View>
        )}
        ListHeaderComponent={
          !user ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t("Se connecter à l'application")} onPress={() => router.push('/login')} style={s.guestBar}>
              <Ionicons name="lock-closed" size={18} color={colors.gold} />
              <Text style={s.guestTxt}>{t('Aperçu des articles. Connectez-vous pour voir tout le catalogue.')}</Text>
              <Text style={s.guestCta}>{t("Se connecter à l'application")}</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          error ? <LoadError message={error} onRetry={() => fetch(user)} /> : <Text style={s.empty}>{loading ? t("Chargement…") : t("Aucun article ne correspond à votre recherche.")}</Text>
        }
        ListFooterComponent={!user ? <View style={{ marginTop: 12 }}><MemberGate /></View> : null}
        initialNumToRender={8}
        windowSize={7}
      />
    </View>
  );
}

function Chip({ label, on, onPress, subtle }: { label: string; on: boolean; onPress: () => void; subtle?: boolean }) {
  const colors = useColors();
  const s = useStyles(styles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[s.chip, on && (subtle ? s.chipSubtleOn : s.chipOn)]}
    >
      <Text style={[s.chipTxt, on && { color: subtle ? colors.primary : colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = (colors: Palette) => StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.heading, paddingHorizontal: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, paddingHorizontal: 14, minHeight: 48, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.text, minHeight: 44 },
  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipSubtleOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipTxt: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.text },
  guestBar: { backgroundColor: colors.banner, borderRadius: radius.lg, padding: 14, gap: 6, marginBottom: 4 },
  guestTxt: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: '#EFE6D6' },
  guestCta: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.gold },
  empty: { textAlign: 'center', fontFamily: fonts.sans, color: colors.muted, marginTop: 40 },
});
