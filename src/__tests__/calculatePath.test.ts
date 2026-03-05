import { describe, it, expect } from 'vitest'
import type { Node, Edge } from 'reactflow'
import { calculatePath } from '../components/SheepPathAnimator'

function makeNode(id: string, isStart = false, isAccepting = false): Node {
  return {
    id,
    type: 'stateNode',
    position: { x: 0, y: 0 },
    data: { isStart, isAccepting },
  }
}

function makeEdge(id: string, source: string, target: string, sheep: string): Edge {
  return { id, source, target, data: { sheep } }
}

describe('calculatePath', () => {
  it('accepts a pattern that ends in an accepting state', () => {
    const nodes = [makeNode('s', true), makeNode('e', false, true)]
    const result = calculatePath(nodes, [makeEdge('s-e', 's', 'e', 'sheep-3')], ['sheep-3'])
    expect(result.success).toBe(true)
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0]).toMatchObject({ fromNode: 's', toNode: 'e', sheep: 'sheep-3' })
  })

  it('fails with no-path when no edge matches the sheep', () => {
    const nodes = [makeNode('s', true), makeNode('e', false, true)]
    const result = calculatePath(nodes, [makeEdge('s-e', 's', 'e', 'sheep-3')], ['sheep-8'])
    expect(result.success).toBe(false)
    expect(result.stuckAtStep).toBe(0)
    expect(result.stuckReason).toBe('no-path')
  })

  it('fails with wrong-state when pattern stops before reaching an accepting state', () => {
    const nodes = [makeNode('s', true), makeNode('m'), makeNode('e', false, true)]
    const edges = [makeEdge('s-m', 's', 'm', 'sheep-3'), makeEdge('m-e', 'm', 'e', 'sheep-8')]
    const result = calculatePath(nodes, edges, ['sheep-3'])
    expect(result.success).toBe(false)
    expect(result.stuckReason).toBe('wrong-state')
  })

  it('works across multiple steps', () => {
    const nodes = [makeNode('s', true), makeNode('a'), makeNode('b'), makeNode('e', false, true)]
    const edges = [
      makeEdge('s-a', 's', 'a', 'sheep-3'),
      makeEdge('a-b', 'a', 'b', 'sheep-7'),
      makeEdge('b-e', 'b', 'e', 'sheep-8'),
    ]
    const result = calculatePath(nodes, edges, ['sheep-3', 'sheep-7', 'sheep-8'])
    expect(result.success).toBe(true)
    expect(result.steps).toHaveLength(3)
  })

  it('reports the failing step index when a multi-step pattern goes wrong', () => {
    const nodes = [makeNode('s', true), makeNode('m'), makeNode('e', false, true)]
    const edges = [makeEdge('s-m', 's', 'm', 'sheep-3'), makeEdge('m-e', 'm', 'e', 'sheep-8')]
    const result = calculatePath(nodes, edges, ['sheep-3', 'sheep-7'])
    expect(result.success).toBe(false)
    expect(result.stuckAtStep).toBe(1)
  })

  it('marks self-loop steps as isSelfLoop', () => {
    const nodes = [makeNode('s', true), makeNode('loop'), makeNode('e', false, true)]
    const edges = [
      makeEdge('s-loop', 's', 'loop', 'sheep-3'),
      makeEdge('loop-loop', 'loop', 'loop', 'sheep-8'),
      makeEdge('loop-e', 'loop', 'e', 'sheep-7'),
    ]
    const result = calculatePath(nodes, edges, ['sheep-3', 'sheep-8', 'sheep-8', 'sheep-7'])
    expect(result.success).toBe(true)
    expect(result.steps[1].isSelfLoop).toBe(true)
    expect(result.steps[0].isSelfLoop).toBe(false)
  })

  it('accepts via the correct branch when the graph forks', () => {
    const nodes = [makeNode('s', true), makeNode('top'), makeNode('bot'), makeNode('e', false, true)]
    const edges = [
      makeEdge('s-top', 's', 'top', 'sheep-3'), makeEdge('s-bot', 's', 'bot', 'sheep-8'),
      makeEdge('top-e', 'top', 'e', 'sheep-7'), makeEdge('bot-e', 'bot', 'e', 'sheep-13'),
    ]
    expect(calculatePath(nodes, edges, ['sheep-8', 'sheep-13']).success).toBe(true)

    // top branch has no sheep-13 edge
    const stuck = calculatePath(nodes, edges, ['sheep-3', 'sheep-13'])
    expect(stuck.success).toBe(false)
    expect(stuck.stuckAtStep).toBe(1)
  })

  it('returns no-start when there is no start node', () => {
    const nodes = [makeNode('s'), makeNode('e', false, true)]
    const result = calculatePath(nodes, [makeEdge('s-e', 's', 'e', 'sheep-3')], ['sheep-3'])
    expect(result.success).toBe(false)
    expect(result.stuckReason).toBe('no-start')
  })

  it('handles empty patterns', () => {
    expect(calculatePath([makeNode('s', true, true)], [], []).success).toBe(true)

    const nodes = [makeNode('s', true), makeNode('e', false, true)]
    expect(calculatePath(nodes, [makeEdge('s-e', 's', 'e', 'sheep-3')], []).success).toBe(false)
  })
})
