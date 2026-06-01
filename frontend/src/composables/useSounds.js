// useSounds.js — HabitMind Sound Engine

function getContext() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function useSounds() {
  function playComplete() {
    try {
      const ctx = getContext()
      const notes = [
        { freq: 523.25, start: 0,    dur: 0.15 },
        { freq: 783.99, start: 0.12, dur: 0.25 },
      ]
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
        g.gain.setValueAtTime(0.18, ctx.currentTime + start)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + dur)
      })
      // Close context after sound finishes to free resources
      setTimeout(() => ctx.close(), 1000)
    } catch (e) { console.error('Sound error:', e) }
  }

  function playUntoggle() {
    try {
      const ctx = getContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
      setTimeout(() => ctx.close(), 500)
    } catch (e) { console.error('Sound error:', e) }
  }

  function playStreakMilestone(streak) {
    try {
      const ctx = getContext()
      const sequences = {
        7:  [
          { freq: 523.25, start: 0,    dur: 0.12 },
          { freq: 659.25, start: 0.1,  dur: 0.12 },
          { freq: 783.99, start: 0.2,  dur: 0.25 },
        ],
        14: [
          { freq: 523.25, start: 0,    dur: 0.1  },
          { freq: 659.25, start: 0.08, dur: 0.1  },
          { freq: 783.99, start: 0.16, dur: 0.1  },
          { freq: 1046.5, start: 0.24, dur: 0.3  },
        ],
        30: [
          { freq: 523.25, start: 0,    dur: 0.1  },
          { freq: 659.25, start: 0.07, dur: 0.1  },
          { freq: 783.99, start: 0.14, dur: 0.1  },
          { freq: 1046.5, start: 0.21, dur: 0.1  },
          { freq: 1318.5, start: 0.28, dur: 0.4  },
        ],
      }
      const notes = sequences[streak] || sequences[7]
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
        g.gain.setValueAtTime(0.2, ctx.currentTime + start)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + dur)
      })
      setTimeout(() => ctx.close(), 1500)
    } catch (e) { console.error('Sound error:', e) }
  }

  function playReminder() {
    try {
      const ctx = getContext()
      const notes = [
        { freq: 587.33, start: 0,    dur: 0.2 },
        { freq: 880.00, start: 0.15, dur: 0.3 },
      ]
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
        g.gain.setValueAtTime(0.15, ctx.currentTime + start)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + dur)
      })
      setTimeout(() => ctx.close(), 1000)
    } catch (e) { console.error('Sound error:', e) }
  }

  function unlockAudio() {
    try {
      const ctx = getContext()
      setTimeout(() => ctx.close(), 500)
    } catch (e) {}
  }

  return { playComplete, playUntoggle, playStreakMilestone, playReminder, unlockAudio }
}