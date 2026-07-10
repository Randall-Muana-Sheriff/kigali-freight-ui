// src/utils/api.js
export const API_BASE = 'http://localhost:5000';

async function parseResponse(res) {
    const contentType = res.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await res.json() : null;

    if (!res.ok) {
        const message = payload?.error?.message || payload?.error || payload?.message || `Request failed with status ${res.status}`;
        throw new Error(message);
    }

    if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
        return payload.data;
    }

    return payload;
}

// Wraps fetch with the API base URL and JSON handling.
// Pass a token to automatically attach the Authorization header.
 export async function apiFetch(path, { method = 'GET', token, body } = {}) {
     const headers = { 'Content-Type': 'application/json' };
     if (token) headers.Authorization = `Bearer ${token}`;
     const res = await fetch(`${API_BASE}${path}`, {
         method,
         headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    return parseResponse(res);
}

// Fetch all committed or active routes
export async function fetchRoutes(token) {
    return apiFetch('/api/routes', { method: 'GET', token });
}

export async function fetchGeofences(token) {
    return apiFetch('/api/geofences', { method: 'GET', token });
}

// VRP Multi-Stop Route Optimization Caller with advanced fleet and time windows
 export async function optimizeMultiStopRoute(depot, vehicles, stops, vehicleCapacity, token) {
    return apiFetch('/api/routes/optimize', {
         method: 'POST',
         token,
         body: { depot, vehicles, stops, vehicleCapacity }
     });
}

// Create a new delivery stop caller
 export async function createDeliveryStop(stopData, token) {
     const result = await apiFetch('/api/stops', {
         method: 'POST',
         token,
         body: stopData,
     });
    return result?.stop ?? result;
}

// Delete a delivery stop caller
 export async function deleteDeliveryStop(stopId, token) {
     const result = await apiFetch(`/api/stops/${stopId}`, {
         method: 'DELETE',
         token,
     });
     return result;
}

// Commit finalized route to persistent storage
 export async function commitOptimizedRoute(commitData, token) {
     const result = await apiFetch('/api/routes/commit', {
         method: 'POST',
         token,
         body: commitData,
     });
     return result?.route ?? result;
}