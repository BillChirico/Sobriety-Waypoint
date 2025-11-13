export const init = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const addBreadcrumb = jest.fn();
export const setUser = jest.fn();
export const setContext = jest.fn();
export const setTag = jest.fn();
export const startTransaction = jest.fn(() => ({
  startChild: jest.fn(() => ({
    finish: jest.fn(),
  })),
  finish: jest.fn(),
}));

export const ErrorBoundary = ({ children }: any) => children;

export const ReactNavigationInstrumentation = jest.fn();
export const ReactNativeTracing = jest.fn();
