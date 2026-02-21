import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import ReactFlow, {
  useNodesState,
  useEdgesState,
  MarkerType,
  Controls,
} from 'reactflow'
import type { Node, Edge, ReactFlowInstance } from 'reactflow'
import 'reactflow/dist/style.css'
import { withBase } from './withBase'
import { startTouchDrag } from './utils/touchDrag'
import './BuildLevel.css'
import StateNode from './components/StateNode'
import { EyeIcon } from './components/Icons'
import PatternDisplay from './components/PatternDisplay'
import CustomEdge from './components/CustomEdge'
import { useGameProgress } from './contexts/GameProgressContext'
import type { Badge } from './contexts/GameProgressContext'
import { getBuildLevelConfig, BUILD_LEVEL_COUNT, type BuildLevelConfig } from './buildLevelConfigs'
import { SheepPathAnimator, useSheepAnimation } from './components/SheepPathAnimator'
import './components/SheepPathAnimator.css'

import { TutorialDemo, hasSeenDemo, markDemoSeen, pickDemoForState } from './components/TutorialDemo'
import type { DemoConcept } from './components/TutorialDemo'
import { PatternMatchFeedback } from './components/DetailedFeedback'
import BadgeNotch from './components/BadgeNotch'
import './components/TutorialDemo.css'
import './components/DetailedFeedback.css'
import './components/BadgeNotch.css'

const DEV_MODE_KEY = 'sheep-automata-dev-mode'
const isDevMode = () => localStorage.getItem(DEV_MODE_KEY) === 'true'

const FENCE_GHOST_SRC = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 38" width="56" height="48">' +
  '<rect x="2" y="2" width="7" height="36" rx="1.5" fill="#8B4513"/>' +
  '<rect x="35" y="2" width="7" height="36" rx="1.5" fill="#8B4513"/>' +
  '<rect x="8" y="6" width="28" height="5" rx="1" fill="#A0522D"/>' +
  '<rect x="8" y="16" width="28" height="5" rx="1" fill="#A0522D"/>' +
  '<rect x="8" y="26" width="28" height="5" rx="1" fill="#A0522D"/>' +
  '</svg>'
)

const edgeTypes = { custom: CustomEdge }
const nodeTypes = { stateNode: StateNode }

interface BuildLevelProps {
  onBack?: () => void
  initialLevel?: number
}

const PROGRESS_KEY = 'sheep-automata-build-progress'

interface SavedProgress {
  currentLevelId: number
  score: number
  completedLevels: number[]
}

function loadProgress(): SavedProgress | null {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load progress:', e)
  }
  return null
}

function saveProgress(progress: SavedProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch (e) {
    console.warn('Failed to save progress:', e)
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(PROGRESS_KEY)
  } catch (e) {
    console.warn('Failed to clear progress:', e)
  }
}

function BuildLevel({ onBack, initialLevel = 1 }: BuildLevelProps) {
  const savedProgress = useRef(loadProgress())

  const [currentLevelId, setCurrentLevelId] = useState(() => {
    const saved = savedProgress.current
    if (!saved) return initialLevel
    for (let i = 1; i <= BUILD_LEVEL_COUNT; i++) {
      if (!saved.completedLevels.includes(i)) return i
    }
    return BUILD_LEVEL_COUNT // all done
  })
  const [levelConfig, setLevelConfig] = useState<BuildLevelConfig | null>(() => getBuildLevelConfig(savedProgress.current?.currentLevelId ?? initialLevel) ?? null)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)
  const [selectedSheep, setSelectedSheep] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [hintUsedThisLevel, setHintUsedThisLevel] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)
  const [score, setScore] = useState(savedProgress.current?.score ?? 0)
  const [completedLevels, setCompletedLevels] = useState<number[]>(savedProgress.current?.completedLevels ?? [])
  const [attempts, setAttempts] = useState(0)
  const [mode, setMode] = useState<'select' | 'connect' | 'delete'>('select')

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const dragConnectRef = useRef<{ startPos: { x: number; y: number }; nodeId: string } | null>(null)
  const graphRef = useRef<HTMLDivElement>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ type: 'node' | 'edge', id: string } | null>(null)

  const [showDemo, setShowDemo] = useState(false)
  const [demoConcept, setDemoConcept] = useState<DemoConcept>('connecting')
  const [showNudge, setShowNudge] = useState<'toolbar' | 'graph' | null>(null)

  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const [feedbackData, setFeedbackData] = useState<{
    matchedPatterns: string[][]
    unmatchedPatterns: string[][]
  }>({ matchedPatterns: [], unmatchedPatterns: [] })

  const nodeIdCounter = useRef(1)
  const edgeIdCounter = useRef(1)
  
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

  const {
    isAnimating,
    animationResult,
    startAnimation,
    handleAnimationComplete,
    handleAllPatternsComplete,
    handleStepChange,
    resetAnimation,
  } = useSheepAnimation()

  const { awardStars, recordCorrectAnswer, getEarnedBadges } = useGameProgress()
  
  const [sessionBadges, setSessionBadges] = useState<Badge[]>([])

  useEffect(() => {
    if (currentLevelId <= BUILD_LEVEL_COUNT) {
      saveProgress({
        currentLevelId,
        score,
        completedLevels
      })
    }
  }, [currentLevelId, score, completedLevels])

  useEffect(() => {
    if (showDetailedFeedback && !levelComplete) {
      setShowDetailedFeedback(false)
    }
  }, [edges, nodes]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 3000)
    return () => clearTimeout(t)
  }, [message])

  useEffect(() => {
    if (showDetailedFeedback && feedbackRef.current) {
      setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    }
  }, [showDetailedFeedback])

  const handleFitView = useCallback(() => {
    if (reactFlowInstance.current) {
      const nodeCount = reactFlowInstance.current.getNodes().length
      const maxZoom = nodeCount <= 1 ? 0.85 : nodeCount <= 4 ? 1.0 : 1.5
      reactFlowInstance.current.fitView({
        padding: 0.4,
        duration: 0,
        minZoom: 0.3,
        maxZoom,
      })
      if (nodeCount <= 1 && graphRef.current) {
        const { x, y, zoom } = reactFlowInstance.current.getViewport()
        const graphWidth = graphRef.current.getBoundingClientRect().width
        reactFlowInstance.current.setViewport({ x: x - graphWidth * 0.2, y, zoom })
      }
    }
  }, [])

  useEffect(() => {
    const timeouts = [50, 200].map(delay =>
      setTimeout(handleFitView, delay)
    )
    return () => timeouts.forEach(t => clearTimeout(t))
  }, [currentLevelId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout
    
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(handleFitView, 150)
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [handleFitView])

  useEffect(() => {
    const config = getBuildLevelConfig(currentLevelId)
    if (config) {
      setLevelConfig(config)
      const newNodes = config.initialNodes.map(n => ({
        ...n,
        data: { ...n.data, sheep: null, showLabel: false }
      }))
      const newEdges = config.initialEdges.map(e => ({
        ...e,
        data: { ...e.data, sheep: null }
      }))
      setNodes(newNodes)
      setEdges(newEdges)
      setMessage('')
      setMessageType('')
      setSelectedEdge(null)
      setConnectingFrom(null)
      setLevelComplete(false)
      setAttempts(0)
      setShowDemo(false)
      setMode('select')
      setShowDetailedFeedback(false)
      
      nodeIdCounter.current = config.initialNodes.length + 1
      edgeIdCounter.current = config.initialEdges.length + 1

      const concepts = config.conceptsIntroduced || []
      if (concepts.length > 0) {
        const demo = concepts[0] as DemoConcept
        if (!hasSeenDemo(demo)) {
          markDemoSeen(demo)
          setTimeout(() => {
            setDemoConcept(demo)
            setShowDemo(true)
          }, 400)
        }
      }
    }
  }, [currentLevelId])

  const findNearestNode = useCallback((flowPoint: { x: number; y: number }) => {
    let best = { id: null as string | null, dist: Infinity }
    nodes.forEach((node) => {
      const cx = node.position.x + 60
      const cy = node.position.y + 50
      const d = Math.hypot(flowPoint.x - cx, flowPoint.y - cy)
      if (d < best.dist) {
        best = { id: node.id, dist: d }
      }
    })
    return best.dist < 120 ? best.id : null
  }, [nodes])

  const completeConnection = useCallback((sourceId: string, targetId: string) => {
    if (sourceId !== targetId || levelConfig?.canSelfLoop) {
      const existingEdge = edges.find(
        e => e.source === sourceId && e.target === targetId
      )
      if (existingEdge) {
        const isSelfLoop = sourceId === targetId
        setMessage(isSelfLoop ? 'This fence already has a loop!' : 'This connection already exists!')
        setMessageType('error')
        setConnectingFrom(null)
        return
      }
      
      const newEdge: Edge = {
        id: `edge-${edgeIdCounter.current++}`,
        source: sourceId,
        target: targetId,
        type: 'custom',
        data: { sheep: null },
      }
      setEdges((eds) => [...eds, newEdge])
    }
    setConnectingFrom(null)
    setMousePos(null)
  }, [levelConfig, edges, setEdges])

  function pointToSegmentDistance(
    p: { x: number; y: number },
    v: { x: number; y: number },
    w: { x: number; y: number }
  ) {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y)
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
    t = Math.max(0, Math.min(1, t))
    const projx = v.x + t * (w.x - v.x)
    const projy = v.y + t * (w.y - v.y)
    return Math.hypot(p.x - projx, p.y - projy)
  }

  const dropSheepAtPosition = useCallback((sheepType: string, fromEdgeId: string | null, clientX: number, clientY: number) => {
    if (!reactFlowInstance.current) return

    const point = reactFlowInstance.current.screenToFlowPosition({ x: clientX, y: clientY })

    let best = { id: null as string | null, dist: Infinity }
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source)
      const targetNode = nodes.find((n) => n.id === edge.target)
      if (!sourceNode || !targetNode) return

      const sourceCenter = { x: sourceNode.position.x + 60, y: sourceNode.position.y + 50 }
      const targetCenter = { x: targetNode.position.x + 60, y: targetNode.position.y + 50 }

      let d: number
      if (edge.source === edge.target) {
        const loopCenter = { x: sourceCenter.x, y: sourceCenter.y - 170 }
        d = Math.hypot(point.x - loopCenter.x, point.y - loopCenter.y)
      } else {
        d = pointToSegmentDistance(point, sourceCenter, targetCenter)
      }

      if (d < best.dist) best = { id: edge.id, dist: d }
    })

    if (best.id && best.dist < 100) {
      setEdges((eds) =>
        eds.map((edge) => {
          if (fromEdgeId && edge.id === fromEdgeId && edge.id !== best.id) {
            return { ...edge, data: { ...edge.data, sheep: null } }
          }
          if (edge.id === best.id) {
            return { ...edge, data: { ...edge.data, sheep: sheepType } }
          }
          return edge
        })
      )
      setSelectedEdge(null)
    } else if (fromEdgeId) {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === fromEdgeId ? { ...edge, data: { ...edge.data, sheep: null } } : edge
        )
      )
    }
  }, [edges, nodes, setEdges])

  const handleDropOnGraph = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    if (!reactFlowInstance.current) return

    const toolType = event.dataTransfer.getData('text/tool')
    if (toolType) {
      const point = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      const nearestNodeId = findNearestNode(point)

      if (toolType === 'arrow-from' && nearestNodeId) {
        setConnectingFrom(nearestNodeId)
        setMode('connect')
      } else if (toolType === 'arrow-to' && nearestNodeId && connectingFrom) {
        completeConnection(connectingFrom, nearestNodeId)
      } else if (toolType === 'bed') {
        const position = reactFlowInstance.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })
        const newNode: Node = {
          id: `state-${nodeIdCounter.current++}`,
          type: 'stateNode',
          position,
          data: {
            label: `Fence ${nodeIdCounter.current - 1}`,
            isStart: false,
            isAccepting: true,
            sheep: null,
            showLabel: false
          },
        }
        setNodes((nds) => [...nds, newNode])
      }
      return
    }

    const sheepType = event.dataTransfer.getData('text/sheep')
    const fromEdgeId = event.dataTransfer.getData('text/fromEdge') || null
    if (sheepType) {
      dropSheepAtPosition(sheepType, fromEdgeId, event.clientX, event.clientY)
      return
    }

    if (!levelConfig?.canAddStates) return

    const type = event.dataTransfer.getData('application/reactflow')
    if (type !== 'stateNode') return

    const position = reactFlowInstance.current.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    const newNode: Node = {
      id: `state-${nodeIdCounter.current++}`,
      type: 'stateNode',
      position,
      data: {
        label: `Fence ${nodeIdCounter.current - 1}`,
        isStart: false,
        isAccepting: false,
        sheep: null,
        showLabel: false
      },
    }

    setNodes((nds) => [...nds, newNode])
  }, [levelConfig, dropSheepAtPosition, setNodes, findNearestNode, completeConnection, connectingFrom])

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (mode === 'connect') {
      if (connectingFrom === null) {
        setConnectingFrom(node.id)
      } else {
        completeConnection(connectingFrom, node.id)
      }
    } else if (mode === 'delete') {
      if (!node.data.isStart) {
        setPendingDelete({ type: 'node', id: node.id })
        setShowDeleteConfirm(true)
      }
    }
  }, [mode, connectingFrom, completeConnection])

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    if (mode === 'delete') {
      setPendingDelete({ type: 'edge', id: edge.id })
      setShowDeleteConfirm(true)
    } else if (selectedSheep) {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === edge.id) {
            return {
              ...e,
              data: { ...e.data, sheep: selectedSheep },
            }
          }
          return e
        })
      )
      setSelectedSheep(null)
    } else if (edge.data?.sheep) {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === edge.id) {
            return {
              ...e,
              data: { ...e.data, sheep: null },
            }
          }
          return e
        })
      )
    } else {
      setSelectedEdge(edge.id)
    }
  }, [mode, selectedSheep, setEdges])

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return
    
    if (pendingDelete.type === 'node') {
      setNodes((nds) => nds.filter((n) => n.id !== pendingDelete.id))
      setEdges((eds) => eds.filter((e) => e.source !== pendingDelete.id && e.target !== pendingDelete.id))
    } else if (pendingDelete.type === 'edge') {
      setEdges((eds) => eds.filter((e) => e.id !== pendingDelete.id))
    }
    
    setShowDeleteConfirm(false)
    setPendingDelete(null)
  }, [pendingDelete, setNodes, setEdges])

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
    setPendingDelete(null)
  }, [])

  const findAllPaths = useCallback(() => {
    const allPaths: string[][] = []
    const startNode = nodes.find(n => n.data.isStart)
    const acceptingNodes = nodes.filter(n => n.data.isAccepting).map(n => n.id)

    if (!startNode || acceptingNodes.length === 0) return allPaths

    const traverse = (currentNode: string, path: string[], visited: Set<string>) => {
      if (acceptingNodes.includes(currentNode) && path.length > 0) {
        allPaths.push([...path])
      }

      if (path.length >= 10) return

      edges.forEach((edge) => {
        if (edge.source === currentNode && edge.data?.sheep) {
          const visitKey = `${edge.id}-${path.length}`
          if (!visited.has(visitKey)) {
            visited.add(visitKey)
            path.push(edge.data.sheep)
            traverse(edge.target, path, visited)
            path.pop()
            visited.delete(visitKey)
          }
        }
      })
    }

    traverse(startNode.id, [], new Set())
    return allPaths
  }, [nodes, edges])

  const pathsMatch = (path1: string[], path2: string[]) => {
    if (path1.length !== path2.length) return false
    return path1.every((sheep, index) => sheep === path2[index])
  }

  const styledEdges = edges.map((edge) => {
    const isEmptyEdge = !edge.data?.sheep
    const isHighlighted = !!selectedSheep && isEmptyEdge
    
    return {
      ...edge,
      type: 'custom',
      data: {
        ...edge.data,
        isHighlighted,
        isSelected: selectedEdge === edge.id,
        onClick: () => {
          if (mode === 'delete') {
            setPendingDelete({ type: 'edge', id: edge.id })
            setShowDeleteConfirm(true)
          } else if (selectedSheep) {
            setEdges((eds) =>
              eds.map((e) => {
                if (e.id === edge.id) {
                  return {
                    ...e,
                    data: { ...e.data, sheep: selectedSheep },
                  }
                }
                return e
              })
            )
            setSelectedSheep(null)
          }
        },
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isHighlighted ? '#4CAF50' : selectedEdge === edge.id ? '#4CAF50' : '#888',
      },
      style: {
        stroke: isHighlighted ? '#4CAF50' : selectedEdge === edge.id ? '#4CAF50' : '#888',
        strokeWidth: isHighlighted || selectedEdge === edge.id ? 3 : 2,
      },
    }
  })

  const styledNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        animationResult: node.data.isAccepting && animationResult 
          ? (animationResult.success ? 'success' : 'fail')
          : null
      }
    }))
  }, [nodes, animationResult])

  const handleReset = () => {
    if (!levelConfig) return

    const newNodes = levelConfig.initialNodes.map(n => ({
      ...n,
      data: { ...n.data, sheep: null, showLabel: false }
    }))
    const newEdges = levelConfig.initialEdges.map(e => ({
      ...e,
      data: { ...e.data, sheep: null }
    }))
    setNodes(newNodes)
    setEdges(newEdges)
    setSelectedEdge(null)
    setSelectedSheep(null)
    setConnectingFrom(null)
    setMessage('')
    setMessageType('')
    setLevelComplete(false)
    setMode('select')
    setShowDetailedFeedback(false)
    setSessionBadges([])
    nodeIdCounter.current = levelConfig.initialNodes.length + 1
    edgeIdCounter.current = levelConfig.initialEdges.length + 1
  }

  const handleSubmit = () => {
    if (!levelConfig) return

    const hasAccepting = nodes.some(n => n.data.isAccepting)
    if (!hasAccepting) {
      setMessage('You need at least one farmer\'s bed!')
      setMessageType('error')
      return
    }

    const allEdgesFilled = edges.every((edge) => edge.data?.sheep)
    if (!allEdgesFilled) {
      setMessage('Place a sheep on every arrow.')
      setMessageType('error')
      return
    }

    startAnimation()

    setAttempts(prev => prev + 1)
    const allPaths = findAllPaths()

    const matched = levelConfig.targetPatterns.filter((pattern) =>
      allPaths.some((path) => pathsMatch(path, pattern))
    )
    const unmatched = levelConfig.targetPatterns.filter((pattern) =>
      !allPaths.some((path) => pathsMatch(path, pattern))
    )

    setFeedbackData({
      matchedPatterns: matched,
      unmatchedPatterns: unmatched,
    })

    const allPatternsMatched = unmatched.length === 0

    if (allPatternsMatched) {
      const isFirstCompletion = !completedLevels.includes(currentLevelId)
      if (isFirstCompletion) {
        const newScore = score + 1
        const newCompleted = [...completedLevels, currentLevelId]
        setScore(newScore)
        setCompletedLevels(newCompleted)
        saveProgress({ currentLevelId, score: newScore, completedLevels: newCompleted })
      }
      
      setLevelComplete(true)
      setShowDetailedFeedback(true)
      setMessage('Correct')
      setMessageType('success')

      const starsForUnlock = (attempts === 0 && !hintUsedThisLevel) ? 2 : 1
      const starBadges = awardStars(`build-level-${currentLevelId}`, starsForUnlock, hintUsedThisLevel)
      const answerBadges = recordCorrectAnswer(`build-level-${currentLevelId}`, 0)
      
      const finalScore = isFirstCompletion ? score + 1 : score
      const percentage = finalScore / BUILD_LEVEL_COUNT
      let stageStars = 1
      if (percentage >= 0.9) stageStars = 3
      else if (percentage >= 0.7) stageStars = 2
      
      const stageBadges = awardStars('build', stageStars, false)
      starBadges.push(...stageBadges)
      
      const allBadges = [...starBadges, ...answerBadges]
      const uniqueBadges = allBadges.filter((badge, index, self) => 
        index === self.findIndex(b => b.id === badge.id)
      )
      if (uniqueBadges.length > 0) setSessionBadges(prev => [...prev, ...uniqueBadges])
    } else {
      setShowDetailedFeedback(true)
      setMessage('')
      setMessageType('error')
    }
  }

  const handleContinueFromFeedback = () => {
    resetAnimation()
    if (levelComplete) {
      let nextLevel: number | null = null
      for (let i = 1; i <= BUILD_LEVEL_COUNT; i++) {
        if (!completedLevels.includes(i)) { nextLevel = i; break }
      }
      if (nextLevel !== null) {
        setCurrentLevelId(nextLevel)
        setHintUsedThisLevel(false)
        setAttempts(0)
        setLevelComplete(false)
      } else {
        clearProgress()
      }
    } else {
      setShowDetailedFeedback(false)
    }
  }

  const handleHintClick = () => {
    if (!levelConfig) return
    setHintUsedThisLevel(true)

    const hasAccepting = nodes.some(n => n.data.isAccepting)
    const emptyEdges = edges.filter(e => !e.data?.sheep)
    const initialNodeCount = levelConfig.initialNodes.length

    const concept = pickDemoForState(
      levelConfig.conceptsIntroduced,
      hasAccepting,
      edges.length,
      emptyEdges.length,
      levelConfig.canAddStates,
      nodes.length,
      initialNodeCount,
    )
    setDemoConcept(concept)
    setShowDemo(true)
  }

  const handleDevAutoComplete = () => {
    const isFirstCompletion = !completedLevels.includes(currentLevelId)
    if (isFirstCompletion) {
      setScore(prev => prev + 1)
      setCompletedLevels(prev => [...prev, currentLevelId])
    }
    
    const finalScore = isFirstCompletion ? score + 1 : score
    const percentage = finalScore / BUILD_LEVEL_COUNT
    let stageStars = 1
    if (percentage >= 0.9) stageStars = 3
    else if (percentage >= 0.7) stageStars = 2
    awardStars('build', stageStars, false)
    
    if (currentLevelId < BUILD_LEVEL_COUNT) {
      setCurrentLevelId(currentLevelId + 1)
      setHintUsedThisLevel(false)
      setAttempts(0)
      setLevelComplete(false)
      setShowDetailedFeedback(false)
    } else {
      clearProgress()
      onBack?.()
    }
  }

  const isLastLevel = currentLevelId === BUILD_LEVEL_COUNT

  if (!levelConfig) {
    return (
      <div className="build-level">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Loading level {currentLevelId}...</h2>
          <button onClick={onBack}>Back to Menu</button>
        </div>
      </div>
    )
  }

  return (
    <div className="build-level">
      <aside className="sheep-panel">
        <button className="home-btn" onClick={onBack} aria-label="Home">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </button>
        <div className="sheep-panel-label">L{currentLevelId}</div>
        {currentLevelId > 1 && (
          <button
            className="prev-btn"
            onClick={() => {
              resetAnimation()
              setCurrentLevelId(currentLevelId - 1)
            }}
            aria-label="Previous level"
          >
            ←
          </button>
        )}
        <div className="sheep-list">
          {Array.from({ length: BUILD_LEVEL_COUNT }, (_, raw) => {
            const i = BUILD_LEVEL_COUNT - 1 - raw  // reverse: bottom-up
            const levelNum = i + 1
            const completed = completedLevels.includes(levelNum)
            const isCurrent = levelNum === currentLevelId
            let status: 'correct' | 'current' | 'future' = 'future'
            if (completed) status = 'correct'
            else if (isCurrent) status = 'current'
            return (
              <div
                key={i}
                className={`sheep-slot status-${status}`}
                onClick={() => { if (status !== 'future') setCurrentLevelId(levelNum) }}
                style={{ cursor: status !== 'future' ? 'pointer' : 'default' }}
              >
                <img
                  src={withBase(`sheep-assets/sheep-${(i % 16) + 1}.svg`)}
                  width={32}
                  height={32}
                  alt=""
                />
                {status === 'correct' && <span className="sheep-badge badge-correct">✓</span>}
              </div>
            )
          })}
        </div>
      </aside>

      <div className="main-content">
      <header className="header-compact">
        <div style={{flex:1}} />
        <BadgeNotch badges={getEarnedBadges()} />
        <button className="hint-button" onClick={handleHintClick} title="Show me how">
          ?
        </button>
      </header>

      <div className="game-container">
        <aside className={`toolbar ${showNudge === 'toolbar' ? 'nudge-pulse' : ''}`}>
          <div className="tool-row-top">
            <div
              className={`tool-cell tool-select ${mode === 'select' ? 'active' : ''}`}
              onClick={() => { setMode('select'); setConnectingFrom(null); setMousePos(null); setSelectedSheep(null) }}
              title="Select"
            >
              <svg width={34} height={34} viewBox="0 0 24 24" fill="none">
                <path d="M7 2L7 18.5L11 14.5L14.5 21L16.5 20L13 13.5L18 13.5Z" fill="currentColor"/>
              </svg>
            </div>

            <div
              className={`tool-cell tool-delete ${mode === 'delete' ? 'active' : ''}`}
              onClick={() => { setMode('delete'); setConnectingFrom(null); setMousePos(null); setSelectedEdge(null); setSelectedSheep(null) }}
              title="Delete"
            >
              <svg width={34} height={34} viewBox="0 0 32 32" fill="none">
                <line x1="8" y1="8" x2="24" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="24" y1="8" x2="8" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div
            className={`arrow-capsule ${mode === 'connect' ? (connectingFrom ? 'state-to' : 'state-from') : ''}`}
            draggable
            onClick={() => { setMode('connect'); setSelectedSheep(null); if (connectingFrom) setConnectingFrom(null) }}
            onDragStart={(e) => {
              if (connectingFrom) {
                e.dataTransfer.setData('text/tool', 'arrow-to')
              } else {
                e.dataTransfer.setData('text/tool', 'arrow-from')
                setMode('connect')
                setSelectedSheep(null)
              }
            }}
            title={connectingFrom ? "Now click or drag onto destination fence" : "Click or drag from source fence"}
          >
            <span className="arrow-cap arrow-cap-from">
              <svg width={28} height={28} viewBox="0 0 36 36" fill="none">
                <circle cx="10" cy="18" r="5.5" stroke="currentColor" strokeWidth="2.2" fill="none" />
                <line x1="15.5" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span>From</span>
            </span>
            <span className="arrow-cap-divider" />
            <span className="arrow-cap arrow-cap-to">
              <svg width={28} height={28} viewBox="0 0 36 36" fill="none">
                <line x1="2" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <polygon points="22,11 33,18 22,25" fill="currentColor" />
              </svg>
              <span>To</span>
            </span>
          </div>

          <div className="tool-grid">
            {levelConfig.canAddStates && (
              <div
                className="tool-cell tool-fence"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', 'stateNode')
                }}
                onTouchStart={(e) => startTouchDrag(
                  e.touches[0],
                  'fence',
                  FENCE_GHOST_SRC,
                  (_id, x, y) => {
                    if (!reactFlowInstance.current) return
                    const position = reactFlowInstance.current.screenToFlowPosition({ x, y })
                    const newNode: Node = {
                      id: `state-${nodeIdCounter.current++}`,
                      type: 'stateNode',
                      position,
                      data: { label: `Fence ${nodeIdCounter.current - 1}`, isStart: false, isAccepting: false, sheep: null, showLabel: false },
                    }
                    setNodes((nds) => [...nds, newNode])
                  },
                )}
                title="Drag onto the field"
              >
                <svg width={56} height={48} viewBox="0 0 44 38" fill="none">
                  <rect x="2" y="2" width="7" height="36" rx="1.5" fill="#8B4513" stroke="#5D3A1A" strokeWidth="0.8"/>
                  <rect x="35" y="2" width="7" height="36" rx="1.5" fill="#8B4513" stroke="#5D3A1A" strokeWidth="0.8"/>
                  <rect x="8" y="6" width="28" height="5" rx="1" fill="#A0522D" stroke="#8B4513" strokeWidth="0.5"/>
                  <rect x="8" y="16" width="28" height="5" rx="1" fill="#A0522D" stroke="#8B4513" strokeWidth="0.5"/>
                  <rect x="8" y="26" width="28" height="5" rx="1" fill="#A0522D" stroke="#8B4513" strokeWidth="0.5"/>
                </svg>
              </div>
            )}

            {currentLevelId >= 4 && (
              <div
                className="tool-cell tool-bed"
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/tool', 'bed') }}
                onTouchStart={(e) => startTouchDrag(
                  e.touches[0],
                  'bed',
                  withBase('sheep-assets/awake-farmer.svg'),
                  (_id, x, y) => {
                    if (!reactFlowInstance.current) return
                    const position = reactFlowInstance.current.screenToFlowPosition({ x, y })
                    const newNode: Node = {
                      id: `state-${nodeIdCounter.current++}`,
                      type: 'stateNode',
                      position,
                      data: { label: `Fence ${nodeIdCounter.current - 1}`, isStart: false, isAccepting: true, sheep: null, showLabel: false },
                    }
                    setNodes((nds) => [...nds, newNode])
                  },
                )}
                title="Drag onto the field"
              >
                <img src={withBase("sheep-assets/awake-farmer.svg")} width={56} height={44} alt="Bed" className="tool-bed-icon" />
              </div>
            )}

          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-sheep">
            {levelConfig.availableSheep.map((sheepId) => (
              <div
                key={sheepId}
                className={`toolbar-sheep-item ${selectedSheep === sheepId ? 'selected' : ''}`}
                draggable
                onClick={() => {
                  if (selectedSheep === sheepId) {
                    setSelectedSheep(null)
                    setMessage('')
                  } else {
                    setSelectedSheep(sheepId)
                    setSelectedEdge(null)
                    setMode('connect')
                    setConnectingFrom(null)
                    setMessageType('')
                  }
                }}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/sheep', sheepId)
                }}
                onTouchStart={(e) => startTouchDrag(
                  e.touches[0],
                  sheepId,
                  withBase(`sheep-assets/${sheepId}.svg`),
                  (id, x, y) => dropSheepAtPosition(id, null, x, y),
                )}
                title="Click or drag onto an arrow"
              >
                <img src={withBase(`sheep-assets/${sheepId}.svg`)} alt={sheepId} />
              </div>
            ))}
          </div>
        </aside>

        <div className="graph-column">
          <div
            ref={graphRef}
            className={`graph-area ${mode === 'connect' ? 'mode-connect' : mode === 'delete' ? 'mode-delete' : 'mode-select'}${showNudge === 'graph' ? ' nudge-pulse' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnGraph}
            onMouseDown={(e) => {
              if (mode === 'connect' && !connectingFrom && reactFlowInstance.current && graphRef.current) {
                const point = reactFlowInstance.current.screenToFlowPosition({
                  x: e.clientX,
                  y: e.clientY,
                })
                const nearestId = findNearestNode(point)
                if (nearestId) {
                  dragConnectRef.current = { startPos: { x: e.clientX, y: e.clientY }, nodeId: nearestId }
                  e.preventDefault()
                }
              }
            }}
            onMouseMove={(e) => {
              if (dragConnectRef.current && !connectingFrom) {
                const { startPos, nodeId } = dragConnectRef.current
                const dragDist = Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y)
                if (dragDist > 15) {
                  setConnectingFrom(nodeId)
                }
              }
              if (connectingFrom && graphRef.current) {
                const rect = graphRef.current.getBoundingClientRect()
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
              }
            }}
            onMouseUp={(e) => {
              const wasDragging = dragConnectRef.current !== null
              dragConnectRef.current = null
              if (mode === 'connect' && connectingFrom && wasDragging && reactFlowInstance.current) {
                const point = reactFlowInstance.current.screenToFlowPosition({
                  x: e.clientX,
                  y: e.clientY,
                })
                const nearestId = findNearestNode(point)
                if (nearestId) {
                  completeConnection(connectingFrom, nearestId)
                }
              }
            }}
            onMouseLeave={() => setMousePos(null)}
            onTouchStart={(e) => {
              if (mode === 'connect' && !connectingFrom && reactFlowInstance.current && graphRef.current) {
                const touch = e.touches[0]
                const point = reactFlowInstance.current.screenToFlowPosition({
                  x: touch.clientX,
                  y: touch.clientY,
                })
                const nearestId = findNearestNode(point)
                if (nearestId) {
                  dragConnectRef.current = { startPos: { x: touch.clientX, y: touch.clientY }, nodeId: nearestId }
                }
              }
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0]
              if (dragConnectRef.current && !connectingFrom) {
                const { startPos, nodeId } = dragConnectRef.current
                if (Math.hypot(touch.clientX - startPos.x, touch.clientY - startPos.y) > 15) {
                  setConnectingFrom(nodeId)
                }
              }
              if (connectingFrom && graphRef.current) {
                const rect = graphRef.current.getBoundingClientRect()
                setMousePos({ x: touch.clientX - rect.left, y: touch.clientY - rect.top })
              }
            }}
            onTouchEnd={(e) => {
              const wasDragging = dragConnectRef.current !== null
              dragConnectRef.current = null
              setMousePos(null)
              if (mode === 'connect' && connectingFrom && wasDragging && reactFlowInstance.current) {
                e.preventDefault()
                const touch = e.changedTouches[0]
                const point = reactFlowInstance.current.screenToFlowPosition({
                  x: touch.clientX,
                  y: touch.clientY,
                })
                const nearestId = findNearestNode(point)
                if (nearestId) {
                  completeConnection(connectingFrom, nearestId)
                }
              }
            }}
          >
          <ReactFlow
            nodes={styledNodes}
            edges={styledEdges}
            edgeTypes={edgeTypes}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onInit={(instance) => {
              reactFlowInstance.current = instance
            }}
            panOnDrag={mode === 'select'}
            panOnScroll={mode === 'select'}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
            minZoom={0.2}
            maxZoom={2}
            nodesDraggable={mode === 'select'}
            nodesConnectable={false}
            elementsSelectable={true}
          >
            <Controls showInteractive={false} />
          </ReactFlow>
          
          {connectingFrom && mousePos && graphRef.current && reactFlowInstance.current && (() => {
            const sourceNode = nodes.find(n => n.id === connectingFrom)
            if (!sourceNode) return null
            const flowCenter = {
              x: sourceNode.position.x + 60,
              y: sourceNode.position.y + 50,
            }
            const viewport = reactFlowInstance.current!.getViewport()
            const screenX = flowCenter.x * viewport.zoom + viewport.x
            const screenY = flowCenter.y * viewport.zoom + viewport.y
            
            const dx = mousePos.x - screenX
            const dy = mousePos.y - screenY
            const dist = Math.hypot(dx, dy)
            
            const nodeRadius = 60 * viewport.zoom
            const loopThreshold = nodeRadius + 30
            
            if (dist < loopThreshold && levelConfig?.canSelfLoop) {
              const z = viewport.zoom
              const loopHeight = 50 * z
              const loopWidth = 30 * z
              const gap = 10 * z
              
              const nodeTopY = screenY - nodeRadius * 0.7

              const startX = screenX - gap
              const startY = nodeTopY
              const endX = screenX + gap
              const endY = nodeTopY
              
              const peakY = nodeTopY - loopHeight
              
              const pathD = `
                M ${startX} ${startY}
                C ${startX - loopWidth} ${startY - loopHeight * 0.4},
                  ${startX - loopWidth * 0.5} ${peakY},
                  ${screenX} ${peakY}
                C ${endX + loopWidth * 0.5} ${peakY},
                  ${endX + loopWidth} ${endY - loopHeight * 0.4},
                  ${endX} ${endY}
              `
              
              const headLen = 10
              const ax = endX + 4
              const ay = endY - headLen
              const bx = endX + headLen
              const by = endY + 2
              
              return (
                <svg className="connecting-line" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 20,
                }}>
                  <path
                    d={pathD}
                    stroke="#4CAF50"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.7"
                  />
                  <polygon
                    points={`${endX},${endY} ${ax},${ay} ${bx},${by}`}
                    fill="#4CAF50"
                    opacity="0.7"
                  />
                </svg>
              )
            }
            
            if (dist < 10) return null
            
            const normDx = dx / dist
            const normDy = dy / dist
            
            const tipX = mousePos.x - normDx * 8
            const tipY = mousePos.y - normDy * 8
            
            const angle = Math.atan2(dy, dx)
            const headLen = 12
            const ax = tipX - headLen * Math.cos(angle - 0.4)
            const ay = tipY - headLen * Math.sin(angle - 0.4)
            const bx = tipX - headLen * Math.cos(angle + 0.4)
            const by = tipY - headLen * Math.sin(angle + 0.4)
            
            return (
              <svg className="connecting-line" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 20,
              }}>
                <line
                  x1={screenX} y1={screenY}
                  x2={tipX} y2={tipY}
                  stroke="#4CAF50"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <polygon
                  points={`${tipX},${tipY} ${ax},${ay} ${bx},${by}`}
                  fill="#4CAF50"
                  opacity="0.7"
                />
              </svg>
            )
          })()}
          
          <SheepPathAnimator
            nodes={nodes}
            edges={edges}
            pattern={[]}
            patterns={levelConfig.targetPatterns}
            isPlaying={isAnimating}
            onComplete={handleAnimationComplete}
            onAllPatternsComplete={handleAllPatternsComplete}
            onStepChange={handleStepChange}
            speed={450}
            reactFlowInstance={reactFlowInstance.current}
          />
        </div>

          <footer className="footer">
            <div className="controls">
              <button className="btn submit-btn" onClick={handleSubmit} disabled={levelComplete || isAnimating}>
                Test
              </button>
              {showDetailedFeedback && (
                <button
                  className="btn watch-path-btn"
                  onClick={startAnimation}
                  disabled={isAnimating}
                >
                  {isAnimating ? <><EyeIcon /> Watching...</> : <><EyeIcon /> Watch Path</>}
                </button>
              )}
              <button className="btn reset-btn" onClick={handleReset}>
                Reset
              </button>
              {isDevMode() && (
                <button 
                  className="btn dev-auto-btn"
                  onClick={handleDevAutoComplete}
                  title="Dev: Auto-complete level"
                >
                  Auto
                </button>
              )}
            </div>
          </footer>
        </div>

        <aside className="sidebar">
          {!levelComplete && (
            <div className="patterns-with-score">
              <PatternDisplay patterns={levelConfig.targetPatterns} />
            </div>
          )}

          {showDetailedFeedback && (
            <div ref={feedbackRef} style={{ position: 'relative', zIndex: 100 }}>
              {levelComplete ? (
                <div className="detailed-feedback correct feedback-flash">
                  <div className="feedback-celebrate">
                    <span className="feedback-big-icon" aria-hidden="true">✓</span>
                    <span className="feedback-matched-count">
                      {feedbackData.matchedPatterns.length}/{feedbackData.matchedPatterns.length}
                    </span>
                  </div>
                  {sessionBadges.length > 0 && (
                    <div className="badges-earned">
                      <h4 className="badges-earned-title">Badges Earned</h4>
                      <div className="badges-earned-list">
                        {sessionBadges.map(badge => (
                          <div key={badge.id} className="badges-earned-item">
                            <span className="badges-earned-icon">{badge.icon || '⭐'}</span>
                            <span className="badges-earned-name">{badge.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="final-buttons" style={{ marginTop: '12px' }}>
                    {!isLastLevel ? (
                      <button
                        className="feedback-btn"
                        onClick={handleContinueFromFeedback}
                        style={{ position: 'relative', zIndex: 101 }}
                      >
                        Next Level
                      </button>
                    ) : (
                      <button
                        className="feedback-btn"
                        onClick={handleReset}
                        style={{ position: 'relative', zIndex: 101 }}
                      >
                        Play Again
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <PatternMatchFeedback
                  matchedPatterns={feedbackData.matchedPatterns}
                  unmatchedPatterns={feedbackData.unmatchedPatterns}
                  onContinue={handleContinueFromFeedback}
                />
              )}
            </div>
          )}

        </aside>
      </div>

      {message && (
        <div className={`toast-message toast-${messageType}`} key={message}>
          {message}
        </div>
      )}
      </div>

      {showDemo && !isAnimating && (
        <TutorialDemo
          concept={demoConcept}
          onDismiss={() => {
            setShowDemo(false)
            const target = demoConcept === 'connecting' ? 'graph' : 'toolbar'
            setShowNudge(target)
            setTimeout(() => setShowNudge(null), 4500)
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="hint-overlay" onClick={cancelDelete}>
          <div className="hint-modal" onClick={e => e.stopPropagation()}>
            <p>Are you sure you want to delete this {pendingDelete?.type === 'edge' ? 'arrow' : nodes.find(n => n.id === pendingDelete?.id)?.data.isAccepting ? 'bed' : 'fence'}?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="hint-close" 
                onClick={confirmDelete}
                style={{ flex: 1, background: '#c62828' }}
              >
                Delete
              </button>
              <button 
                className="hint-close" 
                onClick={cancelDelete}
                style={{ flex: 1, background: '#666' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default BuildLevel
