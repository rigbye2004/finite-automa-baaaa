import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import ReactFlow, {
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import type { Node, Edge, ReactFlowInstance } from 'reactflow'
import 'reactflow/dist/style.css'
import { withBase } from './withBase'
import './DragLevel.css'
import StateNode from './components/StateNode'
import SheepPalette from './components/SheepPalette'
import PatternDisplay from './components/PatternDisplay'
import CustomEdge from './components/CustomEdge'
import { useGameProgress } from './contexts/GameProgressContext'
import type { Badge } from './contexts/GameProgressContext'
import { getDragLevelConfig, DRAG_LEVEL_COUNT, type DragLevelConfig } from './dragLevelConfigs'
import { SheepPathAnimator, useSheepAnimation } from './components/SheepPathAnimator'
import './components/SheepPathAnimator.css'

import { TutorialDemo, hasSeenDemo, markDemoSeen, pickDragDemo } from './components/TutorialDemo'
import type { DemoConcept } from './components/TutorialDemo'
import { PatternMatchFeedback } from './components/DetailedFeedback'
import BadgeNotch from './components/BadgeNotch'
import './components/TutorialDemo.css'
import './components/DetailedFeedback.css'
import './components/BadgeNotch.css'

const DEV_MODE_KEY = 'sheep-automata-dev-mode'
const isDevMode = () => localStorage.getItem(DEV_MODE_KEY) === 'true'

const edgeTypes = { custom: CustomEdge }
const nodeTypes = { stateNode: StateNode }

interface DragLevelProps {
  onBack?: () => void
  initialLevel?: number
}

const PROGRESS_KEY = 'sheep-automata-drag-progress'

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

function DragLevel({ onBack, initialLevel = 1 }: DragLevelProps) {
  const savedProgress = useRef(loadProgress())
  
  const [currentLevelId, setCurrentLevelId] = useState(savedProgress.current?.currentLevelId ?? initialLevel)
  const [levelConfig, setLevelConfig] = useState<DragLevelConfig | null>(() => getDragLevelConfig(savedProgress.current?.currentLevelId ?? initialLevel) ?? null)
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)
  const [selectedSheep, setSelectedSheep] = useState<string | null>(null)
  const [hintUsedThisLevel, setHintUsedThisLevel] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [demoConcept, setDemoConcept] = useState<DemoConcept>('drag-single')
  const [showNudge, setShowNudge] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)
  const [attempts, setAttempts] = useState(0)
  
  const [score, setScore] = useState(savedProgress.current?.score ?? 0)
  const [completedLevels, setCompletedLevels] = useState<number[]>(savedProgress.current?.completedLevels ?? [])

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

  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false)
  const [feedbackData, setFeedbackData] = useState<{
    matchedPatterns: string[][]
    unmatchedPatterns: string[][]
  }>({ matchedPatterns: [], unmatchedPatterns: [] })

  const [sessionBadges, setSessionBadges] = useState<Badge[]>([])

  const { awardStars, recordCorrectAnswer, getEarnedBadges } = useGameProgress()

  useEffect(() => {
    if (currentLevelId <= DRAG_LEVEL_COUNT) {
      saveProgress({
        currentLevelId,
        score,
        completedLevels
      })
    }
  }, [currentLevelId, score, completedLevels])

  // Auto-dismiss feedback when user modifies the graph
  useEffect(() => {
    if (showDetailedFeedback && !levelComplete) {
      setShowDetailedFeedback(false)
    }
  }, [edges]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss toast messages
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 3000)
    return () => clearTimeout(t)
  }, [message])

  // Fit view with extra shift if a self-loop label would be clipped at the top
  // Use a ref so the resize listener and level-load effect always call the latest
  // version without re-triggering effects when nodes/edges change.
  const handleFitView = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({
        padding: 0.4,
        duration: 0,
        minZoom: 0.3,
        maxZoom: 1.5
      })
      setTimeout(() => {
        if (!reactFlowInstance.current) return

        const selfLoopEdges = edges.filter(e => e.source === e.target)
        if (selfLoopEdges.length === 0) return

        const selfLoopNodeIds = new Set(selfLoopEdges.map(e => e.source))
        const selfLoopNodes = nodes.filter(n => selfLoopNodeIds.has(n.id))
        if (selfLoopNodes.length === 0) return

        const topNode = selfLoopNodes.reduce((top, node) =>
          node.position.y < top.position.y ? node : top
        )

        const { x, y, zoom } = reactFlowInstance.current.getViewport()
        const labelScreenY = (topNode.position.y - 120) * zoom + y // approximate label position

        if (labelScreenY < 10) {
          const shiftAmount = Math.min(80, 40 - labelScreenY)
          reactFlowInstance.current.setViewport({ x, y: y + shiftAmount, zoom }, { duration: 0 })
        }
      }, 220)
    }
  }, [nodes, edges])

  const fitViewRef = useRef(handleFitView)
  fitViewRef.current = handleFitView

  // Auto-fit on level change only — not on every edge/node update
  useEffect(() => {
    const attempts = [50, 200]
    const timeouts = attempts.map(delay =>
      setTimeout(() => fitViewRef.current(), delay)
    )
    return () => timeouts.forEach(t => clearTimeout(t))
  }, [currentLevelId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout>

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => fitViewRef.current(), 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  useEffect(() => {
    const config = getDragLevelConfig(currentLevelId)
    if (config) {
      setLevelConfig(config)
      // Deep clone nodes and edges to avoid mutating config
      const newNodes = config.nodes.map(n => ({ 
        ...n, 
        data: { ...n.data, sheep: null } 
      }))
      const newEdges = config.edges.map(e => ({ 
        ...e, 
        data: { ...e.data, sheep: null } 
      }))
      setNodes(newNodes)
      setEdges(newEdges)
      setMessage('')
      setMessageType('')
      setSelectedEdge(null)
      setLevelComplete(false)
      setAttempts(0)
      setShowDemo(false)
      setShowDetailedFeedback(false)
      
      // Auto-show a targeted demo the first time a level introduces new concepts
      const concepts = config.conceptsIntroduced || []
      if (concepts.length > 0) {
        const demo = pickDragDemo(currentLevelId, concepts)
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

  const findAllPaths = useCallback(() => {
    const allPaths: string[][] = []
    const acceptingNodes = nodes.filter(n => n.data.isAccepting).map(n => n.id)
    
    const traverse = (currentNode: string, path: string[], visited: Set<string>) => {
      if (acceptingNodes.includes(currentNode) && path.length > 0) {
        allPaths.push([...path])
        // Don't return - allow continuing through accepting states
      }

      // Limit path length to prevent infinite loops
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

    const startNode = nodes.find(n => n.data.isStart)
    if (startNode) {
      traverse(startNode.id, [], new Set())
    }

    return allPaths
  }, [nodes, edges])

  const pathsMatch = (path1: string[], path2: string[]) => {
    if (path1.length !== path2.length) return false
    return path1.every((sheep, index) => sheep === path2[index])
  }

  const handleDropOnGraph = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const sheepType = event.dataTransfer.getData('text/sheep')
    const fromEdgeId = event.dataTransfer.getData('text/fromEdge')

    if (!sheepType || !reactFlowInstance.current) return

    const point = reactFlowInstance.current.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    let best = { id: null as string | null, dist: Infinity }
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source)
      const targetNode = nodes.find((n) => n.id === edge.target)
      if (!sourceNode || !targetNode) return

      const sourceCenter = { x: sourceNode.position.x + 60, y: sourceNode.position.y + 50 }
      const targetCenter = { x: targetNode.position.x + 60, y: targetNode.position.y + 50 }
      
      let d: number
      
      // Special handling for self-loops
      if (edge.source === edge.target) {
        // Self-loop label is at the top of the balloon loop
        const loopCenter = { 
          x: sourceCenter.x, 
          y: sourceCenter.y - 170 // Top of the balloon loop (nodeTop - loopHeight - 45)
        }
        d = Math.hypot(point.x - loopCenter.x, point.y - loopCenter.y)
      } else {
        d = pointToSegmentDistance(point, sourceCenter, targetCenter)
      }
      
      if (d < best.dist) {
        best = { id: edge.id, dist: d }
      }
    })

    if (best.id && best.dist < 100) {
      setEdges((eds) =>
        eds.map((edge) => {
          if (fromEdgeId && edge.id === fromEdgeId && edge.id !== best.id) {
            return { ...edge, label: '?', data: { ...edge.data, sheep: null } }
          }
          if (edge.id === best.id) {
            return { ...edge, label: sheepType, data: { ...edge.data, sheep: sheepType } }
          }
          return edge
        })
      )
    } else if (fromEdgeId) {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === fromEdgeId) {
            return { ...edge, label: '?', data: { ...edge.data, sheep: null } }
          }
          return edge
        })
      )
    }
  }, [edges, nodes, setEdges])

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    if (selectedSheep) {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === edge.id) {
            return {
              ...e,
              label: selectedSheep,
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
              label: '?',
              data: { ...e.data, sheep: null },
            }
          }
          return e
        })
      )
      setMessage('Sheep removed')
      setMessageType('')
    } else {
      setSelectedEdge(edge.id)
    }
  }, [selectedSheep, setEdges])

  const onSelectSheep = useCallback((sheepType: string) => {
    // Toggle selection if clicking the same sheep
    if (selectedSheep === sheepType) {
      setSelectedSheep(null)
    } else {
      setSelectedSheep(sheepType)
      setSelectedEdge(null)
    }
  }, [selectedSheep])

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
          if (selectedSheep) {
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

  // Add animation result to accepting nodes for farmer image change
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

    const newNodes = levelConfig.nodes.map(n => ({ 
      ...n, 
      data: { ...n.data, sheep: null } 
    }))
    const newEdges = levelConfig.edges.map(e => ({ 
      ...e, 
      data: { ...e.data, sheep: null } 
    }))
    setNodes(newNodes)
    setEdges(newEdges)
    setSelectedEdge(null)
    setMessage('')
    setMessageType('')
    setLevelComplete(false)
    setShowDetailedFeedback(false)
    setSessionBadges([])
  }

  const handleSubmit = () => {
    if (!levelConfig) return

    const allEdgesFilled = edges.every((edge) => edge.data?.sheep)
    if (!allEdgesFilled) {
      setMessage('Place a sheep on every arrow.')
      setMessageType('error')
      return
    }

    // Start the path animation first
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
      // Only increment score if this level hasn't been completed before
      const isFirstCompletion = !completedLevels.includes(currentLevelId)
      if (isFirstCompletion) {
        setScore(prev => prev + 1)
        setCompletedLevels(prev => [...prev, currentLevelId])
      }
      
      setLevelComplete(true)
      setShowDetailedFeedback(true)
      setMessage('Correct')
      setMessageType('success')
      
      const starsForUnlock = (attempts === 0 && !hintUsedThisLevel) ? 2 : 1
      const starBadges = awardStars(`drag-level-${currentLevelId}`, starsForUnlock, hintUsedThisLevel)
      const answerBadges = recordCorrectAnswer(`drag-level-${currentLevelId}`, 0)
      
      // Stage stars are based on total completed levels, so the menu and stage unlock reflect overall progress
      const finalScore = isFirstCompletion ? score + 1 : score
      const percentage = finalScore / DRAG_LEVEL_COUNT
      let stageStars = 1
      if (percentage >= 0.9) stageStars = 3
      else if (percentage >= 0.7) stageStars = 2
      
      const stageBadges = awardStars('drag', stageStars, false)
      starBadges.push(...stageBadges)
      
      // Deduplicate by ID before queuing - awardStars and recordCorrectAnswer can both return the same badge
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
      if (currentLevelId < DRAG_LEVEL_COUNT) {
        setCurrentLevelId(currentLevelId + 1)
        setHintUsedThisLevel(false)
        setAttempts(0)
        setLevelComplete(false)
      } else {
        clearProgress() // all levels done
      }
    } else {
      setShowDetailedFeedback(false) // let them keep trying
    }
  }

  const handleHintClick = () => {
    setHintUsedThisLevel(true)
    const emptyEdges = edges.filter((e) => !e.data?.sheep)
    if (emptyEdges.length > 0 && emptyEdges.length < edges.length) {
      // Some placed, some empty → show simple single-sheep placement
      setDemoConcept('click-edge')
    } else {
      // Not started or all placed but wrong → show level-targeted demo
      setDemoConcept(pickDragDemo(currentLevelId, levelConfig?.conceptsIntroduced))
    }
    setShowDemo(true)
  }

  const handleDevAutoComplete = () => {
    const isFirstCompletion = !completedLevels.includes(currentLevelId)
    if (isFirstCompletion) {
      setScore(prev => prev + 1)
      setCompletedLevels(prev => [...prev, currentLevelId])
    }

    const finalScore = isFirstCompletion ? score + 1 : score
    const percentage = finalScore / DRAG_LEVEL_COUNT
    let stageStars = 1
    if (percentage >= 0.9) stageStars = 3
    else if (percentage >= 0.7) stageStars = 2
    awardStars('drag', stageStars, false)

    if (currentLevelId < DRAG_LEVEL_COUNT) {
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

  const isLastLevel = currentLevelId === DRAG_LEVEL_COUNT

  if (!levelConfig) {
    return (
      <div className="app">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Loading level {currentLevelId}...</h2>
          <p>If this persists, there may be an issue loading the level config.</p>
          <button onClick={onBack}>Back to Menu</button>
        </div>
      </div>
    )
  }

  return (
      <div className="app">
        <aside className="sheep-panel">
          <button className="home-btn" onClick={onBack} aria-label="Home">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </button>
          <div className="sheep-panel-label">L{currentLevelId}</div>
          <div className="sheep-list">
            {Array.from({ length: DRAG_LEVEL_COUNT }, (_, raw) => {
              const i = DRAG_LEVEL_COUNT - 1 - raw  // reverse: bottom-up
              const levelNum = i + 1
              const completed = completedLevels.includes(levelNum)
              const isCurrent = levelNum === currentLevelId
              let status: 'correct' | 'current' | 'future' = 'future'
              if (completed) status = 'correct'
              else if (isCurrent) status = 'current'
              return (
                <div key={i} className={`sheep-slot status-${status}`}>
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
          <button className="hint-button" onClick={handleHintClick} aria-label="Get a hint">
            ?
          </button>
        </header>

        <div className="game-container">
          <div className="graph-column">
            <div
              className="graph-area"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnGraph}
            >
              <ReactFlow
                nodes={styledNodes}
                edges={styledEdges}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                onInit={(instance) => {
                  reactFlowInstance.current = instance
                }}
                fitView
                fitViewOptions={{
                  padding: 0.4,
                  minZoom: 0.3,
                  maxZoom: 1.5,
                }}
                panOnDrag={false}
                panOnScroll={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
              >
              </ReactFlow>
              
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

            <footer className={`footer ${showNudge ? 'nudge-pulse' : ''}`}>
              <SheepPalette 
                onSelectSheep={onSelectSheep}
                selectedSheep={selectedSheep}
                availableSheep={levelConfig.availableSheep}
              />

              <div className="controls">
                <button
                  className="btn submit-btn"
                  onClick={handleSubmit}
                  disabled={levelComplete || isAnimating}
                >
                  ✓ Submit
                </button>
                {showDetailedFeedback && (
                  <button
                    className="btn watch-path-btn"
                    onClick={startAnimation}
                    disabled={isAnimating}
                  >
                    {isAnimating ? '👁 Watching...' : '👁 Watch Path'}
                  </button>
                )}
                <button className="btn reset-btn" onClick={handleReset}>
                  ↺ Reset
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
            {/* Hide patterns when level is complete - the completion card needs the space */}
            {!levelComplete && (
              <div className="patterns-with-score">
                <PatternDisplay patterns={levelConfig.targetPatterns} />
              </div>
            )}

            {showDetailedFeedback && (
              <div style={{ position: 'relative', zIndex: 100 }}>
                {levelComplete ? (
                  <div className="result-card correct">
                    <h3>{isLastLevel ? 'Stage Complete' : 'Level Complete'}</h3>
                    <p style={{ margin: '12px 0', color: '#2E7D32' }}>
                      All {feedbackData.matchedPatterns.length} patterns matched.
                    </p>
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
                    <div className="final-buttons" style={{ marginTop: '16px' }}>
                      {!isLastLevel && (
                        <button
                          className="next-btn"
                          onClick={handleContinueFromFeedback}
                          style={{ position: 'relative', zIndex: 101 }}
                        >
                          Next Level
                        </button>
                      )}
                      <button
                        className="next-btn secondary"
                        onClick={handleReset}
                        style={{ position: 'relative', zIndex: 101 }}
                      >
                        Play Again
                      </button>
                      <button
                        className="next-btn secondary"
                        onClick={onBack}
                        style={{ position: 'relative', zIndex: 101 }}
                      >
                        Back to Menu
                      </button>
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

            {selectedSheep && !levelComplete && !showDetailedFeedback && (
              <div className="selection-hint">
                Click an arrow to place the selected sheep
              </div>
            )}

          </aside>
        </div>

        {message && (
          <div className={`toast-message toast-${messageType}`} key={message}>
            {message}
          </div>
        )}

        {showDemo && !isAnimating && (
          <TutorialDemo
            concept={demoConcept}
            onDismiss={() => {
              setShowDemo(false)
              setShowNudge(true)
              setTimeout(() => setShowNudge(false), 4500)
            }}
          />
        )}

        </div>{/* end main-content */}
      </div>
  )
}

export default DragLevel
