import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const webFallback = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // ignore
  }
  return null;
})();

export const getItemAsync = async (key) => {
  if (Platform.OS === 'web') {
    return webFallback?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
};

export const setItemAsync = async (key, value) => {
  if (Platform.OS === 'web') {
    webFallback?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

export const deleteItemAsync = async (key) => {
  if (Platform.OS === 'web') {
    webFallback?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};
