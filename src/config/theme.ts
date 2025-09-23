// Superfan Club Theme Configuration
// Matches the brand colors from the main application

export const SUPERFAN_COLORS = {
  // Primary Superfan Club Colors
  electricPurple: '#9B5DE5',
  vibrantYellow: '#FEE440',
  limeGreen: '#00F5D4',
  cyanBlue: '#00BBF9',
  coralRed: '#FF006E',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

// Theme Configuration
export const SUPERFAN_THEME = {
  colors: {
    primary: SUPERFAN_COLORS.electricPurple,
    secondary: SUPERFAN_COLORS.vibrantYellow,
    accent: SUPERFAN_COLORS.limeGreen,
    background: SUPERFAN_COLORS.white,
    surface: SUPERFAN_COLORS.gray[50],
    text: SUPERFAN_COLORS.gray[900],
    textLight: SUPERFAN_COLORS.gray[600],
    border: SUPERFAN_COLORS.gray[200],
    success: SUPERFAN_COLORS.success,
    warning: SUPERFAN_COLORS.warning,
    error: SUPERFAN_COLORS.error,
    info: SUPERFAN_COLORS.info,
  },
  
  // Component-specific colors
  header: {
    background: SUPERFAN_COLORS.electricPurple,
    text: SUPERFAN_COLORS.white,
  },
  
  tabs: {
    active: SUPERFAN_COLORS.electricPurple,
    inactive: SUPERFAN_COLORS.gray[400],
    background: SUPERFAN_COLORS.white,
  },
  
  button: {
    primary: SUPERFAN_COLORS.electricPurple,
    secondary: SUPERFAN_COLORS.vibrantYellow,
    success: SUPERFAN_COLORS.limeGreen,
    warning: SUPERFAN_COLORS.warning,
    danger: SUPERFAN_COLORS.coralRed,
  },
  
  card: {
    background: SUPERFAN_COLORS.white,
    border: SUPERFAN_COLORS.gray[200],
    shadow: 'rgba(155, 93, 229, 0.1)', // Electric purple with opacity
  },
  
  // Typography
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  
  // Border radius
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
} as const;

// Gradient definitions for Superfan Club theme
export const SUPERFAN_GRADIENTS = {
  primary: [SUPERFAN_COLORS.electricPurple, SUPERFAN_COLORS.cyanBlue],
  secondary: [SUPERFAN_COLORS.vibrantYellow, SUPERFAN_COLORS.limeGreen],
  accent: [SUPERFAN_COLORS.limeGreen, SUPERFAN_COLORS.cyanBlue],
  sunset: [SUPERFAN_COLORS.coralRed, SUPERFAN_COLORS.vibrantYellow],
} as const;