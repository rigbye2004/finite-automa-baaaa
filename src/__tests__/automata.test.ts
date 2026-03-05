import { describe, it, expect } from 'vitest'
import type { Node, Edge } from 'reactflow'
import { findAllPaths, pathsMatch, calculateStars } from '../utils/automata'

function node(id: string, isStart = false, isAccepting = false): Node {
  return { id, type: 'stateNode', position: { x: 0, y: 0 }, data: { isStart, isAccepting } }
}

function edge(id: string, source: string, target: string, sheep: string): Edge {
  return { id, source, target, data: { sheep } }
}

describe('findAllPaths', () => {
  it('returns nothing with no start node or no accepting node', () => {
    const ns = [node('a'), node('b', false, true)]
    expect(findAllPaths(ns, [edge('e', 'a', 'b', 'sheep-3')])).toEqual([])

    const ns2 = [node('a', true), node('b')]
    expect(findAllPaths(ns2, [edge('e', 'a', 'b', 'sheep-3')])).toEqual([])
  })

  it('finds a single direct path', () => {
    const nodes = [node('s', true), node('e', false, true)]
    expect(findAllPaths(nodes, [edge('s-e', 's', 'e', 'sheep-3')])).toEqual([['sheep-3']])
  })

  it('finds all branches when the graph forks', () => {
    const nodes = [node('s', true), node('top'), node('bot'), node('e', false, true)]
    const edges = [
      edge('s-top', 's', 'top', 'sheep-3'), edge('s-bot', 's', 'bot', 'sheep-8'),
      edge('top-e', 'top', 'e', 'sheep-13'), edge('bot-e', 'bot', 'e', 'sheep-16'),
    ]
    const paths = findAllPaths(nodes, edges)
    expect(paths).toHaveLength(2)
    expect(paths).toContainEqual(['sheep-3', 'sheep-13'])
    expect(paths).toContainEqual(['sheep-8', 'sheep-16'])
  })

  it('follows self-loops for multiple iterations', () => {
    const nodes = [node('s', true), node('loop'), node('e', false, true)]
    const edges = [
      edge('s-loop', 's', 'loop', 'sheep-3'),
      edge('loop-loop', 'loop', 'loop', 'sheep-7'),
      edge('loop-e', 'loop', 'e', 'sheep-8'),
    ]
    const paths = findAllPaths(nodes, edges)
    expect(paths).toContainEqual(['sheep-3', 'sheep-8'])
    expect(paths).toContainEqual(['sheep-3', 'sheep-7', 'sheep-8'])
    expect(paths).toContainEqual(['sheep-3', 'sheep-7', 'sheep-7', 'sheep-8'])
  })

  it('stops searching past 10 steps', () => {
    const nodes: Node[] = [node('n0', true)]
    const edges: Edge[] = []
    for (let i = 1; i <= 12; i++) {
      nodes.push(node('n' + i, false, i === 12))
      edges.push(edge('e' + i, 'n' + (i - 1), 'n' + i, 'sheep-3'))
    }
    expect(findAllPaths(nodes, edges)).toEqual([])
  })

  it('skips edges with no sheep label', () => {
    const nodes = [node('s', true), node('e', false, true)]
    const edges: Edge[] = [{ id: 'e', source: 's', target: 'e', data: { sheep: null } }]
    expect(findAllPaths(nodes, edges)).toEqual([])
  })

  it('handles multiple accepting nodes', () => {
    const nodes = [node('s', true), node('m'), node('e1', false, true), node('e2', false, true)]
    const edges = [
      edge('s-m', 's', 'm', 'sheep-3'),
      edge('m-e1', 'm', 'e1', 'sheep-7'),
      edge('m-e2', 'm', 'e2', 'sheep-8'),
    ]
    const paths = findAllPaths(nodes, edges)
    expect(paths).toHaveLength(2)
    expect(paths).toContainEqual(['sheep-3', 'sheep-7'])
    expect(paths).toContainEqual(['sheep-3', 'sheep-8'])
  })
})

describe('pathsMatch', () => {
  it('matches identical paths', () => {
    expect(pathsMatch(['sheep-3', 'sheep-8'], ['sheep-3', 'sheep-8'])).toBe(true)
    expect(pathsMatch([], [])).toBe(true)
  })

  it('rejects different content, order, or length', () => {
    expect(pathsMatch(['sheep-3', 'sheep-8'], ['sheep-3', 'sheep-7'])).toBe(false)
    expect(pathsMatch(['sheep-3', 'sheep-8'], ['sheep-8', 'sheep-3'])).toBe(false)
    expect(pathsMatch(['sheep-3'], ['sheep-3', 'sheep-8'])).toBe(false)
  })
})

describe('calculateStars', () => {
  it('returns the right star count based on percentage', () => {
    expect(calculateStars(1.0)).toBe(3)
    expect(calculateStars(0.9)).toBe(3)
    expect(calculateStars(0.89)).toBe(2)
    expect(calculateStars(0.7)).toBe(2)
    expect(calculateStars(0.69)).toBe(1)
    expect(calculateStars(0)).toBe(1)
  })
})
