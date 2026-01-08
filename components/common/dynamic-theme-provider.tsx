/**
 * Dynamic Theme Provider Component
 * Applique les variables CSS dynamiques du thème configuré
 */

'use client'

import { useEffect } from 'react'
import type { ThemeConfig } from '@/types/theme-config'
export { generateThemeCSS } from '@/lib/theme/generate-css'

interface DynamicThemeProviderProps {
  theme: ThemeConfig
  children: React.ReactNode
}

export function DynamicThemeProvider({ theme, children }: DynamicThemeProviderProps) {
  useEffect(() => {
    // Appliquer les variables CSS au root
    applyThemeVariables(theme)
  }, [theme])

  return <>{children}</>
}

/**
 * Applique les variables CSS du thème
 */
function applyThemeVariables(theme: ThemeConfig) {
  const root = document.documentElement

  // Appliquer le mode (light/dark/auto)
  if (theme.mode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme.mode === 'dark')
  }

  // Déterminer quelle palette utiliser
  const isDark = root.classList.contains('dark')
  const colorPalette = isDark ? theme.dark : theme.light

  // Appliquer les couleurs
  Object.entries(colorPalette).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    root.style.setProperty(cssVar, value)
  })

  // Appliquer la typographie
  if (theme.typography) {
    root.style.setProperty('--font-family', theme.typography.fontFamily)
    root.style.setProperty('--font-family-heading', theme.typography.fontFamilyHeading)
    root.style.setProperty('--font-family-mono', theme.typography.fontFamilyMono)

    // Tailles de police
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value)
    })

    // Poids de police
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value)
    })

    // Hauteur de ligne
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value)
    })
  }

  // Appliquer l'espacement
  if (theme.spacing) {
    // Border radius
    Object.entries(theme.spacing.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value)
    })

    // Spacing
    Object.entries(theme.spacing.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value)
    })
  }
}
