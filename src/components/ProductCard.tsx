import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryLabel } from '../config';
import { discountPercent, effectivePrice, formatFCFA } from '../lib/format';
import { resolveImage } from '../lib/images';
import { useCart } from '../store/cart';
import { useFavorites } from '../store/favorites';
import { fonts, radius, shadow, useColors, useStyles, type Palette } from '../theme';
import type { Product } from '../types';
import { Badge } from './Badge';
import { FadeIn } from './FadeIn';
import { useT } from '../i18n';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const fav = useFavorites((s) => s.ids.includes(product.id));
  const toggle = useFavorites((s) => s.toggle);
  const add = useCart((s) => s.add);
  const pct = discountPercent(product.price, product.promoPrice);
  const soldOut = product.stock <= 0;
  const needsSize = product.sizes.length > 0;

  const open = () => router.push({ pathname: '/product/[id]', params: { id: product.id } });
  const quickAdd = () => {
    if (needsSize) return open(); // la taille doit être choisie sur la fiche
    add(product.id, null, product.stock);
  };

  return (
    <FadeIn delay={Math.min(index, 8) * 60}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${formatFCFA(effectivePrice(product))}`}
        onPress={open}
        style={({ pressed }) => [s.card, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      >
        <View style={s.imgWrap}>
          <Image
            source={resolveImage(product.images[0])}
            style={s.img}
            contentFit="cover"
            transition={250}
            accessibilityLabel={product.name}
          />
          <View style={s.badges}>
            {product.isNew && <Badge label={t("Nouveau")} tone="new" />}
            {pct > 0 && <Badge label={`-${pct}%`} tone="promo" />}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fav ? t("Retirer des favoris") : t("Ajouter aux favoris")}
            hitSlop={8}
            onPress={() => toggle(product.id)}
            style={s.heart}
          >
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? colors.promo : colors.heading} />
          </Pressable>
        </View>
        <View style={s.body}>
          <Text style={s.cat}>{t(categoryLabel(product.category))}</Text>
          <Text style={s.name} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={s.priceRow}>
            <Text style={s.price}>{formatFCFA(effectivePrice(product))}</Text>
            {pct > 0 && <Text style={s.old}>{formatFCFA(product.price)}</Text>}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={soldOut ? t("Article épuisé") : needsSize ? t("Choisir une taille") : t("Ajouter au panier")}
            disabled={soldOut}
            onPress={quickAdd}
            style={[s.add, soldOut && { opacity: 0.5 }]}
          >
            <Ionicons name="bag-add-outline" size={16} color={colors.onPrimary} />
            <Text style={s.addTxt}>{soldOut ? t("Épuisé") : needsSize ? t("Choisir la taille") : t("Ajouter")}</Text>
          </Pressable>
        </View>
      </Pressable>
    </FadeIn>
  );
}

const styles = (colors: Palette) => StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow },
  imgWrap: { aspectRatio: 0.9, backgroundColor: colors.primarySoft },
  img: { width: '100%', height: '100%' },
  badges: { position: 'absolute', top: 10, left: 10, gap: 4, alignItems: 'flex-start' },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 12, gap: 4 },
  cat: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.goldText, textTransform: 'uppercase', letterSpacing: 0.8 },
  name: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.text, minHeight: 38 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  price: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.primary },
  old: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textDecorationLine: 'line-through' },
  add: {
    marginTop: 6,
    minHeight: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addTxt: { color: colors.onPrimary, fontFamily: fonts.sansSemi, fontSize: 13 },
});
