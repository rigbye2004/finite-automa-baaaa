import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import './BadgePopup.css'

export interface Badge {
  id: string
  name: string
  description: string
  icon?: string
}

interface BadgePopupProps {
  badges: Badge[]
  onClose: () => void
}

const HIDE_BADGES_KEY = 'sheep-automata-hide-badges'
const TOAST_DURATION = 3500 // ms before auto-dismiss

export function areBadgesDisabled(): boolean {
  try {
    return localStorage.getItem(HIDE_BADGES_KEY) === 'true'
  } catch {
    return false
  }
}

export function enableBadges(): void {
  try {
    localStorage.removeItem(HIDE_BADGES_KEY)
  } catch {
    // Ignore
  }
}

export function BadgePopup({ badges, onClose }: BadgePopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exiting, setExiting] = useState(false)

  // stable ref so the timer doesn't reset on parent re-renders
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  const uniqueBadges = useMemo(() =>
    badges.filter((badge, index, self) =>
      index === self.findIndex(b => b.id === badge.id)
    ),
    [badges]
  )

  useEffect(() => {
    setCurrentIndex(prev => Math.min(prev, uniqueBadges.length - 1))
    setExiting(false)
  }, [uniqueBadges.length])

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => {
      setCurrentIndex(prev => {
        const isLast = prev >= uniqueBadges.length - 1
        if (isLast) {
          onCloseRef.current()
          return prev
        }
        setExiting(false)
        return prev + 1
      })
    }, 300) // match exit animation
  }, [uniqueBadges.length])

  useEffect(() => {
    if (uniqueBadges.length === 0 || areBadgesDisabled()) return
    const timer = setTimeout(dismiss, TOAST_DURATION)
    return () => clearTimeout(timer)
  }, [currentIndex, uniqueBadges, dismiss])

  if (uniqueBadges.length === 0 || areBadgesDisabled()) return null

  const currentBadge = uniqueBadges[currentIndex]
  if (!currentBadge) return null

  return (
    <div
      className={`badge-toast ${exiting ? 'badge-toast-exit' : ''}`}
      onClick={dismiss}
      role="status"
      aria-live="polite"
    >
      <div className="badge-toast-icon">
        {currentBadge.icon || '⭐'}
      </div>
      <div className="badge-toast-text">
        <span className="badge-toast-title">{currentBadge.name}</span>
        <span className="badge-toast-desc">{currentBadge.description}</span>
      </div>
      {uniqueBadges.length > 1 && (
        <span className="badge-toast-count">
          {currentIndex + 1}/{uniqueBadges.length}
        </span>
      )}
    </div>
  )
}

export default BadgePopup
