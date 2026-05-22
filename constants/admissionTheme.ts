// School Brand Colors Theme - Navy Blue & Goldenrod (Enhanced)
export const COLORS = {
  // Primary Colors (Navy Blue) - Enhanced
  primary: '#1B3A6B',        // Dark Navy Blue
  primaryLight: '#2A4A7C',   // Lighter Navy
  primaryDark: '#0F2847',    // Darker Navy
  primarySoft: '#E8EDF7',    // Very light navy for backgrounds
  
  // Secondary Colors (Goldenrod) - Enhanced
  secondary: '#DAA520',      // Goldenrod
  secondaryLight: '#F4D03F', // Light Gold
  secondaryDark: '#B8860B',  // Dark Goldenrod
  secondarySoft: '#FDF8E8',  // Very light gold for backgrounds
  
  // Accent Colors - Enhanced
  white: '#FFFFFF',
  offWhite: '#FAFBFC',
  cream: '#FFF9F0',          // Warm white
  lightGray: '#E8EAED',
  gray: '#9A9AB0',
  darkGray: '#4A4A6A',
  
  // Status Colors - Enhanced
  success: '#2ECC71',        // Brighter green
  successLight: '#E8F8F0',
  successDark: '#27AE60',
  error: '#E74C3C',          // Brighter red
  errorLight: '#FDEAEA',
  errorDark: '#C0392B',
  warning: '#F39C12',        // Brighter orange
  warningLight: '#FEF5E7',
  warningDark: '#E67E22',
  
  // Background - Enhanced
  background: '#F8FAFC',     // Softer background
  backgroundGradient: ['#F8FAFC', '#EDF2F7', '#E2E8F0'] as const,
  backgroundGradientPrimary: ['#1B3A6B', '#2A4A7C', '#3B5998'] as const,
  backgroundGradientSecondary: ['#DAA520', '#F4D03F', '#FFE55C'] as const,
  
  // Card & Surface - Enhanced
  cardBg: '#FFFFFF',
  cardShadow: '#1B3A6B',
  cardBorder: '#F0F4F8',
  
  // Text - Enhanced
  textPrimary: '#1A202C',    // Darker for better contrast
  textSecondary: '#4A5568',  // Better contrast
  textLight: '#718096',
  textMuted: '#A0AEC0',
  
  // Button States - Enhanced
  buttonPrimary: '#1B3A6B',
  buttonSecondary: '#DAA520',
  buttonDisabled: '#CBD5E0',
  buttonHover: '#2C5282',
  
  // Input & Form - Enhanced
  inputBorder: '#E2E8F0',
  inputFocus: '#DAA520',
  inputBackground: '#FFFFFF',
  inputError: '#E74C3C',
  
  // Special Effects
  overlay: 'rgba(27, 58, 107, 0.1)',
  overlayDark: 'rgba(27, 58, 107, 0.8)',
  shimmer: '#F7FAFC',
  glow: 'rgba(218, 165, 32, 0.3)',
};

// Typography - Enhanced
export const FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

// Enhanced Shadows
export const SHADOWS = {
  small: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Enhanced Button Styles
export const BUTTON_STYLES = {
  primary: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...SHADOWS.medium,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...SHADOWS.medium,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  ghost: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
};

// Enhanced Gradients
export const GRADIENTS = {
  primary: [COLORS.primary, COLORS.primaryLight],
  secondary: [COLORS.secondary, COLORS.secondaryLight],
  success: [COLORS.success, COLORS.successDark],
  warm: [COLORS.secondary, '#FF8C42'],
  cool: [COLORS.primary, '#4A90E2'],
  sunset: ['#FF6B6B', '#FFE66D', '#4ECDC4'],
  ocean: ['#667eea', '#764ba2'],
  royal: [COLORS.primary, COLORS.secondary],
};

// Enhanced Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Enhanced Border Radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 50,
};

// Animation Durations
export const ANIMATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 800,
};
