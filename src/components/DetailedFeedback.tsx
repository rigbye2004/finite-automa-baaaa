import { useEffect } from 'react'
import { withBase } from '../withBase'
import './DetailedFeedback.css'

export interface FeedbackData {
  isCorrect: boolean
  playerAnswer?: 'accept' | 'reject'
  correctAnswer?: 'accept' | 'reject'
  pattern?: string[]
  pathTaken?: string[]
  reasonRejected?: 'no-path' | 'wrong-state' | 'dead-end' | 'incomplete'
  matchedPatterns?: string[][]
  unmatchedPatterns?: string[][]
  invalidPaths?: string[][]
}

interface DetailedFeedbackProps {
  feedback: FeedbackData
  onContinue: () => void
  autoAdvance?: boolean
  autoAdvanceDelay?: number
}

export function DetailedFeedback({ feedback, onContinue, autoAdvance = false, autoAdvanceDelay = 1400 }: DetailedFeedbackProps) {
  useEffect(() => {
    if (feedback.isCorrect && autoAdvance) {
      const timer = setTimeout(onContinue, autoAdvanceDelay)
      return () => clearTimeout(timer)
    }
  }, [feedback.isCorrect, autoAdvance, autoAdvanceDelay, onContinue])

  if (feedback.isCorrect) {
    return (
      <div className="detailed-feedback correct feedback-flash">
        <div className="feedback-celebrate">
          <span className="feedback-big-icon" aria-hidden="true">✓</span>
        </div>
        {!autoAdvance && (
          <button className="feedback-btn" onClick={onContinue}>
            Continue
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="detailed-feedback incorrect">
      <div className="feedback-wrong">
        <span className="feedback-big-icon wrong" aria-hidden="true">✗</span>
        <p className="feedback-try-again">
          {feedback.playerAnswer === 'accept' && feedback.correctAnswer === 'reject'
            ? "This pattern can't reach the bed"
            : "This pattern does reach the bed!"}
        </p>
      </div>
      <button className="feedback-btn" onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}

interface PatternFeedbackProps {
  matchedPatterns: string[][]
  unmatchedPatterns: string[][]
  onContinue: () => void
  autoAdvance?: boolean
  autoAdvanceDelay?: number
}

export function PatternMatchFeedback({ matchedPatterns, unmatchedPatterns, onContinue, autoAdvance = false, autoAdvanceDelay = 1400 }: PatternFeedbackProps) {
  const allMatched = unmatchedPatterns.length === 0

  useEffect(() => {
    if (allMatched && autoAdvance) {
      const timer = setTimeout(onContinue, autoAdvanceDelay)
      return () => clearTimeout(timer)
    }
  }, [allMatched, autoAdvance, autoAdvanceDelay, onContinue])

  if (allMatched) {
    return (
      <div className="detailed-feedback correct feedback-flash">
        <div className="feedback-celebrate">
          <span className="feedback-big-icon" aria-hidden="true">✓</span>
          <span className="feedback-matched-count">{matchedPatterns.length}/{matchedPatterns.length}</span>
        </div>
        {!autoAdvance && (
          <button className="feedback-btn" onClick={onContinue}>
            Continue
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="detailed-feedback incorrect">
      <div className="feedback-wrong">
        <span className="feedback-big-icon wrong" aria-hidden="true">✗</span>
        <span className="feedback-score-pill">
          {matchedPatterns.length}/{matchedPatterns.length + unmatchedPatterns.length}
        </span>
      </div>

      <div className="patterns-unmatched">
        {unmatchedPatterns.map((pattern, i) => (
          <div key={i} className="pattern-row">
            {pattern.map((sheep, j) => (
              <img 
                key={j}
                src={withBase(`sheep-assets/${sheep}.svg`)}
                width={44} 
                height={44} 
                alt={sheep}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface ReflectionPromptProps {
  question: string
  options: string[]
  correctOption: number
  onAnswer: (wasCorrect: boolean) => void
}

export function ReflectionPrompt({ question, options, correctOption, onAnswer }: ReflectionPromptProps) {
  return (
    <div className="reflection-prompt">
      <h4>Quick Check</h4>
      <p className="reflection-question">{question}</p>
      <div className="reflection-options">
        {options.map((option, i) => (
          <button
            key={i}
            className="reflection-option"
            onClick={() => onAnswer(i === correctOption)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
