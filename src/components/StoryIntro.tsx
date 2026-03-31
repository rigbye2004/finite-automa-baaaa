import { useState, useEffect } from 'react'
import { withBase } from '../withBase'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { speakNarration, stopNarration } from '../utils/sounds'
import './StoryIntro.css'

const INTRO_SEEN_KEY = 'sheep-automata-story-intro-seen'

export function hasSeenIntro(): boolean {
  return localStorage.getItem(INTRO_SEEN_KEY) === 'true'
}

export function markIntroSeen(): void {
  localStorage.setItem(INTRO_SEEN_KEY, 'true')
}

const PANEL_TITLES = [
  'Meet the farmer!',
  'Sheep follow arrows',
  'You decide!',
]

const PANEL_TEXTS = [
  "This farmer can't sleep! The sheep keep getting lost on their way to the bed.",
  "Sheep travel along arrows. Follow the right path to the bed and the farmer falls asleep!",
  "Look at the arrows and decide. Does the sheep reach the farmer's bed?",
]

function Panel0() {
  return (
    <div className="story-illus">
      <img src={withBase('sheep-assets/awake-farmer.svg')} width={130} height={100} alt="awake farmer" draggable={false} />
    </div>
  )
}

function Panel1() {
  return (
    <div className="story-illus story-path-row">
      <img src={withBase('sheep-assets/sheep-3.svg')} width={72} height={72} alt="sheep" draggable={false} />
      <div className="story-arrow" aria-hidden="true">→</div>
      <img src={withBase('sheep-assets/asleep-farmer.svg')} width={96} height={76} alt="sleeping farmer" draggable={false} />
    </div>
  )
}

function Panel2() {
  return (
    <div className="story-illus story-btns-row">
      <div className="story-mock-btn story-mock-accept">😴 Falls Asleep</div>
      <div className="story-mock-btn story-mock-reject">👀 Stays Awake</div>
    </div>
  )
}

const PANELS = [Panel0, Panel1, Panel2]

export function StoryIntro({ onDone }: { onDone: () => void }) {
  const [panel, setPanel] = useState(0)
  const { settings } = useAccessibility()
  const isLast = panel === PANELS.length - 1
  const PanelContent = PANELS[panel]

  useEffect(() => {
    if (settings.narration) speakNarration(PANEL_TEXTS[panel])
  }, [panel, settings.narration])

  useEffect(() => {
    return () => stopNarration()
  }, [])

  return (
    <div className="demo-overlay">
      <div className="story-intro-scene" onClick={e => e.stopPropagation()}>

        <div className="demo-title-bar">
          <span className="demo-title">{PANEL_TITLES[panel]}</span>
        </div>

        <div className="story-intro-content">
          <PanelContent />
          <p className="story-intro-text">{PANEL_TEXTS[panel]}</p>
        </div>

        <div className="demo-bottom-bar">
          <div className="story-dots">
            {PANELS.map((_, i) => (
              <div key={i} className={`story-dot${i === panel ? ' story-dot-active' : ''}`} />
            ))}
          </div>
          {isLast ? (
            <button className="story-nav-btn story-nav-primary" onClick={onDone}>
              Let's play! 🐑
            </button>
          ) : (
            <button className="story-nav-btn story-nav-secondary" onClick={() => setPanel(p => p + 1)}>
              Next →
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
