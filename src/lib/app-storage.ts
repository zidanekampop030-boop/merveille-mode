import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

const isWebServer = Platform.OS === 'web' && typeof window === 'undefined';

export const appStorage = {
  getItem: async (name) => (isWebServer ? null : AsyncStorage.getItem(name)),
  setItem: async (name, value) => {
    if (!isWebServer) await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    if (!isWebServer) await AsyncStorage.removeItem(name);
  },
} satisfies StateStorage;
