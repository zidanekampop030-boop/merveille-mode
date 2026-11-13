import { create } from 'zustand';
import { ApiError, api, fileForm, hasToken, loadToken, setToken, setUnauthorizedHandler } from '../lib/api';
import { appStorage } from '../lib/app-storage';
import type { PickedImage } from '../lib/storage';
import type { User } from '../types';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthState {
  user: User | null;
  ready: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signInWithGoogleToken: (idToken: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateAvatar: (img: PickedImage | null) => Promise<AuthResult>;
}

const USER_CACHE = 'merveille.user';
type Session = { token: string; user: User };

const fail = (e: unknown): AuthResult => ({ ok: false, error: e instanceof ApiError ? e.message : 'Connexion impossible.' });

export const useAuth = create<AuthState>((set, get) => {
  const start = async (s: Session): Promise<AuthResult> => {
    await setToken(s.token);
    await appStorage.setItem(USER_CACHE, JSON.stringify(s.user)).catch(() => undefined);
    set({ user: s.user });
    return { ok: true };
  };
  const clear = async () => {
    await setToken(null);
    await appStorage.removeItem(USER_CACHE).catch(() => undefined);
    set({ user: null });
  };
  const setUser = (user: User) => {
    appStorage.setItem(USER_CACHE, JSON.stringify(user)).catch(() => undefined);
    set({ user });
  };

  setUnauthorizedHandler(() => {
    clear();
  });

  return {
    user: null,
    ready: false,

    init: async () => {
      const t = await loadToken();
      if (t) {
        try {
          const r = await api<{ user: User }>('/me');
          setUser(r.user);
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 401)) {
            // Hors ligne : on réaffiche le dernier profil connu (le serveur reste l'autorité sur les droits)
            const cached = await appStorage.getItem(USER_CACHE).catch(() => null);
            if (cached) set({ user: JSON.parse(cached) as User });
          }
        }
      }
      set({ ready: true });
    },

    signIn: async (email, password) => {
      try {
        return await start(await api<Session>('/auth/login', { method: 'POST', json: { email: email.trim(), password } }));
      } catch (e) {
        return fail(e);
      }
    },

    signUp: async (name, email, password) => {
      try {
        return await start(await api<Session>('/auth/register', { method: 'POST', json: { name: name.trim(), email: email.trim(), password } }));
      } catch (e) {
        return fail(e);
      }
    },

    signInWithGoogleToken: async (idToken) => {
      try {
        return await start(await api<Session>('/auth/google', { method: 'POST', json: { idToken } }));
      } catch (e) {
        return fail(e);
      }
    },

    signOut: async () => {
      await clear();
    },

    updateAvatar: async (img) => {
      if (!get().user || !hasToken()) return { ok: false, error: 'Connexion impossible.' };
      try {
        const r = img
          ? await api<{ user: User }>('/me/avatar', { method: 'POST', form: fileForm(img.uri, img.mimeType) })
          : await api<{ user: User }>('/me/avatar', { method: 'DELETE' });
        setUser(r.user);
        return { ok: true };
      } catch (e) {
        return fail(e);
      }
    },
  };
});
