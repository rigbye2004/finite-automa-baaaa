import type { Node, Edge } from 'reactflow'

export interface BuildLevelConfig {
  id: number
  title: string
  instruction: string
  hint: string
  initialNodes: Node[]
  initialEdges: Edge[]
  targetPatterns: string[][]
  availableSheep: string[]
  canAddStates: boolean
  canSelfLoop: boolean
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
  // Handle state1, state2, etc.
  const stateMatch = id.match(/^state(\d+)$/)
  if (stateMatch) return `Fence ${stateMatch[1]}`
  // Capitalize first letter as fallback
  return id.charAt(0).toUpperCase() + id.slice(1)
}

// Helper to create node
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

// Helper to create edge
const createEdge = (id: string, source: string, target: string): Edge => ({
  id,
  source,
  target,
  type: 'custom',
  data: { sheep: null },
})

export const BUILD_LEVEL_CONFIGS: BuildLevelConfig[] = [
  // Level 1: just connect
  {
    id: 1,
    title: 'Level 1: Your First Connection',
    instruction: 'Connect the Start fence to the Farmer, then add a sheep.',
    hint: 'Click Connect mode, click Start, then click the bed. Then click the arrow and pick a sheep.',
    conceptsIntroduced: ['connecting'],
    initialNodes: [
      createNode('start', 150, 200, true, false),
      createNode('end', 550, 200, false, true),
    ],
    initialEdges: [],
    targetPatterns: [
      ['sheep-3'],
    ],
    availableSheep: ['sheep-3', 'sheep-8'],
    canAddStates: false,
    canSelfLoop: true,
  },

  // Level 2: two connections
  {
    id: 2,
    title: 'Level 2: A Longer Path',
    instruction: 'Connect Start to Middle to Farmer to make a two-sheep path.',
    hint: 'You need two arrows: one from Start to Middle, one from Middle to the bed.',
    conceptsIntroduced: [],
    initialNodes: [
      createNode('start', 100, 200, true, false),
      createNode('middle', 350, 200, false, false),
      createNode('end', 600, 200, false, true),
    ],
    initialEdges: [],
    targetPatterns: [
      ['sheep-3', 'sheep-8'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8'],
    canAddStates: false,
    canSelfLoop: true,
  },

  // Level 3: two paths
  {
    id: 3,
    title: 'Level 3: Two Ways Home',
    instruction: 'Build two different paths that both help the farmer sleep.',
    hint: 'Create connections for both patterns. The top and bottom fences need different sheep.',
    conceptsIntroduced: [],
    initialNodes: [
      createNode('start', 100, 250, true, false),
      createNode('top', 350, 100, false, false),
      createNode('bottom', 350, 400, false, false),
      createNode('end', 600, 250, false, true),
    ],
    initialEdges: [],
    targetPatterns: [
      ['sheep-3', 'sheep-13'],
      ['sheep-8', 'sheep-16'],
    ],
    availableSheep: ['sheep-3', 'sheep-8', 'sheep-13', 'sheep-16'],
    canAddStates: false,
    canSelfLoop: true,
  },

  // Level 4: set the accepting state
  {
    id: 4,
    title: 'Level 4: Choose the Bed',
    instruction: 'Click a fence to place the farmer\'s bed, then build the path.',
    hint: 'In Select mode, click the rightmost fence to make it the farmer\'s bed.',
    conceptsIntroduced: ['set-accepting'],
    initialNodes: [
      createNode('start', 150, 200, true, false),
      createNode('middle', 550, 200, false, false),
    ],
    initialEdges: [],
    targetPatterns: [
      ['sheep-3', 'sheep-8'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8'],
    canAddStates: false,
    canSelfLoop: true,
  },

  // Level 5: add your own state
  {
    id: 5,
    title: 'Level 5: Build a Fence',
    instruction: 'Drag a new fence onto the field, then connect the path.',
    hint: 'Drag the fence from the toolbar to the middle, then connect Start to New to End.',
    conceptsIntroduced: ['add-state'],
    initialNodes: [
      createNode('start', 100, 200, true, false),
      createNode('end', 600, 200, false, true),
    ],
    initialEdges: [],
    targetPatterns: [
      ['sheep-3', 'sheep-8'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8'],
    canAddStates: true,
    canSelfLoop: true,
  },

  // Level 6: build a diamond
  {
    id: 6,
    title: 'Level 6: The Diamond',
    instruction: 'Add two fences and build two different paths.',
    hint: 'Add a fence above and below the middle, then create paths through each.',
    conceptsIntroduced: [],
    initialNodes: [
      createNode('start', 100, 250, true, false),
      createNode('end', 700, 250, false, true),
    ],
    initialEdges: [],
    targetPatterns: [
      ['sheep-3', 'sheep-13'],
      ['sheep-8', 'sheep-16'],
    ],
    availableSheep: ['sheep-3', 'sheep-8', 'sheep-13', 'sheep-16'],
    canAddStates: true,
    canSelfLoop: true,
  },

  // Level 7: add a loop
  {
    id: 7,
    title: 'Level 7: Going in Circles',
    instruction: 'Build a path with a loop - connect a fence to itself.',
    hint: 'Connect the middle fence to itself to create a loop. Then sheep can jump multiple times.',
    conceptsIntroduced: ['build-loop'],
    initialNodes: [
      createNode('start', 100, 200, true, false),
      createNode('loop', 400, 200, false, false),
      createNode('end', 700, 200, false, true),
    ],
    initialEdges: [],
    targetPatterns: [
      ['sheep-3', 'sheep-8'],
      ['sheep-3', 'sheep-7', 'sheep-8'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8'],
    canAddStates: false,
    canSelfLoop: true,
  },

  // Level 8: free build
  {
    id: 8,
    title: 'Level 8: Your Design',
    instruction: 'Build your own path from scratch.',
    hint: 'Add fences, connect them with arrows, mark one as the bed, and add sheep.',
    conceptsIntroduced: [],
    initialNodes: [
      createNode('start', 100, 250, true, false),
    ],
    initialEdges: [],
    targetPatterns: [
      ['sheep-3', 'sheep-8', 'sheep-13'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8', 'sheep-13'],
    canAddStates: true,
    canSelfLoop: true,
  },

  // Level 9: free build - two patterns
  {
    id: 9,
    title: 'Level 9: Double Trouble',
    instruction: 'Build a path that matches both patterns.',
    hint: 'You\'ll need branching paths - one for each pattern.',
    conceptsIntroduced: [],
    initialNodes: [
      createNode('start', 100, 250, true, false),
    ],
    initialEdges: [],
    targetPatterns: [
      ['sheep-3', 'sheep-13'],
      ['sheep-8', 'sheep-7', 'sheep-16'],
    ],
    availableSheep: ['sheep-3', 'sheep-7', 'sheep-8', 'sheep-13', 'sheep-16'],
    canAddStates: true,
    canSelfLoop: true,
  },

  // Level 10: the ultimate challenge
  {
    id: 10,
    title: 'Level 10: Master Builder',
    instruction: 'Build a path for all three patterns - loops allowed.',
    hint: 'Think about which sheep can be shared between patterns. Use loops if needed.',
    conceptsIntroduced: [],
    initialNodes: [
      createNode('start', 50, 250, true, false),
    ],
    initialEdges: [],
    targetPatterns: [
      ['sheep-3', 'sheep-7', 'sheep-16'],
      ['sheep-8', 'sheep-7', 'sheep-16'],
      ['sheep-3', 'sheep-7', 'sheep-7', 'sheep-16'],
    ],
    availableSheep: ['sheep-1', 'sheep-3', 'sheep-7', 'sheep-8', 'sheep-16'],
    canAddStates: true,
    canSelfLoop: true,
  },
]

export function getBuildLevelConfig(levelId: number): BuildLevelConfig | undefined {
  return BUILD_LEVEL_CONFIGS.find(config => config.id === levelId)
}

export const BUILD_LEVEL_COUNT = BUILD_LEVEL_CONFIGS.length

// Export concept groupings for reference
export const BUILD_CONCEPT_PHASES = {
  connecting: { levels: [1, 2], concepts: ['connecting'] },
  setAccepting: { levels: [3, 4], concepts: ['set-accepting'] },
  addStates: { levels: [5, 6], concepts: ['add-state'] },
  loops: { levels: [7], concepts: [] },  // Already learned
  freeBuild: { levels: [8, 9, 10], concepts: [] },
}
