import './App.css'
import { useCallback, useMemo, useRef } from 'react'
import Card from './components/Card'
import { Minimap } from './components/Minimap'
import { useSyncNotes } from './hooks/useSyncNotes'
import type { Note } from './types'

// Use environment variable with fallback for development
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

function App() {
  const { notes, upsertNote, deleteNote, status } = useSyncNotes(WS_URL)
  const boardRef = useRef<HTMLDivElement>(null)

  const maxZIndex = useMemo(() => {
    return Object.values(notes).reduce((max, n) => Math.max(max, n.zIndex || 0), 0)
  }, [notes])

  // Calculate board content bounds based on note positions
  const boardBounds = useMemo(() => {
    const noteArray = Object.values(notes)
    if (noteArray.length === 0) {
      return { width: 2000, height: 2000 }
    }

    let maxX = 0
    let maxY = 0

    noteArray.forEach(note => {
      maxX = Math.max(maxX, note.x + note.w)
      maxY = Math.max(maxY, note.y + note.h)
    })

    // Add padding and ensure minimum size
    return {
      width: Math.max(2000, maxX + 500),
      height: Math.max(2000, maxY + 500),
    }
  }, [notes])

  const handlePanTo = useCallback((x: number, y: number) => {
    if (boardRef.current) {
      boardRef.current.scrollTo({
        left: x,
        top: y,
        behavior: 'smooth',
      })
    }
  }, [])

  const handleUpdateNote = useCallback((updatedNote: Note) => {
    // Only update zIndex if the note is being brought to front (zIndex is less than max)
    if (updatedNote.zIndex < maxZIndex) {
      upsertNote({ ...updatedNote, zIndex: maxZIndex + 1 })
    } else {
      upsertNote(updatedNote)
    }
  }, [maxZIndex, upsertNote])

  const handleAddNote = useCallback(() => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      x: 50,
      y: 50,
      w: 250,
      h: 250,
      style: 'yellow',
      header: 'New Sticky Note',
      content: '',
      zIndex: maxZIndex + 1
    }
    upsertNote(newNote)
  }, [maxZIndex, upsertNote])

  return (
    <div className="w-screen h-screen bg-[#f8f9fa] overflow-hidden flex flex-col">
      {/* Header Bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            Nathans board
          </h1>
          <button
            onClick={handleAddNote}
            className="
              bg-linear-to-b from-[#67ae55] to-[#578843]
              border border-[#3b6e22]
              rounded-full px-5 py-1
              text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]
              hover:from-[#76c362] hover:to-[#5ea04a]
              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
              transition-all duration-75
            "
            aria-label="Add new sticky note"
          >
            + Add Note
          </button>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <div className={`w-2 h-2 rounded-full ${status === 'open' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            {status}
          </span>
        </div>
      </header>

      {/* The Board Area */}
      <div className="flex-1 relative">
        <div
          ref={boardRef}
          className="absolute inset-0 overflow-auto bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[20px_20px] bg-white"
        >
          {/* Scrollable content container */}
          <div
            className="relative"
            style={{
              width: `${boardBounds.width}px`,
              height: `${boardBounds.height}px`,
              minWidth: '100%',
              minHeight: '100%',
            }}
          >
            {Object.values(notes).length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-lg font-medium mb-2">No notes yet</p>
                  <p className="text-sm">Click "Add Note" to create your first sticky note</p>
                </div>
              </div>
            ) : (
              Object.values(notes).map((note) => (
                <Card
                  key={note.id}
                  note={note}
                  onUpdate={handleUpdateNote}
                  onDelete={deleteNote}
                />
              ))
            )}
          </div>
        </div>

        {/* Minimap - fixed to viewport */}
        {Object.values(notes).length > 0 && (
          <Minimap notes={notes} boardRef={boardRef} onPanTo={handlePanTo} />
        )}
      </div>
    </div>
  )
}

export default App
