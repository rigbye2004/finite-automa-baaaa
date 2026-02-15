import { useState } from 'react'
import { GameProgressProvider, useGameProgress } from './contexts/GameProgressContext'
import { AccessibilityProvider, useAccessibility } from './contexts/AccessibilityContext'
import AcceptRejectLevel from './AcceptRejectLevel'
import DragLevel from './DragLevel'
import BuildLevel from './BuildLevel'
import BadgeCollection from './components/BadgeCollection'

import AccessibilityPanel from './components/AccessibilityPanel'
import DevTools from './components/DevTools'
import './App.css'
import './accessibility.css'
import './components/AccessibilityPanel.css'
import './components/DevTools.css'

const UNLOCK_ALL_KEY = 'sheep-automata-unlock-all'

function AppContent() {
  const [level, setLevel] = useState<'menu' | 'accept-reject' | 'drag' | 'build'>('menu')
  const [showBadges, setShowBadges] = useState(false)
  const [showAccessibility, setShowAccessibility] = useState(false)
  const [lockedMessage, setLockedMessage] = useState<string | null>(null)

  const { totalStars, getEarnedBadges, getLevelProgress } = useGameProgress()
  const { settings } = useAccessibility()
  
  const earnedBadges = getEarnedBadges()
  const level1Progress = getLevelProgress('accept-reject')
  const level2Progress = getLevelProgress('drag')
  const level3Progress = getLevelProgress('build')

  const devUnlockAll = localStorage.getItem(UNLOCK_ALL_KEY) === 'true'
  const level2Unlocked = devUnlockAll ||
    (level1Progress && (level1Progress.bestStars >= 1 || level1Progress.completedQuestions >= 5))
  const level3Unlocked = devUnlockAll ||
    (level2Progress && (level2Progress.bestStars >= 1 || level2Progress.completedQuestions >= 5))

  const handleLevelClick = (targetLevel: 'accept-reject' | 'drag' | 'build') => {
    if (targetLevel === 'drag' && !level2Unlocked) {
      setLockedMessage('Complete Stage 1 first to unlock this stage!')
      setTimeout(() => setLockedMessage(null), 3000)
      return
    }
    if (targetLevel === 'build' && !level3Unlocked) {
      setLockedMessage('Complete Stage 2 first to unlock this stage!')
      setTimeout(() => setLockedMessage(null), 3000)
      return
    }
    setLevel(targetLevel)
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {settings.overlay && (
        <div 
          className="color-overlay" 
          style={{ backgroundColor: settings.overlay }}
          aria-hidden="true"
        />
      )}

      <main id="main-content">
        {level === 'accept-reject' && (
          <AcceptRejectLevel onBack={() => setLevel('menu')} />
        )}

        {level === 'drag' && (
          <DragLevel onBack={() => setLevel('menu')} />
        )}

        {level === 'build' && (
          <BuildLevel onBack={() => setLevel('menu')} />
        )}

        {level === 'menu' && (
          <div className="menu-screen" role="main" aria-label="Game Menu">
            <div className="menu-progress">
              <button 
                className="progress-btn" 
                onClick={() => setShowBadges(true)}
                aria-label={`View badges: ${earnedBadges.length} badges`}
              >
                <span className="progress-badges" aria-hidden="true">🏅 {earnedBadges.length} badges</span>
              </button>
            </div>

            <header className="menu-header">
              <img 
                src="/sheep-assets/sheep-3.svg" 
                width={60} 
                height={60} 
                alt="" 
                aria-hidden="true"
              />
              <h1>Finite Automa-baaa</h1>
              <img 
                src="/sheep-assets/sheep-8.svg" 
                width={60} 
                height={60} 
                alt="" 
                aria-hidden="true"
              />
            </header>
            
            <p className="menu-subtitle">Help the farmer fall asleep by guiding sheep!</p>
            
            <div className="menu-farmer" aria-hidden="true">
              <img 
                src="/sheep-assets/asleep-farmer.svg" 
                width={100} 
                height={100} 
                alt="Sleeping farmer" 
              />
            </div>

            {lockedMessage && (
              <div 
                className="locked-toast" 
                role="alert"
                aria-live="polite"
              >
                {lockedMessage}
              </div>
            )}

            <nav className="menu-buttons" aria-label="Game levels">
              <button
                className="level-btn level-1" 
                onClick={() => handleLevelClick('accept-reject')}
                aria-describedby="level1-desc"
              >
                <span className="level-btn-text">Stage 1: Accept or Reject</span>
                <span className="level-btn-desc" id="level1-desc">Can the sheep reach the farmer?</span>
                <span className="level-btn-sheep" aria-label={`${level1Progress?.bestStars ?? 0} out of 3 stars`}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span key={i} className={i < (level1Progress?.bestStars ?? 0) ? 'star-earned' : 'star-unearned'} aria-hidden="true">
                      {i < (level1Progress?.bestStars ?? 0) ? '⭐' : '☆'}
                    </span>
                  ))}
                </span>
              </button>

              {/* Stage 2: Place the Sheep (Drag) */}
              <button 
                className={`level-btn level-2 ${!level2Unlocked ? 'locked' : ''}`}
                onClick={() => handleLevelClick('drag')}
                aria-describedby="level2-desc"
                aria-disabled={!level2Unlocked}
              >
                {!level2Unlocked && (
                  <span className="level-lock-icon" aria-hidden="true">Locked</span>
                )}
                <span className="level-btn-text">Stage 2: Place the Sheep</span>
                <span className="level-btn-desc" id="level2-desc">
                  {level2Unlocked ? 'Put the right sheep on each arrow!' : 'Complete Stage 1 to unlock'}
                </span>
                <span className="level-btn-sheep" aria-label={`${level2Progress?.bestStars ?? 0} out of 3 stars`}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span key={i} className={i < (level2Progress?.bestStars ?? 0) ? 'star-earned' : 'star-unearned'} aria-hidden="true">
                      {i < (level2Progress?.bestStars ?? 0) ? '⭐' : '☆'}
                    </span>
                  ))}
                </span>
              </button>

              <button
                className={`level-btn level-3 ${!level3Unlocked ? 'locked' : ''}`}
                onClick={() => handleLevelClick('build')}
                aria-describedby="level3-desc"
                aria-disabled={!level3Unlocked}
              >
                {!level3Unlocked && (
                  <span className="level-lock-icon" aria-hidden="true">Locked</span>
                )}
                <span className="level-btn-text">Stage 3: Build Your Own</span>
                <span className="level-btn-desc" id="level3-desc">
                  {level3Unlocked ? 'Draw your own sheep path!' : 'Complete Stage 2 to unlock'}
                </span>
                <span className="level-btn-sheep" aria-label={`${level3Progress?.bestStars ?? 0} out of 3 stars`}>
                  {Array.from({ length: 3 }, (_, i) => (
                    <span key={i} className={i < (level3Progress?.bestStars ?? 0) ? 'star-earned' : 'star-unearned'} aria-hidden="true">
                      {i < (level3Progress?.bestStars ?? 0) ? '⭐' : '☆'}
                    </span>
                  ))}
                </span>
              </button>
            </nav>

          </div>
        )}
      </main>

      {showBadges && (
        <BadgeCollection onClose={() => setShowBadges(false)} />
      )}

      <AccessibilityPanel
        isOpen={showAccessibility}
        onClose={() => setShowAccessibility(false)}
      />

      <button
        className="accessibility-btn"
        onClick={() => setShowAccessibility(true)}
        aria-label="Open accessibility settings"
        title="Accessibility Settings"
      >
        <span className="accessibility-icon">Aa</span>
      </button>

      <DevTools enabled={true} />
    </>
  )
}

function App() {
  return (
    <AccessibilityProvider>
      <GameProgressProvider>
        <AppContent />
      </GameProgressProvider>
    </AccessibilityProvider>
  )
}

export default App
