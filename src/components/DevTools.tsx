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

  const toggleUnlock = () => {
    const next = !levelsUnlocked
    if (next) localStorage.setItem(UNLOCK_ALL_KEY, 'true')
    else localStorage.removeItem(UNLOCK_ALL_KEY)
    setLevelsUnlocked(next)
  }

  const toggleDevMode = () => {
    const next = !devModeEnabled
    if (next) localStorage.setItem(DEV_MODE_KEY, 'true')
    else { localStorage.removeItem(DEV_MODE_KEY); setIsOpen(false) }
    setDevModeEnabled(next)
  }

  const clearProgress = () => {
    if (confirm('Reset all progress?')) {
      localStorage.clear()
      setLevelsUnlocked(false)
      alert('Cleared. Refresh the page.')
    }
  }

  return (
    <>
      {devModeEnabled && (
        <button className="devtools-trigger" onClick={() => setIsOpen(true)}>
          Dev
        </button>
      )}

      {devModeEnabled && isOpen && (
        <div className="devtools-overlay" onClick={() => setIsOpen(false)}>
          <div className="devtools-panel" onClick={e => e.stopPropagation()}>
            <div className="devtools-row">
              <label>
                <input type="checkbox" checked={devModeEnabled} onChange={toggleDevMode} />
                Dev mode
              </label>
            </div>
            <div className="devtools-row">
              <label>
                <input type="checkbox" checked={levelsUnlocked} onChange={toggleUnlock} />
                Unlock all levels
              </label>
            </div>
            <div className="devtools-row">
              <button className="devtools-clear" onClick={clearProgress}>Clear progress</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DevTools
