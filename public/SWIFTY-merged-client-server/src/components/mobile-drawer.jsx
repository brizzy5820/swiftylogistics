// components/mobile-drawer.jsx
import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_SNAP_POINTS = [30, 64, 88]

export function MobileDrawer({ children, footer, banner, onClose, onHeightChange, initialSnapIndex = 1, snapPoints = DEFAULT_SNAP_POINTS }) {
  const sheetRef = useRef(null)
  const dragRef = useRef({ dragging: false, startY: 0, startHeight: 0, lastY: 0, lastT: 0, velocity: 0 })
  const [snapIndex, setSnapIndex] = useState(initialSnapIndex)
  const [heightVh, setHeightVh] = useState(snapPoints[initialSnapIndex])
  const [dragging, setDragging] = useState(false)

  const heightInPx = (value) => (window.innerHeight * value) / 100
  const clampHeight = (value) => Math.min(heightInPx(snapPoints[snapPoints.length - 1]), Math.max(heightInPx(snapPoints[0]), value))

  const handlePointerDown = useCallback((event) => {
    dragRef.current = {
      dragging: true,
      startY: event.clientY,
      startHeight: sheetRef.current?.getBoundingClientRect().height || heightInPx(heightVh),
      lastY: event.clientY,
      lastT: performance.now(),
      velocity: 0,
    }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [heightVh])

  const handlePointerMove = useCallback((event) => {
    const state = dragRef.current
    if (!state.dragging) return
    const now = performance.now()
    const delta = event.clientY - state.startY
    const interval = now - state.lastT
    if (interval > 0) state.velocity = (event.clientY - state.lastY) / interval
    state.lastY = event.clientY
    state.lastT = now
    setHeightVh((clampHeight(state.startHeight - delta) / window.innerHeight) * 100)
  }, [])

  const handlePointerUp = useCallback(() => {
    const state = dragRef.current
    if (!state.dragging) return
    state.dragging = false
    setDragging(false)
    const currentHeight = clampHeight(heightInPx(heightVh))
    let targetIndex
    if (Math.abs(state.velocity) > 0.5) {
      targetIndex = Math.min(snapPoints.length - 1, Math.max(0, snapIndex + (state.velocity > 0 ? -1 : 1)))
    } else {
      targetIndex = snapPoints.reduce((closest, point, index) =>
        Math.abs(heightInPx(point) - currentHeight) < Math.abs(heightInPx(snapPoints[closest]) - currentHeight) ? index : closest, 0)
    }
    setSnapIndex(targetIndex)
    setHeightVh(snapPoints[targetIndex])
  }, [heightVh, snapIndex, snapPoints])

  useEffect(() => {
    const handleResize = () => setHeightVh(snapPoints[snapIndex])
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [snapIndex, snapPoints])

  // Lock the page behind the sheet so a drag/scroll inside it never chains
  // through to the body once it hits the top or bottom of its own content.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevBodyOverscroll = body.style.overscrollBehavior
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.overscrollBehavior = prevBodyOverscroll
    }
  }, [])

  // Report the sheet's real, measured height (px) so anything behind it —
  // e.g. a map — can stay clear of it and track it live while dragging.
  useEffect(() => {
    if (!onHeightChange || !sheetRef.current) return
    const el = sheetRef.current
    const report = () => onHeightChange(el.getBoundingClientRect().height, dragging)
    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  }, [onHeightChange, dragging])

  useEffect(() => {
    return () => onHeightChange?.(0, false)
  }, [onHeightChange])

  return (
    <div className="fixed inset-0 z-99 lg:hidden" role="dialog" aria-modal="true">
      {onClose && <button type="button" onClick={onClose} className="absolute inset-0 h-full w-full bg-slate-950/25" aria-label="Close drawer" />}
      {banner && <div className="pointer-events-none absolute inset-x-0 bottom-[30vh] z-10 mx-4">{banner}</div>}
      <div
        ref={sheetRef}
        style={{ height: `${heightVh}vh`, transition: dragging ? 'none' : 'height 0.28s cubic-bezier(0.32, 0.72, 0, 1)' }}
        className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 touch-none items-center justify-center px-4 pb-2 pt-3">
          <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className="flex h-8 w-full cursor-grab items-center justify-center active:cursor-grabbing">
            <div className="h-1 w-10 rounded-full bg-slate-300" />
          </div>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 pb-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
        {footer && <div className="shrink-0 border-t border-slate-100 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </div>
    </div>
  )
}