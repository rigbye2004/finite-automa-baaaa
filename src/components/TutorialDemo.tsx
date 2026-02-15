import { useEffect, useState, useRef } from 'react'
import { withBase } from '../withBase'
import './TutorialDemo.css'

// each demo auto-shows once; after that it's hint-button only
const SEEN_DEMOS_KEY = 'sheep-automata-seen-demos'

export function hasSeenDemo(demoId: DemoConcept): boolean {
  try {
    const saved = localStorage.getItem(SEEN_DEMOS_KEY)
    const set: Set<string> = saved ? new Set(JSON.parse(saved)) : new Set()
    return set.has(demoId)
  } catch { return false }
}

export function markDemoSeen(demoId: DemoConcept) {
  try {
    const saved = localStorage.getItem(SEEN_DEMOS_KEY)
    const set: Set<string> = saved ? new Set(JSON.parse(saved)) : new Set()
    set.add(demoId)
    localStorage.setItem(SEEN_DEMOS_KEY, JSON.stringify([...set]))
  } catch { /* ignore */ }
}

export function resetSeenDemos() {
  localStorage.removeItem(SEEN_DEMOS_KEY)
}

function CursorIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <path d="M7 2L7 18.5L11 14.5L14.5 21L16.5 20L13 13.5L18 13.5Z" fill="#222" stroke="#fff" strokeWidth="1"/>
    </svg>
  )
}

function FenceIcon({ size = 52 }: { size?: number }) {
  const h = size * 0.86
  return (
    <svg width={size} height={h} viewBox="0 0 44 38" fill="none">
      <rect x="2" y="2" width="7" height="36" rx="1.5" fill="#8B4513" stroke="#5D3A1A" strokeWidth="0.8"/>
      <rect x="35" y="2" width="7" height="36" rx="1.5" fill="#8B4513" stroke="#5D3A1A" strokeWidth="0.8"/>
      <rect x="8" y="6" width="28" height="5" rx="1" fill="#A0522D" stroke="#8B4513" strokeWidth="0.5"/>
      <rect x="8" y="16" width="28" height="5" rx="1" fill="#A0522D" stroke="#8B4513" strokeWidth="0.5"/>
      <rect x="8" y="26" width="28" height="5" rx="1" fill="#A0522D" stroke="#8B4513" strokeWidth="0.5"/>
    </svg>
  )
}

function ClickRipple() {
  return <div className="demo-ripple" />
}

function HArrow({ w = 160, h = 20, color = '#666' }: { w?: number; h?: number; color?: string }) {
  const mid = h / 2
  const tip = 12
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <line x1="2" y1={mid} x2={w - tip} y2={mid} stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d={`M${w - tip - 2},${mid - 6} L${w - 2},${mid} L${w - tip - 2},${mid + 6}`} fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

function DiagArrow({ w = 100, h = 60, dir = 'down', color = '#666' }: { w?: number; h?: number; dir?: 'up' | 'down'; color?: string }) {
  const pad = 6
  const x1 = pad, x2 = w - pad
  const y1 = dir === 'down' ? pad : h - pad
  const y2 = dir === 'down' ? h - pad : pad
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const al = 9
  const aw = 5
  const bx = x2 - al * Math.cos(angle)
  const by = y2 - al * Math.sin(angle)
  const px = -Math.sin(angle) * aw
  const py = Math.cos(angle) * aw
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d={`M${bx + px},${by + py} L${x2},${y2} L${bx - px},${by - py}`} fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

function LoopArrow({ w = 56, h = 48, color = '#666' }: { w?: number; h?: number; color?: string }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path
        d={`M${w * 0.2},${h * 0.9} C${-w * 0.05},${h * 0.15} ${w * 1.05},${h * 0.15} ${w * 0.8},${h * 0.9}`}
        fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"
      />
      <path
        d={`M${w * 0.72},${h * 0.78} L${w * 0.84},${h * 0.95} L${w * 0.68},${h * 0.97}`}
        fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  )
}

function StartMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <path d="M3,3 L17,10 L3,17Z" fill="#4CAF50" stroke="#388E3C" strokeWidth="0.8" strokeLinejoin="round"/>
    </svg>
  )
}

function ConnectingDemo() {
  return (
    <div className="demo-scene-inner demo-connecting">
      {/* Combined From/To split button */}
      <div className="demo-el demo-connect-btn">
        <span className="demo-c-from">
          <svg width={22} height={22} viewBox="0 0 36 36" fill="none">
            <circle cx="10" cy="18" r="5.5" stroke="currentColor" strokeWidth="2.2" fill="none"/>
            <line x1="15.5" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          From
        </span>
        <span className="demo-c-divider" />
        <span className="demo-c-to">
          <svg width={22} height={22} viewBox="0 0 36 36" fill="none">
            <line x1="2" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <polygon points="22,11 33,18 22,25" fill="currentColor"/>
          </svg>
          To
        </span>
      </div>
      <div className="demo-el demo-fence-a"><FenceIcon size={60} /></div>
      <div className="demo-el demo-fence-b"><FenceIcon size={60} /></div>
      <div className="demo-el demo-start-arrow"><StartMark size={24} /></div>
      <div className="demo-el demo-glow-a"><ClickRipple /></div>
      <div className="demo-el demo-glow-b"><ClickRipple /></div>
      <div className="demo-el demo-dotted-line" />
      <div className="demo-el demo-arrow"><HArrow w={164} /></div>
      <div className="demo-el demo-q-label">?</div>
      <div className="demo-el demo-check">✓</div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
    </div>
  )
}

function SetAcceptingDemo() {
  return (
    <div className="demo-scene-inner demo-set-accepting">
      <div className="demo-el demo-sidebar-panel" />
      <div className="demo-el demo-drop-zone" />
      <img className="demo-el demo-bed-icon" src={withBase("sheep-assets/awake-farmer.svg")} width={52} height={40} alt="" />
      <img className="demo-el demo-bed-dragging" src={withBase("sheep-assets/awake-farmer.svg")} width={52} height={40} alt="" />
      <div className="demo-el demo-new-fence"><FenceIcon size={60} /></div>
      <div className="demo-el demo-accepting-ring" />
      <img className="demo-el demo-bed-placed" src={withBase("sheep-assets/awake-farmer.svg")} width={40} height={32} alt="" />
      <div className="demo-el demo-check">✓</div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
    </div>
  )
}

function AddStateDemo() {
  return (
    <div className="demo-scene-inner demo-add-state">
      <div className="demo-el demo-sidebar-panel" />
      <div className="demo-el demo-ghost-fence"><FenceIcon size={60} /></div>
      <div className="demo-el demo-toolbar-fence"><FenceIcon size={48} /></div>
      <div className="demo-el demo-fence-dragging"><FenceIcon size={56} /></div>
      <div className="demo-el demo-fence-landed"><FenceIcon size={60} /></div>
      <div className="demo-el demo-check">✓</div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
    </div>
  )
}

function PlaceSheepDemo() {
  return (
    <div className="demo-scene-inner demo-place-sheep">
      <div className="demo-el demo-sidebar-panel" />
      <div className="demo-el demo-fence-a"><FenceIcon size={56} /></div>
      <div className="demo-el demo-fence-b"><FenceIcon size={56} /></div>
      <div className="demo-el demo-arrow"><HArrow w={167} /></div>
      <div className="demo-el demo-toolbar-sheep">
        <img src={withBase("sheep-assets/sheep-7.svg")} width={44} height={44} alt="" draggable={false} />
      </div>
      <img className="demo-el demo-sheep-placed" src={withBase("sheep-assets/sheep-7.svg")} width={44} height={44} alt="" />
      <div className="demo-el demo-glow-sheep"><ClickRipple /></div>
      <div className="demo-el demo-glow-arrow"><ClickRipple /></div>
      <div className="demo-el demo-check">✓</div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
    </div>
  )
}

function BuildLoopDemo() {
  return (
    <div className="demo-scene-inner demo-build-loop">
      {/* Combined From/To split button */}
      <div className="demo-el demo-connect-btn">
        <span className="demo-c-from">
          <svg width={22} height={22} viewBox="0 0 36 36" fill="none">
            <circle cx="10" cy="18" r="5.5" stroke="currentColor" strokeWidth="2.2" fill="none"/>
            <line x1="15.5" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          From
        </span>
        <span className="demo-c-divider" />
        <span className="demo-c-to">
          <svg width={22} height={22} viewBox="0 0 36 36" fill="none">
            <line x1="2" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <polygon points="22,11 33,18 22,25" fill="currentColor"/>
          </svg>
          To
        </span>
      </div>
      <div className="demo-el demo-fence-a"><FenceIcon size={60} /></div>
      <div className="demo-el demo-glow-a1"><ClickRipple /></div>
      <div className="demo-el demo-glow-a2"><ClickRipple /></div>
      <div className="demo-el demo-loop-arrow"><LoopArrow w={64} h={52} /></div>
      <div className="demo-el demo-q-label">?</div>
      <div className="demo-el demo-check">✓</div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
    </div>
  )
}

function TracePathDemo() {
  return (
    <div className="demo-scene-inner demo-trace-path">
      <div className="demo-el demo-pattern-accept">
        <span className="demo-pattern-label">Pattern to match:</span>
        <img src={withBase("sheep-assets/sheep-7.svg")} width={28} height={28} alt="" />
        <span className="demo-pattern-arrow">→</span>
        <img src={withBase("sheep-assets/sheep-8.svg")} width={28} height={28} alt="" />
      </div>
      <div className="demo-el demo-pattern-reject">
        <span className="demo-pattern-label">Pattern to match:</span>
        <img src={withBase("sheep-assets/sheep-13.svg")} width={28} height={28} alt="" />
      </div>
      <div className="demo-el demo-fence-a"><FenceIcon size={46} /></div>
      <div className="demo-el demo-fence-b"><FenceIcon size={46} /></div>
      <div className="demo-el demo-fence-c">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={46} height={36} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark /></div>
      <div className="demo-el demo-arrow-1"><HArrow w={80} /></div>
      <div className="demo-el demo-arrow-2"><HArrow w={80} /></div>
      <img className="demo-el demo-sheep-label-1" src={withBase("sheep-assets/sheep-7.svg")} width={28} height={28} alt="" />
      <img className="demo-el demo-sheep-label-2" src={withBase("sheep-assets/sheep-8.svg")} width={28} height={28} alt="" />
      <img className="demo-el demo-trace-accept" src={withBase("sheep-assets/sheep-7.svg")} width={32} height={32} alt="" />
      <div className="demo-el demo-glow-a1"><ClickRipple /></div>
      <div className="demo-el demo-glow-b1"><ClickRipple /></div>
      <div className="demo-el demo-glow-c1"><ClickRipple /></div>
      <img className="demo-el demo-trace-reject" src={withBase("sheep-assets/sheep-13.svg")} width={32} height={32} alt="" />
      <div className="demo-el demo-stuck-x">✗</div>
      <div className="demo-el demo-accept-btn">😴 Falls Asleep</div>
      <div className="demo-el demo-reject-btn">👀 Stays Awake</div>
      <div className="demo-el demo-check demo-check-1">✓</div>
      <div className="demo-el demo-check demo-check-2">✓</div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
    </div>
  )
}

function DragSingleDemo() {
  return (
    <div className="demo-scene-inner demo-drag-single">
      <div className="demo-el demo-target-pattern">
        <span className="demo-target-label">Pattern to match:</span>
        <img src={withBase("sheep-assets/sheep-7.svg")} width={28} height={28} alt="" />
      </div>
      <div className="demo-el demo-fence-a"><FenceIcon size={52} /></div>
      <div className="demo-el demo-fence-b">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={52} height={42} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark size={18} /></div>
      <div className="demo-el demo-arrow"><HArrow w={140} /></div>
      <img className="demo-el demo-pal-1" src={withBase("sheep-assets/sheep-7.svg")} width={42} height={42} alt="" />
      <img className="demo-el demo-pal-2" src={withBase("sheep-assets/sheep-8.svg")} width={42} height={42} alt="" />
      <img className="demo-el demo-drag-1" src={withBase("sheep-assets/sheep-7.svg")} width={42} height={42} alt="" />
      <img className="demo-el demo-placed-1" src={withBase("sheep-assets/sheep-7.svg")} width={38} height={38} alt="" />
      <div className="demo-el demo-glow-1"><ClickRipple /></div>
      <div className="demo-el demo-match-tick">✓ Matched!</div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
    </div>
  )
}

function DragMatchDemo() {
  return (
    <div className="demo-scene-inner demo-drag-match">
      <div className="demo-el demo-target-pattern">
        <span className="demo-target-label">Pattern to match:</span>
        <img src={withBase("sheep-assets/sheep-7.svg")} width={26} height={26} alt="" />
        <span className="demo-target-arrow">→</span>
        <img src={withBase("sheep-assets/sheep-8.svg")} width={26} height={26} alt="" />
      </div>
      <div className="demo-el demo-fence-a"><FenceIcon size={48} /></div>
      <div className="demo-el demo-fence-b"><FenceIcon size={48} /></div>
      <div className="demo-el demo-fence-c">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={48} height={38} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark /></div>
      <div className="demo-el demo-arrow-1"><HArrow w={90} /></div>
      <div className="demo-el demo-arrow-2"><HArrow w={89} /></div>
      <img className="demo-el demo-pal-1" src={withBase("sheep-assets/sheep-7.svg")} width={38} height={38} alt="" />
      <img className="demo-el demo-pal-2" src={withBase("sheep-assets/sheep-8.svg")} width={38} height={38} alt="" />
      <img className="demo-el demo-drag-1" src={withBase("sheep-assets/sheep-7.svg")} width={38} height={38} alt="" />
      <img className="demo-el demo-placed-1" src={withBase("sheep-assets/sheep-7.svg")} width={34} height={34} alt="" />
      <img className="demo-el demo-drag-2" src={withBase("sheep-assets/sheep-8.svg")} width={38} height={38} alt="" />
      <img className="demo-el demo-placed-2" src={withBase("sheep-assets/sheep-8.svg")} width={34} height={34} alt="" />
      <div className="demo-el demo-glow-1"><ClickRipple /></div>
      <div className="demo-el demo-glow-2"><ClickRipple /></div>
      <div className="demo-el demo-match-tick">✓ Matched!</div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
    </div>
  )
}

function DragBranchDemo() {
  return (
    <div className="demo-scene-inner demo-drag-branch">
      <div className="demo-el demo-target-pattern demo-target-1">
        <img src={withBase("sheep-assets/sheep-7.svg")} width={22} height={22} alt="" />
        <span className="demo-target-arrow">→</span>
        <img src={withBase("sheep-assets/sheep-13.svg")} width={22} height={22} alt="" />
      </div>
      <div className="demo-el demo-target-pattern demo-target-2">
        <img src={withBase("sheep-assets/sheep-8.svg")} width={22} height={22} alt="" />
        <span className="demo-target-arrow">→</span>
        <img src={withBase("sheep-assets/sheep-16.svg")} width={22} height={22} alt="" />
      </div>
      <div className="demo-el demo-fence-start"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-top"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-bot"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-end">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={44} height={36} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark size={14} /></div>
      <div className="demo-el demo-arrow-st"><DiagArrow w={108} h={72} dir="up" /></div>
      <div className="demo-el demo-arrow-sb"><DiagArrow w={108} h={72} dir="down" /></div>
      <div className="demo-el demo-arrow-te"><DiagArrow w={109} h={68} dir="down" /></div>
      <div className="demo-el demo-arrow-be"><DiagArrow w={109} h={76} dir="up" /></div>
      <img className="demo-el demo-pal-1" src={withBase("sheep-assets/sheep-7.svg")} width={34} height={34} alt="" />
      <img className="demo-el demo-pal-2" src={withBase("sheep-assets/sheep-8.svg")} width={34} height={34} alt="" />
      <img className="demo-el demo-pal-3" src={withBase("sheep-assets/sheep-13.svg")} width={34} height={34} alt="" />
      <img className="demo-el demo-pal-4" src={withBase("sheep-assets/sheep-16.svg")} width={34} height={34} alt="" />
      <img className="demo-el demo-drag-1" src={withBase("sheep-assets/sheep-7.svg")} width={34} height={34} alt="" />
      <img className="demo-el demo-placed-1" src={withBase("sheep-assets/sheep-7.svg")} width={30} height={30} alt="" />
      <img className="demo-el demo-drag-2" src={withBase("sheep-assets/sheep-13.svg")} width={34} height={34} alt="" />
      <img className="demo-el demo-placed-2" src={withBase("sheep-assets/sheep-13.svg")} width={30} height={30} alt="" />
      <img className="demo-el demo-drag-3" src={withBase("sheep-assets/sheep-8.svg")} width={34} height={34} alt="" />
      <img className="demo-el demo-placed-3" src={withBase("sheep-assets/sheep-8.svg")} width={30} height={30} alt="" />
      <img className="demo-el demo-drag-4" src={withBase("sheep-assets/sheep-16.svg")} width={34} height={34} alt="" />
      <img className="demo-el demo-placed-4" src={withBase("sheep-assets/sheep-16.svg")} width={30} height={30} alt="" />
      <div className="demo-el demo-glow-1"><ClickRipple /></div>
      <div className="demo-el demo-glow-2"><ClickRipple /></div>
      <div className="demo-el demo-glow-3"><ClickRipple /></div>
      <div className="demo-el demo-glow-4"><ClickRipple /></div>
      <div className="demo-el demo-match-tick">✓ Matched!</div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
    </div>
  )
}

function DragLoopDemo() {
  return (
    <div className="demo-scene-inner demo-drag-loop">
      <div className="demo-el demo-target-pattern demo-target-1">
        <img src={withBase("sheep-assets/sheep-7.svg")} width={22} height={22} alt="" />
        <span className="demo-target-arrow">→</span>
        <img src={withBase("sheep-assets/sheep-8.svg")} width={22} height={22} alt="" />
      </div>
      <div className="demo-el demo-target-pattern demo-target-2">
        <img src={withBase("sheep-assets/sheep-7.svg")} width={22} height={22} alt="" />
        <span className="demo-target-arrow">→</span>
        <img src={withBase("sheep-assets/sheep-13.svg")} width={22} height={22} alt="" />
        <span className="demo-target-arrow">→</span>
        <img src={withBase("sheep-assets/sheep-8.svg")} width={22} height={22} alt="" />
      </div>
      <div className="demo-el demo-fence-a"><FenceIcon size={48} /></div>
      <div className="demo-el demo-fence-b"><FenceIcon size={48} /></div>
      <div className="demo-el demo-fence-c">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={48} height={38} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark /></div>
      <div className="demo-el demo-arrow-1"><HArrow w={90} /></div>
      <div className="demo-el demo-loop-arrow"><LoopArrow w={60} h={48} /></div>
      <div className="demo-el demo-arrow-2"><HArrow w={90} /></div>
      <img className="demo-el demo-pal-1" src={withBase("sheep-assets/sheep-7.svg")} width={36} height={36} alt="" />
      <img className="demo-el demo-pal-2" src={withBase("sheep-assets/sheep-13.svg")} width={36} height={36} alt="" />
      <img className="demo-el demo-pal-3" src={withBase("sheep-assets/sheep-8.svg")} width={36} height={36} alt="" />
      <img className="demo-el demo-drag-1" src={withBase("sheep-assets/sheep-7.svg")} width={36} height={36} alt="" />
      <img className="demo-el demo-placed-1" src={withBase("sheep-assets/sheep-7.svg")} width={30} height={30} alt="" />
      <img className="demo-el demo-drag-2" src={withBase("sheep-assets/sheep-13.svg")} width={36} height={36} alt="" />
      <img className="demo-el demo-placed-2" src={withBase("sheep-assets/sheep-13.svg")} width={30} height={30} alt="" />
      <img className="demo-el demo-drag-3" src={withBase("sheep-assets/sheep-8.svg")} width={36} height={36} alt="" />
      <img className="demo-el demo-placed-3" src={withBase("sheep-assets/sheep-8.svg")} width={30} height={30} alt="" />
      <div className="demo-el demo-glow-1"><ClickRipple /></div>
      <div className="demo-el demo-glow-2"><ClickRipple /></div>
      <div className="demo-el demo-glow-3"><ClickRipple /></div>
      <div className="demo-el demo-loop-counter">
        <span className="lc lc-0">×0</span>
        <span className="lc lc-1">×1</span>
        <span className="lc lc-2">×2</span>
        <span className="lc lc-dots">...</span>
      </div>
      <div className="demo-el demo-match-tick">✓ Matched!</div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
    </div>
  )
}

function ClickEdgeDemo() {
  return (
    <div className="demo-scene-inner demo-click-edge">
      <div className="demo-el demo-fence-a"><FenceIcon size={52} /></div>
      <div className="demo-el demo-fence-b"><FenceIcon size={52} /></div>
      <div className="demo-el demo-arrow"><HArrow w={160} /></div>
      <img className="demo-el demo-palette-1" src={withBase("sheep-assets/sheep-7.svg")} width={40} height={40} alt="" />
      <img className="demo-el demo-palette-2" src={withBase("sheep-assets/sheep-8.svg")} width={40} height={40} alt="" />
      <img className="demo-el demo-sheep-dragging" src={withBase("sheep-assets/sheep-7.svg")} width={40} height={40} alt="" />
      <img className="demo-el demo-sheep-placed" src={withBase("sheep-assets/sheep-7.svg")} width={40} height={40} alt="" />
      <div className="demo-el demo-glow-arrow"><ClickRipple /></div>
      <div className="demo-el demo-cursor"><CursorIcon /></div>
      <div className="demo-el demo-check">✓</div>
    </div>
  )
}

export type DemoConcept =
  | 'connecting' | 'set-accepting' | 'add-state' | 'place-sheep' | 'build-loop'
  | 'trace-path' | 'click-edge'
  | 'drag-single' | 'drag-match' | 'drag-branch' | 'drag-loop'
  | 'ar-basics' | 'ar-reject' | 'ar-sequence'
  | 'ar-branch' | 'ar-loop' | 'ar-dead'
  | 'ar-multi'

const DEMO_TITLES: Record<DemoConcept, string> = {
  'connecting':    'Draw arrows between fences',
  'set-accepting': 'Pick where the farmer sleeps',
  'add-state':     'Add a new fence',
  'place-sheep':   'Put a sheep on an arrow',
  'build-loop':    'Connect a fence to itself!',
  'trace-path':    'Follow the path',
  'click-edge':    'Put a sheep on an arrow',
  'drag-single':   'Which sheep goes here?',
  'drag-match':    'Match the pattern!',
  'drag-branch':   'Two paths to fill in',
  'drag-loop':     'Loops go round and round!',
  'ar-basics':     'Follow the path to the bed',
  'ar-reject':     'Wrong sheep, path blocked!',
  'ar-sequence':   'Sheep jump one at a time',
  'ar-branch':     'Choose the right path',
  'ar-loop':       'Looping round and round',
  'ar-dead':       'Watch out for dead ends!',
  'ar-multi':      'Two beds to choose from',
}

function TestPatternRibbon({ sheep, className }: { sheep: string[]; className?: string }) {
  return (
    <div className={`demo-el demo-test-ribbon ${className || ''}`}>
      <span className="demo-test-label">Pattern to match:</span>
      {sheep.map((s, i) => (
        <span key={i} className="demo-test-item">
          {i > 0 && <span className="demo-target-arrow">→</span>}
          <img src={withBase(`sheep-assets/${s}.svg`)} width={30} height={30} alt="" />
        </span>
      ))}
    </div>
  )
}

function ARBasicsDemo() {
  return (
    <div className="demo-scene-inner demo-ar-basics">
      <div className="demo-el demo-fence-a"><FenceIcon size={52} /></div>
      <div className="demo-el demo-fence-b">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={52} height={42} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark size={18} /></div>
      <div className="demo-el demo-arrow"><HArrow w={180} /></div>
      <img className="demo-el demo-sheep-label" src={withBase("sheep-assets/sheep-7.svg")} width={32} height={32} alt="" />
      <img className="demo-el demo-hop" src={withBase("sheep-assets/sheep-7.svg")} width={36} height={36} alt="" />
      <div className="demo-el demo-glow"><ClickRipple /></div>
      <div className="demo-el demo-result demo-result-accept">😴 Falls Asleep</div>
    </div>
  )
}

function ARRejectDemo() {
  return (
    <div className="demo-scene-inner demo-ar-reject">
      <div className="demo-el demo-fence-a"><FenceIcon size={52} /></div>
      <div className="demo-el demo-fence-b">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={52} height={42} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark size={18} /></div>
      <div className="demo-el demo-arrow"><HArrow w={180} /></div>
      <img className="demo-el demo-sheep-label" src={withBase("sheep-assets/sheep-7.svg")} width={32} height={32} alt="" />
      <img className="demo-el demo-hop-fail" src={withBase("sheep-assets/sheep-8.svg")} width={36} height={36} alt="" />
      <div className="demo-el demo-no-match">✗</div>
      <div className="demo-el demo-arrow-flash" />
      <div className="demo-el demo-result demo-result-reject">👀 Stays Awake</div>
    </div>
  )
}

function ARSequenceDemo() {
  return (
    <div className="demo-scene-inner demo-ar-sequence">
      <div className="demo-el demo-fence-a"><FenceIcon size={48} /></div>
      <div className="demo-el demo-fence-b"><FenceIcon size={48} /></div>
      <div className="demo-el demo-fence-c">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={48} height={38} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark /></div>
      <div className="demo-el demo-arrow-1"><HArrow w={97} /></div>
      <img className="demo-el demo-label-1" src={withBase("sheep-assets/sheep-7.svg")} width={30} height={30} alt="" />
      <div className="demo-el demo-arrow-2"><HArrow w={97} /></div>
      <img className="demo-el demo-label-2" src={withBase("sheep-assets/sheep-8.svg")} width={30} height={30} alt="" />
      <img className="demo-el demo-hop-1" src={withBase("sheep-assets/sheep-7.svg")} width={32} height={32} alt="" />
      <div className="demo-el demo-glow-1"><ClickRipple /></div>
      <img className="demo-el demo-hop-2" src={withBase("sheep-assets/sheep-8.svg")} width={32} height={32} alt="" />
      <div className="demo-el demo-glow-2"><ClickRipple /></div>
      <div className="demo-el demo-result demo-result-accept">😴 Falls Asleep</div>
    </div>
  )
}

function ARBranchDemo() {
  return (
    <div className="demo-scene-inner demo-ar-branch">
      <div className="demo-el demo-fence-start"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-top"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-bot"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-end">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={44} height={36} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark size={14} /></div>
      <div className="demo-el demo-arrow-st"><DiagArrow w={108} h={72} dir="up" /></div>
      <div className="demo-el demo-arrow-sb"><DiagArrow w={108} h={75} dir="down" /></div>
      <div className="demo-el demo-arrow-te"><DiagArrow w={109} h={68} dir="down" /></div>
      <div className="demo-el demo-arrow-be"><DiagArrow w={109} h={79} dir="up" /></div>
      <img className="demo-el demo-label-st" src={withBase("sheep-assets/sheep-7.svg")} width={26} height={26} alt="" />
      <img className="demo-el demo-label-sb" src={withBase("sheep-assets/sheep-8.svg")} width={26} height={26} alt="" />
      <img className="demo-el demo-label-te" src={withBase("sheep-assets/sheep-13.svg")} width={26} height={26} alt="" />
      <img className="demo-el demo-label-be" src={withBase("sheep-assets/sheep-16.svg")} width={26} height={26} alt="" />
      <img className="demo-el demo-hop-1" src={withBase("sheep-assets/sheep-8.svg")} width={30} height={30} alt="" />
      <div className="demo-el demo-glow-1"><ClickRipple /></div>
      <img className="demo-el demo-hop-2" src={withBase("sheep-assets/sheep-16.svg")} width={30} height={30} alt="" />
      <div className="demo-el demo-glow-2"><ClickRipple /></div>
      <div className="demo-el demo-dim-top" />
      <div className="demo-el demo-result demo-result-accept">😴 Falls Asleep</div>
    </div>
  )
}

function ARLoopDemo() {
  return (
    <div className="demo-scene-inner demo-ar-loop">
      <div className="demo-el demo-fence-a"><FenceIcon size={48} /></div>
      <div className="demo-el demo-fence-b"><FenceIcon size={48} /></div>
      <div className="demo-el demo-fence-c">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={48} height={38} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark /></div>
      <div className="demo-el demo-arrow-1"><HArrow w={99} /></div>
      <img className="demo-el demo-label-1" src={withBase("sheep-assets/sheep-7.svg")} width={28} height={28} alt="" />
      <div className="demo-el demo-loop-arrow"><LoopArrow w={60} h={48} /></div>
      <img className="demo-el demo-label-loop" src={withBase("sheep-assets/sheep-8.svg")} width={26} height={26} alt="" />
      <div className="demo-el demo-arrow-2"><HArrow w={98} /></div>
      <img className="demo-el demo-label-2" src={withBase("sheep-assets/sheep-13.svg")} width={28} height={28} alt="" />
      <img className="demo-el demo-hop-1" src={withBase("sheep-assets/sheep-7.svg")} width={30} height={30} alt="" />
      <div className="demo-el demo-glow-1"><ClickRipple /></div>
      <img className="demo-el demo-hop-loop-1" src={withBase("sheep-assets/sheep-8.svg")} width={28} height={28} alt="" />
      <img className="demo-el demo-hop-loop-2" src={withBase("sheep-assets/sheep-8.svg")} width={28} height={28} alt="" />
      <div className="demo-el demo-loop-counter">
        <span className="lc lc-0">×0</span>
        <span className="lc lc-1">×1</span>
        <span className="lc lc-2">×2</span>
        <span className="lc lc-dots">...</span>
      </div>
      <img className="demo-el demo-hop-3" src={withBase("sheep-assets/sheep-13.svg")} width={30} height={30} alt="" />
      <div className="demo-el demo-glow-2"><ClickRipple /></div>
      <div className="demo-el demo-result demo-result-accept">😴 Falls Asleep</div>
    </div>
  )
}

function ARDeadDemo() {
  return (
    <div className="demo-scene-inner demo-ar-dead">
      <div className="demo-el demo-fence-start"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-good"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-trap"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-end">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={44} height={36} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark size={14} /></div>
      <div className="demo-el demo-arrow-sg"><DiagArrow w={108} h={72} dir="up" /></div>
      <div className="demo-el demo-arrow-st"><DiagArrow w={108} h={75} dir="down" /></div>
      <div className="demo-el demo-arrow-ge"><DiagArrow w={109} h={20} dir="up" /></div>
      <img className="demo-el demo-label-sg" src={withBase("sheep-assets/sheep-7.svg")} width={26} height={26} alt="" />
      <img className="demo-el demo-label-st" src={withBase("sheep-assets/sheep-8.svg")} width={26} height={26} alt="" />
      <img className="demo-el demo-label-ge" src={withBase("sheep-assets/sheep-13.svg")} width={26} height={26} alt="" />
      <img className="demo-el demo-hop-1" src={withBase("sheep-assets/sheep-8.svg")} width={30} height={30} alt="" />
      <div className="demo-el demo-glow-1"><ClickRipple /></div>
      <div className="demo-el demo-stuck-badge">🚫 Trapped! No way out!</div>
      <div className="demo-el demo-result demo-result-reject">👀 Stays Awake</div>
    </div>
  )
}

function ARMultiDemo() {
  return (
    <div className="demo-scene-inner demo-ar-multi">
      <div className="demo-el demo-fence-start"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-mid"><FenceIcon size={44} /></div>
      <div className="demo-el demo-fence-bed1">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={44} height={36} alt="" />
      </div>
      <div className="demo-el demo-fence-bed2">
        <img src={withBase("sheep-assets/awake-farmer.svg")} width={44} height={36} alt="" />
      </div>
      <div className="demo-el demo-start-arrow"><StartMark size={14} /></div>
      <div className="demo-el demo-arrow-sm"><HArrow w={88} /></div>
      <div className="demo-el demo-arrow-m1"><DiagArrow w={106} h={80} dir="up" /></div>
      <div className="demo-el demo-arrow-m2"><DiagArrow w={106} h={73} dir="down" /></div>
      <img className="demo-el demo-label-sm" src={withBase("sheep-assets/sheep-7.svg")} width={26} height={26} alt="" />
      <img className="demo-el demo-label-m1" src={withBase("sheep-assets/sheep-13.svg")} width={26} height={26} alt="" />
      <img className="demo-el demo-label-m2" src={withBase("sheep-assets/sheep-8.svg")} width={26} height={26} alt="" />
      <div className="demo-el demo-beds-badge">🛏️ Two Beds!</div>
      <img className="demo-el demo-hop-1" src={withBase("sheep-assets/sheep-7.svg")} width={28} height={28} alt="" />
      <div className="demo-el demo-glow-1"><ClickRipple /></div>
      <img className="demo-el demo-hop-2" src={withBase("sheep-assets/sheep-8.svg")} width={28} height={28} alt="" />
      <div className="demo-el demo-glow-2"><ClickRipple /></div>
      <div className="demo-el demo-result demo-result-accept">😴 Falls Asleep</div>
    </div>
  )
}

export function pickDragDemo(levelId: number, conceptsIntroduced?: string[]): DemoConcept {
  if (conceptsIntroduced && conceptsIntroduced.length > 0) {
    if (conceptsIntroduced.includes('loop')) return 'drag-loop'
    if (conceptsIntroduced.includes('branching')) return 'drag-branch'
    if (conceptsIntroduced.includes('multiple-accepting')) return 'drag-branch'
    if (conceptsIntroduced.includes('sequence')) return 'drag-match'
  }
  if (levelId <= 1) return 'drag-single'
  if (levelId <= 3) return 'drag-match'
  if (levelId <= 6) return 'drag-branch'
  if (levelId <= 8) return 'drag-loop'
  return 'drag-branch'
}

export function pickARDemo(questionId: number, conceptsIntroduced?: string[]): DemoConcept {
  if (conceptsIntroduced && conceptsIntroduced.length > 0) {
    if (conceptsIntroduced.some(c => ['start-state', 'accepting-state', 'transition'].includes(c)))
      return 'ar-basics'
    if (conceptsIntroduced.includes('rejection')) return 'ar-reject'
    if (conceptsIntroduced.includes('sequence')) return 'ar-sequence'
    if (conceptsIntroduced.includes('branching')) return 'ar-branch'
    if (conceptsIntroduced.includes('loop')) return 'ar-loop'
    if (conceptsIntroduced.includes('dead-state')) return 'ar-dead'
    if (conceptsIntroduced.includes('multiple-accepting')) return 'ar-multi'
  }
  // Default for hint button: show the trace animation
  return 'trace-path'
}

export function pickDemoForState(
  levelConcepts: string[],
  hasAccepting: boolean,
  edgeCount: number,
  emptyEdgeCount: number,
  canAddStates: boolean,
  nodeCount: number,
  initialNodeCount: number,
): DemoConcept {
  if (levelConcepts.includes('set-accepting') && !hasAccepting) return 'set-accepting'
  if (levelConcepts.includes('add-state') && nodeCount <= initialNodeCount) return 'add-state'
  if (levelConcepts.includes('build-loop')) return 'build-loop'
  if (levelConcepts.includes('connecting')) return 'connecting'

  if (canAddStates && nodeCount <= initialNodeCount) return 'add-state'
  if (!hasAccepting) return 'set-accepting'
  if (edgeCount === 0) return 'connecting'
  if (emptyEdgeCount > 0) return 'place-sheep'
  return 'connecting'
}


const DEMO_DURATIONS: Record<string, number> = {
  'connecting': 5500,
  'set-accepting': 4500,
  'add-state': 4500,
  'place-sheep': 4500,
  'build-loop': 5500,
  'trace-path': 12000,
  'click-edge': 5500,
  'drag-single': 6500,
  'drag-match': 9000,
  'drag-branch': 11000,
  'drag-loop': 10000,
  'ar-basics': 6500,
  'ar-reject': 6500,
  'ar-sequence': 8000,
  'ar-branch': 8500,
  'ar-loop': 10000,
  'ar-dead': 7500,
  'ar-multi': 8000,
}

// Step breakpoints as percentages of total duration.
// Each array entry marks when that step becomes active.
// The dots light up sequentially as the animation progresses.
const DEMO_STEPS: Record<string, number[]> = {
  // Build demos
  'connecting':     [0, 14, 50],         // Click A → Click B → Sheep placed
  'set-accepting':  [0, 55],             // Pick up bed → Drop on fence
  'add-state':      [0, 55],             // Pick up fence → Drop on canvas
  'place-sheep':    [0, 50],             // Pick up sheep → Drop on arrow
  'build-loop':     [0, 14, 50],         // Click From → Click fence → Click same fence → loop arrow
  'click-edge':     [0, 50],             // Pick sheep → Drop on arrow
  // Trace / AR demos
  'trace-path':     [0, 16, 42, 60, 80], // Pattern → Trace accept → Choose → Trace reject → Choose
  'ar-basics':      [0, 15, 60],         // Pattern → Hop → Falls asleep
  'ar-reject':      [0, 15, 55],         // Pattern → Try → Stays awake
  'ar-sequence':    [0, 12, 40, 70],     // Pattern → Hop 1 → Hop 2 → Falls asleep
  'ar-branch':      [0, 12, 40, 68],     // Pattern → Pick path → Follow → Result
  'ar-loop':        [0, 8, 26, 58, 78],  // Pattern → Enter → Loop → Exit → Result
  'ar-dead':        [0, 10, 36, 56],     // Pattern → Hop to trap → Stuck! → Result
  'ar-multi':       [0, 8, 36, 62],      // Two beds → Hop 1 → Hop 2 → Result
  // Drag demos
  'drag-single':    [0, 20, 65],         // Pick sheep → Place → Matched
  'drag-match':     [0, 14, 46, 78],     // Sheep 1 → Place 1 → Sheep 2 → Matched
  'drag-branch':    [0, 10, 30, 52, 74], // Sheep 1 → Place → Sheep 2 → Place → Matched
  'drag-loop':      [0, 12, 34, 60, 82], // Sheep 1 → Loop sheep → Place → Exit → Matched
}

const RIBBON_SHEEP: Record<string, string[]> = {
  'ar-basics':    ['sheep-7'],
  'ar-reject':    ['sheep-8'],
  'ar-sequence':  ['sheep-7', 'sheep-8'],
  'ar-branch':    ['sheep-8', 'sheep-16'],
  'ar-loop':      ['sheep-7', 'sheep-8', 'sheep-8', 'sheep-13'],
  'ar-dead':      ['sheep-8', 'sheep-13'],
  'ar-multi':     ['sheep-7', 'sheep-8'],
}
function StepDots({ concept, progress, finished }: { concept: string; progress: number; finished: boolean }) {
  const steps = DEMO_STEPS[concept] || [0]
  const activeStep = finished
    ? steps.length
    : steps.reduce((acc, threshold, i) => (progress >= threshold ? i : acc), 0)

  return (
    <div className="demo-step-dots" aria-hidden="true">
      {steps.map((_, i) => (
        <div
          key={i}
          className={`demo-step-dot ${
            i < activeStep ? 'demo-step-done' :
            i === activeStep && !finished ? 'demo-step-active' : ''
          }`}
        />
      ))}
    </div>
  )
}

interface TutorialDemoProps {
  concept: DemoConcept
  onDismiss: () => void
}

export function TutorialDemo({ concept, onDismiss }: TutorialDemoProps) {
  const [finished, setFinished] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const [progress, setProgress] = useState(0)
  const startTime = useRef(Date.now())

  // Allow Escape to dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onDismiss])

  // Track animation progress for step dots
  useEffect(() => {
    startTime.current = Date.now()
    setProgress(0)
    setFinished(false)
    const duration = DEMO_DURATIONS[concept] || 5000

    let rafId: number
    const tick = () => {
      const elapsed = Date.now() - startTime.current
      const pct = Math.min((elapsed / duration) * 100, 100)
      setProgress(pct)
      if (elapsed >= duration) {
        setFinished(true)
      } else {
        rafId = requestAnimationFrame(tick)
      }
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [concept, animKey])

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAnimKey(k => k + 1)
  }

  return (
    <div className="demo-overlay" onClick={onDismiss}>
      <div className="demo-scene" onClick={e => e.stopPropagation()}>
        {/* Title bar */}
        <div className="demo-title-bar">
          <span className="demo-title">{DEMO_TITLES[concept]}</span>
        </div>

        {/* Top bar — test pattern ribbon (AR demos only) */}
        {RIBBON_SHEEP[concept] && (
          <div className="demo-top-bar">
            <div className="demo-test-ribbon">
              <span className="demo-test-label">Pattern to match:</span>
              {RIBBON_SHEEP[concept].map((s, i) => (
                <span key={i} className="demo-test-item">
                  {i > 0 && <span className="demo-target-arrow">→</span>}
                  <img src={withBase(`sheep-assets/${s}.svg`)} width={36} height={36} alt="" />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Animation area */}
        <div className="demo-anim-area">
          <div key={animKey} className={`demo-anim-wrap ${finished ? 'demo-anim-done' : ''}`}>
            {concept === 'connecting' && <ConnectingDemo />}
            {concept === 'set-accepting' && <SetAcceptingDemo />}
            {concept === 'add-state' && <AddStateDemo />}
            {concept === 'place-sheep' && <PlaceSheepDemo />}
            {concept === 'build-loop' && <BuildLoopDemo />}
            {concept === 'trace-path' && <TracePathDemo />}
            {concept === 'click-edge' && <ClickEdgeDemo />}
            {concept === 'drag-single' && <DragSingleDemo />}
            {concept === 'drag-match' && <DragMatchDemo />}
            {concept === 'drag-branch' && <DragBranchDemo />}
            {concept === 'drag-loop' && <DragLoopDemo />}
            {concept === 'ar-basics' && <ARBasicsDemo />}
            {concept === 'ar-reject' && <ARRejectDemo />}
            {concept === 'ar-sequence' && <ARSequenceDemo />}
            {concept === 'ar-branch' && <ARBranchDemo />}
            {concept === 'ar-loop' && <ARLoopDemo />}
            {concept === 'ar-dead' && <ARDeadDemo />}
            {concept === 'ar-multi' && <ARMultiDemo />}
          </div>

          {finished && (
            <button className="demo-replay-btn" onClick={handleReplay} title="Watch again">
              <span className="demo-replay-icon" aria-hidden="true">↻</span>
              <span className="demo-btn-label">Again?</span>
            </button>
          )}
        </div>

        {/* Bottom bar — step dots + dismiss button */}
        <div className="demo-bottom-bar">
          <div className="demo-bar-spacer" />
          <StepDots concept={concept} progress={progress} finished={finished} />
          <button className="demo-dismiss" onClick={onDismiss} title="Got it">
            <span className="demo-dismiss-icon" aria-hidden="true">👍</span>
            <span className="demo-btn-label">Got it!</span>
          </button>
        </div>
      </div>
    </div>
  )
}
