import { useAccessibility } from '../contexts/AccessibilityContext'
import { CloseIcon } from './Icons'
import './AccessibilityPanel.css'
import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface AccessibilityPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const { settings, updateSetting, resetSettings } = useAccessibility()
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Focus management: save trigger, move focus in, restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      first?.focus()
    } else {
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Focus trap + Escape to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter(el => !el.hasAttribute('disabled'))

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="a11y-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-title"
    >
      <div
        ref={panelRef}
        className="a11y-panel"
        onClick={e => e.stopPropagation()}
      >
        <header className="a11y-header">
          <h2 id="a11y-title">My Reading Settings</h2>
          <button
            className="a11y-close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="a11y-content">
          <section className="a11y-section">
            <h3>Words</h3>

            <div className="a11y-option">
              <label className="a11y-toggle">
                <input
                  type="checkbox"
                  checked={settings.dyslexiaFont}
                  onChange={e => updateSetting('dyslexiaFont', e.target.checked)}
                />
                <span className="toggle-switch"></span>
                <span className="toggle-label">
                  Special reading font
                  <small>Some people find this font easier to read</small>
                </span>
              </label>
            </div>

            <div className="a11y-option">
              <label className="a11y-label">Word Size</label>
              <div className="a11y-button-group">
                {(['normal', 'large', 'x-large'] as const).map(size => (
                  <button
                    key={size}
                    className={`a11y-btn ${settings.fontSize === size ? 'active' : ''}`}
                    onClick={() => updateSetting('fontSize', size)}
                    aria-pressed={settings.fontSize === size}
                  >
                    {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                  </button>
                ))}
              </div>
            </div>

            <div className="a11y-option">
              <label className="a11y-label">Space Between Lines</label>
              <div className="a11y-button-group">
                {(['normal', 'relaxed', 'loose'] as const).map(spacing => (
                  <button
                    key={spacing}
                    className={`a11y-btn ${settings.lineSpacing === spacing ? 'active' : ''}`}
                    onClick={() => updateSetting('lineSpacing', spacing)}
                    aria-pressed={settings.lineSpacing === spacing}
                  >
                    {spacing === 'normal' ? 'Normal' : spacing === 'relaxed' ? 'More' : 'Most'}
                  </button>
                ))}
              </div>
            </div>

            <div className="a11y-option">
              <label className="a11y-label">Space Between Letters</label>
              <div className="a11y-button-group">
                {(['normal', 'wide', 'wider'] as const).map(spacing => (
                  <button
                    key={spacing}
                    className={`a11y-btn text-btn ${settings.letterSpacing === spacing ? 'active' : ''}`}
                    onClick={() => updateSetting('letterSpacing', spacing)}
                    aria-pressed={settings.letterSpacing === spacing}
                  >
                    {spacing === 'normal' ? 'ab' : spacing === 'wide' ? 'a b' : 'a  b'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="a11y-section">
            <h3>Screen</h3>

            <div className="a11y-option">
              <label className="a11y-label">Colour Tint</label>
              <div className="a11y-overlay-grid">
                {[
                  { name: 'None', value: null, color: 'transparent' },
                  { name: 'Yellow', value: 'rgba(255, 255, 0, 0.15)', color: '#FFEB3B' },
                  { name: 'Blue', value: 'rgba(100, 149, 237, 0.15)', color: '#6495ED' },
                  { name: 'Pink', value: 'rgba(255, 182, 193, 0.15)', color: '#FFB6C1' },
                  { name: 'Green', value: 'rgba(144, 238, 144, 0.15)', color: '#90EE90' },
                  { name: 'Peach', value: 'rgba(255, 218, 185, 0.15)', color: '#FFDAB9' },
                ].map(opt => (
                  <button
                    key={opt.name}
                    className={`a11y-overlay-btn ${settings.overlay === opt.value ? 'active' : ''}`}
                    style={{
                      backgroundColor: opt.color,
                      border: opt.value === null ? '2px dashed #ccc' : undefined
                    }}
                    onClick={() => updateSetting('overlay', opt.value)}
                    aria-label={`${opt.name} tint`}
                    aria-pressed={settings.overlay === opt.value}
                    title={opt.name}
                  >
                    {opt.value === null && '✕'}
                  </button>
                ))}
              </div>
              <small className="a11y-hint">A coloured tint can make reading easier</small>
            </div>


            <div className="a11y-option">
              <label className="a11y-toggle">
                <input
                  type="checkbox"
                  checked={settings.largerClickTargets}
                  onChange={e => updateSetting('largerClickTargets', e.target.checked)}
                />
                <span className="toggle-switch"></span>
                <span className="toggle-label">
                  Bigger buttons
                  <small>Buttons will be bigger and easier to tap</small>
                </span>
              </label>
            </div>
          </section>
        </div>

        <footer className="a11y-footer">
          <button
            className="a11y-reset-btn"
            onClick={resetSettings}
          >
            Start again
          </button>
          <button
            className="a11y-save-btn"
            onClick={onClose}
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  )
}

export default AccessibilityPanel
