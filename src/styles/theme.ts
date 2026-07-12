export const theme = {
  colors: {
    primary: '#4f46e5', // Sleek indigo
    primaryHover: '#4338ca',
    secondary: '#0f172a', // Dark slate
    secondaryHover: '#1e293b',
    background: '#f8fafc', // Light slate bg
    surface: '#ffffff', // Pure white
    text: '#0f172a', // Dark slate text
    textMuted: '#64748b', // Cool grey text
    border: '#e2e8f0', // Border color
    error: '#ef4444', // Warm red
    success: '#10b981', // Emerald green
    warning: '#f59e0b', // Amber yellow
    info: '#3b82f6', // Bright blue
    sidebarBg: '#0f172a',
    sidebarText: '#94a3b8',
    sidebarTextActive: '#ffffff',
    sidebarTextHover: '#cbd5e1',
  },
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  transitions: {
    default: 'all 0.2s ease-in-out',
    fast: 'all 0.1s ease-in-out',
  },
};

export type ThemeType = typeof theme;
