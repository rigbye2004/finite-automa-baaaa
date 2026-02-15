import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Badge {
  id: string
  name: string
  description: string
  icon?: string
  earned: boolean
  earnedAt?: Date
}

export const BADGE_DEFINITIONS: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Answer your first question correctly',
    icon: '🐑',
  },
  {
    id: 'sheep-counter',
    name: 'Sheep Counter',
    description: 'Get 5 questions correct',
    icon: '🔢',
  },
  {
    id: 'pattern-spotter',
    name: 'Pattern Spotter',
    description: 'Complete an Accept/Reject level',
    icon: '🔍',
  },
  {
    id: 'path-finder',
    name: 'Path Finder',
    description: 'Complete a Drag level',
    icon: '🛤️',
  },
  {
    id: 'automaton-architect',
    name: 'Automaton Architect',
    description: 'Complete a Build level',
    icon: '🏗️',
  },
  {
    id: 'perfect-flock',
    name: 'Perfect Flock',
    description: 'Get 3 stars on any level',
    icon: '⭐',
  },
  {
    id: 'no-hints-needed',
    name: 'No Hints Needed',
    description: 'Complete a level without using hints',
    icon: '💡',
  },
  {
    id: 'sleepy-farmer',
    name: 'Sleepy Farmer',
    description: 'Get 10 questions correct',
    icon: '😴',
  },
  {
    id: 'speed-shepherd',
    name: 'Speed Shepherd',
    description: 'Answer a question correctly in under 10 seconds',
    icon: '⚡',
  },
  {
    id: 'persistence',
    name: 'Persistence Pays',
    description: 'Keep trying after getting one wrong',
    icon: '💪',
  },
  {
    id: 'perfect-level-1',
    name: 'Level 1 Master',
    description: 'Get all questions right in Level 1',
    icon: '🏆',
  },
]

interface LevelProgress {
  levelId: string
  bestStars: number
  completedAt?: Date
  hintsUsed: boolean
  attempts: number
}

interface GameProgressState {
  totalStars: number
  totalCorrect: number
  badges: Badge[]
  levelProgress: Record<string, LevelProgress>
}

interface GameProgressContextType extends GameProgressState {
  awardStars: (levelId: string, stars: number, hintsUsed: boolean) => Badge[]
  recordCorrectAnswer: (levelId: string, timeSeconds: number) => Badge[]
  recordIncorrectAnswer: (levelId: string) => Badge[]
  checkAndAwardBadge: (badgeId: string) => Badge | null
  resetProgress: () => void
  getBadge: (badgeId: string) => Badge | undefined
  getLevelProgress: (levelId: string) => LevelProgress | undefined
  getEarnedBadges: () => Badge[]
}

const GameProgressContext = createContext<GameProgressContextType | null>(null)

const STORAGE_KEY = 'sheep-automata-progress'

const initialState: GameProgressState = {
  totalStars: 0,
  totalCorrect: 0,
  badges: BADGE_DEFINITIONS.map(b => ({ ...b, earned: false })),
  levelProgress: {},
}

function loadProgress(): GameProgressState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Merge with badge definitions in case new badges were added
      const badges = BADGE_DEFINITIONS.map(def => {
        const saved = parsed.badges?.find((b: Badge) => b.id === def.id)
        return saved ? { ...def, earned: saved.earned, earnedAt: saved.earnedAt } : { ...def, earned: false }
      })
      return { ...initialState, ...parsed, badges }
    }
  } catch (e) {
    console.error('Failed to load progress:', e)
  }
  return initialState
}

function saveProgress(state: GameProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save progress:', e)
  }
}

export function GameProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameProgressState>(loadProgress)

  useEffect(() => {
    saveProgress(state)
  }, [state])

  const checkAndAwardBadge = (badgeId: string): Badge | null => {
    const badge = state.badges.find(b => b.id === badgeId)
    if (badge && !badge.earned) {
      const updatedBadge = { ...badge, earned: true, earnedAt: new Date() }
      setState(prev => ({
        ...prev,
        badges: prev.badges.map(b => b.id === badgeId ? updatedBadge : b)
      }))
      return updatedBadge
    }
    return null
  }

  const awardStars = (levelId: string, stars: number, hintsUsed: boolean): Badge[] => {
    // determine badges before setState to avoid React Strict Mode double-call
    const badgesToAward: string[] = []
    
    if (stars === 3) {
      const badge = state.badges.find(b => b.id === 'perfect-flock')
      if (badge && !badge.earned) badgesToAward.push('perfect-flock')
    }
    
    if (!hintsUsed) {
      const badge = state.badges.find(b => b.id === 'no-hints-needed')
      if (badge && !badge.earned) badgesToAward.push('no-hints-needed')
    }
    
    if (levelId.includes('accept-reject')) {
      const badge = state.badges.find(b => b.id === 'pattern-spotter')
      if (badge && !badge.earned) badgesToAward.push('pattern-spotter')
    }
    
    if (levelId.includes('drag')) {
      const badge = state.badges.find(b => b.id === 'path-finder')
      if (badge && !badge.earned) badgesToAward.push('path-finder')
    }
    
    if (levelId.includes('build')) {
      const badge = state.badges.find(b => b.id === 'automaton-architect')
      if (badge && !badge.earned) badgesToAward.push('automaton-architect')
    }
    
    const newBadges: Badge[] = badgesToAward.map(id => {
      const badge = state.badges.find(b => b.id === id)!
      return { ...badge, earned: true, earnedAt: new Date() }
    })

    setState(prev => {
      const existingProgress = prev.levelProgress[levelId]
      const isNewBest = !existingProgress || stars > existingProgress.bestStars
      
      const updatedProgress: LevelProgress = {
        levelId,
        bestStars: isNewBest ? stars : existingProgress?.bestStars || 0,
        completedAt: new Date(),
        hintsUsed: existingProgress?.hintsUsed !== false ? hintsUsed : false,
        attempts: (existingProgress?.attempts || 0) + 1,
      }

      // Update badges
      const updatedBadges = prev.badges.map(b => {
        if (badgesToAward.includes(b.id)) {
          return { ...b, earned: true, earnedAt: new Date() }
        }
        return b
      })

      return {
        ...prev,
        totalStars: prev.totalStars + (isNewBest ? stars - (existingProgress?.bestStars || 0) : 0),
        levelProgress: {
          ...prev.levelProgress,
          [levelId]: updatedProgress,
        },
        badges: updatedBadges,
      }
    })

    return newBadges
  }

  const recordCorrectAnswer = (levelId: string, timeSeconds: number): Badge[] => {
    const badgesToAward: string[] = []
    
    if (state.totalCorrect === 0) {
      const badge = state.badges.find(b => b.id === 'first-steps')
      if (badge && !badge.earned) badgesToAward.push('first-steps')
    }
    
    if (state.totalCorrect + 1 >= 5) {
      const badge = state.badges.find(b => b.id === 'sheep-counter')
      if (badge && !badge.earned) badgesToAward.push('sheep-counter')
    }
    
    if (state.totalCorrect + 1 >= 10) {
      const badge = state.badges.find(b => b.id === 'sleepy-farmer')
      if (badge && !badge.earned) badgesToAward.push('sleepy-farmer')
    }
    
    if (timeSeconds > 0 && timeSeconds < 10) {
      const badge = state.badges.find(b => b.id === 'speed-shepherd')
      if (badge && !badge.earned) badgesToAward.push('speed-shepherd')
    }
    
    const newBadges: Badge[] = badgesToAward.map(id => {
      const badge = state.badges.find(b => b.id === id)!
      return { ...badge, earned: true, earnedAt: new Date() }
    })
    
    setState(prev => {
      const updatedBadges = prev.badges.map(b => {
        if (badgesToAward.includes(b.id)) {
          return { ...b, earned: true, earnedAt: new Date() }
        }
        return b
      })

      return { 
        ...prev, 
        totalCorrect: prev.totalCorrect + 1,
        badges: updatedBadges,
      }
    })

    return newBadges
  }

  const recordIncorrectAnswer = (_levelId: string): Badge[] => {
    const persistenceBadge = state.badges.find(b => b.id === 'persistence')
    
    if (persistenceBadge && !persistenceBadge.earned) {
      const awardedBadge = { ...persistenceBadge, earned: true, earnedAt: new Date() }
      
      setState(prev => ({
        ...prev,
        badges: prev.badges.map(b => b.id === 'persistence' ? awardedBadge : b),
      }))
      
      return [awardedBadge]
    }
    
    return []
  }

  const resetProgress = () => {
    setState(initialState)
    localStorage.removeItem(STORAGE_KEY)
  }

  const getBadge = (badgeId: string) => state.badges.find(b => b.id === badgeId)
  
  const getLevelProgress = (levelId: string) => state.levelProgress[levelId]
  
  const getEarnedBadges = () => state.badges.filter(b => b.earned)

  return (
    <GameProgressContext.Provider value={{
      ...state,
      awardStars,
      recordCorrectAnswer,
      recordIncorrectAnswer,
      checkAndAwardBadge,
      resetProgress,
      getBadge,
      getLevelProgress,
      getEarnedBadges,
    }}>
      {children}
    </GameProgressContext.Provider>
  )
}

export function useGameProgress() {
  const context = useContext(GameProgressContext)
  if (!context) {
    throw new Error('useGameProgress must be used within a GameProgressProvider')
  }
  return context
}
