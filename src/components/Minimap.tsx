import { useEffect, useRef, useState } from 'react'
import type { Note } from '../types'
import { cn } from '../lib/utils'

type MinimapProps = {
    notes: Record<string, Note>
    boardRef: React.RefObject<HTMLDivElement | null>
    onPanTo: (x: number, y: number) => void
}

const MINIMAP_SIZE = 200
const PADDING = 20 // Padding around notes in minimap

export function Minimap({ notes, boardRef, onPanTo }: MinimapProps) {
    const minimapRef = useRef<HTMLDivElement>(null)
    const [bounds, setBounds] = useState({ minX: 0, minY: 0, maxX: 1000, maxY: 1000 })
    const [viewport, setViewport] = useState({ x: 0, y: 0, width: 0, height: 0 })

    // Calculate bounds based on note positions
    useEffect(() => {
        const noteArray = Object.values(notes)
        if (noteArray.length === 0) {
            setBounds({ minX: 0, minY: 0, maxX: 1000, maxY: 1000 })
            return
        }

        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        noteArray.forEach(note => {
            minX = Math.min(minX, note.x)
            minY = Math.min(minY, note.y)
            maxX = Math.max(maxX, note.x + note.w)
            maxY = Math.max(maxY, note.y + note.h)
        })

        // Add padding
        minX = Math.max(0, minX - PADDING)
        minY = Math.max(0, minY - PADDING)
        maxX += PADDING
        maxY += PADDING

        // Ensure minimum size
        const width = Math.max(1000, maxX - minX)
        const height = Math.max(1000, maxY - minY)

        setBounds({ minX, minY, maxX: minX + width, maxY: minY + height })
    }, [notes])

    // Track viewport position
    useEffect(() => {
        const board = boardRef.current
        if (!board) return

        let rafId: number | null = null
        let isScrolling = false

        const updateViewport = () => {
            if (!boardRef.current) return
            const boardEl = boardRef.current
            setViewport({
                x: boardEl.scrollLeft,
                y: boardEl.scrollTop,
                width: boardEl.clientWidth,
                height: boardEl.clientHeight,
            })
        }

        const handleScroll = () => {
            if (!isScrolling) {
                isScrolling = true
                updateViewport()
            }

            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    updateViewport()
                    rafId = null
                    isScrolling = false
                })
            }
        }

        // Initial update
        updateViewport()

        // Listen to scroll events
        board.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('resize', updateViewport)

        return () => {
            board.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', updateViewport)
            if (rafId !== null) {
                cancelAnimationFrame(rafId)
            }
        }
    }, [boardRef, bounds]) // Also update when bounds change

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!minimapRef.current || !boardRef.current) return

        const rect = minimapRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Convert minimap coordinates to board coordinates
        const scaleX = (bounds.maxX - bounds.minX) / MINIMAP_SIZE
        const scaleY = (bounds.maxY - bounds.minY) / MINIMAP_SIZE

        const boardX = bounds.minX + x * scaleX - boardRef.current.clientWidth / 2
        const boardY = bounds.minY + y * scaleY - boardRef.current.clientHeight / 2

        onPanTo(Math.max(0, boardX), Math.max(0, boardY))
    }

    const scaleX = MINIMAP_SIZE / (bounds.maxX - bounds.minX)
    const scaleY = MINIMAP_SIZE / (bounds.maxY - bounds.minY)

    return (
        <div
            ref={minimapRef}
            onClick={handleClick}
            className="absolute bottom-4 right-4 w-[200px] h-[200px] bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded-lg shadow-lg cursor-pointer z-50 overflow-hidden"
            style={{ minWidth: MINIMAP_SIZE, minHeight: MINIMAP_SIZE }}
        >
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
                    backgroundSize: `${20 * scaleX}px ${20 * scaleY}px`,
                }}
            />

            {/* Notes */}
            {Object.values(notes).map(note => {
                const x = (note.x - bounds.minX) * scaleX
                const y = (note.y - bounds.minY) * scaleY
                const w = note.w * scaleX
                const h = note.h * scaleY

                return (
                    <div
                        key={note.id}
                        className="absolute border border-gray-400 bg-blue-500/30"
                        style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            width: `${Math.max(2, w)}px`,
                            height: `${Math.max(2, h)}px`,
                        }}
                    />
                )
            })}

            {/* Viewport indicator */}
            {viewport.width > 0 && (() => {
                const viewportLeft = (viewport.x - bounds.minX) * scaleX
                const viewportTop = (viewport.y - bounds.minY) * scaleY
                const viewportWidth = viewport.width * scaleX
                const viewportHeight = viewport.height * scaleY

                // Clamp to minimap bounds
                const clampedLeft = Math.max(0, Math.min(MINIMAP_SIZE - viewportWidth, viewportLeft))
                const clampedTop = Math.max(0, Math.min(MINIMAP_SIZE - viewportHeight, viewportTop))

                return (
                    <div
                        className="absolute border-2 border-blue-600 bg-blue-500/20 pointer-events-none"
                        style={{
                            left: `${clampedLeft}px`,
                            top: `${clampedTop}px`,
                            width: `${Math.min(viewportWidth, MINIMAP_SIZE)}px`,
                            height: `${Math.min(viewportHeight, MINIMAP_SIZE)}px`,
                        }}
                    />
                )
            })()}

            {/* Minimap label */}
            <div className="absolute top-1 left-1 text-xs font-semibold text-gray-600 bg-white/80 px-1.5 py-0.5 rounded">
                Map
            </div>
        </div>
    )
}
