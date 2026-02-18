import type { Node, Edge } from 'reactflow'

export interface DragLevelConfig {
  id: number
  title: string
  instruction: string
  hint: string
  nodes: Node[]
  edges: Edge[]
  targetPatterns: string[][]
  availableSheep: string[]
  conceptsIntroduced: string[]
}

const friendlyName = (id: string): string => {
  const names: Record<string, string> = {
    'start': 'Start',
    'end': 'End',
    'middle': 'Middle',
    'top': 'Top',
    'bottom': 'Bottom',
    'loop': 'Loop',
    'a': 'A',
    'b': 'B',
  }
  if (names[id]) return names[id]
  const stateMatch = id.match(/^state(\d+)$/)
  if (stateMatch) return `Fence ${stateMatch[1]}`
  return id.charAt(0).toUpperCase() + id.slice(1)
}

const createNode = (
  id: string,
  x: number,
  y: number,
  isStart = false,
  isAccepting = false
): Node => ({
  id,
  type: 'stateNode',
  position: { x, y },
  data: { label: friendlyName(id), isStart, isAccepting, sheep: null },
})

const createEdge = (id: string, source: string, target: string): Edge => ({
  id,
  source,
  target,
  type: 'custom',
  data: { sheep: null },
})

export const DRAG_LEVEL_CONFIGS: DragLevelConfig[] = [
  {
    id: 1,
    title: 'Level 1: One Sheep',
    instruction: 'Place the sheep that helps the farmer fall asleep.',
    hint: 'Look at the pattern on the right - which sheep needs to jump?',
    conceptsIntroduced: ['start-state', 'accepting-state', 'transition'],
    nodes: [
      createNode('start', 150, 200, true, false),
      createNode('end', 550, 200, false, true),
    ],
    edges: [
      createEdge('e-start-end', 'start', 'end'),
    ],
    targetPatterns: [
      ['sheep-3'],
    ],
    availableSheep: ['sheep-3', 'sheep-8'],
  },

  {
    id: 2,
    title: 'Level 2: Two in a Row',
    instruction: 'Two sheep need to jump - one after the other.',
    hint: 'The first sheep on the first arrow, second sheep on the second arrow.',
    conceptsIntroduced: ['sequence'],
    nodes: [
      createNode('start', 100, 200, true, false),
      createNode('middle', 400, 200, false, false),
      createNode('end', 700, 200, false, true),
    ],
    edges: [
      createEdge('e-start-middle', 'start', 'middle'),
      createEdge('e-middle-end', 'middle', 'end'),
    ],
    targetPatterns: [
      ['sheep-3', 'sheep-8'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8'],
  },

  {
    id: 3,
    title: 'Level 3: The Longer Path',
    instruction: 'Three sheep in a row this time.',
    hint: 'Follow the pattern from left to right - each sheep goes on the next arrow.',
    conceptsIntroduced: [],
    nodes: [
      createNode('start', 50, 200, true, false),
      createNode('a', 250, 200, false, false),
      createNode('b', 500, 200, false, false),
      createNode('end', 750, 200, false, true),
    ],
    edges: [
      createEdge('e-start-a', 'start', 'a'),
      createEdge('e-a-b', 'a', 'b'),
      createEdge('e-b-end', 'b', 'end'),
    ],
    targetPatterns: [
      ['sheep-3', 'sheep-7', 'sheep-8'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8', 'sheep-13'],
  },

  {
    id: 4,
    title: 'Level 4: Two Paths',
    instruction: 'There are two different paths - both need to work.',
    hint: 'The top path and bottom path need different sheep. Match both patterns.',
    conceptsIntroduced: ['branching'],
    nodes: [
      createNode('start', 100, 250, true, false),
      createNode('top', 400, 100, false, false),
      createNode('bottom', 400, 400, false, false),
      createNode('end', 700, 250, false, true),
    ],
    edges: [
      createEdge('e-start-top', 'start', 'top'),
      createEdge('e-start-bottom', 'start', 'bottom'),
      createEdge('e-top-end', 'top', 'end'),
      createEdge('e-bottom-end', 'bottom', 'end'),
    ],
    targetPatterns: [
      ['sheep-3', 'sheep-13'],
      ['sheep-8', 'sheep-16'],
    ],
    availableSheep: ['sheep-3', 'sheep-8', 'sheep-13', 'sheep-16'],
  },

  {
    id: 5,
    title: 'Level 5: The Diamond',
    instruction: 'Two paths split and meet again.',
    hint: 'Each pattern takes a different route. Trace them carefully.',
    conceptsIntroduced: [],
    nodes: [
      createNode('start', 100, 250, true, false),
      createNode('top', 400, 80, false, false),
      createNode('bottom', 400, 420, false, false),
      createNode('end', 700, 250, false, true),
    ],
    edges: [
      createEdge('e-start-top', 'start', 'top'),
      createEdge('e-start-bottom', 'start', 'bottom'),
      createEdge('e-top-end', 'top', 'end'),
      createEdge('e-bottom-end', 'bottom', 'end'),
    ],
    targetPatterns: [
      ['sheep-3', 'sheep-13'],
      ['sheep-8', 'sheep-16'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8', 'sheep-13', 'sheep-16'],
  },

  {
    id: 6,
    title: 'Level 6: Crossing Paths',
    instruction: 'Some paths cross over - match all three patterns.',
    hint: 'One path goes: Start, then the top fence, then the bottom fence, then the bed. Can you find it?',
    conceptsIntroduced: [],
    nodes: [
      createNode('start', 50, 280, true, false),
      createNode('state1', 350, 120, false, false),
      createNode('state2', 350, 440, false, false),
      createNode('end', 700, 280, false, true),
    ],
    edges: [
      createEdge('e-start-1', 'start', 'state1'),
      createEdge('e-start-2', 'start', 'state2'),
      createEdge('e-1-end', 'state1', 'end'),
      createEdge('e-1-2', 'state1', 'state2'),
      createEdge('e-2-end', 'state2', 'end'),
    ],
    targetPatterns: [
      ['sheep-3', 'sheep-13'],
      ['sheep-8', 'sheep-16'],
      ['sheep-3', 'sheep-7', 'sheep-16'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8', 'sheep-13', 'sheep-16'],
  },

  {
    id: 7,
    title: 'Level 7: Round and Round',
    instruction: 'The curved arrow means a sheep can jump again.',
    hint: 'One pattern has two of the same sheep in the middle - that\'s the loop.',
    conceptsIntroduced: ['loop'],
    nodes: [
      createNode('start', 100, 250, true, false),
      createNode('loop', 400, 250, false, false),
      createNode('end', 700, 250, false, true),
    ],
    edges: [
      createEdge('e-start-loop', 'start', 'loop'),
      createEdge('e-loop-self', 'loop', 'loop'),
      createEdge('e-loop-end', 'loop', 'end'),
    ],
    targetPatterns: [
      ['sheep-3', 'sheep-8'],
      ['sheep-3', 'sheep-7', 'sheep-8'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8', 'sheep-13'],
  },

  {
    id: 8,
    title: 'Level 8: Loop the Loop',
    instruction: 'A loop and two paths - can you solve it?',
    hint: 'The top path has a loop. The bottom path is direct.',
    conceptsIntroduced: [],
    nodes: [
      createNode('start', 50, 250, true, false),
      createNode('top', 350, 100, false, false),
      createNode('bottom', 350, 400, false, false),
      createNode('end', 700, 250, false, true),
    ],
    edges: [
      createEdge('e-start-top', 'start', 'top'),
      createEdge('e-start-bottom', 'start', 'bottom'),
      createEdge('e-top-self', 'top', 'top'),
      createEdge('e-top-end', 'top', 'end'),
      createEdge('e-bottom-end', 'bottom', 'end'),
    ],
    targetPatterns: [
      ['sheep-3', 'sheep-13'],
      ['sheep-3', 'sheep-7', 'sheep-13'],
      ['sheep-8', 'sheep-16'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8', 'sheep-13', 'sheep-16'],
  },

  {
    id: 9,
    title: 'Level 9: Two Farmers',
    instruction: 'Two farmers need to sleep - different patterns for each.',
    hint: 'Check which patterns go to which farmer (top or bottom bed).',
    conceptsIntroduced: ['multiple-accepting'],
    nodes: [
      createNode('start', 50, 280, true, false),
      createNode('middle', 350, 280, false, false),
      createNode('end-top', 650, 100, false, true),
      createNode('end-bottom', 650, 460, false, true),
    ],
    edges: [
      createEdge('e-start-middle', 'start', 'middle'),
      createEdge('e-middle-top', 'middle', 'end-top'),
      createEdge('e-middle-bottom', 'middle', 'end-bottom'),
    ],
    targetPatterns: [
      ['sheep-3', 'sheep-13'],
      ['sheep-3', 'sheep-16'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-13', 'sheep-16'],
  },

  {
    id: 10,
    title: 'Level 10: The Grand Flock',
    instruction: 'Use everything you have learned.',
    hint: 'Start with the shortest pattern first, then work up.',
    conceptsIntroduced: [],
    nodes: [
      createNode('start', 50, 280, true, false),
      createNode('a', 250, 120, false, false),
      createNode('b', 250, 440, false, false),
      createNode('c', 500, 280, false, false),
      createNode('end', 750, 280, false, true),
    ],
    edges: [
      createEdge('e-start-a', 'start', 'a'),
      createEdge('e-start-b', 'start', 'b'),
      createEdge('e-a-c', 'a', 'c'),
      createEdge('e-b-c', 'b', 'c'),
      createEdge('e-c-self', 'c', 'c'),
      createEdge('e-c-end', 'c', 'end'),
    ],
    targetPatterns: [
      ['sheep-3', 'sheep-7', 'sheep-16'],
      ['sheep-8', 'sheep-7', 'sheep-16'],
      ['sheep-3', 'sheep-7', 'sheep-13', 'sheep-16'],
    ],
    availableSheep: ['sheep-1', 'sheep-3', 'sheep-7', 'sheep-8', 'sheep-13', 'sheep-16'],
  },
]

export function getDragLevelConfig(levelId: number): DragLevelConfig | undefined {
  return DRAG_LEVEL_CONFIGS.find(config => config.id === levelId)
}

export const DRAG_LEVEL_COUNT = DRAG_LEVEL_CONFIGS.length

export const CONCEPT_PHASES = {
  basics: { levels: [1, 2, 3], concepts: ['start-state', 'accepting-state', 'transition', 'sequence'] },
  branching: { levels: [4, 5, 6], concepts: ['branching'] },
  loops: { levels: [7, 8], concepts: ['loop'] },
  multipleEndings: { levels: [9], concepts: ['multiple-accepting'] },
  challenge: { levels: [10], concepts: [] },
}
