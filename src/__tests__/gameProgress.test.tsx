import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { GameProgressProvider, useGameProgress, type Badge } from '../contexts/GameProgressContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GameProgressProvider>{children}</GameProgressProvider>
)

beforeEach(() => {
  localStorage.clear()
})

describe('recordCorrectAnswer', () => {
  it('awards first-steps on the very first correct answer, not after', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    let badges: Badge[]
    act(() => { badges = result.current.recordCorrectAnswer('accept-reject', 5) })
    expect(badges!.some(b => b.id === 'first-steps')).toBe(true)
    act(() => { badges = result.current.recordCorrectAnswer('accept-reject', 5) })
    expect(badges!.some(b => b.id === 'first-steps')).toBe(false)
  })

  it('awards speed-shepherd under 10 seconds but not at 10', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    let badges: Badge[]
    act(() => { badges = result.current.recordCorrectAnswer('accept-reject', 3) })
    expect(badges!.find(b => b.id === 'speed-shepherd')).toBeDefined()
    act(() => { badges = result.current.recordCorrectAnswer('accept-reject', 10) })
    expect(badges!.some(b => b.id === 'speed-shepherd')).toBe(false)
  })

  it('awards sheep-counter at 5 total and sleepy-farmer at 10', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    let badges: Badge[] = []
    act(() => {
      for (let i = 0; i < 4; i++) result.current.recordCorrectAnswer('accept-reject', 5)
    })
    act(() => { badges = result.current.recordCorrectAnswer('accept-reject', 5) })
    expect(badges.some(b => b.id === 'sheep-counter')).toBe(true)
    act(() => {
      for (let i = 0; i < 4; i++) result.current.recordCorrectAnswer('accept-reject', 5)
    })
    act(() => { badges = result.current.recordCorrectAnswer('accept-reject', 5) })
    expect(badges.some(b => b.id === 'sleepy-farmer')).toBe(true)
  })

  it('increments totalCorrect', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    expect(result.current.totalCorrect).toBe(0)
    act(() => { result.current.recordCorrectAnswer('accept-reject', 5) })
    act(() => { result.current.recordCorrectAnswer('accept-reject', 5) })
    expect(result.current.totalCorrect).toBe(2)
  })
})

describe('recordIncorrectAnswer', () => {
  it('awards persistence once for a wrong answer', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    let badges: Badge[]
    act(() => { badges = result.current.recordIncorrectAnswer('accept-reject') })
    expect(badges!.some(b => b.id === 'persistence')).toBe(true)
    act(() => { badges = result.current.recordIncorrectAnswer('accept-reject') })
    expect(badges!.some(b => b.id === 'persistence')).toBe(false)
  })
})

describe('awardStars', () => {
  it('awards perfect-flock for 3 stars', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    let badges: Badge[]
    act(() => { badges = result.current.awardStars('accept-reject', 3, false) })
    expect(badges!.find(b => b.id === 'perfect-flock')).toBeDefined()
  })

  it('does not award perfect-flock for fewer than 3 stars', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    let badges: Badge[]
    act(() => { badges = result.current.awardStars('accept-reject', 2, false) })
    expect(badges!.some(b => b.id === 'perfect-flock')).toBe(false)
  })

  it('awards no-hints-needed only when hints were not used', () => {
    const { result: r1 } = renderHook(() => useGameProgress(), { wrapper })
    let badges: Badge[]
    act(() => { badges = r1.current.awardStars('accept-reject', 1, false) })
    expect(badges!.find(b => b.id === 'no-hints-needed')).toBeDefined()

    const { result: r2 } = renderHook(() => useGameProgress(), { wrapper })
    act(() => { badges = r2.current.awardStars('accept-reject', 1, true) })
    expect(badges!.some(b => b.id === 'no-hints-needed')).toBe(false)
  })

  it('awards level-type badges for each level type', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    let badges: Badge[]
    act(() => { badges = result.current.awardStars('accept-reject', 1, false) })
    expect(badges!.some(b => b.id === 'pattern-spotter')).toBe(true)
    act(() => { badges = result.current.awardStars('drag-level-1', 1, false) })
    expect(badges!.some(b => b.id === 'path-finder')).toBe(true)
    act(() => { badges = result.current.awardStars('build-level-1', 1, false) })
    expect(badges!.some(b => b.id === 'automaton-architect')).toBe(true)
  })

  it('only increases totalStars, never decreases', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    act(() => { result.current.awardStars('accept-reject', 3, false) })
    expect(result.current.totalStars).toBe(3)
    act(() => { result.current.awardStars('accept-reject', 1, false) })
    expect(result.current.totalStars).toBe(3)
  })
})

describe('checkAndAwardBadge', () => {
  it('awards a badge and returns null if already earned', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    let badge: Badge | null
    act(() => { badge = result.current.checkAndAwardBadge('perfect-level-1') })
    expect(badge!.id).toBe('perfect-level-1')
    expect(badge!.earned).toBe(true)
    act(() => { badge = result.current.checkAndAwardBadge('perfect-level-1') })
    expect(badge).toBeNull()
  })
})

describe('getEarnedBadges', () => {
  it('returns only earned badges', () => {
    const { result } = renderHook(() => useGameProgress(), { wrapper })
    expect(result.current.getEarnedBadges()).toHaveLength(0)
    act(() => { result.current.recordCorrectAnswer('accept-reject', 3) })
    const earned = result.current.getEarnedBadges()
    expect(earned.length).toBeGreaterThan(0)
    expect(earned.every(b => b.earned)).toBe(true)
  })
})
