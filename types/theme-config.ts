/**
 * Theme Configuration Types
 * Système de personnalisation des couleurs et styles du site
 */

export interface ColorPalette {
  // Couleurs principales
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  
  // Couleurs d'arrière-plan
  background: string
  foreground: string
  
  // Couleurs de carte/surface
  card: string
  cardForeground: string
  
  // Couleurs de bordure
  border: string
  input: string
  ring: string
  
  // États
  muted: string
  mutedForeground: string
  destructive: string
  destructiveForeground: string
  
  // Couleurs spécifiques
  success: string
  warning: string
  info: string
}

export interface TypographyConfig {
  // Familles de polices
  fontFamily: string
  fontFamilyHeading: string
  fontFamilyMono: string
  
  // Tailles de base
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
  }
  
  // Poids des polices
  fontWeight: {
    light: string
    normal: string
    medium: string
    semibold: string
    bold: string
  }
  
  // Hauteur de ligne
  lineHeight: {
    tight: string
    normal: string
    relaxed: string
  }
}

export interface SpacingConfig {
  // Bordures
  borderRadius: {
    none: string
    sm: string
    md: string
    lg: string
    xl: string
    full: string
  }
  
  // Espacement
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
}

export interface ThemeConfig {
  // Nom du thème
  name: string
  
  // Mode
  mode: 'light' | 'dark' | 'auto'
  
  // Palettes de couleurs
  light: ColorPalette
  dark: ColorPalette
  
  // Typographie
  typography: TypographyConfig
  
  // Espacement et bordures
  spacing: SpacingConfig
  
  // Métadonnées
  createdAt?: Date
  updatedAt?: Date
}

// Thème par défaut
export const defaultTheme: ThemeConfig = {
  name: 'Default',
  mode: 'light',
  
  light: {
    primary: '222.2 47.4% 11.2%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
    background: '0 0% 100%',
    foreground: '222.2 47.4% 11.2%',
    card: '0 0% 100%',
    cardForeground: '222.2 47.4% 11.2%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 46.9%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '210 40% 98%',
    success: '142.1 76.2% 36.3%',
    warning: '38 92% 50%',
    info: '221.2 83.2% 53.3%',
  },
  
  dark: {
    primary: '210 40% 98%',
    primaryForeground: '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    accent: '217.2 32.6% 17.5%',
    accentForeground: '210 40% 98%',
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '212.7 26.8% 83.9%',
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 20.2% 65.1%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '210 40% 98%',
    success: '142.1 70.6% 45.3%',
    warning: '38 92% 50%',
    info: '217.2 91.2% 59.8%',
  },
  
  typography: {
    fontFamily: 'var(--font-sans)',
    fontFamilyHeading: 'var(--font-sans)',
    fontFamilyMono: 'var(--font-mono)',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  
  spacing: {
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
  },
}
