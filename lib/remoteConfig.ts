import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import { getApp } from 'firebase/app';

export const initializeRemoteConfig = async () => {
  if (typeof window === 'undefined') return null;

  const app = getApp();
  const remoteConfig = getRemoteConfig(app);
  remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
  remoteConfig.defaultConfig = {
    intro_modal_title: 'Welcome to ATLAS',
    intro_modal_description: 'Experience lifelike conversations with our AI real estate agents. Get personalized property insights and explore listings in an interactive way. Get started now!'
  };

  try {
    await fetchAndActivate(remoteConfig);
    return remoteConfig;
  } catch (error) {
    console.error('Error initializing Remote Config:', error);
    return null;
  }
};

export const getRemoteConfigValue = (remoteConfig: any, key: string) => {
  if (!remoteConfig) return null;
  return getValue(remoteConfig, key).asString();
};

