import { useState, useEffect, useCallback } from 'react'
import './DevTools.css'

const UNLOCK_ALL_KEY = 'sheep-automata-unlock-all'
const DEV_MODE_KEY = 'sheep-automata-dev-mode'

interface DevToolsProps {
  enabled?: boolean
}

export function DevTools({ enabled = true }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [levelsUnlocked, setLevelsUnlocked] = useState(
    localStorage.getItem(UNLOCK_ALL_KEY) === 'true'
  )
  const [devModeEnabled, setDevModeEnabled] = useState(
    localStorage.getItem(DEV_MODE_KEY) === 'true'
  )

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault()
      const newValue = !devModeEnabled
      if (newValue) {
        localStorage.setItem(DEV_MODE_KEY, 'true')
      } else {
        localStorage.removeItem(DEV_MODE_KEY)
      }
      setDevModeEnabled(newValue)
    }
  }, [devModeEnabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!enabled) return null

  const handleOpen = () => {
    setIsOpen(true)
    setLevelsUnlocked(localStorage.getItem(UNLOCK_ALL_KEY) === 'true')
  }

  const handleClearAllProgress = () => {
    if (confirm('This will reset all game progress including stars, badges, and tutorials. Continue?')) {
      localStorage.clear()
      setSeenList([])
      setLevelsUnlocked(false)
      alert('Progress cleared. Refresh the page.')
    }
  }

  const handleToggleUnlockLevels = () => {
    const newValue = !levelsUnlocked
    if (newValue) {
      localStorage.setItem(UNLOCK_ALL_KEY, 'true')
    } else {
      localStorage.removeItem(UNLOCK_ALL_KEY)
    }
    setLevelsUnlocked(newValue)
  }

  const handleToggleDevMode = () => {
    const newValue = !devModeEnabled
    if (newValue) {
      localStorage.setItem(DEV_MODE_KEY, 'true')
    } else {
      localStorage.removeItem(DEV_MODE_KEY)
      setIsOpen(false)
    }
    setDevModeEnabled(newValue)
  }

  return (
    <>
      {devModeEnabled && (
        <button 
          className="devtools-trigger"
          onClick={handleOpen}
          title="Developer Tools"
          aria-label="Open developer tools"
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            style={{ width: '1.2em', height: '1.2em' }}
            aria-hidden="true"
          >
            <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
          </svg>
        </button>
      )}

      {devModeEnabled && isOpen && (
        <div className="devtools-overlay" onClick={() => setIsOpen(false)}>
          <div className="devtools-modal" onClick={e => e.stopPropagation()}>
            <div className="devtools-header">
              <h2>Dev Tools</h2>
              <button className="devtools-close" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="devtools-content">
              <section className="devtools-section devtools-section-highlight">
                <h3>Dev Mode</h3>
                <div className="devtools-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={devModeEnabled}
                      onChange={handleToggleDevMode}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">
                      {devModeEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
                <p className="devtools-note">
                  When disabled, the dev tools button will be hidden. Use <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> to toggle.
                </p>
              </section>

              <section className="devtools-section">
                <h3>Level Access</h3>
                <div className="devtools-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={levelsUnlocked}
                      onChange={handleToggleUnlockLevels}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">
                      {levelsUnlocked ? 'All levels unlocked' : 'Progressive unlock'}
                    </span>
                  </label>
                </div>
                <p className="devtools-note">
                  When unlocked, all levels are accessible without completing previous ones.
                </p>
              </section>

              <section className="devtools-section">
                <h3>Data</h3>
                <div className="devtools-buttons">
                  <button className="devtools-btn danger" onClick={handleClearAllProgress}>
                    Clear All Progress
                  </button>
                </div>
                <p className="devtools-note">
                  Clears stars, badges, tutorials, and all saved data.
                </p>
              </section>

              <section className="devtools-section">
                <h3>Info</h3>
                <div className="devtools-info">
                  <p><strong>LocalStorage keys:</strong> {Object.keys(localStorage).length}</p>
                </div>
              </section>
            </div>

            <div className="devtools-footer">
              <p>ESC or click outside to close | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> toggles dev mode</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DevTools
