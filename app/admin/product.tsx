import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { CATEGORIES, CategoryKey } from '../../src/config';
import { resolveImage } from '../../src/lib/images';
import { PickedImage, uploadProductImage } from '../../src/lib/storage';
import { useAuth } from '../../src/store/auth';
import { ProductInput, useProducts } from '../../src/store/products';
import { fonts, radius, useColors, useStyles, type Palette } from '../../src/theme';
import { useT } from '../../src/i18n';

const MAX_IMAGES = 4;
const digits = (t: string) => t.replace(/\D/g, '');

interface Img {
  ref?: string; // image déjà enregistrée
  picked?: PickedImage; // nouvelle image à envoyer
}

export default function AdminProduct() {
  const colors = useColors();
  const s = useStyles(styles);
  const t = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuth((s) => s.user);
  const { products, create, update, remove } = useProducts();
  const existing = id ? products.find((p) => p.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState<CategoryKey>(existing?.category ?? 'chaussures');
  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [promo, setPromo] = useState(existing?.promoPrice ? String(existing.promoPrice) : '');
  const [stock, setStock] = useState(existing ? String(existing.stock) : '10');
  const [sizes, setSizes] = useState(existing?.sizes.join(', ') ?? '');
  const [isNew, setIsNew] = useState(existing?.isNew ?? true);
  const [published, setPublished] = useState(existing?.published ?? true);
  const [preview, setPreview] = useState(existing?.preview ?? false);
  const [images, setImages] = useState<Img[]>(existing?.images.map((ref) => ({ ref })) ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user?.role !== 'admin') return <Redirect href="/" />;

  const pick = async () => {
    const left = MAX_IMAGES - images.length;
    if (left <= 0) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Autorisation requise', t("Autorisez l'accès aux photos dans les réglages pour importer des images."));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: left,
      quality: 0.7,
    });
    if (res.canceled) return;
    setImages((cur) => [
      ...cur,
      ...res.assets.slice(0, left).map((a) => ({ picked: { uri: a.uri, mimeType: a.mimeType } })),
    ]);
    setErrors((e) => ({ ...e, images: '' }));
  };

  const makeMain = (i: number) => setImages((cur) => [cur[i], ...cur.filter((_, k) => k !== i)]);
  const dropImage = (i: number) => setImages((cur) => cur.filter((_, k) => k !== i));

  const submit = async () => {
    const e: Record<string, string> = {};
    const pr = Number(digits(price));
    const pm = promo.trim() ? Number(digits(promo)) : null;
    if (name.trim().length < 2) e.name = t("Entrez le nom de l'article.");
    if (!pr) e.price = t("Entrez un prix valide.");
    if (pm !== null && pr && pm >= pr) e.promo = t("Doit être inférieur au prix normal.");
    if (stock === '' || Number.isNaN(Number(stock))) e.stock = t("Entrez le stock (0 si épuisé).");
    if (images.length === 0) e.images = t("Ajoutez au moins une image.");
    setErrors(e);
    setFormError('');
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const urls: string[] = [];
      for (const img of images) urls.push(img.picked ? await uploadProductImage(img.picked) : (img.ref as string));
      const input: ProductInput = {
        name: name.trim(),
        description: description.trim(),
        category,
        price: pr,
        promoPrice: pm,
        images: urls,
        isNew,
        preview,
        published,
        stock: Number(stock),
        sizes: sizes.split(',').map((x) => x.trim()).filter(Boolean),
      };
      if (existing) await update(existing.id, input);
      else await create(input);
      router.back();
    } catch (err) {
      setFormError(err instanceof Error ? t(err.message) : t("Enregistrement impossible."));
    } finally {
      setBusy(false);
    }
  };

  const del = () =>
    Alert.alert('Supprimer cet article ?', t("Cette action est définitive."), [
      { text: t("Annuler"), style: 'cancel' },
      {
        text: t("Supprimer"),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(existing!.id);
            router.back();
          } catch (err) {
            setFormError(err instanceof Error ? t(err.message) : t("Suppression impossible."));
          }
        },
      },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title={existing ? t("Modifier l'article") : t("Nouvel article")} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 + insets.bottom }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 8 }}>
            <Text style={s.label}>{t('Images ({n}/{max})', { n: images.length, max: MAX_IMAGES })}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {images.map((img, i) => (
                <View key={`${img.ref ?? img.picked?.uri}-${i}`} style={s.thumbWrap}>
                  <Image source={img.picked ? { uri: img.picked.uri } : resolveImage(img.ref)} style={s.thumb} contentFit="cover" accessibilityLabel={t('Image {n}', { n: i + 1 })} />
                  {i === 0 && <Text style={s.main}>{t("Principale")}</Text>}
                  <View style={s.thumbActions}>
                    {i > 0 && (
                      <Pressable accessibilityRole="button" accessibilityLabel={t("Définir comme image principale")} onPress={() => makeMain(i)} style={s.mini}>
                        <Ionicons name="star-outline" size={16} color={colors.white} />
                      </Pressable>
                    )}
                    <Pressable accessibilityRole="button" accessibilityLabel={t("Retirer l'image")} onPress={() => dropImage(i)} style={s.mini}>
                      <Ionicons name="close" size={16} color={colors.white} />
                    </Pressable>
                  </View>
                </View>
              ))}
              {images.length < MAX_IMAGES && (
                <Pressable accessibilityRole="button" accessibilityLabel={t("Importer des images")} onPress={pick} style={s.add}>
                  <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
                  <Text style={s.addTxt}>{t("Importer")}</Text>
                </Pressable>
              )}
            </ScrollView>
            {!!errors.images && <Text style={s.err}>{errors.images}</Text>}
          </View>

          <Field label={t("Nom de l'article")} value={name} onChangeText={setName} error={errors.name} />
          <Field label={t("Description")} value={description} onChangeText={setDescription} multiline style={{ minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }} />

          <View style={{ gap: 8 }}>
            <Text style={s.label}>{t("Catégorie")}</Text>
            <View style={s.chips}>
              {CATEGORIES.map((c) => (
                <Pressable key={c.key} accessibilityRole="button" accessibilityState={{ selected: category === c.key }} onPress={() => setCategory(c.key)} style={[s.chip, category === c.key && s.chipOn]}>
                  <Text style={[s.chipTxt, category === c.key && { color: colors.onPrimary }]}>{t(c.label)}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label={t("Prix (FCFA)")} value={price} onChangeText={(t) => setPrice(digits(t))} keyboardType="number-pad" error={errors.price} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t("Prix promo")} value={promo} onChangeText={(t) => setPromo(digits(t))} keyboardType="number-pad" error={errors.promo} hint={t("Facultatif")} />
            </View>
          </View>
          <Field label={t("Stock disponible")} value={stock} onChangeText={(t) => setStock(digits(t))} keyboardType="number-pad" error={errors.stock} />
          <Field label={t("Tailles (séparées par des virgules)")} value={sizes} onChangeText={setSizes} hint={t("Ex. : 40, 41, 42 ou S, M, L. Laisser vide si non applicable.")} autoCapitalize="characters" />

          <Toggle label={t("Nouveauté")} hint={t("Affiché avec le badge « Nouveau »")} value={isNew} onChange={setIsNew} />
          <Toggle label={t("Publié")} hint={t("Visible par les clients connectés")} value={published} onChange={setPublished} />
          <Toggle label={t("Aperçu visiteurs")} hint={t("Visible aussi sans compte")} value={preview} onChange={setPreview} />

          {!!formError && <Text style={s.err} accessibilityRole="alert">{formError}</Text>}
          <Button label={existing ? t("Enregistrer les modifications") : t("Publier l'article")} loading={busy} onPress={submit} />
          {existing && <Button label={t("Supprimer l'article")} variant="danger" disabled={busy} onPress={del} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  const colors = useColors();
  const s = useStyles(styles);
  return (
    <View style={s.toggle}>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.hint}>{hint}</Text>
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.white} />
    </View>
  );
}

const styles = (colors: Palette) => StyleSheet.create({
  label: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.text },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  err: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.danger },
  thumbWrap: { width: 110, height: 140, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.primarySoft },
  thumb: { width: '100%', height: '100%' },
  main: { position: 'absolute', left: 6, top: 6, backgroundColor: colors.primary, color: colors.onPrimary, fontFamily: fonts.sansBold, fontSize: 10, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  thumbActions: { position: 'absolute', right: 4, bottom: 4, flexDirection: 'row', gap: 4 },
  mini: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(17,17,17,0.7)', alignItems: 'center', justifyContent: 'center' },
  add: { width: 110, height: 140, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.surface },
  addTxt: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTxt: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.text },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border },
});
