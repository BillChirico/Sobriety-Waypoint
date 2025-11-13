import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  extra: {
    eas: {
      projectId: 'ca075b23-5398-4570-a6c4-286468f78eb1',
    },
  },
  name: '12-Step Tracker',
  owner: 'volvox-llc',
  slug: 'twelve-step-tracker',
  scheme: 'twelvesteptracker',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/logo.png',
  ios: {
    bundleIdentifier: 'com.volvoxllc.twelvesteptracker',
    icon: './assets/images/logo.png',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  plugins: [
    ...(config.plugins || []),
    [
      'sentry-expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ],
  ],
});
