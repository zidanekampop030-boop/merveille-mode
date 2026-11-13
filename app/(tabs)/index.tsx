import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Logo } from '../../src/components/Logo';
import { LoadError } from '../../src/components/LoadError';
import { MemberGate } from '../../src/components/MemberGate';
import { ProductCard } from '../../src/components/ProductCard';
import { CATEGORIES } from '../../src/config';
import { CATEGORY_COVERS, HERO_IMAGES } from '../../src/data/images';
import { resolveImage } from '../../src/lib/images';
import { useAuth } from '../../src/store/auth';
import { useProducts } from '../../src/store/products';
import { fonts, radius, useColors, useStyles, type Palette } from '../../src/theme';
import { discountPercent } from '../../src/lib/format';
import { useT } from '../../src/i18n';

const SLIDES = [
  { title: 'Chaussures', text: 'Baskets, mocassins et sandales pour chaque style.', cat: 'chaussures' },
  { title: 'Sacs & Élégance', text: 'Des sacs à main pour sublimer vos tenues.', cat: 'sacs' },
  { title: 'Vêtements', text: 'Habillez-vous avec style, à prix irrésistibles.', cat: 'vetements' },
];

const goShop = (cat?: string) => router.push({ pathname: '/shop', params: cat ? { cat } : {} });

export default function Home() {
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const user = useAuth((s) => s.user);
  const { products, loading, error, fetch } = useProducts();
  const [slide, setSlide] = useState(0);
  const listRef = useRef<FlatList>(null);

  const news = products.filter((p) => p.isNew).slice(0, 6);
  const promos = products.filter((p) => discountPercent(p.price, p.promoPrice) > 0).slice(0, 6);
  const maxPct = Math.max(0, ...products.map((p) => discountPercent(p.price, p.promoPrice)));
  const slideW = width - 32;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetch(user)} tintColor={colors.primary} />}
    >
      <View style={s.header}>
        <Logo />
        <View style={s.headerRight}>
          {!user && (
            <Pressable accessibilityRole="button" accessibilityLabel={t("Se connecter à l'application")} onPress={() => router.push('/login')} style={s.loginPill}>
              <Text style={s.loginPillTxt}>{t("Se connecter")}</Text>
            </Pressable>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel={t("Rechercher un produit")} hitSlop={8} onPress={() => goShop()} style={s.iconBtn}>
            <MaterialCommunityIcons name="magnify" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Héro */}
      <View style={{ paddingHorizontal: 16 }}>
        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(x) => x.cat}
          onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / slideW))}
          snapToInterval={slideW}
          decelerationRate="fast"
          renderItem={({ item, index }) => (
            <Pressable accessibilityRole="button" accessibilityLabel={`${t(item.title)}. ${t(item.text)}`} onPress={() => goShop(item.cat)} style={{ width: slideW }}>
              <Image source={resolveImage(`local:${HERO_IMAGES[index]}`)} style={s.heroImg} contentFit="cover" transition={300} />
              <LinearGradient colors={['rgba(17,17,17,0.05)', 'rgba(17,17,17,0.85)']} style={s.heroShade} />
              <View style={s.heroText}>
                <Text style={s.heroTitle}>{t(item.title)}</Text>
                <Text style={s.heroSub}>{t(item.text)}</Text>
                <View style={s.heroCta}>
                  <Text style={s.heroCtaTxt}>{t("Découvrir la collection")}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={colors.onGold} />
                </View>
              </View>
            </Pressable>
          )}
        />
        <View style={s.dots} accessibilityLabel={t('Diapositive {a} sur {b}', { a: slide + 1, b: SLIDES.length })}>
          {SLIDES.map((x, i) => (
            <View key={x.cat} style={[s.dot, i === slide && s.dotOn]} />
          ))}
        </View>
      </View>

      {/* Catégories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
        {CATEGORIES.map((c) => (
          <Pressable key={c.key} accessibilityRole="button" accessibilityLabel={t('Collection {name}', { name: t(c.label) })} onPress={() => goShop(c.key)} style={s.cat}>
            <Image source={resolveImage(`local:${CATEGORY_COVERS[c.key]}`)} style={s.catImg} contentFit="cover" />
            <LinearGradient colors={['transparent', 'rgba(17,17,17,0.8)']} style={StyleSheet.absoluteFill} />
            <Text style={s.catTxt}>{t(c.label)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {maxPct > 0 && (
        <Pressable accessibilityRole="button" onPress={() => goShop()} style={s.promo}>
          <MaterialCommunityIcons name="tag-heart-outline" size={34} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={s.promoK}>{t("Jusqu'à")}</Text>
            <Text style={s.promoBig}>-{maxPct}%</Text>
            <Text style={s.promoS}>{t("sur une sélection d'articles")}</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right-circle" size={30} color={colors.gold} />
        </Pressable>
      )}

      {!!error && products.length === 0 && <LoadError message={error} onRetry={() => fetch(user)} />}

      <Section title={t("Nouveautés")} onMore={() => goShop()} />
      <Grid items={news} />

      {promos.length > 0 && (
        <>
          <Section title={t("Promotions")} onMore={() => goShop()} />
          <Grid items={promos} />
        </>
      )}

      {!user && (
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <MemberGate />
        </View>
      )}
      {user && products.length === 0 && !loading && (
        <Text style={s.empty}>{t("Aucun article pour le moment.")}</Text>
      )}
      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <Button label={t("Voir toute la boutique")} variant="outline" onPress={() => goShop()} />
      </View>
    </ScrollView>
  );
}

function Section({ title, onMore }: { title: string; onMore: () => void }) {
  const s = useStyles(styles);
  const t = useT();
  return (
    <View style={s.sectionRow}>
      <Text style={s.section} accessibilityRole="header">
        {title}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t('Voir tout : {title}', { title })} hitSlop={10} onPress={onMore}>
        <Text style={s.more}>{t("Voir tout")}</Text>
      </Pressable>
    </View>
  );
}

function Grid({ items }: { items: ReturnType<typeof useProducts.getState>['products'] }) {
  const s = useStyles(styles);
  return (
    <View style={s.grid}>
      {items.map((p, i) => (
        <View key={p.id} style={s.cell}>
          <ProductCard product={p} index={i} />
        </View>
      ))}
    </View>
  );
}

const styles = (colors: Palette) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginPill: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  loginPillTxt: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.onPrimary },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroImg: { width: '100%', height: 360, borderRadius: radius.lg },
  heroShade: { ...StyleSheet.absoluteFillObject, borderRadius: radius.lg },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 22, gap: 6 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 38, color: colors.white },
  heroSub: { fontFamily: fonts.sans, fontSize: 14, color: '#F3EBDC' },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.gold, paddingHorizontal: 16, paddingVertical: 11, borderRadius: radius.pill, marginTop: 8 },
  heroCtaTxt: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.onGold },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { width: 22, backgroundColor: colors.primary },
  cats: { paddingHorizontal: 16, gap: 12, paddingVertical: 18 },
  cat: { width: 112, height: 138, borderRadius: radius.md, overflow: 'hidden', justifyContent: 'flex-end' },
  catImg: { ...StyleSheet.absoluteFillObject },
  catTxt: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.white, padding: 10 },
  promo: { marginHorizontal: 16, padding: 18, borderRadius: radius.lg, backgroundColor: colors.banner, flexDirection: 'row', alignItems: 'center', gap: 14 },
  promoK: { fontFamily: fonts.sansMedium, fontSize: 12, color: '#EFE6D6' },
  promoBig: { fontFamily: fonts.serif, fontSize: 44, color: colors.gold, lineHeight: 48 },
  promoS: { fontFamily: fonts.sans, fontSize: 12, color: '#EFE6D6' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 16, marginTop: 28, marginBottom: 12 },
  section: { fontFamily: fonts.serif, fontSize: 30, color: colors.heading },
  more: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  cell: { width: '50%', padding: 6 },
  empty: { textAlign: 'center', fontFamily: fonts.sans, color: colors.muted, marginTop: 24 },
});
