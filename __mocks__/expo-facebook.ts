export const initializeAsync = jest.fn().mockResolvedValue(undefined);

export const logInWithReadPermissionsAsync = jest.fn().mockResolvedValue({
  type: 'success',
  token: 'mock-facebook-access-token',
});

export default {
  initializeAsync,
  logInWithReadPermissionsAsync,
};
