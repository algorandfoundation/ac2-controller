// ─── Palette ──────────────────────────────────────────────────────────────────

export const palette = {
  blue: {
    100: '#e3f2fd',
    200: '#bfdbfe',
    300: '#81c0ff',
    400: '#4da3f7',
    500: '#1a73e8',
    600: '#3b82f6',
    700: '#1557b0',
    900: '#1c2f4d',
  },
  // Indigo accent + slate neutrals used by the chat timeline. Kept as their own
  // scales (rather than folded into `blue`/`neutral`) so the chat surface can
  // adhere to its indigo/slate look without shifting the rest of the app's
  // google-blue theming.
  indigo: {
    50: '#eef2ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    500: '#6366f1',
    700: '#4338ca',
    900: '#1e1b4b',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    800: '#1e293b',
    900: '#0f172a',
  },
  sky: {
    300: '#7dd3fc',
  },
  neutral: {
    0: '#ffffff',
    50: '#f8f9fa',
    100: '#f1f3f4',
    200: '#e8eaed',
    300: '#dadce0',
    400: '#9aa0a6',
    500: '#5f6368',
    700: '#3c4043',
    800: '#2d2d2d',
    850: '#242424',
    900: '#202124',
    925: '#1e1e1e',
    950: '#111111',
  },
  green: {
    400: '#5dba71',
    500: '#34a853',
    600: '#10b981',
  },
  red: {
    400: '#f28b82',
    500: '#ea4335',
    600: '#ef4444',
    700: '#b91c1c',
  },
  yellow: {
    100: '#fff8e1',
    400: '#fdd663',
    500: '#fbbc05',
  },
  black: '#000000',
} as const;

// ─── Shared Tokens ────────────────────────────────────────────────────────────

export const spacing = {
  gap: (v: number) => v * 8,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  fonts: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semiBold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
  },
  sizes: {
    xs: 9,
    sm: 11,
    md: 13,
    base: 14,
    lg: 17,
    xl: 18,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primary: {
    shadowColor: palette.blue[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

// ─── Colors (Light Theme) ─────────────────────────────────────────────────────

export const colors = {
  brand: {
    primary: palette.blue[500],
    hover: palette.blue[700],
    soft: palette.blue[100],
  },
  fg: {
    default: palette.neutral[900],
    muted: palette.neutral[500],
    inverse: palette.neutral[0],
    onLight: palette.neutral[950],
    primary: palette.blue[500],
    success: palette.green[500],
    danger: palette.red[500],
    warning: palette.yellow[500],
  },
  bg: {
    app: palette.neutral[100],
    surface: palette.neutral[0],
    white: palette.neutral[0],
    chat: palette.neutral[50],
    dark: palette.neutral[950],
    darkAlt: palette.neutral[900],
    header: palette.neutral[950],
    bubbleUser: palette.blue[100],
    bubbleBot: palette.neutral[0],
  },
  border: {
    default: palette.neutral[300],
  },
  state: {
    success: palette.green[500],
    danger: palette.red[500],
    warning: palette.yellow[500],
  },
  // ─── Chat surface ─────────────────────────────────────────────────────────
  // Semantic tokens for the chat timeline. Components read these names instead
  // of raw hex so the conversation UI stays themeable in one place.
  chat: {
    accent: palette.indigo[500],
    accentMuted: palette.indigo[300],
    appBg: palette.slate[50],
    divider: palette.slate[200],
    // Message bubbles
    bubbleMe: palette.blue[600],
    bubbleMeText: palette.neutral[0],
    bubblePeer: palette.slate[200],
    bubblePeerText: palette.slate[800],
    timestamp: 'rgba(0,0,0,0.5)',
    timestampInverse: 'rgba(255,255,255,0.7)',
    // Composer
    inputBg: palette.slate[100],
    inputText: palette.slate[800],
    placeholder: palette.slate[400],
    sendBg: palette.blue[600],
    sendDisabled: palette.slate[300],
    // Tool-activity card (dark)
    toolBg: palette.slate[900],
    toolBorder: palette.slate[800],
    toolName: palette.indigo[300],
    toolCommand: palette.sky[300],
    toolOutput: palette.slate[300],
    toolMeta: palette.slate[500],
    // AC2 protocol card
    ac2Surface: palette.indigo[50],
    ac2Border: palette.indigo[200],
    ac2Title: palette.indigo[700],
    ac2Text: palette.indigo[900],
    // Thread switcher chips
    chipBg: palette.indigo[50],
    chipBorder: palette.indigo[200],
    chipActiveBg: palette.indigo[500],
    chipText: palette.indigo[700],
    chipTextActive: palette.neutral[0],
    newChipBg: '#f8faff',
    newChipBorder: palette.blue[200],
    newChipText: palette.blue[600],
    // Status / header
    approve: palette.green[600],
    reject: palette.red[600],
    expired: palette.red[700],
    actioned: palette.slate[500],
    heartbeat: palette.green[600],
    headerBack: palette.blue[600],
    headerClear: palette.slate[500],
    headerDisconnect: palette.red[600],
  },
} as const;

// ─── Default Export ───────────────────────────────────────────────────────────

export const theme = {
  palette,
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} as const;
