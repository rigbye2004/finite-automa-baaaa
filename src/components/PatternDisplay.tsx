import './PatternDisplay.css'

interface PatternDisplayProps {
  patterns: string[][]
}

export default function PatternDisplay({ patterns }: PatternDisplayProps) {
  return (
    <div className="pattern-display">
      <h3>Patterns to match:</h3>
      <div className="pattern-list">
        {patterns.map((pattern, i) => (
          <div key={i} className="pattern-item">
            {pattern.map((sheep, j) => (
              <img 
                key={j}
                src={`/sheep-assets/${sheep}.svg`}
                alt={sheep}
              />
            ))}
            <span className="pattern-end">
              <span className="pattern-arrow">&rarr;</span>
              <img
                src="/sheep-assets/awake-farmer.svg"
                alt="farmer sleeping"
                className="farmer-icon"
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
