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

export default function BadgeNotch({ badges }: BadgeNotchProps) {
  const [pulse, setPulse] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const prevCountRef = useRef(badges.length)

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

  if (badges.length === 0) return null

  const latest = badges[badges.length - 1]

  return (
    <div className={`badge-notch${pulse ? ' badge-notch-pulse' : ''}`}>
      <button
        className="badge-notch-icon"
        onClick={() => setShowPopup(prev => !prev)}
        aria-label={`${badges.length} badge${badges.length > 1 ? 's' : ''} earned`}
      >
        {latest.icon || '⭐'}
      </button>
      {badges.length > 1 && (
        <span className="badge-notch-count">{badges.length}</span>
      )}
      {showPopup && (
        <div className="badge-notch-popup">
          <h4 className="badge-notch-popup-title">Badges Earned</h4>
          {badges.map(badge => (
            <div key={badge.id} className="badge-notch-popup-item">
              <span className="badge-notch-popup-icon">{badge.icon || '⭐'}</span>
              <div className="badge-notch-popup-text">
                <span className="badge-notch-popup-name">{badge.name}</span>
                <span className="badge-notch-popup-desc">{badge.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
