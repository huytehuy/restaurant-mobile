import { useRef, useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import type { DragDropConfig } from './brewingSteps'

interface Props {
  config: DragDropConfig
  onFinish: (result: 'perfect' | 'good' | 'bad') => void
}

export function DragDropStep({ config, onFinish }: Props) {
  const targetRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [done, setDone] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const finish = () => {
    if (done) return
    setDone(true)
    if (!targetRef.current || !containerRef.current) {
      onFinish('good')
      return
    }
    const t = targetRef.current.getBoundingClientRect()
    const c = containerRef.current.getBoundingClientRect()
    // current item position (we placed item with absolute coords)
    const itemX = x.get()
    const itemY = y.get()
    // Item rendered at left: itemStart (e.g. 40px from left of container), top: similar
    const itemStartX = 40
    const itemStartY = 80
    const cx = c.left + itemStartX + itemX + 32
    const cy = c.top + itemStartY + itemY + 32
    const dx = cx - (t.left + t.width / 2)
    const dy = cy - (t.top + t.height / 2)
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 20) onFinish('perfect')
    else if (dist < 50) onFinish('good')
    else onFinish('bad')
  }

  return (
    <div ref={containerRef} className="relative h-48 rounded-2xl bg-brand-200/60 overflow-hidden">
      {/* Drop target */}
      <div
        ref={targetRef}
        className="absolute right-6 top-12 flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-inner"
        style={{ background: `${config.targetColor}33`, border: `3px dashed ${config.targetColor}` }}
      >
        {config.target}
      </div>

      {/* Drag item */}
      <motion.div
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        onDragEnd={finish}
        style={{ x, y, left: 40, top: 80 }}
        whileTap={{ scale: 1.1 }}
        className="absolute flex h-16 w-16 cursor-grab items-center justify-center rounded-2xl bg-white text-4xl shadow-lg active:cursor-grabbing"
      >
        {config.item}
      </motion.div>

      <div className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold text-brand-700">
        Kéo và thả vào vòng tròn
      </div>
    </div>
  )
}
