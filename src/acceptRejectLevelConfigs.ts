import type { Node, Edge } from 'reactflow'

export interface AcceptRejectQuestion {
  id: number
  nodes: Node[]
  edges: Edge[]
  testPattern: string[]
  correctAnswer: 'accept' | 'reject'
  explanation: string
  conceptsIntroduced: string[]
  rejectionReason?: 'no-path' | 'wrong-state' | 'dead-end' | 'incomplete'
}

export const ACCEPT_REJECT_QUESTIONS: AcceptRejectQuestion[] = [
  {
    id: 1,
    conceptsIntroduced: ['start-state', 'accepting-state', 'transition'],
    nodes: [
      { id: 'start', type: 'stateNode', position: { x: 50, y: 150 }, data: { isStart: true, isAccepting: false } },
      { id: 'end', type: 'stateNode', position: { x: 450, y: 150 }, data: { isStart: false, isAccepting: true } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'end', type: 'sheep', data: { sheep: 'sheep-3' } },
    ],
    testPattern: ['sheep-3'],
    correctAnswer: 'accept',
    explanation: 'The [sheep-3] follows the path straight to the bed. The farmer falls asleep.',
  },

  {
    id: 2,
    conceptsIntroduced: ['rejection'],
    nodes: [
      { id: 'start', type: 'stateNode', position: { x: 50, y: 150 }, data: { isStart: true, isAccepting: false } },
      { id: 'end', type: 'stateNode', position: { x: 450, y: 150 }, data: { isStart: false, isAccepting: true } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'end', type: 'sheep', data: { sheep: 'sheep-3' } },
    ],
    testPattern: ['sheep-8'],
    correctAnswer: 'reject',
    rejectionReason: 'no-path',
    explanation: 'The path needs a [sheep-3], but we have a [sheep-8]. They don\'t match, so the farmer stays awake.',
  },

  {
    id: 3,
    conceptsIntroduced: ['sequence'],
    nodes: [
      { id: 'start', type: 'stateNode', position: { x: 50, y: 150 }, data: { isStart: true, isAccepting: false } },
      { id: 'middle', type: 'stateNode', position: { x: 300, y: 150 }, data: { isStart: false, isAccepting: false } },
      { id: 'end', type: 'stateNode', position: { x: 550, y: 150 }, data: { isStart: false, isAccepting: true } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'middle', type: 'sheep', data: { sheep: 'sheep-3' } },
      { id: 'e2', source: 'middle', target: 'end', type: 'sheep', data: { sheep: 'sheep-8' } },
    ],
    testPattern: ['sheep-3', 'sheep-8'],
    correctAnswer: 'accept',
    explanation: 'The [sheep-3] takes us to the middle, then the [sheep-8] takes us to the bed. Sweet dreams.',
  },

  {
    id: 4,
    conceptsIntroduced: [],
    nodes: [
      { id: 'start', type: 'stateNode', position: { x: 50, y: 150 }, data: { isStart: true, isAccepting: false } },
      { id: 'middle', type: 'stateNode', position: { x: 300, y: 150 }, data: { isStart: false, isAccepting: false } },
      { id: 'end', type: 'stateNode', position: { x: 550, y: 150 }, data: { isStart: false, isAccepting: true } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'middle', type: 'sheep', data: { sheep: 'sheep-3' } },
      { id: 'e2', source: 'middle', target: 'end', type: 'sheep', data: { sheep: 'sheep-8' } },
    ],
    testPattern: ['sheep-3'],
    correctAnswer: 'reject',
    rejectionReason: 'incomplete',
    explanation: 'The [sheep-3] gets us to the middle fence, but the path does not end there. We need one more sheep to reach the bed.',
  },

  {
    id: 5,
    conceptsIntroduced: ['branching'],
    nodes: [
      { id: 'start', type: 'stateNode', position: { x: 50, y: 175 }, data: { isStart: true, isAccepting: false } },
      { id: 'top', type: 'stateNode', position: { x: 300, y: 75 }, data: { isStart: false, isAccepting: false } },
      { id: 'bottom', type: 'stateNode', position: { x: 300, y: 275 }, data: { isStart: false, isAccepting: false } },
      { id: 'end', type: 'stateNode', position: { x: 550, y: 175 }, data: { isStart: false, isAccepting: true } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'top', type: 'sheep', data: { sheep: 'sheep-3' } },
      { id: 'e2', source: 'start', target: 'bottom', type: 'sheep', data: { sheep: 'sheep-8' } },
      { id: 'e3', source: 'top', target: 'end', type: 'sheep', data: { sheep: 'sheep-7' } },
      { id: 'e4', source: 'bottom', target: 'end', type: 'sheep', data: { sheep: 'sheep-13' } },
    ],
    testPattern: ['sheep-8', 'sheep-13'],
    correctAnswer: 'accept',
    explanation: 'The [sheep-8] takes the bottom path, then the [sheep-13] jumps to the bed. Zzzzz...',
  },

  {
    id: 6,
    conceptsIntroduced: [],
    nodes: [
      { id: 'start', type: 'stateNode', position: { x: 50, y: 200 }, data: { isStart: true, isAccepting: false } },
      { id: 'top', type: 'stateNode', position: { x: 300, y: 50 }, data: { isStart: false, isAccepting: false } },
      { id: 'bottom', type: 'stateNode', position: { x: 300, y: 350 }, data: { isStart: false, isAccepting: false } },
      { id: 'end', type: 'stateNode', position: { x: 550, y: 200 }, data: { isStart: false, isAccepting: true } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'top', type: 'sheep', data: { sheep: 'sheep-3' } },
      { id: 'e2', source: 'start', target: 'bottom', type: 'sheep', data: { sheep: 'sheep-8' } },
      { id: 'e3', source: 'top', target: 'end', type: 'sheep', data: { sheep: 'sheep-7' } },
      { id: 'e4', source: 'bottom', target: 'end', type: 'sheep', data: { sheep: 'sheep-13' } },
    ],
    testPattern: ['sheep-3', 'sheep-13'],
    correctAnswer: 'reject',
    rejectionReason: 'no-path',
    explanation: 'The [sheep-3] takes us to the top, but there\'s no [sheep-13] path from there. We need the [sheep-7] instead.',
  },

  {
    id: 7,
    conceptsIntroduced: ['loop'],
    nodes: [
      { id: 'start', type: 'stateNode', position: { x: 50, y: 150 }, data: { isStart: true, isAccepting: false } },
      { id: 'middle', type: 'stateNode', position: { x: 300, y: 150 }, data: { isStart: false, isAccepting: false } },
      { id: 'end', type: 'stateNode', position: { x: 550, y: 150 }, data: { isStart: false, isAccepting: true } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'middle', type: 'sheep', data: { sheep: 'sheep-3' } },
      { id: 'e2', source: 'middle', target: 'middle', type: 'sheep', data: { sheep: 'sheep-8' } },
      { id: 'e3', source: 'middle', target: 'end', type: 'sheep', data: { sheep: 'sheep-7' } },
    ],
    testPattern: ['sheep-3', 'sheep-8', 'sheep-8', 'sheep-7'],
    correctAnswer: 'accept',
    explanation: 'First, [sheep-3] gets us to the loop fence. Then [sheep-8] can go round and round as many times as needed! After looping twice, [sheep-7] finally reaches the bed.',
  },

  {
    id: 8,
    conceptsIntroduced: ['dead-state'],
    nodes: [
      { id: 'start', type: 'stateNode', position: { x: 50, y: 200 }, data: { isStart: true, isAccepting: false } },
      { id: 'good', type: 'stateNode', position: { x: 300, y: 80 }, data: { isStart: false, isAccepting: false } },
      { id: 'trap', type: 'stateNode', position: { x: 300, y: 320 }, data: { isStart: false, isAccepting: false } },
      { id: 'end', type: 'stateNode', position: { x: 550, y: 200 }, data: { isStart: false, isAccepting: true } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'good', type: 'sheep', data: { sheep: 'sheep-3' } },
      { id: 'e2', source: 'start', target: 'trap', type: 'sheep', data: { sheep: 'sheep-8' } },
      { id: 'e3', source: 'good', target: 'end', type: 'sheep', data: { sheep: 'sheep-7' } },
    ],
    testPattern: ['sheep-8', 'sheep-7'],
    correctAnswer: 'reject',
    rejectionReason: 'dead-end',
    explanation: 'The [sheep-8] takes us to a dead end - there are no arrows leading out. The [sheep-7] has nowhere to go, so the farmer stays awake.',
  },

  {
    id: 9,
    conceptsIntroduced: ['multiple-accepting'],
    nodes: [
      { id: 'start', type: 'stateNode', position: { x: 50, y: 200 }, data: { isStart: true, isAccepting: false } },
      { id: 'middle', type: 'stateNode', position: { x: 300, y: 200 }, data: { isStart: false, isAccepting: false } },
      { id: 'end1', type: 'stateNode', position: { x: 550, y: 80 }, data: { isStart: false, isAccepting: true } },
      { id: 'end2', type: 'stateNode', position: { x: 550, y: 320 }, data: { isStart: false, isAccepting: true } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'middle', type: 'sheep', data: { sheep: 'sheep-3' } },
      { id: 'e2', source: 'middle', target: 'end1', type: 'sheep', data: { sheep: 'sheep-7' } },
      { id: 'e3', source: 'middle', target: 'end2', type: 'sheep', data: { sheep: 'sheep-8' } },
    ],
    testPattern: ['sheep-3', 'sheep-8'],
    correctAnswer: 'accept',
    explanation: 'There are two beds. The [sheep-3] then [sheep-8] path leads to the bottom bed. Sweet dreams.',
  },

  {
    id: 10,
    conceptsIntroduced: [],
    nodes: [
      { id: 'start', type: 'stateNode', position: { x: 50, y: 200 }, data: { isStart: true, isAccepting: false } },
      { id: 'path', type: 'stateNode', position: { x: 300, y: 100 }, data: { isStart: false, isAccepting: false } },
      { id: 'trap', type: 'stateNode', position: { x: 300, y: 300 }, data: { isStart: false, isAccepting: false } },
      { id: 'end', type: 'stateNode', position: { x: 550, y: 100 }, data: { isStart: false, isAccepting: true } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'path', type: 'sheep', data: { sheep: 'sheep-3' } },
      { id: 'e2', source: 'start', target: 'trap', type: 'sheep', data: { sheep: 'sheep-8' } },
      { id: 'e3', source: 'path', target: 'path', type: 'sheep', data: { sheep: 'sheep-8' } },
      { id: 'e4', source: 'path', target: 'end', type: 'sheep', data: { sheep: 'sheep-7' } },
      { id: 'e5', source: 'trap', target: 'trap', type: 'sheep', data: { sheep: 'sheep-8' } },
    ],
    testPattern: ['sheep-3', 'sheep-8', 'sheep-8', 'sheep-7'],
    correctAnswer: 'accept',
    explanation: 'Starting with a [sheep-3] puts us on the right path. We can count any number of [sheep-8], then a [sheep-7] takes us to bed. The bottom path is a trap - once you go there with a [sheep-8], you\'re stuck.',
  },
]

export function getAcceptRejectQuestion(questionId: number): AcceptRejectQuestion | undefined {
  return ACCEPT_REJECT_QUESTIONS.find(q => q.id === questionId)
}

export const ACCEPT_REJECT_QUESTION_COUNT = ACCEPT_REJECT_QUESTIONS.length

export const ACCEPT_REJECT_CONCEPT_PHASES = {
  basics: { questions: [1, 2], concepts: ['start-state', 'accepting-state', 'transition', 'rejection'] },
  sequences: { questions: [3, 4], concepts: ['sequence'] },
  branching: { questions: [5, 6], concepts: ['branching'] },
  loops: { questions: [7], concepts: ['loop'] },
  deadEnds: { questions: [8], concepts: ['dead-state'] },
  multipleAccepting: { questions: [9], concepts: ['multiple-accepting'] },
  challenge: { questions: [10], concepts: [] },
}
