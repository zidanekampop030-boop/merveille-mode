import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { categoryLabel } from '../../src/config';
import { discountPercent, formatFCFA } from '../../src/lib/format';
import { resolveImage } from '../../src/lib/images';
import { useAuth } from '../../src/store/auth';
import { useProducts } from '../../src/store/products';
import { fonts, radius, shadow, useColors, useStyles, type Palette } from '../../src/theme';
import type { Product } from '../../src/types';
import { useT } from '../../src/i18n';

const digits = (t: string) => t.replace(/\D/g, '');
const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function AdminDashboard() {
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const { products, update, fetch, loading } = useProducts();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [price, setPrice] = useState('');
  const [promo, setPromo] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const list = useMemo(
    () => products.filter((p) => !q.trim() || norm(p.name).includes(norm(q.trim()))),
    [products, q],
  );

  if (user?.role !== 'admin') return <Redirect href="/" />;

  const stats = [
    { label: t("Articles"), value: products.length, icon: 'cube-outline' as const },
    { label: t("Nouveautés"), value: products.filter((p) => p.isNew).length, icon: 'sparkles-outline' as const },
    { label: t("En promo"), value: products.filter((p) => discountPercent(p.price, p.promoPrice) > 0).length, icon: 'pricetag-outline' as const },
    { label: t("Masqués"), value: products.filter((p) => !p.published).length, icon: 'eye-off-outline' as const },
  ];

  const openPrice = (p: Product) => {
    setEditing(p);
    setPrice(String(p.price));
    setPromo(p.promoPrice ? String(p.promoPrice) : '');
    setErr('');
  };

  const savePrice = async () => {
    if (!editing) return;
    const pr = Number(digits(price));
    const pm = promo.trim() ? Number(digits(promo)) : null;
    if (!pr || pr <= 0) return setErr(t("Entrez un prix valide."));
    if (pm !== null && pm >= pr) return setErr(t("Le prix promo doit être inférieur au prix normal."));
    setBusy(true);
    try {
      await update(editing.id, { price: pr, promoPrice: pm });
      setEditing(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Enregistrement impossible."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title={t("Tableau de bord")} />
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        refreshing={loading}
        onRefresh={() => fetch(user)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 + insets.bottom }}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 6 }}>
            <View style={s.stats}>
              {stats.map((x) => (
                <View key={x.label} style={s.stat}>
                  <Ionicons name={x.icon} size={20} color={colors.primary} />
                  <Text style={s.statV}>{x.value}</Text>
                  <Text style={s.statL}>{x.label}</Text>
                </View>
              ))}
            </View>
            <View style={s.search}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput accessibilityLabel={t("Rechercher un article")} placeholder={t("Rechercher un article…")} placeholderTextColor={colors.placeholder} value={q} onChangeText={setQ} style={s.input} />
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={s.empty}>{t("Aucun article.")}</Text>}
        renderItem={({ item: p }) => {
          const pct = discountPercent(p.price, p.promoPrice);
          return (
            <View style={[s.row, !p.published && { opacity: 0.6 }]}>
              <Image source={resolveImage(p.images[0])} style={s.img} contentFit="cover" accessibilityLabel={p.name} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.name} numberOfLines={1}>{p.name}</Text>
                <Text style={s.meta}>
                  {t(categoryLabel(p.category))} · {t('stock')} {p.stock}
                  {!p.published ? t(" · masqué") : ''}
                  {p.preview ? t(" · aperçu visiteurs") : ''}
                </Text>
                <Text style={s.price}>
                  {formatFCFA(pct > 0 ? (p.promoPrice as number) : p.price)}
                  {pct > 0 ? `  (-${pct}%)` : ''}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t('Modifier le prix de {name}', { name: p.name })} onPress={() => openPrice(p)} style={s.iconBtn}>
                <Ionicons name="cash-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('Modifier {name}', { name: p.name })}
                onPress={() => router.push({ pathname: '/admin/product', params: { id: p.id } })}
                style={s.iconBtn}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>
          );
        }}
      />

      <View style={[s.fab, { bottom: insets.bottom + 16 }]}>
        <Button label={t("Ajouter un article")} onPress={() => router.push('/admin/product')} icon={<Ionicons name="add-circle-outline" size={22} color={colors.onPrimary} />} />
      </View>

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={s.backdrop}>
          <View style={s.modal}>
            <Text style={s.mTitle}>{t("Fixer le prix")}</Text>
            <Text style={s.meta} numberOfLines={2}>{editing?.name}</Text>
            <Field label={t("Prix (FCFA)")} value={price} onChangeText={(t) => setPrice(digits(t))} keyboardType="number-pad" />
            <Field label={t("Prix promotionnel (FCFA, facultatif)")} value={promo} onChangeText={(t) => setPromo(digits(t))} keyboardType="number-pad" hint={t("Laissez vide pour retirer la promotion.")} />
            {!!err && <Text style={s.err} accessibilityRole="alert">{err}</Text>}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label={t("Annuler")} variant="outline" onPress={() => setEditing(null)} style={{ flex: 1 }} />
              <Button label={t("Enregistrer")} loading={busy} onPress={savePrice} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = (colors: Palette) => StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 10, alignItems: 'center', gap: 2, ...shadow },
  statV: { fontFamily: fonts.serif, fontSize: 26, color: colors.heading },
  statL: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.muted },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 46, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 15, minHeight: 44, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius.md, padding: 8, ...shadow },
  img: { width: 56, height: 68, borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  name: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.text },
  meta: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  price: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primary },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', left: 16, right: 16 },
  empty: { textAlign: 'center', fontFamily: fonts.sans, color: colors.muted, marginTop: 30 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: colors.bg, borderRadius: radius.lg, padding: 20, gap: 12 },
  mTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.heading },
  err: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.danger },
});
