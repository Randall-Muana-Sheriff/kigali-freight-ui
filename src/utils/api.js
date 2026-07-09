// src/utils/api.js
export const API_BASE = 'http://localhost:5000';

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
    return res.json();
}

// Fetch all committed or active routes
export async function fetchRoutes(token) {
    const result = await apiFetch('/api/routes', { method: 'GET', token });
    if (result.error) {
        throw new Error(result.error);
    }
    return result.data;
}

// VRP Multi-Stop Route Optimization Caller with advanced fleet and time windows
 export async function optimizeMultiStopRoute(depot, vehicles, stops, vehicleCapacity, token) {
     const result = await apiFetch('/api/routes/optimize', {
         method: 'POST',
         token,
         body: { depot, vehicles, stops, vehicleCapacity }
     });
     if (result.error) {
         throw new Error(result.error);
     }
     return result.data; // returns { routes, summary }
}

// Create a new delivery stop caller
 export async function createDeliveryStop(stopData, token) {
     const result = await apiFetch('/api/stops', {
         method: 'POST',
         token,
         body: stopData,
     });
     if (result.error) {
         throw new Error(result.error);
     }
     return result.stop;
}

// Delete a delivery stop caller
 export async function deleteDeliveryStop(stopId, token) {
     const result = await apiFetch(`/api/stops/${stopId}`, {
         method: 'DELETE',
         token,
     });
     if (result.error) {
         throw new Error(result.error);
     }
     return result;
}

// Commit finalized route to persistent storage
 export async function commitOptimizedRoute(commitData, token) {
     const result = await apiFetch('/api/routes/commit', {
         method: 'POST',
         token,
         body: commitData,
     });
     if (result.error) {
         throw new Error(result.error);
     }
     return result.route;
}