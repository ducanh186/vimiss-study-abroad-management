

// ====================================================================
// Vimiss Study Abroad Management — TypeScript Types
// Backend: Laravel + Sanctum (session-based auth)
// Roles: admin | director | mentor | student
// ====================================================================

// ====== Roles ======
export type UserRole = 'admin' | 'director' | 'reviewer' | 'mentor' | 'student';

// ====== Core: User ======
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  must_change_password: boolean;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ====== Auth ======
export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterCodeRequest {
  email: string;
  name: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  verification_code: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  verification_code: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

// ====== Applications ======
export type ApplicationStatus =
  | 'draft'
  | 'collecting_docs'
  | 'ready_for_review'
  | 'review_step_1'
  | 'review_step_2'
  | 'approved'
  | 'submitted'
  | 'interview'
  | 'admitted'
  | 'rejected'
  | 'deferred'
  | 'cancelled';

export type ApplicationType = 'master' | 'engineer' | 'bachelor' | 'undergraduate' | 'language' | 'other';

export interface Application {
  id: number;
  student_id: number;
  mentor_id: number | null;
  created_by: number;
  status: ApplicationStatus;
  application_type: ApplicationType;
  scholarship_type: ScholarshipType | null;
  university_id: number | null;
  major: string | null;
  intake_term: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  student?: User;
  mentor?: User;
  creator?: User;
  university?: University;
  documents?: ApplicationDocument[];
  histories?: ApplicationHistory[];
  scholarship_requests?: ScholarshipRequest[];
}

// ====== Approvals ======
export type ApprovalAction = 'approved' | 'rejected';

export interface Approval {
  id: number;
  application_id: number;
  actor_id: number;
  step: 1 | 2;
  action: ApprovalAction;
  notes: string | null;
  created_at: string;
  updated_at: string;
  actor?: User;
}

// ====== Application History ======
export interface ApplicationHistory {
  id: number;
  application_id: number;
  changed_by: number;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  notes: string | null;
  created_at: string;
  changer?: User;
}

// ====== Application Documents ======
export type DocumentType =
  | 'passport'
  | 'transcript'
  | 'hsk_cert'
  | 'hskk_cert'
  | 'recommendation'
  | 'personal_statement'
  | 'medical_report'
  | 'photo'
  | 'other';

export type LabelStatus = 'pending_review' | 'valid' | 'need_more' | 'translating' | 'submitted' | 'rejected';

export interface ApplicationDocument {
  id: number;
  application_id: number;
  uploaded_by: number;
  file_path: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  type: DocumentType;
  label_status: LabelStatus;
  notes: string | null;
  storage: 'local' | 'drive';
  drive_file_id: string | null;
  drive_folder_id: string | null;
  checksum: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  uploader?: User;
}

// ====== Scholarships ======
export type ScholarshipType = 'CSC' | 'CIS' | 'province' | 'university' | 'self_funded' | 'other';

export interface Scholarship {
  id: number;
  university_id: number;
  name: string;
  type: ScholarshipType;
  min_hsk_level: number | null;
  min_gpa: number | null;
  deadline: string | null;
  quota: number | null;
  used_quota: number;
  requirements: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  university?: University;
}

// ====== Universities ======
export interface University {
  id: number;
  name: string;
  country: string;
  city: string | null;
  ranking: number | null;
  programs: string[] | null;
  description: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  scholarships?: Scholarship[];
}

// ====== Student Profile ======
export interface StudentProfile {
  id: number;
  user_id: number;
  phone: string | null;
  date_of_birth: string | null;
  passport_status: string | null;
  gpa: number | null;
  hsk_level: number | null;
  hskk_level: number | null;
  desired_scholarship_type: ScholarshipType | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

// ====== Mentor Profile ======
export interface MentorProfile {
  id: number;
  user_id: number;
  staff_code: string | null;
  capacity_max: number;
  specialty: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

// ====== Notifications ======
export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  data: { title: string; body: string } | Record<string, any>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// ====== Calendar Events ======
export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  type: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// ====== Review Requests ======
export type ReviewRequestStatus = 'pending' | 'approved' | 'rejected';
export type ReviewRequestType = 'document_review' | 'application_review' | 'scholarship_approval';

export interface ReviewRequest {
  id: number;
  application_id: number;
  requested_by: number;
  reviewed_by: number | null;
  type: ReviewRequestType;
  status: ReviewRequestStatus;
  notes: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ====== Scholarship Request ======
export interface ScholarshipRequest {
  id: number;
  application_id: number;
  scholarship_id: number;
  status: string;
  applied_at: string;
  created_at: string;
  updated_at: string;
}

// ====== API Error ======
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  errorCode?: string;

  constructor(message: string, status: number, errors?: Record<string, string[]>, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.errorCode = errorCode;
  }
}

// ====== Paginated Response (Laravel) ======
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// ====================================================================
// Legacy types — backward compatibility for unmigrated pages
// These will be REMOVED after each page is migrated (Phase 1–6).
// ====================================================================

/** @deprecated Old Java BE wrapper — Laravel returns data directly */
export interface APIResponse<T> {
  status: 'SUCCESS' | 'FAILURE' | string;
  result: T;
  errors?: ErrorDetail[];
}

/** @deprecated */
export interface ErrorDetail {
  field: string;
  errorMessage: string;
  timestamp: string;
}

/** @deprecated Use AuthRequest */
export interface AuthResponse extends User {
  token?: string;
}

/** @deprecated Use User */
export interface UserResponse {
  id: number;
  username?: string;
  name: string;
  email: string;
  role: string;
}

/** @deprecated Use RegisterCodeRequest */
export interface SendVerificationCodeRequest {
  email: string;
}

/** @deprecated JWT token — not used with Sanctum */
export interface DecodedToken {
  sub: string;
  roles: string[];
  iat: number;
  exp: number;
}

/** @deprecated */
export interface CategoryRequest { name: string; description?: string; }
/** @deprecated Use Scholarship */
export interface CategoryResponse { id: number; name: string; description: string; }

/** @deprecated Use Application */
export interface CaseRequest { caseName: string; caseDescription?: string; status?: string; courtName?: string; location?: string; categoryId?: number; }
/** @deprecated Use Application */
export interface CaseResponse { id: number; caseName: string; caseDescription: string; status: string; courtName: string; location: string; categoryId: number; createdAt: string; updatedAt: string; }

/** @deprecated Use StudentProfile / MentorProfile */
export interface PersonRequest { name: string; role: string; contactInfo?: string; }
/** @deprecated Use StudentProfile / MentorProfile */
export interface PersonResponse { id: number; name: string; role: string; contactInfo: string; }

/** @deprecated */
export interface CaseTagRequest { tagName: string; }
/** @deprecated */
export interface CaseTagResponse { id: number; tagName: string; }

/** @deprecated Use ApplicationDocument */
export interface CaseFileRequest { caseId: number; fileName: string; filePath: string; fileType: string; uploadedBy?: number; }
/** @deprecated Use ApplicationDocument */
export interface CaseFileResponse { id: number; caseId: number; fileName: string; filePath: string; fileType: string; uploadedBy: number; }

/** @deprecated */
export interface AuditLogRequest { userId: number; action: string; caseId?: number; fileId?: number; }
/** @deprecated */
export interface AuditLogResponse { id: number; userId: number; action: string; caseId: number | null; fileId: number | null; createdAt: string; }

/** @deprecated Will be replaced with new Q&A types in Phase 4 */
export interface QuestionRequest { idQuestioner: number; idLawyerPerson: number; caseId?: number | null; content: string; }
/** @deprecated Will be replaced with new Q&A types in Phase 4 */
export interface QuestionResponse { id: number; content: string; answer: string | null; questionerId: number; questionerName: string; lawyerId: number; lawyerName: string; lawyerEmail: string; caseName: string | null; createdAt: string; updatedAt: string; }

/** @deprecated */
export interface CasePersonRequest { caseId: number; personId: number; }
/** @deprecated */
export interface CasePersonResponse { caseId: number; personId: number; }

/** @deprecated Will be replaced with new Appointment types in Phase 4 */
export interface AppointmentRequest { userId: number; lawyerId: number; appointmentTime: string; notes?: string; }
/** @deprecated Will be replaced with new Appointment types in Phase 4 */
export interface AppointmentResponse { id: number; userName: string; lawyerName: string; lawyerRole: string; lawyerEmail: string; appointmentTime: string; notes: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED'; }