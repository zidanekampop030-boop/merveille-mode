import * as SecureStore from 'expo-secure-store';
import { appStorage } from './app-storage';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
export const isApiConfigured = API_URL.length > 0;

const TOKEN_KEY = 'merveille.token';
let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Le jeton de session est gardé dans le stockage sécurisé du téléphone (Keychain / Keystore).
export async function loadToken(): Promise<string | null> {
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    token = await appStorage.getItem(TOKEN_KEY).catch(() => null); // web
  }
  return token;
}

export async function setToken(t: string | null): Promise<void> {
  token = t;
  try {
    if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    if (t) await appStorage.setItem(TOKEN_KEY, t).catch(() => undefined);
    else await appStorage.removeItem(TOKEN_KEY).catch(() => undefined);
  }
}

export const hasToken = () => token !== null;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

/** URL absolue d'une image : "local:pNN" (embarquée) est gérée ailleurs ; "/uploads/…" est servie par l'API. */
export const mediaUrl = (ref: string) => (ref.startsWith('/') ? API_URL + ref : ref);

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  json?: unknown;
  form?: FormData;
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  if (!isApiConfigured) throw new ApiError(0, "Le serveur n'est pas configuré (voir README).");
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.json);
  } else if (opts.form) {
    body = opts.form; // le Content-Type multipart (avec sa frontière) est ajouté automatiquement
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(API_URL + path, { method: opts.method ?? 'GET', headers, body, signal: ctrl.signal });
  } catch {
    throw new ApiError(0, 'Serveur injoignable. Vérifiez votre connexion internet.');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) return undefined as T;
  let data: { error?: string } & Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* corps vide ou non JSON */
  }
  if (!res.ok) {
    if (res.status === 401 && token && path !== '/auth/login') onUnauthorized?.();
    throw new ApiError(res.status, data.error ?? 'Erreur serveur.');
  }
  return data as T;
}

export function fileForm(uri: string, mimeType?: string | null): FormData {
  const type = mimeType ?? 'image/jpeg';
  const ext = type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const form = new FormData();
  // Format de fichier propre à React Native
  form.append('file', { uri, name: `photo.${ext}`, type } as unknown as Blob);
  return form;
}
