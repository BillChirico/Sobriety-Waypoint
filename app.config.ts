import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  extra: {
    eas: {
      projectId: 'ca075b23-5398-4570-a6c4-286468f78eb1',
    },
  },
  name: 'Sobriety Waypoint',
  owner: 'volvox-llc',
  slug: 'sobriety-waypoint',
  scheme: 'sobrietywaypoint',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/logo.png',
  ios: {
    bundleIdentifier: 'com.volvoxllc.sobrietywaypoint',
    icon: './assets/images/logo.png',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.volvoxllc.sobrietywaypoint',
    icon: './assets/images/logo.png',
  },
  plugins: [
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        project: 'sobriety-waypoint',
        organization: 'volvox',
      },
    ],
  ],
});
