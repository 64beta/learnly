// Yumşaq səs siqnalları (fayl yoxdur, Web Audio ilə yaradılır).
// Sensor həssaslığı "yüksək" olan uşaqlar üçün default olaraq söndürülür.
let ctx: AudioContext | null = null

function tone(freq: number, start: number, duration: number, volume = 0.06) {
  try {
    ctx ??= new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t0 = ctx.currentTime + start
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + duration + 0.05)
  } catch {
    /* audio dəstəklənmir */
  }
}

export function playSuccess() {
  tone(523, 0, 0.25)
  tone(659, 0.12, 0.3)
}

export function playSoftTry() {
  tone(330, 0, 0.2, 0.04)
}
