import { useState, useEffect, useRef } from 'react'
import './BadgeNotch.css'

interface BadgeInfo {
  id: string
  name: string
  description: string
  icon?: string
}

interface BadgeNotchProps {
  badges: BadgeInfo[]
}

const STORAGE_KEY = 'sheep-dismissed-badges'

function loadDismissed(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return new Set(stored ? JSON.parse(stored) : [])
  } catch {
    return new Set()
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

export default function BadgeNotch({ badges }: BadgeNotchProps) {
  const [pulse, setPulse] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(loadDismissed)
  const prevCountRef = useRef(badges.length)

  const visibleBadges = badges.filter(b => !dismissedIds.has(b.id))

  useEffect(() => {
    if (badges.length > prevCountRef.current) {
      setPulse(true)
      const timer = setTimeout(() => setPulse(false), 600)
      prevCountRef.current = badges.length
      return () => clearTimeout(timer)
    }
    prevCountRef.current = badges.length
  }, [badges.length])

  // Close popup when clicking outside
  useEffect(() => {
    if (!showPopup) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.badge-notch')) {
        setShowPopup(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showPopup])

  const handleClearAll = () => {
    const newDismissed = new Set([...dismissedIds, ...badges.map(b => b.id)])
    setDismissedIds(newDismissed)
    saveDismissed(newDismissed)
    setShowPopup(false)
  }

  if (visibleBadges.length === 0) return null

  const latest = visibleBadges[visibleBadges.length - 1]

  return (
    <div className={`badge-notch${pulse ? ' badge-notch-pulse' : ''}`}>
      <button
        className="badge-notch-icon"
        onClick={() => setShowPopup(prev => !prev)}
        aria-label={`${visibleBadges.length} badge${visibleBadges.length > 1 ? 's' : ''} earned`}
      >
        {latest.icon || '⭐'}
      </button>
      {visibleBadges.length > 1 && (
        <span className="badge-notch-count">{visibleBadges.length}</span>
      )}
      {showPopup && (
        <div className="badge-notch-popup">
          <h4 className="badge-notch-popup-title">Badges Earned</h4>
          <div className="badge-notch-popup-list">
            {visibleBadges.map(badge => (
              <div key={badge.id} className="badge-notch-popup-item">
                <span className="badge-notch-popup-icon">{badge.icon || '⭐'}</span>
                <div className="badge-notch-popup-text">
                  <span className="badge-notch-popup-name">{badge.name}</span>
                  <span className="badge-notch-popup-desc">{badge.description}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="badge-notch-popup-footer">
            <button className="badge-notch-clear-btn" onClick={handleClearAll}>
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
