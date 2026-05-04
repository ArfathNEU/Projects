import { useEffect, useRef, useCallback } from 'react'
import { useFlightStore } from '../store/flightStore'
import type { ServerMessage } from '../types'
import { WS_URL } from '../lib/constants'

export function useWebSocket(onMessage?: (msg: ServerMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const reconnectDelayRef = useRef(1_000)
  const mountedRef = useRef(true)

  const { setFlights, setTrails, applyDelta, setStats, setWsConnected, setWsReconnecting } = useFlightStore()

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      reconnectDelayRef.current = 1_000
      setWsConnected(true)
      setWsReconnecting(false)
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const msg = JSON.parse(event.data as string) as ServerMessage
        if (msg.type === 'snapshot') {
          setFlights(msg.flights)
          setTrails(msg.trails)
          setStats(msg.stats)
        } else if (msg.type === 'delta') {
          applyDelta(msg.added, msg.updated, msg.removed)
          setStats(msg.stats)
        }
        onMessage?.(msg)
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setWsConnected(false)
      scheduleReconnect()
    }

    ws.onerror = () => {
      ws.close()
    }

    // Keep-alive ping every 25 seconds
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25_000)

    ws.addEventListener('close', () => clearInterval(pingInterval))
  }, [setFlights, setTrails, applyDelta, setStats, setWsConnected, setWsReconnecting, onMessage])

  const scheduleReconnect = useCallback(() => {
    setWsReconnecting(true)
    const delay = reconnectDelayRef.current
    reconnectDelayRef.current = Math.min(delay * 1.5, 30_000)
    reconnectTimeoutRef.current = setTimeout(connect, delay)
  }, [connect, setWsReconnecting])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimeoutRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return { send }
}
