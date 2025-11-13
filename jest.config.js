const jestExpoPreset = require('jest-expo/jest-preset');

module.exports = {
  ...jestExpoPreset,
  // Override setupFiles to use custom setup (avoids React Native 0.81.5 ESM import issues)
  setupFiles: ['<rootDir>/__tests__/jest-setup.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock react-native to avoid ESM/Flow import issues
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    // Mock expo packages to avoid virtual env issues
    '^expo$': '<rootDir>/__mocks__/expo.ts',
    '^expo/virtual/env$': '<rootDir>/__mocks__/expo.ts',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.ts',
    '^expo-web-browser$': '<rootDir>/__mocks__/expo-web-browser.ts',
    '^expo-auth-session$': '<rootDir>/__mocks__/expo-auth-session.ts',
    '^expo-facebook$': '<rootDir>/__mocks__/expo-facebook.ts',
    // Map MSW exports to their CommonJS versions for Jest
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native/.*)|expo(nent)?|@expo(nent)?/.*|expo/virtual/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|msw|@mswjs/.*|@bundled-es-modules/.*|until-async)',
  ],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'contexts/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 40,
      branches: 40,
      functions: 30,
      lines: 40,
    },
  },
};
