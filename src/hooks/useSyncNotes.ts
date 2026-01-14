import { useState, useEffect, useCallback, useRef } from 'react'
import type { Note, WSMessage } from '../types'

const MAX_RECONNECT_ATTEMPTS = 10
const INITIAL_RECONNECT_DELAY = 1000

export function useSyncNotes(url: string) {
    const [notes, setNotes] = useState<Record<string, Note>>({})
    const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting')
    const socketRef = useRef<WebSocket | null>(null)
    const isMountedRef = useRef(true)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const reconnectAttempts = useRef(0)
    const messageQueue = useRef<string[]>([])
    const MAX_QUEUE_SIZE = 100 // Prevent unbounded queue growth

    const connect = useCallback(() => {
        if (!isMountedRef.current || socketRef.current?.readyState === WebSocket.OPEN) return

        try {
            setStatus('connecting')
            const ws = new WebSocket(url)
            socketRef.current = ws

            ws.onopen = () => {
                if (!isMountedRef.current) {
                    ws.close()
                    return
                }
                setStatus('open')
                reconnectAttempts.current = 0
                while (messageQueue.current.length > 0) {
                    const msg = messageQueue.current.shift()
                    if (msg) ws.send(msg)
                }
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (!data || typeof data !== 'object' || !('type' in data)) return

                    const msg: WSMessage = data
                    if (msg.type === 'init') {
                        if (!Array.isArray(msg.notes)) {
                            console.error("Invalid init message: notes must be an array")
                            return
                        }
                        const noteMap = msg.notes.reduce<Record<string, Note>>((acc, n) => {
                            if (n && n.id) {
                                acc[n.id] = n
                            }
                            return acc
                        }, {})
                        setNotes(noteMap)
                    } else if (msg.type === 'update') {
                        if (msg.note && msg.note.id) {
                            setNotes(prev => ({ ...prev, [msg.note.id]: msg.note }))
                        }
                    } else if (msg.type === 'delete') {
                        if (msg.id) {
                            setNotes(prev => {
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const { [msg.id]: _, ...rest } = prev
                                return rest
                            })
                        }
                    }
                } catch (err) {
                    console.error("WS parse error:", err)
                }
            }

            ws.onclose = () => {
                socketRef.current = null
                if (!isMountedRef.current) return

                setStatus('closed')
                if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current), 30000)
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (!isMountedRef.current) return
                        reconnectAttempts.current++
                        connect()
                    }, delay)
                }
            }

            ws.onerror = () => ws.close()
        } catch (error) {
            console.error("Failed to create WebSocket:", error)
            setStatus('closed')
        }
    }, [url])

    useEffect(() => {
        isMountedRef.current = true
        connect()

        return () => {
            isMountedRef.current = false
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }
            if (socketRef.current) {
                socketRef.current.close(1000)
                socketRef.current = null
            }
        }
    }, [connect])

    const upsertNote = useCallback((note: Note) => {
        setNotes(prev => ({ ...prev, [note.id]: note }))
        const payload = JSON.stringify({ type: 'update', note })
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(payload)
        } else {
            // Prevent queue from growing unbounded
            if (messageQueue.current.length >= MAX_QUEUE_SIZE) {
                console.warn('Message queue full, dropping oldest message')
                messageQueue.current.shift()
            }
            messageQueue.current.push(payload)
        }
    }, [])

    const deleteNote = useCallback((id: string) => {
        setNotes(prev => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _, ...rest } = prev
            return rest
        })
        const payload = JSON.stringify({ type: 'delete', id })
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(payload)
        } else {
            // Prevent queue from growing unbounded
            if (messageQueue.current.length >= MAX_QUEUE_SIZE) {
                console.warn('Message queue full, dropping oldest message')
                messageQueue.current.shift()
            }
            messageQueue.current.push(payload)
        }
    }, [])

    return { notes, upsertNote, deleteNote, status }
}
