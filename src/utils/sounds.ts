let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
  delaySeconds = 0
): void {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = frequency
  osc.type = type
  gain.gain.setValueAtTime(0, ctx.currentTime + delaySeconds)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delaySeconds + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delaySeconds + duration)
  osc.start(ctx.currentTime + delaySeconds)
  osc.stop(ctx.currentTime + delaySeconds + duration)
}

/** Short bounce when a sheep hops to a new state */
export function playHop(): void {
  playTone(440, 0.12, 'triangle', 0.15)
}

/** Ascending three-note chime for a correct answer */
export function playCorrect(): void {
  playTone(523, 0.15, 'sine', 0.3, 0)
  playTone(659, 0.15, 'sine', 0.3, 0.15)
  playTone(784, 0.25, 'sine', 0.3, 0.3)
}

/** Low descending buzz for an incorrect answer */
export function playIncorrect(): void {
  playTone(300, 0.15, 'sawtooth', 0.2, 0)
  playTone(220, 0.3, 'sawtooth', 0.2, 0.15)
}

/** Four-note fanfare for level completion */
export function playLevelComplete(): void {
  playTone(523, 0.15, 'sine', 0.3, 0)
  playTone(659, 0.15, 'sine', 0.3, 0.15)
  playTone(784, 0.15, 'sine', 0.3, 0.3)
  playTone(1047, 0.4, 'sine', 0.3, 0.45)
}
