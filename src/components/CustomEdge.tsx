import { type EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'
import { withBase } from '../withBase'

export default function CustomEdge({
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
    // sourceX/targetX are handle positions (right/left edges), so average them to find center
    const nodeCenter = (sourceX + targetX) / 2
    const nodeTop = Math.min(sourceY, targetY) - 40  // Top of the fence
    
    const loopHeight = 50   // How tall the loop is (reduced from 70)
    const loopWidth = 30    // How wide each side curves out (reduced from 35)
    const gap = 10          // Half-gap between entry and exit points
    
    // Entry point (left side of gap)
    const startX = nodeCenter - gap
    const startY = nodeTop
    
    // Exit point (right side of gap, where arrow points IN)
    const endX = nodeCenter + gap
    const endY = nodeTop
    
    // Peak of the loop
    const peakY = nodeTop - loopHeight
    
    edgePath = `
      M ${startX} ${startY}
      C ${startX - loopWidth} ${startY - loopHeight * 0.4},
        ${startX - loopWidth * 0.5} ${peakY},
        ${nodeCenter} ${peakY}
      C ${endX + loopWidth * 0.5} ${peakY},
        ${endX + loopWidth} ${endY - loopHeight * 0.4},
        ${endX} ${endY}
    `
    
    // Position label at the top of the loop (reduced offset)
    labelX = nodeCenter
    labelY = peakY - 30
  } else {
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })
    edgePath = path
    labelX = lx
    labelY = ly
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (data?.sheep) {
      e.dataTransfer.setData('text/sheep', data.sheep)
      e.dataTransfer.setData('text/fromEdge', id)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (data?.onLabelClick) {
      e.stopPropagation()
      data.onLabelClick()
    }
  }

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          fill: 'none',  // Important for self-loops to not fill the curve
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          className={`edge-label ${data?.isAnimating && data?.sheep ? 'jumping' : ''} ${data?.sheep ? 'has-sheep' : ''}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: 4,
            borderRadius: 8,
            border: `2px solid ${data?.isSelected ? '#4CAF50' : '#ccc'}`,
            pointerEvents: 'all',
            cursor: data?.sheep ? 'pointer' : 'default',
            zIndex: data?.sheep ? 10 : 1,
          }}
          draggable={!!data?.sheep}
          onDragStart={handleDragStart}
          onClick={handleClick}
        >
          {data?.sheep ? (
            <>
              <img 
                src={withBase(`sheep-assets/${data.sheep}.svg`)}
                width={72} 
                height={72} 
                alt={data.sheep}
                draggable={false}
              />
              <div className="remove-hint" title="Click to remove">×</div>
            </>
          ) : (
            <span style={{ fontSize: 20, padding: '20px 24px', display: 'block' }}>?</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
