import { useGameProgress } from '../contexts/GameProgressContext'
import type { Badge } from '../contexts/GameProgressContext'
import './BadgeCollection.css'

interface BadgeCollectionProps {
  onClose: () => void
}

export default function BadgeCollection({ onClose }: BadgeCollectionProps) {
  const { badges } = useGameProgress()
  
  const earnedCount = badges.filter(b => b.earned).length

  return (
    <div className="badge-overlay" onClick={onClose}>
      <div className="badge-modal" onClick={e => e.stopPropagation()}>
        <button className="badge-close" onClick={onClose}>×</button>
        
        <h2>Your Badges</h2>
        <p className="badge-count">{earnedCount} of {badges.length} collected</p>

        <div className="badge-grid">
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    </div>
  )
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div className={`badge-card ${badge.earned ? 'badge-card--earned' : 'badge-card--locked'}`}>
      <div className="badge-icon">
        {badge.earned ? badge.icon : '🔒'}
      </div>
      <div className="badge-name">{badge.name}</div>
      {!badge.earned && (
        <div className="badge-hint">{badge.description}</div>
      )}
    </div>
  )
}
