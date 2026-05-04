import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'
import { flightStore } from '../flightState.js'

interface FlightFilter {
  minAltitudeFt?: number
  maxAltitudeFt?: number
  minSpeedKts?: number
  maxSpeedKts?: number
  minVerticalRate?: number
  maxVerticalRate?: number
  onGround?: boolean
  country?: string
  callsignPrefix?: string
  headingMin?: number
  headingMax?: number
}

// Converts a natural language query into a structured flight filter using Claude
async function parseQueryWithClaude(query: string): Promise<FlightFilter> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    tools: [
      {
        name: 'apply_flight_filter',
        description: 'Apply structured filters to the live flight feed based on the user query',
        input_schema: {
          type: 'object' as const,
          properties: {
            minAltitudeFt: { type: 'number', description: 'Minimum altitude in feet' },
            maxAltitudeFt: { type: 'number', description: 'Maximum altitude in feet' },
            minSpeedKts: { type: 'number', description: 'Minimum speed in knots' },
            maxSpeedKts: { type: 'number', description: 'Maximum speed in knots' },
            minVerticalRate: { type: 'number', description: 'Min vertical rate in ft/min (positive = climbing)' },
            maxVerticalRate: { type: 'number', description: 'Max vertical rate in ft/min' },
            onGround: { type: 'boolean', description: 'Filter for on-ground flights' },
            country: { type: 'string', description: 'Country of origin filter (partial match)' },
            callsignPrefix: { type: 'string', description: 'ICAO airline code prefix e.g. "DLH" for Lufthansa' },
            headingMin: { type: 'number', description: 'Minimum heading in degrees (0-359)' },
            headingMax: { type: 'number', description: 'Maximum heading in degrees (0-359)' },
          },
        },
      },
    ],
    tool_choice: { type: 'any' },
    messages: [
      {
        role: 'user',
        content: `Convert this flight search query into structured filters: "${query}"\n\nNotes:\n- Altitude is in feet\n- Speed is in knots\n- Vertical rate in ft/min\n- Heading: 0/360=north, 90=east, 180=south, 270=west\n- "heading east" = headingMin:45, headingMax:135\n- "climbing" = minVerticalRate > 200\n- "descending" = maxVerticalRate < -200`,
      },
    ],
  })

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'apply_flight_filter') {
      return block.input as FlightFilter
    }
  }
  return {}
}

function applyFilter(filter: FlightFilter) {
  return flightStore.getAll().filter(f => {
    const altFt = f.baroAltitude !== null ? f.baroAltitude * 3.28084 : null
    const spdKts = f.velocity !== null ? f.velocity * 1.94384 : null
    const vrFtMin = f.verticalRate !== null ? f.verticalRate * 196.85 : null

    if (filter.minAltitudeFt !== undefined && (altFt === null || altFt < filter.minAltitudeFt)) return false
    if (filter.maxAltitudeFt !== undefined && (altFt === null || altFt > filter.maxAltitudeFt)) return false
    if (filter.minSpeedKts !== undefined && (spdKts === null || spdKts < filter.minSpeedKts)) return false
    if (filter.maxSpeedKts !== undefined && (spdKts === null || spdKts > filter.maxSpeedKts)) return false
    if (filter.minVerticalRate !== undefined && (vrFtMin === null || vrFtMin < filter.minVerticalRate)) return false
    if (filter.maxVerticalRate !== undefined && (vrFtMin === null || vrFtMin > filter.maxVerticalRate)) return false
    if (filter.onGround !== undefined && f.onGround !== filter.onGround) return false
    if (filter.country && !f.originCountry.toLowerCase().includes(filter.country.toLowerCase())) return false
    if (filter.callsignPrefix && !f.callsign?.toLowerCase().startsWith(filter.callsignPrefix.toLowerCase())) return false
    if (filter.headingMin !== undefined && filter.headingMax !== undefined && f.trueTrack !== null) {
      const h = f.trueTrack
      if (filter.headingMin <= filter.headingMax) {
        if (h < filter.headingMin || h > filter.headingMax) return false
      } else {
        if (h < filter.headingMin && h > filter.headingMax) return false
      }
    }
    return true
  })
}

export function registerAiRoutes(app: FastifyInstance) {
  if (!config.ANTHROPIC_API_KEY) return

  app.post<{ Body: { query: string } }>('/api/ai/search', async (req, reply) => {
    const { query } = req.body
    if (!query?.trim()) {
      return reply.status(400).send({ error: 'Query required' })
    }

    try {
      const filter = await parseQueryWithClaude(query)
      const flights = applyFilter(filter)
      return { flights: flights.slice(0, 200), filter, total: flights.length }
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'AI search failed' })
    }
  })
}
