import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const frame = useRef<number>(0)
  useEffect(() => {
    setValue(0)
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(target * ease)
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])
  return value
}
