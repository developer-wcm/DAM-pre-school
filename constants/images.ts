/**
 * Centralized image constants for the app
 * Using this approach allows for better caching and optimization
 */

export const IMAGES = {
  schoolLogo: require('../assets/images/school-logo.png'),
  favicon: require('../assets/images/favicon.png'),
  icon: require('../assets/images/icon.png'),
  splashIcon: require('../assets/images/splash-icon.png'),
} as const;

export type ImageKey = keyof typeof IMAGES;
