import { describe, it, expect } from 'vitest'
import {
  BUILD_LEVEL_CONFIGS,
  getBuildLevelConfig,
  BUILD_LEVEL_COUNT,
} from '../buildLevelConfigs'
import {
  DRAG_LEVEL_CONFIGS,
  getDragLevelConfig,
  DRAG_LEVEL_COUNT,
} from '../dragLevelConfigs'
import {
  ACCEPT_REJECT_QUESTIONS,
  getAcceptRejectQuestion,
  ACCEPT_REJECT_QUESTION_COUNT,
} from '../acceptRejectLevelConfigs'
import { calculatePath } from '../components/SheepPathAnimator'

describe('build level configs', () => {
  it('can look up by id', () => {
    expect(getBuildLevelConfig(1)?.id).toBe(1)
    expect(getBuildLevelConfig(999)).toBeUndefined()
  })

  it('BUILD_LEVEL_COUNT is correct', () => {
    expect(BUILD_LEVEL_COUNT).toBe(BUILD_LEVEL_CONFIGS.length)
  })

  it('all configs are well-formed', () => {
    for (const config of BUILD_LEVEL_CONFIGS) {
      expect(config.targetPatterns.length).toBeGreaterThan(0)
      expect(config.availableSheep.length).toBeGreaterThan(0)
      expect(config.initialNodes.some(n => n.data.isStart)).toBe(true)
      for (const pattern of config.targetPatterns) {
        for (const sheep of pattern) {
          expect(config.availableSheep).toContain(sheep)
        }
      }
    }
  })

  it('ids are unique', () => {
    const ids = BUILD_LEVEL_CONFIGS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('drag level configs', () => {
  it('can look up by id', () => {
    expect(getDragLevelConfig(1)?.id).toBe(1)
    expect(getDragLevelConfig(999)).toBeUndefined()
  })

  it('DRAG_LEVEL_COUNT is correct', () => {
    expect(DRAG_LEVEL_COUNT).toBe(DRAG_LEVEL_CONFIGS.length)
  })

  it('all configs are well-formed', () => {
    for (const config of DRAG_LEVEL_CONFIGS) {
      const nodeIds = new Set(config.nodes.map(n => n.id))
      expect(config.nodes.filter(n => n.data.isStart)).toHaveLength(1)
      expect(config.nodes.some(n => n.data.isAccepting)).toBe(true)
      expect(config.edges.length).toBeGreaterThan(0)
      for (const edge of config.edges) {
        expect(nodeIds.has(edge.source)).toBe(true)
        expect(nodeIds.has(edge.target)).toBe(true)
      }
      for (const pattern of config.targetPatterns) {
        for (const sheep of pattern) {
          expect(config.availableSheep).toContain(sheep)
        }
      }
    }
  })

  it('ids are unique', () => {
    const ids = DRAG_LEVEL_CONFIGS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('accept/reject question configs', () => {
  it('can look up by id', () => {
    expect(getAcceptRejectQuestion(1)?.id).toBe(1)
    expect(getAcceptRejectQuestion(999)).toBeUndefined()
  })

  it('ACCEPT_REJECT_QUESTION_COUNT is correct', () => {
    expect(ACCEPT_REJECT_QUESTION_COUNT).toBe(ACCEPT_REJECT_QUESTIONS.length)
  })

  it('all questions are well-formed', () => {
    for (const q of ACCEPT_REJECT_QUESTIONS) {
      expect(['accept', 'reject']).toContain(q.correctAnswer)
      expect(q.testPattern.length).toBeGreaterThan(0)
      expect(q.nodes.some(n => n.data.isStart)).toBe(true)
      expect(q.nodes.some(n => n.data.isAccepting)).toBe(true)
    }
  })

  it('ids are unique', () => {
    const ids = ACCEPT_REJECT_QUESTIONS.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('accept/reject cross-validation', () => {
  it('calculatePath agrees with correctAnswer for every question', () => {
    for (const q of ACCEPT_REJECT_QUESTIONS) {
      const result = calculatePath(q.nodes, q.edges, q.testPattern)
      expect(result.success).toBe(q.correctAnswer === 'accept')
    }
  })

  it('rejected questions fail for the right reason', () => {
    for (const q of ACCEPT_REJECT_QUESTIONS.filter(q => q.correctAnswer === 'reject')) {
      const result = calculatePath(q.nodes, q.edges, q.testPattern)
      if (q.rejectionReason === 'no-path' || q.rejectionReason === 'dead-end') {
        expect(result.stuckAtStep).toBeDefined()
      }
      if (q.rejectionReason === 'incomplete') {
        expect(result.stuckReason).toBe('wrong-state')
      }
    }
  })
})
