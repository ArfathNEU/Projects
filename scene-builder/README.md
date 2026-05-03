# Scene Builder

A collaborative 3D scene builder with AI-powered scene manipulation, built with React, Three.js, and Claude.

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Three.js](https://img.shields.io/badge/Three.js-r169-000000?logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)

## Features

- **3D Scene Editing** — Add, transform, and style primitives (box, sphere, cylinder, cone, torus, plane, capsule) with a visual editor
- **AI Scene Commands** — Describe scene changes in natural language via `Cmd+K`; powered by Claude API
- **Real-Time Collaboration** — Multi-user editing with Yjs CRDTs, WebSocket relay, and WebRTC fallback
- **Live Presence** — See collaborators' cursors and selections in real time
- **Post-Processing Pipeline** — Bloom, vignette, custom GLSL shaders (outline, SSAO, depth fog)
- **GLTF Export** — Download your scene as a `.glb` file
- **Keyboard-Driven Workflow** — Q (Select), G (Move), R (Rotate), S (Scale), Del (Delete), Cmd+Z/Cmd+Shift+Z (Undo/Redo)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 + TypeScript |
| 3D Rendering | Three.js via React Three Fiber + Drei |
| State Management | Zustand v5 with `subscribeWithSelector` |
| Collaboration | Yjs + y-websocket + y-webrtc |
| AI Integration | Claude API (Anthropic) |
| Post-Processing | Custom GLSL shaders + `postprocessing` library |
| Off-Thread Compute | Web Workers via Comlink (BVH construction, geometry generation) |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS + Radix UI primitives |
| Deployment (optional) | Cloudflare Workers + Durable Objects |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install & Run

```bash
git clone https://github.com/ArfathNEU/scene-builder.git
cd scene-builder
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Enable AI Commands

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```
3. Add your key to `.env.local`:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Restart the dev server

The Vite dev server proxies AI requests through a local middleware — your API key never reaches the browser.

### Collaboration

Open the app in multiple tabs or share the URL (includes a room hash). Collaboration works peer-to-peer via WebRTC out of the box. For a persistent relay, deploy the Cloudflare Worker (see below).

## Project Structure

```
src/
├── components/
│   ├── ai/              # AI command bar, prompt builder, command hook
│   ├── canvas/          # 3D canvas, scene objects, lights, transform controls
│   │   └── shaders/     # Custom GLSL: outline, SSAO, depth fog
│   ├── panels/          # Hierarchy, properties, asset panels
│   │   └── sub/         # Transform, material, light, texture editors
│   ├── presence/        # Collaboration avatars
│   └── toolbar/         # Main toolbar
├── collab/              # Yjs document, providers, awareness
├── hooks/               # Keyboard shortcuts
├── lib/                 # Object factory, nanoid, GLTF serializer
├── store/
│   ├── slices/          # Scene, selection, UI, history state
│   └── middleware/      # Yjs <-> Zustand sync bridge
├── types/               # TypeScript interfaces (scene, AI, collab)
└── workers/             # Web Worker for BVH + geometry generation

cf-worker/               # Cloudflare Worker (Durable Objects relay + AI proxy)
```

## Architecture Highlights

- **Flat scene graph** — Objects stored as `Record<string, SceneObject>` with `rootIds[]` for O(1) lookups and clean Yjs mapping
- **Flag-gated sync** — `isApplyingRemoteUpdate` flag prevents echo loops between Zustand and Yjs
- **Deep merge for AI ops** — AI returns partial objects; a custom `deepMergeObject` preserves nested transform/geometry/material fields
- **Geometry/material disposal** — Three.js GPU resources are properly cleaned up on unmount via `useEffect`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build locally |

## Deploying the Cloudflare Worker (Optional)

The `cf-worker/` directory contains a Cloudflare Worker for:
- WebSocket relay via Durable Objects (persistent collaboration)
- Claude API proxy (for production, without exposing keys)
- Stability AI texture generation proxy

```bash
cd cf-worker
cp wrangler.example.toml wrangler.toml
# Add your API keys to wrangler.toml secrets
npx wrangler deploy
```

Then set `VITE_WORKER_URL` in `.env.local` to your deployed worker URL.

## License

