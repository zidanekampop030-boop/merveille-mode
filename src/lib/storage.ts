import { api, fileForm } from './api';

export interface PickedImage {
  uri: string;
  mimeType?: string | null;
}

/** Envoie une image d'article à l'API (administrateur) et retourne son chemin (/uploads/…). */
export async function uploadProductImage(img: PickedImage): Promise<string> {
  const r = await api<{ url: string }>('/products/images', { method: 'POST', form: fileForm(img.uri, img.mimeType) });
  return r.url;
}
