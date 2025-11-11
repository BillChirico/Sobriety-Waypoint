/* eslint-disable no-undef */
/**
 * Custom Jest setup that replaces React Native's setup.js
 * This avoids the ESM import issues in React Native 0.81.5
 * while still providing necessary mocks for React Native Testing Library
 *
 * Based on react-native/jest/setup.js but without ESM imports
 */

// Set React ACT and React Native test environment flags
global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

// Mock global objects that React Native provides
global.__DEV__ = true;

// Mock the Fabric UI Manager
global.nativeFabricUIManager = {};

// Mock the performance API
global.performance = {
  now: jest.fn(Date.now),
};

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = id => clearTimeout(id);

// Mock setImmediate and clearImmediate
global.setImmediate = callback => setTimeout(callback, 0);
global.clearImmediate = id => clearTimeout(id);

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out specific warnings we don't care about in tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render') ||
      message.includes('Not implemented: HTMLFormElement'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// ==============================================
// MSW Setup for API Mocking
// ==============================================
// Note: MSW is configured but not automatically enabled globally due to ESM compatibility issues.
// To use MSW in a test file, import and set up the server manually:
//
// import { server } from '@/mocks/server';
// import { resetDb } from '@/mocks/db';
//
// beforeAll(() => server.listen());
// afterEach(() => { server.resetHandlers(); resetDb(); });
// afterAll(() => server.close());
