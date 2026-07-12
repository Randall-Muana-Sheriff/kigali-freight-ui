// src/utils/api.js
export const API_BASE = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE) {
    throw new Error('Missing VITE_API_BASE_URL. Create a .env file from .env.example and set your backend URL.');
}

function createHttpError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// Registered by SocketContext so any expired/invalid token clears the
// session in one place, instead of every caller having to check the status.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(handler) {
    unauthorizedHandler = handler;
}

async function parseResponse(res) {
    const contentType = res.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await res.json() : null;
    const acceptedResponse = res.status === 202;

    if (!res.ok && !acceptedResponse) {
        const message = payload?.error?.message || payload?.error || payload?.message || `Request failed with status ${res.status}`;
        if (res.status === 401 || res.status === 403) {
            unauthorizedHandler?.();
        }
        throw createHttpError(message, res.status);
    }

    if (acceptedResponse && payload == null) {
        return { accepted: true };
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