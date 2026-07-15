/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ─────────────────────────────────────────────────────────────────────────────
// THEME SYSTEM INFRASTRUCTURE  (Phase 8.1)
// ─────────────────────────────────────────────────────────────────────────────
//
// PURPOSE
//   Single source of truth for every color / surface token used in the app.
//   Components should import their class strings from here instead of
//   hard-coding hex values or Tailwind classes in JSX.
//
// CURRENT BEHAVIOR (preserved exactly)
//   • The app renders a Tailwind "dark mode" via the `dark` class on <html>.
//   • All `dark:*` utility classes in the components continue to work unchanged.
//   • This file does NOT alter any existing JSX or CSS.
//
// FUTURE BEHAVIOR (scaffolded, not yet wired)
//   • A `system` theme will detect the OS preference and delegate to
//     `light` or `dark` automatically.
//   • Individual component tokens will be looked up from this file so that
//     a single palette change propagates everywhere.
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. Theme mode ────────────────────────────────────────────────────────────

/** The three supported theme modes. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** The two resolved (applied) modes — `system` resolves to one of these. */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Resolves `'system'` to the OS preference.
 * `'light'` and `'dark'` pass through unchanged.
 */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode;
}

// ─── 2. Semantic token map ─────────────────────────────────────────────────────
//
// Each token is an object with a `light` value and a `dark` value.
// Values are Tailwind utility class strings (not raw CSS / hex).
// Using Tailwind classes keeps full compatibility with the existing setup.
//
// Convention: token names follow a `<layer>.<role>` pattern, e.g.
//   bg.page     → root page background
//   text.primary → primary text
//   border.subtle → a de-emphasized divider

export interface ThemeTokens {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: {
    page:        string;   // outermost app background
    surface:     string;   // cards, panels
    surfaceAlt:  string;   // secondary panels / sidebars
    overlay:     string;   // modal backdrops
    input:       string;   // form inputs
    badge:       string;   // pill / badge chips
    success:     string;   // success highlights
    warning:     string;   // warning highlights
    danger:      string;   // error / destructive highlights
    info:        string;   // informational highlights
    brand:       string;   // primary brand color (orange / amber)
    brandAlt:    string;   // secondary brand accent (rose / red)
  };

  // ── Text ─────────────────────────────────────────────────────────────────
  text: {
    primary:   string;   // headings, high-emphasis
    secondary: string;   // body, medium-emphasis
    muted:     string;   // placeholders, low-emphasis
    inverted:  string;   // text on dark/colored surfaces
    brand:     string;   // brand-colored text
    brandAlt:  string;   // rose / red text
    success:   string;
    warning:   string;
    danger:    string;
    link:      string;
  };

  // ── Borders ───────────────────────────────────────────────────────────────
  border: {
    default: string;
    subtle:  string;
    focus:   string;
    brand:   string;
    danger:  string;
  };

  // ── Interactive / Buttons ─────────────────────────────────────────────────
  btn: {
    primaryBg:   string;
    primaryText: string;
    primaryHover: string;
    secondaryBg:   string;
    secondaryText: string;
    secondaryHover: string;
    dangerBg:    string;
    dangerText:  string;
    dangerHover: string;
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  nav: {
    bg:         string;
    activeBg:   string;
    activeText: string;
    inactiveText: string;
  };

  // ── Status badges ─────────────────────────────────────────────────────────
  status: {
    pendiente:    string;  // Tailwind class string for the badge background
    preparacion:  string;
    listo:        string;
    entregado:    string;
    cancelado:    string;
    credito:      string;
    pagado:       string;
  };
}

// ─── 3. Light theme tokens ─────────────────────────────────────────────────────
//
// NOTE: These mirror the *current* light-mode appearance of the app.
// No visual change is made in this phase.

const lightTokens: ThemeTokens = {
  bg: {
    page:       'bg-orange-50',
    surface:    'bg-white',
    surfaceAlt: 'bg-gray-50',
    overlay:    'bg-black/40',
    input:      'bg-white',
    badge:      'bg-gray-100',
    success:    'bg-green-50',
    warning:    'bg-amber-50',
    danger:     'bg-rose-50',
    info:       'bg-blue-50',
    brand:      'bg-amber-500',
    brandAlt:   'bg-rose-600',
  },
  text: {
    primary:   'text-gray-900',
    secondary: 'text-gray-700',
    muted:     'text-gray-500',
    inverted:  'text-white',
    brand:     'text-amber-700',
    brandAlt:  'text-rose-600',
    success:   'text-green-700',
    warning:   'text-amber-700',
    danger:    'text-rose-700',
    link:      'text-blue-600',
  },
  border: {
    default: 'border-gray-200',
    subtle:  'border-gray-100',
    focus:   'border-blue-500',
    brand:   'border-amber-400',
    danger:  'border-rose-300',
  },
  btn: {
    primaryBg:      'bg-amber-600',
    primaryText:    'text-white',
    primaryHover:   'hover:bg-amber-700',
    secondaryBg:    'bg-gray-100',
    secondaryText:  'text-gray-700',
    secondaryHover: 'hover:bg-gray-200',
    dangerBg:       'bg-rose-600',
    dangerText:     'text-white',
    dangerHover:    'hover:bg-rose-700',
  },
  nav: {
    bg:           'bg-white',
    activeBg:     'bg-orange-100',
    activeText:   'text-orange-700',
    inactiveText: 'text-gray-500',
  },
  status: {
    pendiente:   'bg-amber-100 text-amber-800',
    preparacion: 'bg-blue-100 text-blue-800',
    listo:       'bg-green-100 text-green-800',
    entregado:   'bg-gray-100 text-gray-600',
    cancelado:   'bg-red-100 text-red-800',
    credito:     'bg-rose-100 text-rose-800',
    pagado:      'bg-emerald-100 text-emerald-800',
  },
};

// ─── 4. Dark theme tokens ──────────────────────────────────────────────────────
//
// NOTE: These mirror the *current* dark-mode appearance of the app exactly.
// Tailwind `dark:` classes already handle the switch; these tokens are defined
// here so future migration to CSS-var-based theming is straightforward.

const darkTokens: ThemeTokens = {
  bg: {
    page:       'bg-slate-900',
    surface:    'bg-slate-800',
    surfaceAlt: 'bg-slate-700',
    overlay:    'bg-black/60',
    input:      'bg-slate-800',
    badge:      'bg-slate-700',
    success:    'bg-green-900/40',
    warning:    'bg-amber-900/40',
    danger:     'bg-rose-900/40',
    info:       'bg-blue-900/40',
    brand:      'bg-amber-600',
    brandAlt:   'bg-rose-700',
  },
  text: {
    primary:   'text-slate-50',
    secondary: 'text-slate-300',
    muted:     'text-slate-500',
    inverted:  'text-slate-900',
    brand:     'text-amber-400',
    brandAlt:  'text-rose-400',
    success:   'text-green-400',
    warning:   'text-amber-400',
    danger:    'text-rose-400',
    link:      'text-blue-400',
  },
  border: {
    default: 'border-slate-700',
    subtle:  'border-slate-800',
    focus:   'border-blue-400',
    brand:   'border-amber-600',
    danger:  'border-rose-600',
  },
  btn: {
    primaryBg:      'bg-amber-600',
    primaryText:    'text-white',
    primaryHover:   'hover:bg-amber-500',
    secondaryBg:    'bg-slate-700',
    secondaryText:  'text-slate-100',
    secondaryHover: 'hover:bg-slate-600',
    dangerBg:       'bg-rose-700',
    dangerText:     'text-white',
    dangerHover:    'hover:bg-rose-600',
  },
  nav: {
    bg:           'bg-slate-900',
    activeBg:     'bg-slate-700',
    activeText:   'text-amber-400',
    inactiveText: 'text-slate-400',
  },
  status: {
    pendiente:   'bg-amber-900/60 text-amber-300',
    preparacion: 'bg-blue-900/60 text-blue-300',
    listo:       'bg-green-900/60 text-green-300',
    entregado:   'bg-slate-700 text-slate-400',
    cancelado:   'bg-red-900/60 text-red-300',
    credito:     'bg-rose-900/60 text-rose-300',
    pagado:      'bg-emerald-900/60 text-emerald-300',
  },
};

// ─── 5. Theme registry ────────────────────────────────────────────────────────

const themes: Record<ResolvedTheme, ThemeTokens> = {
  light: lightTokens,
  dark:  darkTokens,
};

/**
 * Returns the full token map for the given resolved theme.
 *
 * @example
 *   const t = getThemeTokens('dark');
 *   className={t.bg.surface}   // → 'bg-slate-800'
 */
export function getThemeTokens(resolved: ResolvedTheme): ThemeTokens {
  return themes[resolved];
}

// ─── 6. localStorage key helpers ─────────────────────────────────────────────
//
// Centralises the storage key format so it is not duplicated across App.tsx
// and future settings panels.

/** Storage key for the theme preference of a given role. */
export function themeStorageKey(role: string): string {
  return `rf_theme_${role}`;
}

/**
 * Reads the persisted theme preference for a role.
 * Falls back to `'light'` if nothing is stored.
 */
export function loadThemeMode(role: string): ThemeMode {
  const saved = localStorage.getItem(themeStorageKey(role));
  if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  return 'light';
}

/**
 * Persists a theme preference for a role.
 */
export function saveThemeMode(role: string, mode: ThemeMode): void {
  localStorage.setItem(themeStorageKey(role), mode);
}

// ─── 7. DOM application helper ───────────────────────────────────────────────
//
// Applies the resolved theme to the <html> element via the `dark` class
// (Tailwind's class-based dark strategy, matching @custom-variant in index.css).

/**
 * Adds or removes the `dark` class from `<html>` based on the resolved mode.
 * This is the only function that should touch `document.documentElement`.
 */
export function applyThemeToDom(resolved: ResolvedTheme): void {
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// ─── 8. Brand palette reference ───────────────────────────────────────────────
//
// Raw hex values for cases where Tailwind classes are insufficient
// (e.g. inline SVG fills, Canvas, third-party components).
// Components should prefer the token classes above; use these only as fallback.

export const brandPalette = {
  /** Primary brand orange/amber */
  brand:       '#d97706',   // amber-600
  brandDark:   '#b45309',   // amber-700
  brandLight:  '#fbbf24',   // amber-400

  /** Secondary accent (rose / red) */
  accent:      '#e11d48',   // rose-600
  accentDark:  '#be123c',   // rose-700
  accentLight: '#fb7185',   // rose-400

  /** Neutral surfaces (dark mode) */
  slate900:    '#0f172a',
  slate800:    '#1e293b',
  slate700:    '#334155',

  /** Extended custom tokens from index.css */
  red650:      '#dc2626',
  rose650:     '#e11d48',
  purple650:   '#7c3aed',
  gray650:     '#4b5563',
  slate650:    '#475569',
  amber650:    '#d97706',
} as const;

// ─── 9. Combined Theme Utility Classes (static helper) ──────────────────────────
export const theme = {
  bg: {
    page:        'bg-orange-50 dark:bg-slate-900',
    surface:     'bg-white dark:bg-slate-900',
    surfaceAlt:  'bg-gray-50 dark:bg-slate-800/50',
    overlay:     'bg-black/40 dark:bg-black/60',
    input:       'bg-white dark:bg-slate-800',
    badge:       'bg-gray-100 dark:bg-slate-700',
    success:     'bg-green-50 dark:bg-green-950/30',
    warning:     'bg-amber-50 dark:bg-amber-950/30',
    danger:      'bg-rose-50 dark:bg-rose-950/30',
    info:        'bg-blue-50 dark:bg-blue-950/30',
    brand:       'bg-amber-500 dark:bg-amber-600',
    brandAlt:    'bg-rose-600 dark:bg-rose-700',
    
    // Brand primary orange/amber backgrounds
    brandPrimary: 'bg-[#904d00] dark:bg-amber-650',
    brandPrimaryHover: 'hover:bg-[#5c3100] dark:hover:bg-amber-600',
    brandSuccess: 'bg-[#006e0a] dark:bg-emerald-700',
    brandSuccessHover: 'hover:bg-emerald-800 dark:hover:bg-emerald-600',
  },
  text: {
    primary:   'text-gray-900 dark:text-slate-50',
    secondary: 'text-gray-700 dark:text-slate-350',
    muted:     'text-gray-500 dark:text-slate-500',
    inverted:  'text-white dark:text-slate-950',
    brand:     'text-amber-700 dark:text-amber-450',
    brandAlt:  'text-rose-600 dark:text-rose-450',
    success:   'text-green-700 dark:text-green-450',
    warning:   'text-amber-700 dark:text-amber-450',
    danger:    'text-rose-700 dark:text-rose-450',
    link:      'text-blue-600 dark:text-blue-450',
    
    // Brand primary orange/amber and success texts
    brandPrimary: 'text-[#904d00] dark:text-amber-450',
    brandSuccess: 'text-[#006e0a] dark:text-emerald-450',
  },
  border: {
    default: 'border-gray-200 dark:border-slate-800',
    subtle:  'border-gray-100 dark:border-slate-850',
    focus:   'border-blue-500 dark:border-blue-450',
    brand:   'border-amber-400 dark:border-amber-650',
    danger:  'border-rose-300 dark:border-rose-700',
    
    brandPrimary: 'border-[#904d00] dark:border-amber-650',
    brandSuccess: 'border-[#006e0a] dark:border-emerald-700',
  },
  btn: {
    primaryBg:      'bg-amber-600 dark:bg-amber-600',
    primaryText:    'text-white dark:text-white',
    primaryHover:   'hover:bg-amber-700 dark:hover:bg-amber-500',
    secondaryBg:    'bg-gray-100 dark:bg-slate-700',
    secondaryText:  'text-gray-700 dark:text-slate-100',
    secondaryHover: 'hover:bg-gray-200 dark:hover:bg-slate-650',
    dangerBg:       'bg-rose-600 dark:bg-rose-700',
    dangerText:     'text-white dark:text-white',
    dangerHover:    'hover:bg-rose-700 dark:hover:bg-rose-600',
  },
  nav: {
    bg:           'bg-white dark:bg-slate-900',
    activeBg:     'bg-orange-100 dark:bg-slate-800',
    activeText:   'text-orange-700 dark:text-amber-400',
    inactiveText: 'text-gray-500 dark:text-slate-400',
  },
  status: {
    pendiente:   'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
    preparacion: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300',
    listo:       'bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300',
    entregado:   'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400',
    cancelado:   'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300',
    credito:     'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300',
    pagado:      'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
  },
  catBgs: {
    bebidasFrias: 'bg-[#fffbeb] dark:bg-amber-950/20 hover:bg-[#fff2cc] dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-gray-805 dark:text-amber-200',
    frutas: 'bg-[#fff5f5] dark:bg-red-950/20 hover:bg-[#ffe3e3] dark:hover:bg-red-900/30 border-red-200 dark:border-red-800 text-gray-805 dark:text-red-200',
    tortas: 'bg-[#fffdf0] dark:bg-yellow-950/20 hover:bg-[#fef9c3] dark:hover:bg-yellow-900/30 border-yellow-250 dark:border-yellow-800 text-gray-805 dark:text-yellow-250',
    bebidasCalientes: 'bg-[#faf6f0] dark:bg-orange-950/20 hover:bg-[#eedfcc] dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-850 text-gray-805 dark:text-orange-200',
    comida: 'bg-[#fff8f2] dark:bg-orange-950/20 hover:bg-[#ffebd6] dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-gray-805 dark:text-orange-200',
    snacks: 'bg-[#f4fcf0] dark:bg-emerald-950/20 hover:bg-[#e1f5db] dark:hover:bg-emerald-900/30 border-emerald-250 dark:border-emerald-800 text-gray-850 dark:text-emerald-200',
    default: 'bg-[#fffcf9] dark:bg-slate-800 hover:bg-[#fdf3e9] dark:hover:bg-slate-750 border-orange-100 dark:border-slate-750 text-gray-805 dark:text-slate-200',
  }
};
