import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import ReactFlow, {
  MarkerType,
  EdgeLabelRenderer,
  getBezierPath,
} from 'reactflow'
import type { Node, Edge, EdgeProps, ReactFlowInstance } from 'reactflow'
import 'reactflow/dist/style.css'
import './AcceptRejectLevel.css'
import StateNode from './components/StateNode'
import { useGameProgress } from './contexts/GameProgressContext'
import type { Badge } from './contexts/GameProgressContext'
import { SheepPathAnimator, useSheepAnimation } from './components/SheepPathAnimator'
import './components/SheepPathAnimator.css'

import { TutorialDemo, hasSeenDemo, markDemoSeen, pickARDemo } from './components/TutorialDemo'
import type { DemoConcept } from './components/TutorialDemo'
import { DetailedFeedback, type FeedbackData } from './components/DetailedFeedback'
import { ACCEPT_REJECT_QUESTIONS, ACCEPT_REJECT_QUESTION_COUNT, type AcceptRejectQuestion } from './acceptRejectLevelConfigs'
import BadgeNotch from './components/BadgeNotch'
import './components/TutorialDemo.css'
import './components/DetailedFeedback.css'
import './components/BadgeNotch.css'

const DEV_MODE_KEY = 'sheep-automata-dev-mode'
const isDevMode = () => localStorage.getItem(DEV_MODE_KEY) === 'true'

// converts [sheep-3] tokens to inline <img> elements
function renderExplanationWithSheep(explanation: string): React.ReactNode {
  const parts = explanation.split(/(\[sheep-\d+\])/)
  return parts.map((part, index) => {
    const match = part.match(/\[sheep-(\d+)\]/)
    if (match) {
      return (
        <img
          key={index}
          src={`/sheep-assets/sheep-${match[1]}.svg`}
          alt="sheep"
          className="inline-sheep"
        />
      )
    }
    return part
  })
}

const nodeTypes = {
  stateNode: StateNode,
}

function SheepEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const isSelfLoop = source === target

  let edgePath: string
  let labelX: number
  let labelY: number

  if (isSelfLoop) {
    const nodeCenter = (sourceX + targetX) / 2
    const nodeTop = Math.min(sourceY, targetY) - 45

    const loopHeight = 80
    const loopWidth = 40
    const gapSize = 12

    const startX = nodeCenter - gapSize
    const startY = nodeTop
    const endX = nodeCenter + gapSize
    const endY = nodeTop

    edgePath = `
      M ${startX} ${startY}
      C ${startX - loopWidth} ${startY - loopHeight * 0.3},
        ${startX - loopWidth} ${startY - loopHeight},
        ${nodeCenter} ${startY - loopHeight}
      C ${endX + loopWidth} ${endY - loopHeight},
        ${endX + loopWidth} ${endY - loopHeight * 0.3},
        ${endX} ${endY}
    `
    
    labelX = nodeCenter
    labelY = nodeTop - loopHeight - 45
  } else {
    const isBidirectional = data?.bidirectional === true
    const offsetDirection = source > target ? 1 : -1
    const offsetAmount = isBidirectional ? 25 * offsetDirection : 0

    let offsetSourceX = sourceX
    let offsetSourceY = sourceY
    let offsetTargetX = targetX
    let offsetTargetY = targetY
    
    if (offsetAmount !== 0) {
      const dx = targetX - sourceX
      const dy = targetY - sourceY
      const len = Math.sqrt(dx * dx + dy * dy)
      const perpX = len > 0 ? -dy / len : 0
      const perpY = len > 0 ? dx / len : 0
      offsetSourceX = sourceX + perpX * offsetAmount
      offsetSourceY = sourceY + perpY * offsetAmount
      offsetTargetX = targetX + perpX * offsetAmount
      offsetTargetY = targetY + perpY * offsetAmount
    }
    
    const [path, lx, ly] = getBezierPath({
      sourceX: offsetSourceX,
      sourceY: offsetSourceY,
      sourcePosition,
      targetX: offsetTargetX,
      targetY: offsetTargetY,
      targetPosition,
    })
    edgePath = path
    labelX = lx
    labelY = ly
  }

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        fill="none"
      />
      <EdgeLabelRenderer>
        <div
          className="sheep-edge-label"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {data?.sheep ? (
            <img 
              src={`/sheep-assets/${data.sheep}.svg`} 
              width={48}
              height={48}
              alt={data.sheep}
            />
          ) : (
            <span style={{ fontSize: 14, padding: '6px 10px', display: 'block' }}>?</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const edgeTypes = {
  sheep: SheepEdge,
}

interface AcceptRejectLevelProps {
  onBack?: () => void
}

const PROGRESS_KEY = 'sheep-automata-accept-reject-progress'

interface SavedProgress {
  currentQuestion: number
  score: number
  completedQuestions: number[]
  correctlyAnswered: number[]
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

export default function AcceptRejectLevel({ onBack }: AcceptRejectLevelProps) {
  const savedProgress = useRef(loadProgress())
  
  const [currentQuestion, setCurrentQuestion] = useState(savedProgress.current?.currentQuestion ?? 0)
  const [answer, setAnswer] = useState<'accept' | 'reject' | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(savedProgress.current?.score ?? 0)
  const [completedQuestions, setCompletedQuestions] = useState<number[]>(savedProgress.current?.completedQuestions ?? [])
  const [hintUsedThisQuestion, setHintUsedThisQuestion] = useState(false)
  const [anyHintUsed, setAnyHintUsed] = useState(false)
  const [wrongAttemptThisQuestion, setWrongAttemptThisQuestion] = useState(false)
  const [incorrectAnswers, setIncorrectAnswers] = useState(0)
  
  const [sessionBadges, setSessionBadges] = useState<Badge[]>([])
  const [levelFinished, setLevelFinished] = useState(false)

  const [showDemo, setShowDemo] = useState(false)
  const [demoConcept, setDemoConcept] = useState<DemoConcept>('trace-path')
  const [showNudge, setShowNudge] = useState(false)

  const questionStartTime = useRef<number>(Date.now())
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)
  
  const handleFitView = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({
        padding: 0.4,
        duration: 0,
        minZoom: 0.3,
        maxZoom: 1.5
      })
      // nudge down if a self-loop label would get cut off at the top
      setTimeout(() => {
        if (!reactFlowInstance.current) return
        const question = ACCEPT_REJECT_QUESTIONS[currentQuestion]
        if (!question) return
        const selfLoopEdges = question.edges.filter(e => e.source === e.target)
        if (selfLoopEdges.length === 0) return
        const selfLoopNodeIds = new Set(selfLoopEdges.map(e => e.source))
        const selfLoopNodes = question.nodes.filter(n => selfLoopNodeIds.has(n.id))
        if (selfLoopNodes.length === 0) return
        const topNode = selfLoopNodes.reduce((top, node) =>
          node.position.y < top.position.y ? node : top
        )
        const { x, y, zoom } = reactFlowInstance.current.getViewport()
        const labelScreenY = (topNode.position.y - 120) * zoom + y
        if (labelScreenY < 10) {
          const shiftAmount = Math.min(80, 40 - labelScreenY)
          reactFlowInstance.current.setViewport({ x, y: y + shiftAmount, zoom }, { duration: 0 })
        }
      }, 220)
    }
  }, [currentQuestion])

  useEffect(() => {
    const attempts = [50, 200]
    const timeouts = attempts.map(delay => 
      setTimeout(handleFitView, delay)
    )
    return () => timeouts.forEach(t => clearTimeout(t))
  }, [currentQuestion, handleFitView])

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
  
  const {
    isAnimating,
    animationResult,
    highlightedNode,
    startAnimation,
    handleAnimationComplete,
    handleStepChange,
    resetAnimation,
  } = useSheepAnimation()
  
  const { recordCorrectAnswer, recordIncorrectAnswer, awardStars, checkAndAwardBadge, getEarnedBadges } = useGameProgress()

  useEffect(() => {
    if (currentQuestion < ACCEPT_REJECT_QUESTION_COUNT) {
      saveProgress({
        currentQuestion,
        score,
        completedQuestions
      })
    }
  }, [currentQuestion, score, completedQuestions])

  // auto-show demo for new concepts; reinforcement questions skip this
  useEffect(() => {
    const question = ACCEPT_REJECT_QUESTIONS[currentQuestion]
    if (!question) return
    
    const concepts = question.conceptsIntroduced || []
    if (concepts.length > 0) {
      const demo = pickARDemo(question.id, concepts)
      if (!hasSeenDemo(demo)) {
        markDemoSeen(demo)
        setTimeout(() => {
          if (!isAnimating) {
            setDemoConcept(demo)
            setShowDemo(true)
          }
        }, 400)
      }
    }
    
    questionStartTime.current = Date.now()
  }, [currentQuestion])

  const question = ACCEPT_REJECT_QUESTIONS[currentQuestion]

  const styledEdges = useMemo(() => {
    return question.edges.map(edge => ({
      ...edge,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#555',
      },
      style: {
        strokeWidth: 2.5,
        stroke: '#555',
      },
    }))
  }, [question.edges])

  const styledNodes = useMemo(() => {
    return question.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        animationResult: node.data.isAccepting && animationResult 
          ? (animationResult.success ? 'success' : 'fail')
          : null
      }
    }))
  }, [question.nodes, animationResult])

  const handleHintClick = () => {
    setHintUsedThisQuestion(true)
    setAnyHintUsed(true)
    const q = ACCEPT_REJECT_QUESTIONS[currentQuestion]
    setDemoConcept(pickARDemo(q.id, q.conceptsIntroduced))
    setShowDemo(true)
  }

  const onAnimationComplete = useCallback((result: { success: boolean; stoppedAt?: string }) => {
    handleAnimationComplete(result)
  }, [handleAnimationComplete])

  const handleAnswer = (selectedAnswer: 'accept' | 'reject') => {
    setAnswer(selectedAnswer)
    setShowResult(true)
    
    const isCorrect = selectedAnswer === question.correctAnswer
    
    // Start animation to show the path
    startAnimation()
    
    if (isCorrect) {
      const timeTaken = Date.now() - questionStartTime.current
      const timeSeconds = timeTaken / 1000
      const answerBadges = recordCorrectAnswer('accept-reject', timeSeconds)
      if (answerBadges.length > 0) {
        setSessionBadges(prev => [...prev, ...answerBadges])
      }
      // only score if first-time correct with no hints or wrong attempts
      const isFirstCorrect = !completedQuestions.includes(currentQuestion)
      if (!wrongAttemptThisQuestion && !hintUsedThisQuestion && isFirstCorrect) {
        setScore(prev => prev + 1)
        setCompletedQuestions(prev => [...prev, currentQuestion])
      }
    } else {
      setWrongAttemptThisQuestion(true)
      setIncorrectAnswers(prev => prev + 1)
      const incorrectBadges = recordIncorrectAnswer('accept-reject')
      if (incorrectBadges.length > 0) {
        setSessionBadges(prev => [...prev, ...incorrectBadges])
      }
    }
  }

  const handleNext = () => {
    resetAnimation()
    setCurrentQuestion(prev => prev + 1)
    setAnswer(null)
    setShowResult(false)
    setHintUsedThisQuestion(false)
    setWrongAttemptThisQuestion(false)
  }

  const handleLevelComplete = () => {
    clearProgress()
    const percentage = score / ACCEPT_REJECT_QUESTION_COUNT
    let levelStars = 1
    if (percentage >= 0.9) levelStars = 3
    else if (percentage >= 0.7) levelStars = 2

    const badges = awardStars('accept-reject', levelStars, anyHintUsed)
    if (incorrectAnswers === 0) {
      const perfectBadge = checkAndAwardBadge('perfect-level-1')
      if (perfectBadge) badges.push(perfectBadge)
    }

    setSessionBadges(prev => [...prev, ...badges])
    setLevelFinished(true)
  }

  const handleRestart = () => {
    clearProgress()
    resetAnimation()
    
    setCurrentQuestion(0)
    setAnswer(null)
    setShowResult(false)
    setScore(0)
    setCompletedQuestions([])
    setHintUsedThisQuestion(false)
    setAnyHintUsed(false)
    setWrongAttemptThisQuestion(false)
    setIncorrectAnswers(0)
    setLevelFinished(false)
    setSessionBadges([])
  }

  const isCorrect = answer === question.correctAnswer
  const isLastQuestion = currentQuestion === ACCEPT_REJECT_QUESTION_COUNT - 1

  const feedbackData: FeedbackData = {
    isCorrect: answer === question.correctAnswer,
    playerAnswer: answer || undefined,
    correctAnswer: question.correctAnswer,
    pattern: question.testPattern,
    reasonRejected: question.rejectionReason,
  }

  return (
    <div className="accept-reject-level">
      <aside className="sheep-panel">
        <button className="home-btn" onClick={onBack} aria-label="Home">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </button>
        <div className="sheep-panel-label">Q{currentQuestion + 1}</div>
        <div className="sheep-list">
          {Array.from({ length: ACCEPT_REJECT_QUESTION_COUNT }, (_, raw) => {
            const i = ACCEPT_REJECT_QUESTION_COUNT - 1 - raw  // reverse: bottom-up
            const isCurrent = i === currentQuestion
            const isPast = i < currentQuestion
            const gotRight = completedQuestions.includes(i)
            const currentAnswered = isCurrent && showResult && answer !== null
            const currentCorrect = currentAnswered && answer === question.correctAnswer
            let status: 'correct' | 'wrong' | 'current' | 'future' = 'future'
            if (isPast) status = gotRight ? 'correct' : 'wrong'
            else if (currentAnswered) status = currentCorrect ? 'correct' : 'wrong'
            else if (isCurrent) status = 'current'
            return (
              <div key={i} className={`sheep-slot status-${status}`}>
                <img
                  src={`/sheep-assets/sheep-${(i % 16) + 1}.svg`}
                  width={32}
                  height={32}
                  alt=""
                />
                {status === 'correct' && <span className="sheep-badge badge-correct">✓</span>}
                {status === 'wrong' && <span className="sheep-badge badge-wrong">✗</span>}
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
        <div className="graph-area">
          <ReactFlow
            key={question.id}
            nodes={styledNodes}
            edges={styledEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(instance) => {
              reactFlowInstance.current = instance
            }}
            fitView
            fitViewOptions={{ 
              padding: 0.4,
              minZoom: 0.3,
              maxZoom: 1.5,
            }}
            minZoom={0.2}
            maxZoom={2}
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
            nodes={question.nodes}
            edges={question.edges}
            pattern={question.testPattern}
            isPlaying={isAnimating}
            onComplete={onAnimationComplete}
            onStepChange={handleStepChange}
            speed={500}
            reactFlowInstance={reactFlowInstance.current}
          />
        </div>

        <aside className="sidebar">
          <div className="question-card">
            <div className="question-header">
              <h3>Patterns to match:</h3>
            </div>
            
            <div className="test-pattern">
              {question.testPattern.map((sheep, i) => (
                <span key={i} className="pattern-sheep">
                  <img 
                    src={`/sheep-assets/${sheep}.svg`}
                    width={64}
                    height={64}
                    alt={sheep}
                  />
                  {i < question.testPattern.length - 1 && <span className="arrow"></span>}
                </span>
              ))}
            </div>
          </div>

          {!showResult ? (
            <div className={`answer-buttons ${showNudge ? 'nudge-pulse' : ''}`}>
              <button 
                className="answer-btn accept-btn"
                onClick={() => { setShowNudge(false); handleAnswer('accept') }}
              >
                <span className="answer-icon" aria-hidden="true">😴</span>
                Yes, Falls Asleep
              </button>
              <button 
                className="answer-btn reject-btn"
                onClick={() => { setShowNudge(false); handleAnswer('reject') }}
              >
                <span className="answer-icon" aria-hidden="true">👀</span>
                No, Stays Awake
              </button>
              {isDevMode() && (
                <button 
                  className="dev-auto-btn"
                  onClick={() => handleAnswer(question.correctAnswer)}
                  title="Dev: Auto-answer correctly"
                >
                  Auto
                </button>
              )}
            </div>
          ) : (
            <div className="result-section">
              {isCorrect ? (
                <>
                  <DetailedFeedback
                    feedback={feedbackData}
                    onContinue={isLastQuestion ? handleLevelComplete : handleNext}
                  />
                  {!isAnimating && (
                    <button className="watch-again-btn" onClick={startAnimation}>
                      🔁 Watch the path again
                    </button>
                  )}
                  {isLastQuestion && !isAnimating && (
                    <div className="final-score">
                      <p>Final Score: {score}/{ACCEPT_REJECT_QUESTION_COUNT}</p>
                      <div className="final-buttons">
                        <button className="next-btn" onClick={handleLevelComplete}>
                          See Results
                        </button>
                        <button className="next-btn secondary" onClick={handleRestart}>
                          Play Again
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {isAnimating ? (
                    <div className="watching-indicator">🐑 Watching the path...</div>
                  ) : (
                    <>
                      <DetailedFeedback
                        feedback={feedbackData}
                        onContinue={isLastQuestion ? handleLevelComplete : handleNext}
                      />
                      <button className="watch-again-btn" onClick={startAnimation}>
                        🔁 Watch the path again
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </aside>
      </div>
      </div>{/* end main-content */}

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

      {levelFinished && (
        <div className="level-complete-overlay">
          <div className="level-complete-modal">
            <h2>Stage Complete</h2>
            <div className="level-complete-score">
              <span className="final-score">{score} / {ACCEPT_REJECT_QUESTION_COUNT}</span>
            </div>
            {sessionBadges.length > 0 && (
              <div className="badges-earned">
                <h3 className="badges-earned-title">Badges Earned</h3>
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
            <div className="level-complete-buttons">
              <button className="btn primary-btn" onClick={handleRestart}>
                Play Again
              </button>
              <button className="btn secondary-btn" onClick={onBack}>
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
