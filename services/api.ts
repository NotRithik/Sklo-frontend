/**
 * Base API Client
 * Provides authenticated fetch wrapper and common API utilities
 */

const API_BASE = 'http://localhost:8000';

/**
 * Get stored auth token
 */
export const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
};

/**
 * Authenticated fetch wrapper
 */
export const apiFetch = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> => {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });
};

/**
 * JSON response handler with error handling
 */
export const apiJson = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const res = await apiFetch(endpoint, options);

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${res.status}`);
    }

    return res.json();
};

/**
 * API helper methods
 */
export const api = {
    get: <T>(endpoint: string) => apiJson<T>(endpoint, { method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown) =>
        apiJson<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        }),

    patch: <T>(endpoint: string, data?: unknown) =>
        apiJson<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined
        }),

    put: <T>(endpoint: string, data?: unknown) =>
        apiJson<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        }),

    delete: <T>(endpoint: string) =>
        apiJson<T>(endpoint, { method: 'DELETE' }),
};

export default api;
