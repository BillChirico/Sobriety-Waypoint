/**
 * Global test setup for Jest
 * This file runs before all tests and configures the testing environment
 */

// Note: @testing-library/jest-native v5.4.3 is deprecated.
// The project uses @testing-library/react-native v13.3.3, which includes built-in matchers.
// We do not import jest-native to avoid ESM compatibility issues and because its matchers are superseded.

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(), // Keep error to catch unexpected errors
};
