import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'
import { flightStore } from './flightState.js'
import type { ClientMessage, ServerMessage } from './types.js'

interface ConnectedClient {
  ws: WebSocket
  subscribedIcao: string | null
  isAlive: boolean
}

const clients = new Set<ConnectedClient>()

function send(client: ConnectedClient, msg: ServerMessage) {
  if (client.ws.readyState === 1 /* OPEN */) {
    try {
      client.ws.send(JSON.stringify(msg))
    } catch {
      // Client disconnected mid-send, will be cleaned up on close
    }
  }
}

function broadcast(msg: ServerMessage) {
  for (const client of clients) {
    send(client, msg)
  }
}

export function registerWebSocket(app: FastifyInstance) {
  // Broadcast delta updates whenever the store emits
  flightStore.on('update', (update) => {
    const msg: ServerMessage = {
      type: 'delta',
      added: update.added,
      updated: update.updated,
      removed: update.removed,
      stats: update.stats,
      ts: Date.now(),
    }
    broadcast(msg)
  })

  app.get('/ws', { websocket: true }, (socket) => {
    const client: ConnectedClient = {
      ws: socket,
      subscribedIcao: null,
      isAlive: true,
    }
    clients.add(client)

    // Send initial full snapshot
    const snapshot: ServerMessage = {
      type: 'snapshot',
      flights: flightStore.getAll(),
      trails: flightStore.getAllTrails(),
      stats: flightStore.getStats(),
      ts: Date.now(),
    }
    send(client, snapshot)

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as ClientMessage
        if (msg.type === 'ping') {
          send(client, { type: 'pong', ts: Date.now() })
        } else if (msg.type === 'subscribe') {
          client.subscribedIcao = msg.icao24
        } else if (msg.type === 'unsubscribe') {
          client.subscribedIcao = null
        }
      } catch {
        // Ignore malformed messages
      }
    })

    socket.on('close', () => {
      clients.delete(client)
    })

    socket.on('pong', () => {
      client.isAlive = true
    })
  })

  // Heartbeat to detect dead connections
  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (!client.isAlive) {
        client.ws.terminate()
        clients.delete(client)
        continue
      }
      client.isAlive = false
      if (client.ws.readyState === 1) {
        client.ws.ping()
      }
    }
  }, 30_000)

  app.addHook('onClose', () => {
    clearInterval(heartbeat)
  })
}

export function getClientCount() {
  return clients.size
}
