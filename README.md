# Kigali Freight UI Frontend

React + Vite command center for fleet monitoring, geofence operations, dispatching, and admin workflows.

## Overview

This UI connects to the backend API and Socket.IO stream to provide:

- live driver telemetry mapping,
- route optimization and commit workflows,
- order pooling and assignment operations,
- geofence creation/management,
- admin user/vehicle management and audit visibility.

## Tech Stack

- React
- Vite
- Leaflet + React Leaflet
- Socket.IO client
- Tailwind CSS

## Prerequisites

- Node.js 18+
- Backend API running (default `http://localhost:5000`)

## Install

```bash
npm install
```

## Run

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

## Backend Connection

The API base is configured in `src/utils/api.js`:

- `API_BASE = 'http://localhost:5000'`

If your backend runs elsewhere, update that value.

## API Contract Expectations

The UI expects normalized backend responses:

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human readable message"
  }
}
```

`src/utils/api.js` automatically unwraps `data` and throws on error responses.

## Main Feature Areas

- Authentication: login/signup and token persistence.
- Live Fleet Map: realtime Socket.IO driver updates.
- Dispatch Matrix: ETA and nearest-driver ranking.
- Route Optimization: optimize, save, and commit route flows.
- Geofences: create/delete polygon zones and monitor violations.
- Stops: create/delete delivery stops.
- Admin: user role management, vehicle assignment, audit logs.

## Troubleshooting

- Blank data panels: verify backend is running and token is valid.
- CORS/network errors: ensure backend `PORT` and `API_BASE` match.
- Map not updating: verify Socket.IO connection and backend telemetry events.
- Build failures: run `npm install` again and then `npm run build`.

## Production Notes

- Use a production API base URL before deployment.
- Serve UI behind HTTPS when backend/auth is public.
- Align backend CORS policy with deployed frontend origin.
