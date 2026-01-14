import { motion, useDragControls } from "motion/react"
import { useEffect, useRef, useState, memo } from "react"
import { GripHorizontal } from "lucide-react"
import type { Note, CardStyle } from "../types"
import { cn } from "../lib/utils"

type CardProps = {
    note: Note;
    onUpdate: (note: Note) => void;
    onDelete: (id: string) => void;
}

// Inside Card.tsx, update styleClasses for that glossy look
const styleClasses: Record<CardStyle, string> = {
    blue: "bg-gradient-to-b from-blue-400 to-blue-600 text-white",
    indigo: "bg-gradient-to-b from-indigo-400 to-indigo-600 text-white",
    purple: "bg-gradient-to-b from-purple-400 to-purple-600 text-white",
    pink: "bg-gradient-to-b from-pink-400 to-pink-600 text-white",
    red: "bg-gradient-to-b from-red-400 to-red-600 text-white",
    orange: "bg-gradient-to-b from-orange-400 to-orange-600 text-white",
    yellow: "bg-gradient-to-b from-[#fff781] to-[#f9e01b] text-black", // Classic sticky note yellow
    green: "bg-gradient-to-b from-green-400 to-green-600 text-white",
    teal: "bg-gradient-to-b from-teal-400 to-teal-600 text-white",
    cyan: "bg-gradient-to-b from-cyan-400 to-cyan-600 text-white",
    white: "bg-gradient-to-b from-white to-gray-100 text-black",
    gray: "bg-gradient-to-b from-gray-400 to-gray-600 text-white",
    "gray-dark": "bg-gradient-to-b from-gray-700 to-gray-900 text-white",
}

function Card({ note, onUpdate, onDelete }: CardProps) {
    const dragControls = useDragControls()
    const cardRef = useRef<HTMLDivElement>(null)
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [header, setHeader] = useState(note.header)
    const [content, setContent] = useState(note.content)

    const latestNoteRef = useRef(note)

    // Sync ref every render
    latestNoteRef.current = note

    // Correct Prop-to-State sync pattern
    useEffect(() => {
        if (header !== note.header) setHeader(note.header)
        if (content !== note.content) setContent(note.content)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [note.header, note.content])

    const debouncedUpdate = (updates: Partial<Note>) => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }
        debounceTimer.current = setTimeout(() => {
            onUpdate({ ...latestNoteRef.current, ...updates })
            debounceTimer.current = null
        }, 300)
    }

    useEffect(() => {
        if (!cardRef.current) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const boxSize = entry.borderBoxSize?.[0] || entry.borderBoxSize
                const width = boxSize ? boxSize.inlineSize : entry.contentRect.width
                const height = boxSize ? boxSize.blockSize : entry.contentRect.height

                if (Math.abs(width - note.w) > 2 || Math.abs(height - note.h) > 2) {
                    // Enforce minimum size constraints
                    const constrainedWidth = Math.max(150, width)
                    const constrainedHeight = Math.max(150, height)

                    if (debounceTimer.current) clearTimeout(debounceTimer.current)
                    debounceTimer.current = setTimeout(() => {
                        onUpdate({ ...latestNoteRef.current, w: constrainedWidth, h: constrainedHeight })
                        debounceTimer.current = null
                    }, 200)
                }
            }
        })

        observer.observe(cardRef.current)
        return () => {
            observer.disconnect()
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current)
                debounceTimer.current = null
            }
        }
    }, [note.id, note.w, note.h, onUpdate])

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current)
                debounceTimer.current = null
            }
        }
    }, [])

    const colors: CardStyle[] = ["yellow", "blue", "green", "red", "purple", "orange", "pink", "cyan", "teal", "indigo", "white", "gray", "gray-dark"]

    return (
        <motion.div
            ref={cardRef}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={{
                top: 0,
                left: 0,
            }}
            dragElastic={0}
            initial={{ x: note.x, y: note.y }}
            animate={{ x: note.x, y: note.y }}
            onDragStart={() => onUpdate({ ...latestNoteRef.current })} // Pop to front on drag start
            onDragEnd={(_, info) => {
                // Ensure notes can't go to negative positions (prevent going above board area)
                // The board container has overflow-hidden, so cards beyond bounds will be clipped
                const newX = Math.max(0, latestNoteRef.current.x + info.offset.x)
                const newY = Math.max(0, latestNoteRef.current.y + info.offset.y)
                onUpdate({ ...latestNoteRef.current, x: newX, y: newY })
            }}
            whileDrag={{ scale: 1.02, zIndex: 1000000 }}
            style={{
                width: note.w,
                height: note.h,
                zIndex: note.zIndex || 1,
            }}
            className={cn(
                "absolute flex flex-col resize overflow-hidden min-w-[150px] min-h-[150px] border border-solid border-black/20 rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)]",
                styleClasses[note.style]
            )}
        >
            {/* Glossy Overlay */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-white/20 to-transparent pointer-events-none" />

            <div
                onPointerDown={(e) => {
                    onUpdate({ ...latestNoteRef.current }) // Pop to front
                    dragControls.start(e)
                }}
                className="
                    py-2 px-3 mb-0 flex items-center gap-2
                    bg-black/10 cursor-grab active:cursor-grabbing
                    border-b border-solid border-[rgba(0,0,0,0.175)] 
                    rounded-t-[calc(0.375rem-1px)]
                    select-none
                "
            >
                <div className="text-inherit opacity-30 shrink-0">
                    <GripHorizontal size={18} />
                </div>
                <input
                    value={header}
                    onChange={(e) => {
                        setHeader(e.target.value)
                        debouncedUpdate({ header: e.target.value })
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="bg-transparent border-none outline-none font-bold flex-1 min-w-0 text-inherit placeholder:text-inherit/50"
                    placeholder="Give me a name..."
                    aria-label="Note header"
                />
                <button
                    onClick={() => onDelete(note.id)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="text-inherit opacity-50 hover:opacity-100 font-bold text-xl leading-none shrink-0"
                    title="Delete note"
                    aria-label="Delete note"
                >
                    &times;
                </button>
            </div>

            <div
                className="flex-auto p-4 overflow-y-auto min-h-0"
                onPointerDown={() => onUpdate({ ...latestNoteRef.current })} // Pop to front
            >
                <textarea
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value)
                        debouncedUpdate({ content: e.target.value })
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="
                        w-full h-full bg-transparent border-none outline-none 
                        resize-none whitespace-pre-wrap text-inherit
                        placeholder:text-inherit/50
                    "
                    placeholder="Make a note..."
                    aria-label="Note content"
                />
            </div>

            {/* Color Picker Toolbar */}
            <div
                className="px-4 pb-2 flex gap-1 flex-wrap"
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onUpdate({ ...latestNoteRef.current }) // Pop to front
                }}
            >
                {colors.map((c) => (
                    <button
                        key={c}
                        onClick={() => onUpdate({ ...latestNoteRef.current, style: c })}
                        className={cn(
                            "w-4 h-4 rounded-full border border-black/20 transition-transform hover:scale-110 cursor-pointer",
                            styleClasses[c],
                            note.style === c && "ring-2 ring-white/50 shadow-md scale-110"
                        )}
                        aria-label={`Set color to ${c}`}
                        aria-pressed={note.style === c}
                    />
                ))}
            </div>

            <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-black/20 pointer-events-none" />
        </motion.div>
    )
}

export default memo(Card)
