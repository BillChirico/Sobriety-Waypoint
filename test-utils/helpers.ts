/**
 * Test helper utilities
 * Common functions for testing scenarios
 */

import { act } from '@testing-library/react-native';

/**
 * Wait for all promises to resolve (useful for async state updates)
 */
export async function flushPromises(): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setImmediate(resolve));
  });
}

/**
 * Wait for a specific amount of time (use sparingly, prefer waitFor)
 */
export async function wait(ms: number): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, ms));
  });
}

/**
 * Create a deferred promise for testing async operations
 */
export function createDeferred<T = void>() {
  let resolve: (value: T) => void;
  let reject: (error: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}

/**
 * Mock implementation of AsyncStorage for tests
 */
export const mockAsyncStorage: {
  store: Map<string, string>;
  getItem: jest.Mock<Promise<string | null>, [string]>;
  setItem: jest.Mock<Promise<void>, [string, string]>;
  removeItem: jest.Mock<Promise<void>, [string]>;
  clear: jest.Mock<Promise<void>, []>;
  getAllKeys: jest.Mock<Promise<string[]>, []>;
  multiGet: jest.Mock<Promise<[string, string | null][]>, [string[]]>;
  multiSet: jest.Mock<Promise<void>, [[string, string][]]>;
  multiRemove: jest.Mock<Promise<void>, [string[]]>;
  reset: () => void;
} = {
  store: new Map<string, string>(),

  getItem: jest.fn((key: string): Promise<string | null> => {
    return Promise.resolve(mockAsyncStorage.store.get(key) || null);
  }),

  setItem: jest.fn((key: string, value: string): Promise<void> => {
    mockAsyncStorage.store.set(key, value);
    return Promise.resolve();
  }),

  removeItem: jest.fn((key: string) => {
    mockAsyncStorage.store.delete(key);
    return Promise.resolve();
  }),

  clear: jest.fn(() => {
    mockAsyncStorage.store.clear();
    return Promise.resolve();
  }),

  getAllKeys: jest.fn(() => {
    return Promise.resolve(Array.from(mockAsyncStorage.store.keys()));
  }),

  multiGet: jest.fn((keys: string[]) => {
    return Promise.resolve(keys.map(key => [key, mockAsyncStorage.store.get(key) || null]));
  }),

  multiSet: jest.fn((keyValuePairs: [string, string][]) => {
    keyValuePairs.forEach(([key, value]) => {
      mockAsyncStorage.store.set(key, value);
    });
    return Promise.resolve();
  }),

  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach(key => mockAsyncStorage.store.delete(key));
    return Promise.resolve();
  }),

  /**
   * Reset the mock storage (call this in afterEach)
   */
  reset: () => {
    mockAsyncStorage.store.clear();
    jest.clearAllMocks();
  },
};

/**
 * Generate a unique ID for testing (mimics UUID format)
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a mock error response for testing error handling
 */
export function createMockError(
  message: string,
  code?: string
): { error: { message: string; code?: string } } {
  return {
    error: {
      message,
      ...(code && { code }),
    },
  };
}

/**
 * Suppress console errors/warnings during a test
 * Useful when testing error states that intentionally trigger console output
 */
export function suppressConsole(
  methods: ('error' | 'warn' | 'log')[] = ['error', 'warn']
): () => void {
  const original: Record<string, any> = {};

  methods.forEach(method => {
    original[method] = console[method];
    console[method] = jest.fn();
  });

  // Return cleanup function
  return () => {
    methods.forEach(method => {
      console[method] = original[method];
    });
  };
}

/**
 * Create a mock file object for testing file uploads
 */
export function createMockFile(
  name: string,
  type: string = 'image/jpeg',
  size: number = 1024
): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  const file = new File([blob], name, { type });
  return file;
}
