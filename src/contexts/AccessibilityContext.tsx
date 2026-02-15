import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AccessibilitySettings {
  dyslexiaFont: boolean
  fontSize: 'normal' | 'large' | 'x-large'
  lineSpacing: 'normal' | 'relaxed' | 'loose'
  letterSpacing: 'normal' | 'wide' | 'wider'
  colorMode: 'default' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'high-contrast' | 'dark'
  overlay: string | null
  reducedColors: boolean
  reducedMotion: boolean
  largerClickTargets: boolean
  screenReaderMode: boolean
  soundEffects: boolean
}

const defaultSettings: AccessibilitySettings = {
  dyslexiaFont: false,
  fontSize: 'normal',
  lineSpacing: 'normal',
  letterSpacing: 'normal',
  colorMode: 'default',
  overlay: null,
  reducedColors: false,
  reducedMotion: false,
  largerClickTargets: false,
  screenReaderMode: false,
  soundEffects: true,
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void
  resetSettings: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

const STORAGE_KEY = 'sheep-automata-accessibility'

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.warn('Failed to load accessibility settings:', e)
    }
    return defaultSettings
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (e) {
      console.warn('Failed to save accessibility settings:', e)
    }
  }, [settings])

  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    body.classList.toggle('dyslexia-font', settings.dyslexiaFont)
    root.setAttribute('data-font-size', settings.fontSize)
    root.setAttribute('data-line-spacing', settings.lineSpacing)
    root.setAttribute('data-letter-spacing', settings.letterSpacing)
    root.setAttribute('data-color-mode', settings.colorMode)
    body.classList.toggle('reduced-colors', settings.reducedColors)
    body.classList.toggle('reduced-motion', settings.reducedMotion)
    body.classList.toggle('larger-targets', settings.largerClickTargets)
    body.classList.toggle('sr-mode', settings.screenReaderMode)

    // honour system-level reduced-motion even if setting is off
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && !settings.reducedMotion) {
      body.classList.add('reduced-motion')
    }
  }, [settings])

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

export default AccessibilityContext
