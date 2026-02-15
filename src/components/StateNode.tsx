import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { withBase } from '../withBase'
import './StateNode.css'

interface StateNodeData {
  label?: string
  isStart: boolean
  isAccepting: boolean
  showLabel?: boolean
  animationResult?: 'success' | 'fail' | null
}

const friendlyName = (id: string, label?: string): string => {
  if (label && label !== id) return label
  
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
  
  const stateMatch = id.match(/^state[-_]?(\d+)$/i)
  if (stateMatch) return `Fence ${stateMatch[1]}`
  return id.charAt(0).toUpperCase() + id.slice(1)
}

const getFarmerImage = (animationResult?: 'success' | 'fail' | null): string => {
  switch (animationResult) {
    case 'success': return withBase('sheep-assets/asleep-farmer.svg')
    case 'fail': return withBase('sheep-assets/grumpy-farmer.svg')
    default: return withBase('sheep-assets/awake-farmer.svg')
  }
}

function StateNode({ id, data }: NodeProps<StateNodeData>) {
  const { label, isStart, isAccepting, showLabel, animationResult } = data
  
  const displayLabel = showLabel && !isStart ? friendlyName(id, label) : null

  return (
    <div className={`state-node ${isAccepting ? 'accepting' : ''} ${isStart ? 'start' : ''}`}>
      <Handle type="target" position={Position.Left} />
      
      {isAccepting ? (
        <img
          src={getFarmerImage(animationResult)}
          alt={animationResult === 'success' ? 'Farmer asleep' : animationResult === 'fail' ? 'Farmer grumpy' : 'Farmer'}
          className="accepting-bed"
        />
      ) : (
        <div className="fence">
          <div className="fence-post left" />
          <div className="fence-rails">
            <div className="rail" />
            <div className="rail" />
            <div className="rail" />
          </div>
          <div className="fence-post right" />
        </div>
      )}
      
      {displayLabel && (
        <div className="node-label">{displayLabel}</div>
      )}
      
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default memo(StateNode)
