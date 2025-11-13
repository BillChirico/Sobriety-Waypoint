export default {
  expo: {
    name: '12-Step Tracker',
    slug: '12-step-tracker',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: '12stepstracker',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.billchirico.12steptracker',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      [
        'expo-facebook',
        {
          appID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
          displayName: '12 Step Tracker',
          scheme: `fb${process.env.EXPO_PUBLIC_FACEBOOK_APP_ID}`,
          advertiserIDCollectionEnabled: false,
          autoLogAppEventsEnabled: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '4652ad8b-2e44-4270-8612-64c4587219d8',
      },
    },
    android: {
      package: 'com.billchirico.twelvesteptracker',
    },
  },
};
