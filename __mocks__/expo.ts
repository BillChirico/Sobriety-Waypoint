// Mock for expo package to avoid virtual env module issues
export const registerRootComponent = jest.fn();
export const env = process.env;
