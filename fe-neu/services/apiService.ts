// ====================================================================
// Vimiss Study Abroad Management — API Service
// Backend: Laravel + Sanctum (session/cookie auth via Vite proxy)
// All requests go through Vite proxy → http://localhost:8000
// ====================================================================

import type {
  User,
  AuthRequest,
  RegisterCodeRequest,
  RegisterRequest as RegisterReq,
  ForgotPasswordRequest as ForgotPwReq,
  ResetPasswordRequest as ResetPwReq,
  ChangePasswordRequest,
  Application,
  ApplicationDocument,
  Approval,
  PaginatedResponse,
  Scholarship,
  University,
  MentorProfile,
  StudentProfile,
  AppNotification,
  CalendarEvent,
  ReviewRequest,
  ScholarshipRequest,
  // Legacy types (backward compat for unmigrated pages)
  CategoryResponse,
  CategoryRequest,
  CaseResponse,
  CaseRequest,
  PersonResponse,
  PersonRequest,
  CaseTagResponse,
  CaseTagRequest,
  CaseFileResponse,
  CaseFileRequest,
  AuditLogResponse,
  AuditLogRequest,
  QuestionResponse,
  QuestionRequest,
  CasePersonResponse,
  CasePersonRequest,
  AppointmentResponse,
  AppointmentRequest,
  UserResponse,
  SendVerificationCodeRequest,
  ApiError as ApiErrorType,
} from '../types';

// Re-export ApiError class from types
export { ApiError } from '../types';

// ============================================================
// Core Fetch Wrapper
// ============================================================

/**
 * Read XSRF-TOKEN cookie (set by /sanctum/csrf-cookie).
 * Sanctum sets it as non-httpOnly so JS can read it.
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

interface LaravelErrorBody {
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}

class RequestError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  errorCode?: string;
  currentStatus?: string;
  allowed?: string[];

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
    errorCode?: string,
    currentStatus?: string,
    allowed?: string[],
  ) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.errors = errors;
    this.errorCode = errorCode;
    this.currentStatus = currentStatus;
    this.allowed = allowed;
  }
}

/**
 * Core fetch wrapper for all API calls.
 * - Adds Accept/X-Requested-With headers
 * - Adds XSRF token header if available
 * - Content-Type auto-set for JSON (not for FormData)
 * - credentials: 'same-origin' (Vite proxy makes everything same-origin)
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  // Don't set Content-Type for FormData — browser sets it with multipart boundary
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // XSRF token for CSRF protection
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...headers,
      ...((options.headers as Record<string, string>) || {}),
    },
    credentials: 'same-origin',
  });

  // 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new RequestError(`HTTP ${response.status}`, response.status);
    }
    return null as T;
  }

  if (!response.ok) {
    const errBody = data as LaravelErrorBody & { current_status?: string; allowed?: string[] };
    let message: string;
    if (response.status === 403) {
      message = errBody.message || 'Bạn không có quyền thực hiện thao tác này.';
    } else if (response.status === 422 && errBody.current_status) {
      message = errBody.message || `Trạng thái không hợp lệ (hiện tại: ${errBody.current_status}).`;
    } else if (errBody.errors) {
      message = Object.values(errBody.errors).flat().join(', ');
    } else {
      message = errBody.message || `HTTP ${response.status}`;
    }
    throw new RequestError(
      message,
      response.status,
      errBody.errors,
      errBody.error,
      errBody.current_status,
      errBody.allowed,
    );
  }

  return data as T;
}

// ============================================================
// CSRF
// ============================================================

export async function fetchCsrfCookie(): Promise<void> {
  await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
}

// ============================================================
// AUTH — web routes (no /api prefix)
// ============================================================

export async function login(credentials: AuthRequest): Promise<User> {
  await fetchCsrfCookie();
  const res = await request<{ message: string; user: User }>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return res.user;
}

export async function logout(): Promise<void> {
  await request<{ message: string }>('/logout', { method: 'POST' });
}

export async function me(): Promise<User> {
  const res = await request<{ user: User }>('/api/me');
  return res.user;
}

export async function changePassword(data: ChangePasswordRequest): Promise<string> {
  const res = await request<{ message: string }>('/api/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.message;
}

// ============================================================
// REGISTRATION — web routes
// ============================================================

export async function registerRequestCode(data: RegisterCodeRequest): Promise<string> {
  await fetchCsrfCookie();
  const res = await request<{ message: string }>('/register/request-code', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.message;
}

export async function registerUser(data: RegisterReq): Promise<User> {
  const res = await request<{ message: string; user: User }>('/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.user;
}

// ============================================================
// FORGOT / RESET PASSWORD — web routes
// ============================================================

export async function forgotPasswordRequest(data: ForgotPwReq): Promise<string> {
  await fetchCsrfCookie();
  const res = await request<{ message: string }>('/forgot-password/request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.message;
}

export async function forgotPasswordReset(data: ResetPwReq): Promise<string> {
  const res = await request<{ message: string }>('/forgot-password/reset', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.message;
}

// ============================================================
// PROFILE
// ============================================================

export async function getProfile(): Promise<any> {
  return request<any>('/api/profile');
}

export async function updateProfile(data: Record<string, any>): Promise<any> {
  return request<any>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============================================================
// APPLICATIONS
// ============================================================

/** List applications (paginated). Returns Laravel paginated response. */
export async function getApplications(params?: {
  status?: string;
  application_type?: string;
  scholarship_type?: string;
  university_id?: number;
  per_page?: number;
  page?: number;
}): Promise<PaginatedResponse<Application>> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
  }
  const qs = query.toString();
  return request<PaginatedResponse<Application>>(`/api/applications${qs ? '?' + qs : ''}`);
}

/** Show single application with nested relations. */
export async function getApplication(id: number): Promise<Application> {
  const res = await request<{ application: Application }>(`/api/applications/${id}`);
  return res.application;
}

export async function createApplication(data: Partial<Application>): Promise<Application> {
  const res = await request<{ message: string; application: Application }>('/api/applications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.application;
}

export async function updateApplication(id: number, data: Partial<Application>): Promise<Application> {
  const res = await request<{ message: string; application: Application }>(`/api/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.application;
}

// ============================================================
// APPROVAL WORKFLOW
// ============================================================

/** Submit application for Step 1 review (mentor/admin). Requires status: ready_for_review. */
export async function submitForReview(applicationId: number, notes?: string): Promise<Application> {
  const res = await request<{ message: string; application: Application }>(
    `/api/applications/${applicationId}/submit-review`,
    { method: 'POST', body: JSON.stringify({ notes: notes || null }) },
  );
  return res.application;
}

/** Approve Step 1 (reviewer/director/admin). Requires status: review_step_1. */
export async function approveStep1(applicationId: number, notes?: string): Promise<Application> {
  const res = await request<{ message: string; application: Application }>(
    `/api/applications/${applicationId}/approve-step1`,
    { method: 'POST', body: JSON.stringify({ notes: notes || null }) },
  );
  return res.application;
}

/** Reject Step 1 (reviewer/director/admin). Returns app to collecting_docs. */
export async function rejectStep1(applicationId: number, notes?: string): Promise<Application> {
  const res = await request<{ message: string; application: Application }>(
    `/api/applications/${applicationId}/reject-step1`,
    { method: 'POST', body: JSON.stringify({ notes: notes || null }) },
  );
  return res.application;
}

/** Approve Step 2 (director/admin). Requires status: review_step_2. */
export async function approveStep2(applicationId: number, notes?: string): Promise<Application> {
  const res = await request<{ message: string; application: Application }>(
    `/api/applications/${applicationId}/approve-step2`,
    { method: 'POST', body: JSON.stringify({ notes: notes || null }) },
  );
  return res.application;
}

/** Reject Step 2 (director/admin). Returns app to collecting_docs. */
export async function rejectStep2(applicationId: number, notes?: string): Promise<Application> {
  const res = await request<{ message: string; application: Application }>(
    `/api/applications/${applicationId}/reject-step2`,
    { method: 'POST', body: JSON.stringify({ notes: notes || null }) },
  );
  return res.application;
}

// ============================================================
// APPLICATION DOCUMENTS
// ============================================================

export async function getApplicationDocuments(applicationId: number): Promise<ApplicationDocument[]> {
  return request<ApplicationDocument[]>(`/api/applications/${applicationId}/documents`);
}

export async function uploadDocument(applicationId: number, formData: FormData): Promise<ApplicationDocument> {
  return request<ApplicationDocument>(`/api/applications/${applicationId}/documents`, {
    method: 'POST',
    body: formData,
  });
}

export async function updateDocumentLabel(
  documentId: number,
  labelStatus: string,
  notes?: string,
): Promise<ApplicationDocument> {
  return request<ApplicationDocument>(`/api/documents/${documentId}/label`, {
    method: 'PATCH',
    body: JSON.stringify({ label_status: labelStatus, notes }),
  });
}

export async function deleteDocument(documentId: number): Promise<null> {
  return request<null>(`/api/documents/${documentId}`, { method: 'DELETE' });
}

export function getDocumentDownloadUrl(documentId: number): string {
  return `/api/documents/${documentId}/download`;
}

export function getDocumentPreviewUrl(documentId: number): string {
  return `/api/documents/${documentId}/preview`;
}

// ============================================================
// SCHOLARSHIPS
// ============================================================

export async function getScholarships(): Promise<Scholarship[]> {
  return request<Scholarship[]>('/api/scholarships');
}

export async function getScholarship(id: number): Promise<Scholarship> {
  return request<Scholarship>(`/api/scholarships/${id}`);
}

export async function createScholarship(data: Partial<Scholarship>): Promise<Scholarship> {
  return request<Scholarship>('/api/scholarships', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateScholarship(id: number, data: Partial<Scholarship>): Promise<Scholarship> {
  return request<Scholarship>(`/api/scholarships/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteScholarship(id: number): Promise<null> {
  return request<null>(`/api/scholarships/${id}`, { method: 'DELETE' });
}

// ============================================================
// UNIVERSITIES
// ============================================================

export async function getUniversities(): Promise<University[]> {
  return request<University[]>('/api/universities');
}

export async function getUniversity(id: number): Promise<University> {
  return request<University>(`/api/universities/${id}`);
}

export async function createUniversity(data: Partial<University>): Promise<University> {
  return request<University>('/api/universities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUniversity(id: number, data: Partial<University>): Promise<University> {
  return request<University>(`/api/universities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUniversity(id: number): Promise<null> {
  return request<null>(`/api/universities/${id}`, { method: 'DELETE' });
}

// ============================================================
// MENTORS
// ============================================================

export async function getMentorDirectory(): Promise<MentorProfile[]> {
  return request<MentorProfile[]>('/api/mentors/directory');
}

export async function getMentorDetail(mentorUserId: number): Promise<MentorProfile> {
  return request<MentorProfile>(`/api/mentors/directory/${mentorUserId}`);
}

export async function getMyStudents(): Promise<any[]> {
  return request<any[]>('/api/mentor/my-students');
}

export async function getAdminMentors(): Promise<MentorProfile[]> {
  return request<MentorProfile[]>('/api/admin/mentors');
}

export async function createMentor(data: Partial<MentorProfile>): Promise<MentorProfile> {
  return request<MentorProfile>('/api/admin/mentors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMentor(mentorUserId: number, data: Partial<MentorProfile>): Promise<MentorProfile> {
  return request<MentorProfile>(`/api/admin/mentors/${mentorUserId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function disableMentor(mentorUserId: number): Promise<void> {
  await request<{ message: string }>(`/api/admin/mentors/${mentorUserId}/disable`, { method: 'POST' });
}

export async function enableMentor(mentorUserId: number): Promise<void> {
  await request<{ message: string }>(`/api/admin/mentors/${mentorUserId}/enable`, { method: 'POST' });
}

// ============================================================
// STUDENT PROFILE
// ============================================================

export async function getStudentProfile(): Promise<StudentProfile> {
  return request<StudentProfile>('/api/student/profile');
}

export async function updateStudentProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
  return request<StudentProfile>('/api/student/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function chooseMentor(mentorId: number): Promise<string> {
  const res = await request<{ message: string }>('/api/student/choose-mentor', {
    method: 'POST',
    body: JSON.stringify({ mentor_id: mentorId }),
  });
  return res.message;
}

export async function randomMentor(): Promise<string> {
  const res = await request<{ message: string }>('/api/student/random-mentor', { method: 'POST' });
  return res.message;
}

export async function getMyMentor(): Promise<any> {
  return request<any>('/api/student/my-mentor');
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getNotifications(): Promise<AppNotification[]> {
  return request<AppNotification[]>('/api/notifications');
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await request<{ count: number }>('/api/notifications/unread-count');
  return res.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await request<any>(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await request<any>('/api/notifications/mark-all-read', { method: 'POST' });
}

// ============================================================
// CALENDAR EVENTS
// ============================================================

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  return request<CalendarEvent[]>('/api/calendar-events');
}

export async function getCalendarEvent(id: number): Promise<CalendarEvent> {
  return request<CalendarEvent>(`/api/calendar-events/${id}`);
}

export async function createCalendarEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  return request<CalendarEvent>('/api/calendar-events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCalendarEvent(id: number, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  return request<CalendarEvent>(`/api/calendar-events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCalendarEvent(id: number): Promise<null> {
  return request<null>(`/api/calendar-events/${id}`, { method: 'DELETE' });
}

// ============================================================
// USERS (Admin)
// ============================================================

export async function getUsers(): Promise<User[]> {
  return request<User[]>('/api/users');
}

export async function getUser(id: number): Promise<User> {
  return request<User>(`/api/users/${id}`);
}

export async function createUser(data: Partial<User> & { password: string }): Promise<User> {
  return request<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUserRole(userId: number, role: string): Promise<User> {
  return request<User>(`/api/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deleteUser(userId: number): Promise<null> {
  return request<null>(`/api/users/${userId}`, { method: 'DELETE' });
}

export async function getRoles(): Promise<string[]> {
  return request<string[]>('/api/roles');
}

// ============================================================
// REVIEW REQUESTS
// ============================================================

export async function getReviewRequests(): Promise<ReviewRequest[]> {
  return request<ReviewRequest[]>('/api/review-requests');
}

export async function createReviewRequest(data: {
  application_id: number;
  type: string;
  notes?: string;
}): Promise<ReviewRequest> {
  return request<ReviewRequest>('/api/review-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reviewReviewRequest(
  id: number,
  data: { status: string; review_notes?: string },
): Promise<ReviewRequest> {
  return request<ReviewRequest>(`/api/review-requests/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============================================================
// REPORTS
// ============================================================

export async function getMentorLoadReport(): Promise<any[]> {
  return request<any[]>('/api/reports/mentor-load');
}

// ============================================================
// SCHOLARSHIP REQUESTS
// ============================================================

export async function createScholarshipRequest(data: {
  application_id: number;
  scholarship_id: number;
}): Promise<ScholarshipRequest> {
  return request<ScholarshipRequest>('/api/scholarship-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ====================================================================
// Legacy API stubs — backward compatibility for unmigrated pages
// These return empty arrays so old pages render without crashing.
// They will be REMOVED when each page is migrated.
// ====================================================================

// old BASE_URL export (some pages may reference it)
export const BASE_URL = '/api';

// Categories → will map to Scholarships in Phase 1
export const getCategories = async (): Promise<CategoryResponse[]> => {
  console.warn('[apiService] getCategories() is deprecated — use getScholarships()');
  try {
    const scholarships = await getScholarships();
    return scholarships.map((s) => ({ id: s.id, name: s.name, description: s.description || '' }));
  } catch {
    return [];
  }
};
export const getCategoryById = async (id: number): Promise<CategoryResponse> => {
  const s = await getScholarship(id);
  return { id: s.id, name: s.name, description: s.description || '' };
};
export const createCategory = async (data: CategoryRequest): Promise<CategoryResponse> => {
  console.warn('[apiService] createCategory() is deprecated');
  return { id: 0, name: data.name, description: data.description || '' };
};
export const updateCategory = async (id: number, data: CategoryRequest): Promise<CategoryResponse> => {
  console.warn('[apiService] updateCategory() is deprecated');
  return { id, name: data.name, description: data.description || '' };
};
export const deleteCategory = async (_id: number): Promise<null> => {
  console.warn('[apiService] deleteCategory() is deprecated');
  return null;
};

// Cases → will map to Applications in Phase 2
export const getCases = async (): Promise<CaseResponse[]> => {
  console.warn('[apiService] getCases() is deprecated — use getApplications()');
  try {
    const res = await getApplications();
    return res.data.map((a) => ({
      id: a.id,
      caseName: `Application #${a.id}`,
      caseDescription: a.notes || '',
      status: a.status,
      courtName: a.student?.name || '',
      location: '',
      categoryId: 0,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));
  } catch {
    return [];
  }
};
export const getCaseById = async (id: number): Promise<CaseResponse> => {
  const a = await getApplication(id);
  return {
    id: a.id,
    caseName: `Application #${a.id}`,
    caseDescription: a.notes || '',
    status: a.status,
    courtName: a.student?.name || '',
    location: '',
    categoryId: 0,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
};
export const createCase = async (_data: CaseRequest): Promise<CaseResponse> => {
  console.warn('[apiService] createCase() is deprecated — use createApplication()');
  throw new Error('Not implemented — use createApplication()');
};
export const updateCase = async (_id: number, _data: CaseRequest): Promise<CaseResponse> => {
  console.warn('[apiService] updateCase() is deprecated — use updateApplication()');
  throw new Error('Not implemented — use updateApplication()');
};
export const deleteCase = async (_id: number): Promise<null> => {
  console.warn('[apiService] deleteCase() is deprecated');
  return null;
};

// Persons → empty stub (Phase 2 migration)
export const getPersons = async (): Promise<PersonResponse[]> => {
  console.warn('[apiService] getPersons() is deprecated — use student/mentor APIs');
  return [];
};
export const getPersonById = async (_id: number): Promise<PersonResponse> => {
  console.warn('[apiService] getPersonById() is deprecated');
  return { id: 0, name: '', role: '', contactInfo: '' };
};
export const createPerson = async (_data: PersonRequest): Promise<PersonResponse> => {
  console.warn('[apiService] createPerson() is deprecated');
  throw new Error('Not implemented');
};
export const updatePerson = async (_id: number, _data: PersonRequest): Promise<PersonResponse> => {
  console.warn('[apiService] updatePerson() is deprecated');
  throw new Error('Not implemented');
};
export const deletePerson = async (_id: number): Promise<null> => {
  console.warn('[apiService] deletePerson() is deprecated');
  return null;
};

// Case Tags — not used in Laravel BE
export const getCaseTags = async (): Promise<CaseTagResponse[]> => [];
export const createCaseTag = async (_data: CaseTagRequest): Promise<CaseTagResponse> => ({ id: 0, tagName: '' });
export const updateCaseTag = async (_id: number, _data: CaseTagRequest): Promise<CaseTagResponse> => ({ id: 0, tagName: '' });
export const deleteCaseTag = async (_id: number): Promise<null> => null;

// Case Files → will map to ApplicationDocuments in Phase 3
export const getCaseFiles = async (): Promise<CaseFileResponse[]> => {
  console.warn('[apiService] getCaseFiles() is deprecated — use getApplicationDocuments()');
  return [];
};
export const createCaseFile = async (_data: FormData): Promise<CaseFileResponse> => {
  console.warn('[apiService] createCaseFile() is deprecated');
  throw new Error('Not implemented — use uploadDocument()');
};
export const updateCaseFile = async (_id: number, _data: Partial<CaseFileRequest>): Promise<CaseFileResponse> => {
  console.warn('[apiService] updateCaseFile() is deprecated');
  throw new Error('Not implemented');
};
export const deleteCaseFile = async (_id: number): Promise<null> => null;

// Audit Logs — stub
export const getAuditLogs = async (): Promise<AuditLogResponse[]> => [];
export const createAuditLog = async (_data: AuditLogRequest): Promise<AuditLogResponse> => {
  throw new Error('Not implemented');
};

// Questions — stub (Phase 4)
export const createQuestion = async (_data: QuestionRequest): Promise<QuestionResponse> => {
  console.warn('[apiService] createQuestion() is deprecated — Phase 4 will add new Q&A');
  throw new Error('Not implemented — Q&A will be added in Phase 4');
};
export const answerQuestion = async (_id: number, _answer: string): Promise<QuestionResponse> => {
  throw new Error('Not implemented — Phase 4');
};
export const getAllQuestions = async (): Promise<QuestionResponse[]> => [];
export const getQuestionsByUser = async (_userId: number): Promise<QuestionResponse[]> => [];

// Case Persons — not used in Laravel BE
export const getCasePersons = async (): Promise<CasePersonResponse[]> => [];
export const createCasePerson = async (_data: CasePersonRequest): Promise<CasePersonResponse> => {
  throw new Error('Not implemented');
};
export const deleteCasePerson = async (_caseId: number, _personId: number): Promise<null> => null;

// Appointments — stub (Phase 4)
export const createAppointment = async (_data: AppointmentRequest): Promise<AppointmentResponse> => {
  console.warn('[apiService] createAppointment() is deprecated — Phase 4 will add new appointments');
  throw new Error('Not implemented — Appointments will be added in Phase 4');
};
export const getAllAppointments = async (): Promise<AppointmentResponse[]> => [];
export const updateAppointmentStatus = async (_id: number, _status: string): Promise<AppointmentResponse> => {
  throw new Error('Not implemented — Phase 4');
};

// Legacy auth stubs (old signatures, for pages that haven't updated)
export const sendVerificationCode = async (data: SendVerificationCodeRequest): Promise<string> => {
  return registerRequestCode({ email: data.email, name: '' });
};
export const sendPasswordResetCode = async (data: ForgotPwReq): Promise<string> => {
  return forgotPasswordRequest(data);
};
export const resetPassword = async (data: ResetPwReq): Promise<string> => {
  return forgotPasswordReset(data);
};
export const register = async (data: any): Promise<string> => {
  await registerUser({
    email: data.email,
    name: data.username || data.name || '',
    verification_code: data.verificationCode || data.verification_code || '',
    password: data.password,
  });
  return 'Registration successful';
};
