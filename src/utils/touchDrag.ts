export function startTouchDrag(
  initialTouch: { clientX: number; clientY: number },
  sheepId: string,
  sheepSrc: string,
  onDrop: (sheepId: string, clientX: number, clientY: number) => void,
) {
  const startX = initialTouch.clientX
  const startY = initialTouch.clientY
  let hasMoved = false
  let ghost: HTMLDivElement | null = null

  const createGhost = (x: number, y: number) => {
    ghost = document.createElement('div')
    Object.assign(ghost.style, {
      position: 'fixed',
      width: '64px',
      height: '64px',
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '0.85',
      transform: 'translate(-50%, -50%)',
      left: `${x}px`,
      top: `${y}px`,
    })
    const img = document.createElement('img')
    img.src = sheepSrc
    img.style.cssText = 'width:100%;height:100%;'
    ghost.appendChild(img)
    document.body.appendChild(ghost)
  }

  const onMove = (moveEvent: TouchEvent) => {
    const t = moveEvent.touches[0]
    const dx = t.clientX - startX
    const dy = t.clientY - startY
    if (!hasMoved) {
      if (Math.hypot(dx, dy) < 8) return
      hasMoved = true
      createGhost(t.clientX, t.clientY)
    }
    moveEvent.preventDefault()
    if (ghost) {
      ghost.style.left = `${t.clientX}px`
      ghost.style.top = `${t.clientY}px`
    }
  }

  const cleanup = () => {
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
    document.removeEventListener('touchcancel', onCancel)
    if (ghost) {
      document.body.removeChild(ghost)
      ghost = null
    }
  }

  const onEnd = (endEvent: TouchEvent) => {
    cleanup()
    if (hasMoved) {
      const t = endEvent.changedTouches[0]
      onDrop(sheepId, t.clientX, t.clientY)
    }
  }

  const onCancel = () => {
    cleanup()
  }

  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onEnd)
  document.addEventListener('touchcancel', onCancel)
}
