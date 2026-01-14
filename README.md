# Nathan’s Board

Nathan’s Board is a real-time sticky-note whiteboard. Create notes, drag and resize them, change colors, and keep everything synced across tabs/devices via WebSockets.

- **Live site**: `nathanswhiteboard.com`

## Features

- **Sticky notes**: create, edit title/body, delete
- **Drag + resize**: smooth interactions with persistent positions and sizes
- **Colors**: per-note color picker (and the minimap reflects note colors)
- **Minimap**: overview + click-to-pan navigation
- **Realtime sync**: WebSocket-backed multi-client updates with reconnect + message queueing

## Tech stack

- React + TypeScript
- Vite (Rolldown Vite)
- Tailwind CSS
- Cloudflare Pages (deployment) via Wrangler

## Running locally

### Prerequisites

- Bun installed
- A WebSocket backend running that speaks the board protocol (init/update/delete)

### Install

```bash
bun install
```

### Configure environment variables

Create a `.env` file in the project root:

```bash
VITE_WS_URL=ws://localhost:8080/ws
```

- **Dev** can use `ws://...`
- **Production** should use `wss://...`

### Start the dev server

```bash
bun run dev
```

## Build

```bash
bun run build
```

## Deploy (Cloudflare Pages)

### Authenticate Wrangler

```bash
bunx wrangler login
```

### Deploy

```bash
bun run deploy
```

### Deploy a preview environment

```bash
bun run deploy:preview
```
