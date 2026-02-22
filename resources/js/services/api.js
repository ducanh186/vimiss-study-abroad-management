import axios from 'axios';

export const handleApiError = (error, toast) => {
    const status = error.response?.status;
    const data = error.response?.data;
    switch (status) {
        case 401: break;
        case 403: toast?.error(data?.message || "You don't have permission to perform this action"); break;
        case 404: toast?.error(data?.message || 'Resource not found'); break;
        case 409:
            if (data?.error === 'MUST_CHANGE_PASSWORD') { window.location.href = '/change-password'; }
            else { toast?.error(data?.message || 'Conflict error'); }
            break;
        case 422:
            const firstError = Object.values(data?.errors || {})[0]?.[0];
            toast?.error(firstError || data?.message || 'Validation failed');
            break;
        default: toast?.error(data?.message || 'An unexpected error occurred');
    }
    return { status, data, error };
};

export const usersApi = {
    list: async (params = {}) => { const response = await axios.get('/api/users', { params }); return response.data; },
    get: async (id) => { const response = await axios.get(`/api/users/${id}`); return response.data; },
    create: async (data) => { const response = await axios.post('/api/users', data); return response.data; },
    updateRole: async (id, role) => { const response = await axios.patch(`/api/users/${id}/role`, { role }); return response.data; },
    delete: async (id) => { const response = await axios.delete(`/api/users/${id}`); return response.data; },
    roles: async () => { const response = await axios.get('/api/roles'); return response.data; },
};

export const profileApi = {
    get: async () => { const response = await axios.get('/api/profile'); return response.data; },
    update: async (data) => { const response = await axios.put('/api/profile', data); return response.data; },
};

// ── Phase 3: Mentor & Student ──────────────────────────────────
export const mentorApi = {
    directory: async (params = {}) => { const r = await axios.get('/api/mentors/directory', { params }); return r.data; },
    show: async (id) => { const r = await axios.get(`/api/mentors/directory/${id}`); return r.data; },
    myStudents: async () => { const r = await axios.get('/api/mentor/my-students'); return r.data; },
    // Admin
    adminList: async (params = {}) => { const r = await axios.get('/api/admin/mentors', { params }); return r.data; },
    adminCreate: async (data) => { const r = await axios.post('/api/admin/mentors', data); return r.data; },
    adminUpdate: async (id, data) => { const r = await axios.put(`/api/admin/mentors/${id}`, data); return r.data; },
    adminDisable: async (id) => { const r = await axios.post(`/api/admin/mentors/${id}/disable`); return r.data; },
    adminEnable: async (id) => { const r = await axios.post(`/api/admin/mentors/${id}/enable`); return r.data; },
    mentorLoad: async () => { const r = await axios.get('/api/reports/mentor-load'); return r.data; },
};

export const studentApi = {
    profile: async () => { const r = await axios.get('/api/student/profile'); return r.data; },
    updateProfile: async (data) => { const r = await axios.put('/api/student/profile', data); return r.data; },
    chooseMentor: async (mentorId) => { const r = await axios.post('/api/student/choose-mentor', { mentor_id: mentorId }); return r.data; },
    randomMentor: async () => { const r = await axios.post('/api/student/random-mentor'); return r.data; },
    myMentor: async () => { const r = await axios.get('/api/student/my-mentor'); return r.data; },
    adminAssign: async (data) => { const r = await axios.post('/api/admin/assign-mentor', data); return r.data; },
    adminReassign: async (data) => { const r = await axios.post('/api/admin/reassign-mentor', data); return r.data; },
};

// ── Phase 4: Applications ──────────────────────────────────────
export const applicationApi = {
    list: async (params = {}) => { const r = await axios.get('/api/applications', { params }); return r.data; },
    show: async (id) => { const r = await axios.get(`/api/applications/${id}`); return r.data; },
    create: async (data) => { const r = await axios.post('/api/applications', data); return r.data; },
    update: async (id, data) => { const r = await axios.put(`/api/applications/${id}`, data); return r.data; },
    reassign: async (id, data) => { const r = await axios.post(`/api/applications/${id}/reassign`, data); return r.data; },
};

// ── Phase 5: Documents & Notifications ─────────────────────────
export const documentApi = {
    list: async (appId) => { const r = await axios.get(`/api/applications/${appId}/documents`); return r.data; },
    upload: async (appId, formData) => { const r = await axios.post(`/api/applications/${appId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data; },
    updateLabel: async (docId, data) => { const r = await axios.patch(`/api/documents/${docId}/label`, data); return r.data; },
    delete: async (docId) => { const r = await axios.delete(`/api/documents/${docId}`); return r.data; },
    downloadUrl: (docId) => `/api/documents/${docId}/download`,
};

export const notificationApi = {
    list: async (params = {}) => { const r = await axios.get('/api/notifications', { params }); return r.data; },
    unreadCount: async () => { const r = await axios.get('/api/notifications/unread-count'); return r.data; },
    markRead: async (id) => { const r = await axios.patch(`/api/notifications/${id}/read`); return r.data; },
    markAllRead: async () => { const r = await axios.post('/api/notifications/mark-all-read'); return r.data; },
};

// ── Phase 6: Scholarships, Universities, Reviews, Calendar ─────
export const universityApi = {
    list: async (params = {}) => { const r = await axios.get('/api/universities', { params }); return r.data; },
    show: async (id) => { const r = await axios.get(`/api/universities/${id}`); return r.data; },
    create: async (data) => { const r = await axios.post('/api/universities', data); return r.data; },
    update: async (id, data) => { const r = await axios.put(`/api/universities/${id}`, data); return r.data; },
    delete: async (id) => { const r = await axios.delete(`/api/universities/${id}`); return r.data; },
};

export const scholarshipApi = {
    list: async (params = {}) => { const r = await axios.get('/api/scholarships', { params }); return r.data; },
    show: async (id) => { const r = await axios.get(`/api/scholarships/${id}`); return r.data; },
    create: async (data) => { const r = await axios.post('/api/scholarships', data); return r.data; },
    update: async (id, data) => { const r = await axios.put(`/api/scholarships/${id}`, data); return r.data; },
    delete: async (id) => { const r = await axios.delete(`/api/scholarships/${id}`); return r.data; },
    createRequest: async (data) => { const r = await axios.post('/api/scholarship-requests', data); return r.data; },
};

export const reviewApi = {
    list: async (params = {}) => { const r = await axios.get('/api/review-requests', { params }); return r.data; },
    submit: async (data) => { const r = await axios.post('/api/review-requests', data); return r.data; },
    review: async (id, data) => { const r = await axios.patch(`/api/review-requests/${id}/review`, data); return r.data; },
};

export const calendarApi = {
    list: async (params = {}) => { const r = await axios.get('/api/calendar-events', { params }); return r.data; },
    show: async (id) => { const r = await axios.get(`/api/calendar-events/${id}`); return r.data; },
    create: async (data) => { const r = await axios.post('/api/calendar-events', data); return r.data; },
    update: async (id, data) => { const r = await axios.put(`/api/calendar-events/${id}`, data); return r.data; },
    delete: async (id) => { const r = await axios.delete(`/api/calendar-events/${id}`); return r.data; },
};
