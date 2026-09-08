// Senior Design System Tokens - Emerald & Obsidian Theme

export const fontFamilies = {
  primary: 'var(--font-family-primary), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  heading: 'var(--font-family-heading), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const colorRoles = {
  primary: '#059669', // Emerald 600
  primary_hover: '#047857', // Emerald 700
  primary_active: '#065f46', // Emerald 800
  on_primary: '#ffffff',
  primary_container: '#ecfdf5', // Emerald 50
  on_primary_container: '#064e3b', // Emerald 900
  
  secondary: '#0f172a', // Slate 900
  on_secondary: '#ffffff',
  secondary_container: '#f1f5f9', // Slate 100
  on_secondary_container: '#0f172a',

  surface: '#ffffff',
  surface_muted: '#f8fafc', // Slate 50
  surface_border: '#e2e8f0', // Slate 200
  surface_border_hover: '#cbd5e1', // Slate 300

  text_primary: '#0f172a', // Slate 900 (High contrast WCAG AAA)
  text_secondary: '#475569', // Slate 600 (WCAG AA)
  text_muted: '#64748b', // Slate 500

  error: '#e11d48', // Rose 600
  on_error: '#ffffff',
  error_container: '#ffe4e6', // Rose 100
  on_error_container: '#9f1239', // Rose 800

  success: '#10b981', // Emerald 500
  on_success: '#ffffff',
  success_container: '#d1fae5', // Emerald 100
} as const;

export const shadows = {
  subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  card: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.02)',
  glow: '0 0 25px -5px rgba(16, 185, 129, 0.35)',
  glow_lg: '0 0 40px -5px rgba(16, 185, 129, 0.45)',
  soft: '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
  medium: '0 8px 30px -4px rgba(15, 23, 42, 0.12)',
  hard: '0 20px 40px -8px rgba(15, 23, 42, 0.2)',
} as const;
