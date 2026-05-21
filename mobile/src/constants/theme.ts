// TODO: Replace palette values with your brand colors.
const palette = {
  white: '#FFFFFF',
  black: '#000000',
  ink: '#1A1A1A',
  charcol: '#232323',
  inkSoft: '#8A8A8A',
  navy: '#12213A',
  blush: '#FEFAF7',
  // TODO: primary brand gradient (start → end)
  rose: '#FF6B9D',
  coral: '#FF6B4A',
  green: '#4FAF8F',
  red: '#E53935',
  gold: '#D4A24C',
  purple: '#9C27B0',
  amber: '#F5A623',
  midnightIndigo: '#1B1F3B',
  gray50: '#FAFAFA',
  gray75: '#F7F7F7',
  gray100: '#F5F5F5',
  gray150: '#F0F0F0',
  gray200: '#E8E8E8',
  gray300: '#E0E0E0',
  red50: '#FFF5F5',
  red100: '#FFD5D5',
  pink50: '#FFF5F8',
  rice: '#F7F4ED'
};

export const Colors = {
  palette,

  surface: {
    background: palette.rice,
    warm: palette.blush, 
    card: palette.white,
    subtle: palette.gray100,
    muted: palette.gray75,
    inverse: palette.black,
  },

  text: {
    primary: palette.charcol,
    secondary: palette.inkSoft,
    inverse: palette.white,
    inverseMuted: 'rgba(255,255,255,0.72)',
    brandDark: palette.navy,
  },

  stroke: {
    default: palette.gray150,
    subtle: palette.gray100,
    danger: palette.red100,
    inverse: 'rgba(255,255,255,0.45)',
  },

  action: {
    primary: palette.green,
    primaryEnd: palette.midnightIndigo,
    disabled: palette.gray300,
    destructive: palette.red,
  },

  feedback: {
    success: palette.green,
    danger: palette.red,
    warning: palette.gold,
    rating: palette.amber,
  },

  overlay: {
    scrim: 'rgba(0,0,0,0.45)',
    scrimStrong: 'rgba(0,0,0,0.55)',
    mediaLight: 'rgba(0,0,0,0.18)',
    media: 'rgba(0,0,0,0.72)',
    mediaStrong: 'rgba(0,0,0,0.85)',
    inverseGlass: 'rgba(255,255,255,0.95)',
  },

  // Aliases
  background: palette.white,
  card: palette.white,
  gradientStart: palette.rose,
  gradientEnd: palette.coral,
  textPrimary: palette.ink,
  textSecondary: palette.inkSoft,
  border: palette.gray150,
};

// TODO: Swap font families if you're using different ones. Update app.json plugins accordingly.
export const Fonts = {
  heading: 'AoboshiOne_400Regular',
  headingSemiBold: 'AoboshiOne_400Regular',
  headingRegular: 'AoboshiOne_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
};

export const Typography = {
  hero: { fontFamily: Fonts.heading, fontSize: 32, lineHeight: 38 },
  screenTitle: { fontFamily: Fonts.heading, fontSize: 26, lineHeight: 32 },
  sectionTitle: { fontFamily: Fonts.heading, fontSize: 20, lineHeight: 28 },
  cardTitle: { fontFamily: Fonts.headingSemiBold, fontSize: 17, lineHeight: 23 },
  sheetTitle: { fontFamily: Fonts.headingSemiBold, fontSize: 22, lineHeight: 28 },
  body: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 21 },
  bodyMedium: { fontFamily: Fonts.bodyMedium, fontSize: 15, lineHeight: 21 },
  bodySmall: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 19 },
  caption: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 18 },
  badge: { fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 14 },
  button: { fontFamily: Fonts.headingSemiBold, fontSize: 16, lineHeight: 22 },
};

export const Space = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const Radius = {
  sm: 8,
  md: 16,
  ml: 18,
  lg: 24,
  xl: 32,
  full: 999,
};

export const Size = {
  touch: 44,
  buttonHeight: 56,
  buttonHeightSm: 48,
  iconButton: 36,
  avatar: 52,
  avatarSm: 32,
  chipMinHeight: 32,
};

export const Opacity = {
  disabled: 0.5,
  pressed: 0.7,
  buttonPressed: 0.88,
  subtleIcon: 0.5,
  mediumIcon: 0.7,
};

export const Gradients = {
  primary: [Colors.action.primary, Colors.action.primaryEnd] as const,
  disabled: [Colors.action.disabled, Colors.action.disabled] as const,
  media: ['transparent', Colors.overlay.media] as const,
  mediaStrong: ['transparent', Colors.overlay.mediaStrong] as const,
};

export const Shadow = {
  card: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  raised: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
};
