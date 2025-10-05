/**
 * Sound effects for timer - Soothing and gentle
 */

let audioContext = null

const getAudioContext = () => {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

/**
 * Play gentle start tone - soft ascending chime
 */
export const playStartTone = () => {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    // Soft two-note ascending chime (A4 -> C5)
    const notes = [
      { freq: 440, start: 0, duration: 0.4 },      // A4
      { freq: 523.25, start: 0.2, duration: 0.5 }, // C5
    ]

    notes.forEach(note => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = note.freq
      oscillator.type = 'sine' // Pure sine wave for softness

      const startTime = ctx.currentTime + note.start
      const endTime = startTime + note.duration

      // Gentle fade in and out
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0.15, endTime - 0.2)
      gainNode.gain.linearRampToValueAtTime(0.001, endTime)

      oscillator.start(startTime)
      oscillator.stop(endTime)
    })
  } catch (err) {
    console.error('Start tone error:', err)
  }
}

/**
 * Play gentle completion tone - peaceful descending meditation bell
 */
export const playCompletionTone = () => {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    // Peaceful bell-like tones (E5 -> C5 -> A4)
    const notes = [
      { freq: 659.25, start: 0, duration: 0.8 },    // E5
      { freq: 523.25, start: 0.4, duration: 0.9 },  // C5
      { freq: 440, start: 0.8, duration: 1.2 },     // A4
    ]

    notes.forEach(note => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = note.freq
      oscillator.type = 'sine'

      const startTime = ctx.currentTime + note.start
      const endTime = startTime + note.duration

      // Very gentle fade in and long decay like a bell
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, endTime)

      oscillator.start(startTime)
      oscillator.stop(endTime)
    })
  } catch (err) {
    console.error('Completion tone error:', err)
  }
}

/**
 * Play button click sound
 */
export const playClickSound = () => {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'square'

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.03)
  } catch (err) {
    console.error('Click sound error:', err)
  }
}
