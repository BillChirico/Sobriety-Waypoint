/* eslint-disable no-undef */
/**
 * Mock for react-native module
 * This avoids the ESM/Flow type import issues in react-native/index.js
 * while providing the necessary exports for React Native Testing Library
 */

const React = require('react');

// Mock View component
const View = props => React.createElement('View', props, props.children);

// Mock Text component
const Text = props => React.createElement('Text', props, props.children);

// Mock TouchableOpacity
const TouchableOpacity = props => React.createElement('TouchableOpacity', props, props.children);

// Mock TextInput
const TextInput = props => React.createElement('TextInput', props);

// Mock ScrollView
const ScrollView = props => React.createElement('ScrollView', props, props.children);

// Mock FlatList
const FlatList = props => React.createElement('FlatList', props);

// Mock Image
const Image = props => React.createElement('Image', props);

// Mock StyleSheet
const StyleSheet = {
  create: styles => styles,
  flatten: style => style,
  compose: (style1, style2) => [style1, style2],
};

// Mock Platform
const Platform = {
  OS: 'ios',
  Version: 14,
  select: obj => obj.ios || obj.default,
};

// Mock Dimensions
const Dimensions = {
  get: jest.fn(() => ({ width: 375, height: 667, scale: 2, fontScale: 1 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock Animated
const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    setOffset: jest.fn(),
    flattenOffset: jest.fn(),
    extractOffset: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    stopAnimation: jest.fn(),
    resetAnimation: jest.fn(),
    interpolate: jest.fn(() => ({ interpolate: jest.fn() })),
  })),
  ValueXY: jest.fn(() => ({
    setValue: jest.fn(),
    setOffset: jest.fn(),
    flattenOffset: jest.fn(),
    extractOffset: jest.fn(),
    x: { interpolate: jest.fn() },
    y: { interpolate: jest.fn() },
    getLayout: jest.fn(() => ({ left: 0, top: 0 })),
    getTranslateTransform: jest.fn(() => []),
  })),
  timing: jest.fn(() => ({
    start: jest.fn(callback => callback && callback({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  spring: jest.fn(() => ({
    start: jest.fn(callback => callback && callback({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  decay: jest.fn(() => ({
    start: jest.fn(callback => callback && callback({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  parallel: jest.fn(animations => ({
    start: jest.fn(callback => callback && callback({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  sequence: jest.fn(animations => ({
    start: jest.fn(callback => callback && callback({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  stagger: jest.fn((time, animations) => ({
    start: jest.fn(callback => callback && callback({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  loop: jest.fn(animation => ({
    start: jest.fn(callback => callback && callback({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  event: jest.fn(() => jest.fn()),
  createAnimatedComponent: Component => Component,
};

// Mock Keyboard
const Keyboard = {
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  dismiss: jest.fn(),
};

// Mock Alert
const Alert = {
  alert: jest.fn(),
};

// Mock AccessibilityInfo
const AccessibilityInfo = {
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  announceForAccessibility: jest.fn(),
  setAccessibilityFocus: jest.fn(),
};

// Mock useColorScheme hook
const useColorScheme = jest.fn(() => 'light');

// Export everything
module.exports = {
  // Components
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,

  // APIs
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  Keyboard,
  Alert,
  AccessibilityInfo,

  // Hooks
  useColorScheme,

  // Add other commonly used exports as needed
  TouchableHighlight: TouchableOpacity,
  TouchableWithoutFeedback: TouchableOpacity,
  Pressable: TouchableOpacity,
  Button: props => React.createElement('Button', props),
  Switch: props => React.createElement('Switch', props),
  ActivityIndicator: props => React.createElement('ActivityIndicator', props),
  Modal: props => React.createElement('Modal', props, props.children),
  SafeAreaView: View,
  StatusBar: props => React.createElement('StatusBar', props),

  // Layout events
  LayoutAnimation: {
    configureNext: jest.fn(),
    create: jest.fn(),
    Types: {},
    Properties: {},
  },

  // Utilities
  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn(size => size * 2),
    roundToNearestPixel: jest.fn(size => Math.round(size)),
  },

  // Appearance
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
    removeChangeListener: jest.fn(),
  },
};
