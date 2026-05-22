// Mock expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Mock react-native Animated
jest.mock('react-native/Libraries/Animated/animations/TimingAnimation');
jest.mock('react-native/Libraries/Animated/animations/SpringAnimation');

// Make Animated callbacks execute immediately in tests
global.requestAnimationFrame = (cb) => {
  cb(0);
  return 0;
};

// Mock Animated.timing and Animated.spring to execute callbacks immediately
const mockAnimatedValue = {
  setValue: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  stopAnimation: jest.fn(),
  resetAnimation: jest.fn(),
  interpolate: jest.fn(() => mockAnimatedValue),
  animate: jest.fn(),
  __getValue: jest.fn(() => 0),
};

const mockAnimatedTiming = (value, config) => ({
  start: (callback) => {
    if (callback) {
      callback({ finished: true });
    }
  },
  stop: jest.fn(),
  reset: jest.fn(),
});

const mockAnimatedSpring = (value, config) => ({
  start: (callback) => {
    if (callback) {
      callback({ finished: true });
    }
  },
  stop: jest.fn(),
  reset: jest.fn(),
});

const mockAnimatedParallel = (animations) => ({
  start: (callback) => {
    if (callback) {
      callback({ finished: true });
    }
  },
  stop: jest.fn(),
  reset: jest.fn(),
});

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = mockAnimatedTiming;
  RN.Animated.spring = mockAnimatedSpring;
  RN.Animated.parallel = mockAnimatedParallel;
  RN.Animated.Value = jest.fn(() => mockAnimatedValue);
  return RN;
});
