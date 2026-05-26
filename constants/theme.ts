/**
 * DAM PreSchool App Theme
 * Brand colors inspired by school logo
 */

export const AppColors = {
  // Primary Brand Colors
  primaryBlue: '#1E3A5F',      // Dark Navy Blue (main brand color)
  gold: '#DAA520',              // Golden Rod (accent color)
  white: '#FFFFFF',
  
  // Background Colors
  background: '#F5F7FA',        // Soft off-white with blue tint
  backgroundLight: '#FAFBFC',   // Lighter variant
  cardBackground: '#FFFFFF',
  
  // Text Colors
  textPrimary: '#1E3A5F',       // Dark blue for headings
  textSecondary: '#5A6C7D',     // Gray-blue for body text
  textTertiary: '#8B95A1',      // Lighter gray-blue
  textLight: '#B0B7C3',         // Very light gray
  
  // Status Colors
  success: '#2ECC71',           // Green for active/success
  error: '#E74C3C',             // Red for errors
  warning: '#F39C12',           // Orange for warnings
  info: '#3498DB',              // Blue for info
  
  // Accent Variations
  goldLight: '#F4E4C1',         // Light golden for backgrounds
  goldPale: '#FDF6E3',          // Very pale golden
  blueLight: '#E8EDF3',         // Light blue for backgrounds
  bluePale: '#F0F4F8',          // Very pale blue
  
  // Shadow Colors
  shadowDark: 'rgba(30, 58, 95, 0.15)',    // Dark blue shadow
  shadowGold: 'rgba(218, 165, 32, 0.25)',  // Golden shadow
  shadowLight: 'rgba(0, 0, 0, 0.08)',      // Subtle shadow
  
  // Class Badge Colors (soft pastels with blue/gold theme)
  classPG: { bg: '#FDF6E3', text: '#DAA520' },      // Pale gold
  classPKG: { bg: '#FFE4E4', text: '#E05A5A' },     // Soft red
  classJKG: { bg: '#E8EDF3', text: '#1E3A5F' },     // Light blue
  classSKG: { bg: '#D4F4E8', text: '#2A9D6E' },     // Soft green
};

export const AppSizes = {
  // Border Radius
  radiusSmall: 12,
  radiusMedium: 16,
  radiusLarge: 20,
  radiusXLarge: 24,
  radiusPill: 28,
  
  // Spacing
  spacingXSmall: 4,
  spacingSmall: 8,
  spacingMedium: 12,
  spacingLarge: 16,
  spacingXLarge: 20,
  spacingXXLarge: 24,
  
  // Icon Sizes
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
  iconXLarge: 28,
  
  // Button Heights
  buttonSmall: 40,
  buttonMedium: 48,
  buttonLarge: 56,
};

export const AppFonts = {
  // Font Weights
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  
  // Font Sizes
  sizeXSmall: 11,
  sizeSmall: 13,
  sizeMedium: 15,
  sizeLarge: 17,
  sizeXLarge: 20,
  sizeXXLarge: 24,
  sizeTitle: 28,
  sizeHero: 32,
};

export const AppShadows = {
  // Soft shadows for cards
  cardShadow: {
    shadowColor: AppColors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Medium shadow for elevated elements
  elevatedShadow: {
    shadowColor: AppColors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  
  // Strong shadow for floating buttons
  floatingShadow: {
    shadowColor: AppColors.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Golden glow for accents
  goldGlow: {
    shadowColor: AppColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const AppTheme = {
  colors: AppColors,
  sizes: AppSizes,
  fonts: AppFonts,
  shadows: AppShadows,
};

export default AppTheme;
