// IceIQ "Kinetic Edge" Design System
// Based on Stitch DESIGN.md — "The Synthetic Ice"
// Fonts: Space Grotesk (headlines) + Inter (body/Korean)

export const Colors = {
  // ─── Surface Hierarchy (No-Line Rule: use tonal shifts, not borders) ───
  bg: '#131318',                    // surface — base
  surfaceDim: '#131318',            // surface-dim — deepest
  surfaceLowest: '#0E0E13',         // surface-container-lowest — recessed
  surfaceLow: '#1B1B20',            // surface-container-low — sections
  card: '#1F1F25',                  // surface-container — cards
  cardHigh: '#2A292F',              // surface-container-high — active cards
  cardHighest: '#35343A',           // surface-container-highest — interactive
  surfaceBright: '#39383E',         // surface-bright

  // ─── Primary / Accent ───
  accent: '#00D4FF',                // primary-container — CTAs, key metrics
  accentLight: '#A8E8FF',           // primary — softer accent
  accentDim: '#3CD7FF',             // primary-fixed-dim
  accentGlow: 'rgba(0,212,255,0.15)', // ambient glow

  // ─── Text ───
  text: '#E4E1E9',                  // on-surface — high readability (NOT #FFF)
  subtext: '#BBC9CF',               // on-surface-variant — secondary text
  outline: '#859398',               // outline — metadata, hints
  outlineVariant: '#3C494E',        // outline-variant — ghost borders (15% opacity)

  // ─── Semantic ───
  error: '#FFB4AB',                 // error
  errorContainer: '#93000A',        // error-container
  success: '#34C759',               // custom — growth positive
  warning: '#FFD700',               // custom — caution

  // ─── Secondary / Tertiary ───
  secondary: '#A5CDDB',             // secondary
  secondaryContainer: '#254C58',    // secondary-container
  tertiary: '#DEDFDF',              // tertiary

  // ─── Legacy aliases (backward compat) ───
  input: '#2A292F',                 // → cardHigh
  border: '#3C494E',                // → outlineVariant

  // ─── Gradients & Effects ───
  shimmerStart: '#00D4FF',          // CTA gradient start
  shimmerEnd: '#A8E8FF',            // CTA gradient end
  glassCard: 'rgba(53,52,58,0.4)', // glass-card background
  glassBorder: 'rgba(168,232,255,0.1)', // glass-card top border
} as const;

// ─── Typography tokens ───
export const Fonts = {
  headline: 'SpaceGrotesk',         // Display, headlines, scores
  headlineBold: 'SpaceGrotesk-Bold',
  body: 'Inter',                    // Body, Korean text, labels
  bodyBold: 'Inter-Bold',
} as const;

// ─── Spacing scale ───
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Border radius (sharp, not rounded pills) ───
export const Radius = {
  sm: 2,       // DEFAULT
  md: 4,       // lg
  lg: 8,       // xl — cards
  xl: 12,      // full — chips
} as const;
