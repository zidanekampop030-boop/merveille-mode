import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { WHATSAPP_NUMBER, categoryLabel } from '../../src/config';
import { discountPercent, effectivePrice, formatFCFA } from '../../src/lib/format';
import { resolveImage } from '../../src/lib/images';
import { useAuth } from '../../src/store/auth';
import { useCart } from '../../src/store/cart';
import { useFavorites } from '../../src/store/favorites';
import { useProducts } from '../../src/store/products';
import { fonts, radius, useColors, useStyles, type Palette } from '../../src/theme';
import { useT } from '../../src/i18n';

export default function ProductScreen() {
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const user = useAuth((s) => s.user);
  const product = useProducts((s) => s.products.find((p) => p.id === id));
  const add = useCart((s) => s.add);
  const fav = useFavorites((s) => s.ids.includes(id));
  const toggleFav = useFavorites((s) => s.toggle);
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [done, setDone] = useState(false);
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!product) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title={t("Article")} />
        <View style={s.missing}>
          <Ionicons name="lock-closed-outline" size={44} color={colors.primary} />
          <Text style={s.mTitle}>{t("Article introuvable ou réservé aux membres")}</Text>
          {!user && <Button label={t("Se connecter")} onPress={() => router.push('/login')} />}
        </View>
      </View>
    );
  }

  const pct = discountPercent(product.price, product.promoPrice);
  const soldOut = product.stock <= 0;

  const addToCart = () => {
    if (product.sizes.length && !size) return setSizeError(true);
    setSizeError(false);
    if (!add(product.id, size, product.stock)) return;
    setDone(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1800);
  };

  const ask = () =>
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('Bonjour, je voudrais des informations sur : {name}', { name: product.name }))}`).catch(() => undefined);

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        title={t(categoryLabel(product.category))}
        right={
          <Pressable accessibilityRole="button" accessibilityLabel={fav ? t("Retirer des favoris") : t("Ajouter aux favoris")} hitSlop={8} onPress={() => toggleFav(product.id)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={24} color={fav ? colors.promo : colors.primary} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <FlatList
          data={product.images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(x, i) => `${x}-${i}`}
          onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Image source={resolveImage(item)} style={{ width, height: width * 1.1, backgroundColor: colors.primarySoft }} contentFit="cover" accessibilityLabel={product.name} />
          )}
        />
        {product.images.length > 1 && (
          <View style={s.dots}>
            {product.images.map((x, i) => (
              <View key={`${x}-${i}`} style={[s.dot, i === idx && s.dotOn]} />
            ))}
          </View>
        )}
        <View style={s.body}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {product.isNew && <Badge label={t("Nouveau")} tone="new" />}
            {pct > 0 && <Badge label={`-${pct}%`} tone="promo" />}
          </View>
          <Text style={s.name} accessibilityRole="header">
            {product.name}
          </Text>
          <View style={s.priceRow}>
            <Text style={s.price}>{formatFCFA(effectivePrice(product))}</Text>
            {pct > 0 && <Text style={s.old}>{formatFCFA(product.price)}</Text>}
          </View>
          <Text style={s.desc}>{product.description}</Text>

          {product.sizes.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={s.label}>{t("Taille")}</Text>
              <View style={s.sizes}>
                {product.sizes.map((z) => (
                  <Pressable key={z} accessibilityRole="button" accessibilityState={{ selected: size === z }} accessibilityLabel={t('Taille {z}', { z })} onPress={() => { setSize(z); setSizeError(false); }} style={[s.size, size === z && s.sizeOn]}>
                    <Text style={[s.sizeTxt, size === z && { color: colors.onPrimary }]}>{z}</Text>
                  </Pressable>
                ))}
              </View>
              {sizeError && (
                <Text style={s.err} accessibilityRole="alert">
                  {t("Choisissez une taille.")}
                </Text>
              )}
            </View>
          )}

          <Text style={s.stock}>{soldOut ? t("Article épuisé") : product.stock <= 3 ? t('Plus que {n} en stock', { n: product.stock }) : t("En stock")}</Text>
          <Button label={t("Une question ? Écrire sur WhatsApp")} variant="ghost" onPress={ask} icon={<Ionicons name="logo-whatsapp" size={18} color={colors.primary} />} />
        </View>
      </ScrollView>
      <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={soldOut ? t("Épuisé") : done ? t("Ajouté au panier") : t("Ajouter au panier")}
          disabled={soldOut}
          onPress={addToCart}
          icon={<Ionicons name={done ? 'checkmark-circle' : 'bag-add-outline'} size={20} color={colors.onPrimary} />}
          style={{ flex: 1, backgroundColor: done ? colors.success : colors.primary, borderColor: done ? colors.success : colors.primary }}
        />
        {done && <Button label={t("Voir le panier")} variant="outline" onPress={() => router.push('/cart')} />}
      </View>
    </View>
  );
}

const styles = (colors: Palette) => StyleSheet.create({
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  mTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.heading, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotOn: { width: 22, backgroundColor: colors.primary },
  body: { padding: 20, gap: 12 },
  name: { fontFamily: fonts.serif, fontSize: 32, color: colors.heading },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  price: { fontFamily: fonts.sansBold, fontSize: 22, color: colors.primary },
  old: { fontFamily: fonts.sans, fontSize: 15, color: colors.muted, textDecorationLine: 'line-through' },
  desc: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: colors.text },
  label: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.text },
  sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  size: { minWidth: 48, minHeight: 44, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  sizeOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeTxt: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.text },
  err: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.danger },
  stock: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.success },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
