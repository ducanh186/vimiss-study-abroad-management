/**
 * API Client Module - Vimiss Study Abroad
 * Handles all API calls with consistent error handling
 */
import axios from 'axios';

// ============================================================================
// Error Handler
// ============================================================================
export const handleApiError = (error, toast) => {
    const status = error.response?.status;
    const data = error.response?.data;

    switch (status) {
        case 401:
            break;
        case 403:
            toast?.error(data?.message || "You don't have permission to perform this action");
            break;
        case 404:
            toast?.error(data?.message || 'Resource not found');
            break;
        case 409:
            if (data?.error === 'MUST_CHANGE_PASSWORD') {
                window.location.href = '/change-password';
            } else {
                toast?.error(data?.message || 'Conflict error');
            }
            break;
        case 422:
            const firstError = Object.values(data?.errors || {})[0]?.[0];
            toast?.error(firstError || data?.message || 'Validation failed');
            break;
        default:
            toast?.error(data?.message || 'An unexpected error occurred');
    }

    return { status, data, error };
};

// ============================================================================
// Users API (Admin)
// ============================================================================
export const usersApi = {
    list: async (params = {}) => {
        const response = await axios.get('/api/users', { params });
        return response.data;
    },

    get: async (id) => {
        const response = await axios.get(`/api/users/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await axios.post('/api/users', data);
        return response.data;
    },

    updateRole: async (id, role) => {
        const response = await axios.patch(`/api/users/${id}/role`, { role });
        return response.data;
    },

    delete: async (id) => {
        const response = await axios.delete(`/api/users/${id}`);
        return response.data;
    },

    roles: async () => {
        const response = await axios.get('/api/roles');
        return response.data;
    },
};

// ============================================================================
// Profile API
// ============================================================================
export const profileApi = {
    get: async () => {
        const response = await axios.get('/api/profile');
        return response.data;
    },

    update: async (data) => {
        const response = await axios.put('/api/profile', data);
        return response.data;
    },
};
