import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { WHATSAPP_NUMBER } from '../../src/config';
import { useT } from '../../src/i18n';
import { effectivePrice, formatFCFA } from '../../src/lib/format';
import { resolveImage } from '../../src/lib/images';
import { PAY_OPTIONS, isValidCmPhone } from '../../src/lib/payment';
import { useAuth } from '../../src/store/auth';
import { useCart } from '../../src/store/cart';
import { useProducts } from '../../src/store/products';
import { useSettings } from '../../src/store/settings';
import { fonts, radius, shadow, useColors, useStyles, type Palette } from '../../src/theme';

export default function Cart() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const { lines, setQty, remove, clear } = useCart();
  const products = useProducts((st) => st.products);
  const user = useAuth((st) => st.user);
  const { payMethod, payPhone, setPayMethod, setPayPhone } = useSettings();
  const [phoneError, setPhoneError] = useState('');

  // Les articles retirés du catalogue ne sont plus affichés
  const rows = lines
    .map((l) => ({ line: l, p: products.find((x) => x.id === l.productId) }))
    .filter((r): r is { line: typeof r.line; p: NonNullable<typeof r.p> } => !!r.p);
  const subtotal = rows.reduce((n, r) => n + effectivePrice(r.p) * r.line.qty, 0);
  const method = PAY_OPTIONS.find((o) => o.key === payMethod) ?? PAY_OPTIONS[0];

  const order = async () => {
    if (method.needsPhone && !isValidCmPhone(payPhone)) {
      setPhoneError(t('Entrez un numéro valide à 9 chiffres (il commence par 6).'));
      return;
    }
    setPhoneError('');
    const body = rows
      .map(
        (r) =>
          `• ${r.line.qty} x ${r.p.name}${r.line.size ? ' ' + t('(taille {size})', { size: r.line.size }) : ''} — ${formatFCFA(effectivePrice(r.p) * r.line.qty)}`,
      )
      .join('\n');
    const payLine = method.needsPhone
      ? t('Paiement : {method} — numéro {phone}', { method: t(method.label), phone: payPhone })
      : t("Paiement : Carte bancaire — merci de m'envoyer un lien de paiement sécurisé.");
    const msg = [
      t('Bonjour Merveille Mode & Élégance, je souhaite commander :'),
      body,
      '',
      t('Total : {total}', { total: formatFCFA(subtotal) }),
      payLine,
      user ? t('Nom : {name}', { name: user.name }) : '',
      '',
      t('Merci de me confirmer la disponibilité et la livraison.'),
    ].join('\n');
    try {
      await Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`);
    } catch {
      Alert.alert(t('WhatsApp indisponible'), t("Impossible d'ouvrir WhatsApp sur cet appareil."));
    }
  };

  const footer = (
    <View style={s.footer}>
      <Text style={s.h}>{t('Mode de paiement')}</Text>
      <View style={s.pays} accessibilityRole="radiogroup" accessibilityLabel={t('Mode de paiement')}>
        {PAY_OPTIONS.map((o) => {
          const on = o.key === payMethod;
          return (
            <Pressable
              key={o.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, checked: on }}
              accessibilityLabel={t(o.label)}
              onPress={() => {
                setPayMethod(o.key);
                setPhoneError('');
              }}
              style={[s.pay, on && s.payOn]}
            >
              <View style={[s.dot, { backgroundColor: o.dot }]} />
              <MaterialCommunityIcons name={o.icon} size={20} color={on ? colors.onPrimary : colors.primary} />
              <Text style={[s.payTxt, on && { color: colors.onPrimary }]} numberOfLines={2}>
                {t(o.label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {method.needsPhone && (
        <Field
          label={t('Numéro {op}', { op: t(method.label) })}
          value={payPhone}
          onChangeText={(v) => {
            setPayPhone(v);
            setPhoneError('');
          }}
          keyboardType="number-pad"
          maxLength={9}
          placeholder="6XXXXXXXX"
          error={phoneError}
        />
      )}
      <Text style={s.note}>
        {t("Le paiement se finalise avec la boutique après l'envoi de votre commande. Ne partagez jamais votre code PIN ni les informations de votre carte dans une discussion.")}
      </Text>
      <View style={s.totalRow}>
        <Text style={s.totalL}>{t('Sous-total')}</Text>
        <Text style={s.totalV}>{formatFCFA(subtotal)}</Text>
      </View>
      <Button label={t('Commander sur WhatsApp')} onPress={order} icon={<Ionicons name="logo-whatsapp" size={20} color={colors.onPrimary} />} />
      <Button
        label={t('Vider le panier')}
        variant="ghost"
        onPress={() => Alert.alert(t('Vider le panier ?'), '', [{ text: t('Annuler'), style: 'cancel' }, { text: t('Vider'), style: 'destructive', onPress: clear }])}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 8 }}>
      <Text style={s.title} accessibilityRole="header">
        {t('Mon panier')}
      </Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => `${r.line.productId}|${r.line.size ?? ''}`}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: { line, p } }) => (
          <View style={s.row}>
            <Image source={resolveImage(p.images[0])} style={s.img} contentFit="cover" accessibilityLabel={p.name} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.name} numberOfLines={2}>
                {p.name}
              </Text>
              {line.size && <Text style={s.meta}>{t('Taille : {size}', { size: line.size })}</Text>}
              <Text style={s.price}>{formatFCFA(effectivePrice(p))}</Text>
              <View style={s.qtyRow}>
                <Pressable accessibilityRole="button" accessibilityLabel={t('Diminuer la quantité')} onPress={() => setQty(line.productId, line.size, line.qty - 1, p.stock)} style={s.qBtn}>
                  <Ionicons name="remove" size={18} color={colors.primary} />
                </Pressable>
                <Text style={s.qty} accessibilityLabel={t('Quantité {n}', { n: line.qty })}>
                  {line.qty}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('Augmenter la quantité')}
                  disabled={line.qty >= p.stock}
                  onPress={() => setQty(line.productId, line.size, line.qty + 1, p.stock)}
                  style={[s.qBtn, line.qty >= p.stock && { opacity: 0.4 }]}
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable accessibilityRole="button" accessibilityLabel={t('Supprimer {name} du panier', { name: p.name })} hitSlop={10} onPress={() => remove(line.productId, line.size)}>
                  <Ionicons name="trash-outline" size={22} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="bag-outline" size={48} color={colors.primary} />
            <Text style={s.emptyT}>{t('Votre panier est vide')}</Text>
            <Button label={t('Découvrir la boutique')} onPress={() => router.push('/shop')} />
          </View>
        }
        ListFooterComponent={rows.length > 0 ? footer : null}
      />
    </View>
  );
}

const styles = (colors: Palette) =>
  StyleSheet.create({
    title: { fontFamily: fonts.serif, fontSize: 34, color: colors.heading, paddingHorizontal: 16 },
    row: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 10, ...shadow },
    img: { width: 92, height: 110, borderRadius: radius.md, backgroundColor: colors.primarySoft },
    name: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.text },
    meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
    price: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.primary },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    qBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    qty: { fontFamily: fonts.sansBold, fontSize: 15, minWidth: 22, textAlign: 'center', color: colors.text },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
    emptyT: { fontFamily: fonts.serif, fontSize: 26, color: colors.heading },
    footer: { marginTop: 8, padding: 16, gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow },
    h: { fontFamily: fonts.serif, fontSize: 24, color: colors.heading },
    pays: { flexDirection: 'row', gap: 8 },
    pay: { flex: 1, minHeight: 72, padding: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 4 },
    payOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    payTxt: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.text, textAlign: 'center' },
    dot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
    note: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.muted },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    totalL: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.muted },
    totalV: { fontFamily: fonts.serif, fontSize: 28, color: colors.heading },
  });
