let audioCtx: AudioContext | null = null
let muted = false

const audioCache: Record<string, HTMLAudioElement> = {}
function getAudio(path: string): HTMLAudioElement {
  if (!audioCache[path]) {
    audioCache[path] = new Audio(path)
  }
  const audio = audioCache[path]
  audio.currentTime = 0
  return audio
}
export function muteSounds(): void { muted = true }
export function unmuteSounds(): void { muted = false }

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

export function playHop(): void {
  playTone(440, 0.12, 'triangle', 0.15)
}

export function playBaaa(): void {
  if (muted) return
  getAudio(`${import.meta.env.BASE_URL}audio/baaa.mp3`).play().catch(() => {/* autoplay blocked */})
}

export function playSnore(): void {
  if (muted) return
  getAudio(`${import.meta.env.BASE_URL}audio/snoring.mp3`).play().catch(() => {/* autoplay blocked */})
}

export function playCorrect(): void {
  if (muted) return
  playTone(523, 0.15, 'sine', 0.3, 0)
  playTone(659, 0.15, 'sine', 0.3, 0.15)
  playTone(784, 0.25, 'sine', 0.3, 0.3)
}

export function playIncorrect(): void {
  if (muted) return
  playTone(300, 0.15, 'sawtooth', 0.2, 0)
  playTone(220, 0.3, 'sawtooth', 0.2, 0.15)
}

export function playGrumpy(): void {
  if (muted) return
  getAudio(`${import.meta.env.BASE_URL}audio/grumpy.mp3`).play().catch(() => {/* autoplay blocked */})
}

export function playFanfare(): void {
  getAudio(`${import.meta.env.BASE_URL}audio/fanfare.mp3`).play().catch(() => {/* autoplay blocked */})
}

// 4-note version for individual level completion (vs. stage fanfare)
export function playLevelComplete(): void {
  playTone(523, 0.15, 'sine', 0.3, 0)
  playTone(659, 0.15, 'sine', 0.3, 0.15)
  playTone(784, 0.15, 'sine', 0.3, 0.3)
  playTone(1047, 0.4, 'sine', 0.3, 0.45)
}

export function speakNarration(text: string): void {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export function getAudioRemainingMs(): number {
  let max = 0
  for (const audio of Object.values(audioCache)) {
    if (!audio.paused && !audio.ended && isFinite(audio.duration)) {
      const remaining = (audio.duration - audio.currentTime) * 1000
      if (remaining > max) max = remaining
    }
  }
  return max
}

export function stopAllAudio(): void {
  for (const audio of Object.values(audioCache)) {
    audio.pause()
    audio.currentTime = 0
  }
}

export function stopNarration(): void {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}
