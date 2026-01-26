import type { MerchantSettings } from './types';

const STORAGE_KEY = 'receiptless_merchant';

const defaultSettings: MerchantSettings = {
  pubkey: '',
  displayName: 'Demo Merchant',
  accentColor: '#2dd4bf',
  environment: 'devnet',
};

export const getMerchantSettings = (): MerchantSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultSettings;
};

export const setMerchantSettings = (settings: Partial<MerchantSettings>): void => {
  const current = getMerchantSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  // Also store pubkey separately for backward compat
  if (settings.pubkey) {
    localStorage.setItem('merchantPubkey', settings.pubkey);
  }
};

export const getMerchantPubkey = (): string => {
  return getMerchantSettings().pubkey || localStorage.getItem('merchantPubkey') || '';
};

export const setMerchantPubkey = (pubkey: string): void => {
  setMerchantSettings({ pubkey });
};
