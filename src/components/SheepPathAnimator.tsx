import { useState, useEffect, useCallback, useRef } from 'react'
import type { Node, Edge, ReactFlowInstance } from 'reactflow'
import { withBase } from '../withBase'
import './SheepPathAnimator.css'

interface AnimationStep {
  fromNode: string
  toNode: string
  edgeId: string
  sheep: string
  fromPosition: { x: number; y: number }
  toPosition: { x: number; y: number }
  isSelfLoop: boolean
}

interface PatternResult {
  pattern: string[]
  success: boolean
  steps: AnimationStep[]
  stuckAtStep?: number
}

interface SheepPathAnimatorProps {
  nodes: Node[]
  edges: Edge[]
  pattern: string[]
  patterns?: string[][]
  isPlaying: boolean
  onComplete: (reachedAccepting: boolean, stuckAt?: string) => void
  onPatternComplete?: (patternIndex: number, success: boolean) => void
  onAllPatternsComplete?: (results: PatternResult[]) => void
  onStepChange?: (step: number, currentNode: string) => void
  speed?: number
  bedPosition?: { x: number; y: number }
  reactFlowInstance?: ReactFlowInstance | null
}

function calculatePath(
  nodes: Node[],
  edges: Edge[],
  pattern: string[]
): { steps: AnimationStep[]; success: boolean; stuckAtStep?: number; stuckReason?: string } {
  const steps: AnimationStep[] = []
  
  const startNode = nodes.find(n => n.data?.isStart)
  if (!startNode) {
    return { steps: [], success: false, stuckReason: 'no-start' }
  }
  
  let currentNodeId = startNode.id
  
  for (let i = 0; i < pattern.length; i++) {
    const sheep = pattern[i]
    const currentNode = nodes.find(n => n.id === currentNodeId)
    
    if (!currentNode) {
      return { steps, success: false, stuckAtStep: i, stuckReason: 'node-not-found' }
    }
    
    const matchingEdge = edges.find(
      e => e.source === currentNodeId && e.data?.sheep === sheep
    )
    
    if (!matchingEdge) {
      steps.push({
        fromNode: currentNodeId,
        toNode: currentNodeId,
        edgeId: 'none',
        sheep,
        fromPosition: { x: currentNode.position.x + 40, y: currentNode.position.y + 40 },
        toPosition: { x: currentNode.position.x + 40, y: currentNode.position.y + 40 },
        isSelfLoop: false,
      })
      return { steps, success: false, stuckAtStep: i, stuckReason: 'no-path' }
    }
    
    const targetNode = nodes.find(n => n.id === matchingEdge.target)
    if (!targetNode) {
      return { steps, success: false, stuckAtStep: i, stuckReason: 'target-not-found' }
    }
    
    const isSelfLoop = matchingEdge.source === matchingEdge.target
    
    steps.push({
      fromNode: currentNodeId,
      toNode: matchingEdge.target,
      edgeId: matchingEdge.id,
      sheep,
      fromPosition: { x: currentNode.position.x + 40, y: currentNode.position.y + 40 },
      toPosition: { x: targetNode.position.x + 40, y: targetNode.position.y + 40 },
      isSelfLoop,
    })
    
    currentNodeId = matchingEdge.target
  }
  
  const finalNode = nodes.find(n => n.id === currentNodeId)
  const success = finalNode?.data?.isAccepting === true
  
  return { steps, success, stuckReason: success ? undefined : 'wrong-state' }
}

export function SheepPathAnimator({
  nodes,
  edges,
  pattern,
  patterns,
  isPlaying,
  onComplete,
  onPatternComplete,
  onAllPatternsComplete,
  onStepChange,
  speed = 700,
  bedPosition,
  reactFlowInstance,
}: SheepPathAnimatorProps) {
  const [currentStep, setCurrentStep] = useState(-1)
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0)
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'jumping' | 'landed' | 'going-to-bed' | 'done'>('idle')
  const [sheepPosition, setSheepPosition] = useState({ x: 0, y: 0 })
  const [showSheep, setShowSheep] = useState(false)
  const [currentSheepType, setCurrentSheepType] = useState('sheep-3')
  const [displayMessage, setDisplayMessage] = useState<string | null>(null)
  const [isSelfLoop, setIsSelfLoop] = useState(false)
  
  const cancelledRef = useRef(false)
  const patternResultsRef = useRef<PatternResult[]>([])
  const instanceRef = useRef(reactFlowInstance)

  useEffect(() => {
    instanceRef.current = reactFlowInstance
  }, [reactFlowInstance])

  const flowToScreenPosition = useCallback((flowX: number, flowY: number) => {
    const instance = instanceRef.current
    if (!instance) {
      return { x: flowX, y: flowY }
    }
    const { x, y, zoom } = instance.getViewport()
    return {
      x: flowX * zoom + x,
      y: flowY * zoom + y,
    }
  }, [])
  
  const allPatterns = patterns || (pattern && pattern.length > 0 ? [pattern] : [])

  const delay = (ms: number) => new Promise<boolean>(resolve => {
    setTimeout(() => {
      resolve(!cancelledRef.current)
    }, ms)
  })
  
  useEffect(() => {
    if (!isPlaying || allPatterns.length === 0) {
      return
    }
    cancelledRef.current = false
    patternResultsRef.current = []
    setCurrentPatternIndex(0)
    setCurrentStep(-1)
    setAnimationPhase('idle')
    setShowSheep(false)
    setDisplayMessage(null)
    setIsSelfLoop(false)
    
    const runAllPatterns = async () => {
      const results: PatternResult[] = []
      
      for (let patternIdx = 0; patternIdx < allPatterns.length; patternIdx++) {
        if (cancelledRef.current) return
        
        const currentPattern = allPatterns[patternIdx]
        const pathData = calculatePath(nodes, edges, currentPattern)
        
        setCurrentPatternIndex(patternIdx)
        
        if (allPatterns.length > 1) {
          setDisplayMessage(`Testing pattern ${patternIdx + 1} of ${allPatterns.length}`)
        }
        
        const startNode = nodes.find(n => n.data?.isStart)
        if (startNode) {
          setSheepPosition({
            x: startNode.position.x + 40,
            y: startNode.position.y + 40,
          })
        }
        
        setShowSheep(true)
        setAnimationPhase('landed')
        
        if (!await delay(400)) return

        for (let i = 0; i < pathData.steps.length; i++) {
          if (cancelledRef.current) return
          const step = pathData.steps[i]
          setCurrentSheepType(step.sheep)
          setCurrentStep(i)
          onStepChange?.(i, step.fromNode)
          setIsSelfLoop(step.isSelfLoop)
          setAnimationPhase('jumping')
          setSheepPosition(step.toPosition)
          if (!await delay(speed)) return
          setAnimationPhase('landed')
          setIsSelfLoop(false)
          if (!await delay(300)) return
          if (pathData.stuckAtStep === i) {
            setAnimationPhase('done')
            break
          }
        }
        
        if (cancelledRef.current) return
        
        const result: PatternResult = {
          pattern: currentPattern,
          success: pathData.success,
          steps: pathData.steps,
          stuckAtStep: pathData.stuckAtStep,
        }
        
        results.push(result)
        patternResultsRef.current = results
        onPatternComplete?.(patternIdx, pathData.success)
        
        if (pathData.success && bedPosition) {
          setDisplayMessage('✓ Accepted!')
          if (!await delay(150)) return
          setAnimationPhase('going-to-bed')
          setSheepPosition(bedPosition)
          if (!await delay(500)) return
        } else {
          setDisplayMessage(pathData.success ? '✓ Accepted!' : '✗ Rejected!')
          if (!await delay(300)) return
        }

        if (cancelledRef.current) return

        if (patternIdx < allPatterns.length - 1) {
          setShowSheep(false)
          setCurrentStep(-1)
          if (!await delay(200)) return
        }
      }
      
      if (cancelledRef.current) return
      
      setAnimationPhase('done')
      const allSuccess = results.every(r => r.success)
      onAllPatternsComplete?.(results)
      
      const lastResult = results[results.length - 1]
      const lastStep = lastResult?.steps[lastResult.steps.length - 1]
      onComplete(allSuccess, lastStep?.toNode)
    }
    
    runAllPatterns()
    
    return () => {
      cancelledRef.current = true
    }
    // callbacks excluded from deps intentionally — closures are safe here,
    // and including them would restart the animation on parent re-renders
  }, [isPlaying, nodes, edges, bedPosition, allPatterns.length, speed])
  
  if (!isPlaying || !showSheep) {
    // Still show message if we have one
    if (isPlaying && displayMessage) {
      return (
        <div className="sheep-animator-container">
          <div className="animation-progress">
            <span>{displayMessage}</span>
          </div>
        </div>
      )
    }
    return null
  }
  
  const currentPattern = allPatterns[currentPatternIndex]
  
  // Convert flow coordinates to screen coordinates for rendering
  const screenPosition = flowToScreenPosition(sheepPosition.x, sheepPosition.y)
  
  return (
    <div className="sheep-animator-container">
      <div
        className={`animated-sheep ${animationPhase} ${isSelfLoop ? 'self-loop' : ''}`}
        style={{
          left: screenPosition.x,
          top: screenPosition.y,
          transition: animationPhase === 'jumping' && !isSelfLoop 
            ? `all ${speed}ms cubic-bezier(0.34, 1.56, 0.64, 1)` 
            : animationPhase === 'going-to-bed'
            ? 'all 1200ms ease-in-out'
            : 'none',
        }}
      >
        <img 
          src={withBase(`sheep-assets/${currentSheepType}.svg`)}
          alt="Animated sheep"
          className="sheep-sprite"
        />
        {animationPhase === 'jumping' && (
          <div className="jump-trail" />
        )}
      </div>
      
      <div className="animation-progress">
        <span>
          {displayMessage || `Step ${currentStep + 1} of ${currentPattern?.length || 0}`}
          {allPatterns.length > 1 && !displayMessage && ` (Pattern ${currentPatternIndex + 1}/${allPatterns.length})`}
        </span>
      </div>
      
      {currentPattern && (
        <div className="current-pattern-preview">
          {currentPattern.map((sheep, idx) => (
            <div 
              key={idx} 
              className={`pattern-sheep-item ${idx <= currentStep ? 'completed' : ''} ${idx === currentStep ? 'current' : ''}`}
            >
              <img src={withBase(`sheep-assets/${sheep}.svg`)} alt="" width={32} height={32} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function useSheepAnimation() {
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationResult, setAnimationResult] = useState<{
    success: boolean
    stuckAt?: string
    patternResults?: PatternResult[]
  } | null>(null)
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null)
  const [highlightedEdge, setHighlightedEdge] = useState<string | null>(null)
  
  const startAnimation = useCallback(() => {
    setIsAnimating(true)
    setAnimationResult(null)
    setHighlightedNode(null)
    setHighlightedEdge(null)
  }, [])
  
  const handleAnimationComplete = useCallback((success: boolean, stuckAt?: string) => {
    setAnimationResult({ success, stuckAt })
    setTimeout(() => {
      setIsAnimating(false)
    }, 600)
  }, [])

  const handleAllPatternsComplete = useCallback((results: PatternResult[]) => {
    const allSuccess = results.every(r => r.success)
    setAnimationResult({
      success: allSuccess,
      patternResults: results
    })
    setTimeout(() => {
      setIsAnimating(false)
    }, 600)
  }, [])
  
  const handleStepChange = useCallback((step: number, currentNode: string) => {
    setHighlightedNode(currentNode)
  }, [])
  
  const resetAnimation = useCallback(() => {
    setIsAnimating(false)
    setAnimationResult(null)
    setHighlightedNode(null)
    setHighlightedEdge(null)
  }, [])
  
  return {
    isAnimating,
    animationResult,
    highlightedNode,
    highlightedEdge,
    startAnimation,
    handleAnimationComplete,
    handleAllPatternsComplete,
    handleStepChange,
    resetAnimation,
  }
}

export default SheepPathAnimator
