import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/apiService';
import type { Application, ApplicationStatus, ApplicationHistory } from '../types';
import { Card, Spinner, Button } from '../components/ui';
import DocumentsPanel from '../components/DocumentsPanel';

// ── Status display helpers (shared with ApplicationsPage) ──────

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Nháp',
  collecting_docs: 'Thu thập hồ sơ',
  ready_for_review: 'Sẵn sàng duyệt',
  review_step_1: 'Đang duyệt B1',
  review_step_2: 'Đang duyệt B2',
  approved: 'Đã duyệt',
  submitted: 'Đã nộp trường',
  interview: 'Phỏng vấn',
  admitted: 'Trúng tuyển',
  rejected: 'Từ chối',
  deferred: 'Hoãn',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
  collecting_docs: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  ready_for_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  review_step_1: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  review_step_2: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  submitted: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  interview: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  admitted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  deferred: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  cancelled: 'bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-slate-300',
};

const APP_TYPE_LABELS: Record<string, string> = {
  master: 'Thạc sĩ',
  engineer: 'Kỹ sư',
  bachelor: 'Cử nhân',
  undergraduate: 'Đại học',
  language: 'Ngôn ngữ',
  other: 'Khác',
};

type Tab = 'overview' | 'documents' | 'approvals';

const ApplicationDetailPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const appId = Number(applicationId);
  const navigate = useNavigate();
  const { user, isAdmin, isDirector, isMentor, isStudent } = useAuth();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Approval action state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isReviewer = user?.role === 'reviewer';

  const loadApplication = useCallback(async () => {
    if (!appId || isNaN(appId)) return;
    setLoading(true);
    setError(null);
    try {
      const application = await api.getApplication(appId);
      setApp(application);
    } catch (err: any) {
      setError(err.message || 'Không thể tải hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  // ── Approval actions ──────────────────────────────────────────

  const doAction = async (actionFn: (id: number, notes?: string) => Promise<Application>, successMsg: string) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await actionFn(appId, actionNotes || undefined);
      setApp(updated);
      setActionNotes('');
      setActionSuccess(successMsg);
      // Reload to get fresh histories
      setTimeout(() => loadApplication(), 500);
    } catch (err: any) {
      setActionError(err.message || 'Thao tác thất bại.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Permission checks ─────────────────────────────────────────

  const canSubmitForReview = (isAdmin || (isMentor && app?.mentor_id === user?.id)) && app?.status === 'ready_for_review';
  const canApproveStep1 = (isReviewer || isDirector || isAdmin) && app?.status === 'review_step_1';
  const canApproveStep2 = (isDirector || isAdmin) && app?.status === 'review_step_2';

  // ── Render ────────────────────────────────────────────────────

  if (!appId || isNaN(appId)) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        ID hồ sơ không hợp lệ.
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-3">{error}</div>
        <Link to="/app/applications" className="text-accent hover:text-accent-hover font-medium text-sm">← Quay lại danh sách</Link>
      </div>
    );
  }

  if (!app) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'documents', label: 'Tài liệu' },
    { key: 'approvals', label: 'Phê duyệt' },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <Link to="/app/applications" className="text-accent hover:text-accent-hover text-sm font-medium">← Danh sách hồ sơ</Link>
        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-2xl font-bold text-primary dark:text-slate-100">Hồ sơ #{app.id}</h1>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[app.status]}`}>
            {STATUS_LABELS[app.status]}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border dark:border-slate-700">
        <nav className="-mb-px flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === t.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab app={app} />}
      {activeTab === 'documents' && <DocumentsPanel applicationId={appId} showUpload={!isStudent || app.status === 'collecting_docs'} />}
      {activeTab === 'approvals' && (
        <ApprovalsTab
          app={app}
          canSubmitForReview={canSubmitForReview}
          canApproveStep1={canApproveStep1}
          canApproveStep2={canApproveStep2}
          actionLoading={actionLoading}
          actionNotes={actionNotes}
          actionError={actionError}
          actionSuccess={actionSuccess}
          setActionNotes={setActionNotes}
          doAction={doAction}
        />
      )}
    </div>
  );
};

// ── Overview Tab ────────────────────────────────────────────────

const OverviewTab: React.FC<{ app: Application }> = ({ app }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Details Card */}
    <Card className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-primary dark:text-slate-100">Thông tin hồ sơ</h2>
      <dl className="space-y-3 text-sm">
        <InfoRow label="Loại hồ sơ" value={APP_TYPE_LABELS[app.application_type] ?? app.application_type} />
        <InfoRow label="Học bổng" value={app.scholarship_type ?? '—'} />
        <InfoRow label="Trường" value={app.university?.name ?? '—'} />
        <InfoRow label="Chuyên ngành" value={app.major ?? '—'} />
        <InfoRow label="Đợt nhập học" value={app.intake_term ?? '—'} />
        <InfoRow label="Ghi chú" value={app.notes ?? '—'} />
      </dl>
    </Card>

    {/* People Card */}
    <Card className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-primary dark:text-slate-100">Thành viên</h2>
      <dl className="space-y-3 text-sm">
        <InfoRow label="Sinh viên" value={app.student ? `${app.student.name} (${app.student.email})` : '—'} />
        <InfoRow label="Cố vấn" value={app.mentor ? `${app.mentor.name} (${app.mentor.email})` : '—'} />
        <InfoRow label="Ngày tạo" value={new Date(app.created_at).toLocaleString('vi-VN')} />
        <InfoRow label="Cập nhật" value={new Date(app.updated_at).toLocaleString('vi-VN')} />
      </dl>
    </Card>

    {/* History */}
    {app.histories && app.histories.length > 0 && (
      <Card className="p-6 lg:col-span-2">
        <h2 className="text-lg font-semibold text-primary dark:text-slate-100 mb-4">Lịch sử thay đổi</h2>
        <div className="space-y-3">
          {app.histories.map((h) => (
            <HistoryItem key={h.id} history={h} />
          ))}
        </div>
      </Card>
    )}
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-secondary dark:text-slate-400 flex-shrink-0">{label}</dt>
    <dd className="text-primary dark:text-slate-100 text-right font-medium">{value}</dd>
  </div>
);

const HistoryItem: React.FC<{ history: ApplicationHistory }> = ({ history }) => (
  <div className="flex items-start gap-3 text-sm border-l-2 border-accent/30 pl-4 py-1">
    <div className="flex-1">
      <p className="text-primary dark:text-slate-100">
        <span className="font-medium">{history.changer?.name ?? `User #${history.changed_by}`}</span>
        {' '}thay đổi <span className="font-mono text-xs bg-background dark:bg-slate-700 px-1 py-0.5 rounded">{history.field_changed}</span>
      </p>
      {history.old_value && (
        <p className="text-xs text-secondary dark:text-slate-400">
          {history.old_value} → {history.new_value}
        </p>
      )}
      {history.notes && (
        <p className="text-xs text-secondary dark:text-slate-400 italic mt-0.5">{history.notes}</p>
      )}
    </div>
    <span className="text-xs text-secondary dark:text-slate-500 whitespace-nowrap">
      {new Date(history.created_at).toLocaleString('vi-VN')}
    </span>
  </div>
);

// ── Approvals Tab ───────────────────────────────────────────────

interface ApprovalsTabProps {
  app: Application;
  canSubmitForReview: boolean;
  canApproveStep1: boolean;
  canApproveStep2: boolean;
  actionLoading: boolean;
  actionNotes: string;
  actionError: string | null;
  actionSuccess: string | null;
  setActionNotes: (v: string) => void;
  doAction: (fn: (id: number, notes?: string) => Promise<Application>, msg: string) => void;
}

const ApprovalsTab: React.FC<ApprovalsTabProps> = ({
  app,
  canSubmitForReview,
  canApproveStep1,
  canApproveStep2,
  actionLoading,
  actionNotes,
  actionError,
  actionSuccess,
  setActionNotes,
  doAction,
}) => {
  const hasActions = canSubmitForReview || canApproveStep1 || canApproveStep2;

  return (
    <div className="space-y-6">
      {/* Status pipeline visualization */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-primary dark:text-slate-100 mb-4">Tiến trình phê duyệt</h2>
        <StatusPipeline currentStatus={app.status} />
      </Card>

      {/* Action Panel */}
      {hasActions && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-primary dark:text-slate-100">Thao tác</h2>

          <div>
            <label className="block text-sm font-medium text-secondary dark:text-slate-400 mb-1">Ghi chú</label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Ghi chú (tùy chọn)"
              rows={2}
              className="w-full rounded-lg border border-border dark:border-slate-700 bg-surface dark:bg-slate-800 text-primary dark:text-slate-100 p-3 text-sm focus:border-accent focus:ring-accent"
            />
          </div>

          {actionError && (
            <div className="text-red-600 dark:text-red-400 text-sm">{actionError}</div>
          )}
          {actionSuccess && (
            <div className="text-green-600 dark:text-green-400 text-sm">{actionSuccess}</div>
          )}

          <div className="flex flex-wrap gap-3">
            {canSubmitForReview && (
              <Button
                disabled={actionLoading}
                onClick={() => doAction(api.submitForReview, 'Đã gửi duyệt Bước 1.')}
              >
                {actionLoading ? 'Đang xử lý…' : 'Gửi duyệt (B1)'}
              </Button>
            )}

            {canApproveStep1 && (
              <>
                <Button
                  disabled={actionLoading}
                  onClick={() => doAction(api.approveStep1, 'Bước 1 đã duyệt.')}
                >
                  {actionLoading ? 'Đang xử lý…' : 'Duyệt B1'}
                </Button>
                <Button
                  variant="danger"
                  disabled={actionLoading}
                  onClick={() => doAction(api.rejectStep1, 'Bước 1 đã từ chối.')}
                >
                  {actionLoading ? 'Đang xử lý…' : 'Từ chối B1'}
                </Button>
              </>
            )}

            {canApproveStep2 && (
              <>
                <Button
                  disabled={actionLoading}
                  onClick={() => doAction(api.approveStep2, 'Bước 2 đã duyệt.')}
                >
                  {actionLoading ? 'Đang xử lý…' : 'Duyệt B2'}
                </Button>
                <Button
                  variant="danger"
                  disabled={actionLoading}
                  onClick={() => doAction(api.rejectStep2, 'Bước 2 đã từ chối.')}
                >
                  {actionLoading ? 'Đang xử lý…' : 'Từ chối B2'}
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Approval history from application histories */}
      {app.histories && app.histories.filter(h => h.field_changed === 'status').length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-primary dark:text-slate-100 mb-4">Lịch sử phê duyệt</h2>
          <div className="space-y-3">
            {app.histories
              .filter((h) => h.field_changed === 'status')
              .map((h) => (
                <HistoryItem key={h.id} history={h} />
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ── Status Pipeline Visualization ───────────────────────────────

const PIPELINE_STEPS: { status: ApplicationStatus; label: string }[] = [
  { status: 'draft', label: 'Nháp' },
  { status: 'collecting_docs', label: 'Thu thập' },
  { status: 'ready_for_review', label: 'Sẵn sàng' },
  { status: 'review_step_1', label: 'Duyệt B1' },
  { status: 'review_step_2', label: 'Duyệt B2' },
  { status: 'approved', label: 'Đã duyệt' },
  { status: 'submitted', label: 'Đã nộp' },
  { status: 'admitted', label: 'Trúng tuyển' },
];

const StatusPipeline: React.FC<{ currentStatus: ApplicationStatus }> = ({ currentStatus }) => {
  const statusIndex = PIPELINE_STEPS.findIndex((s) => s.status === currentStatus);
  // For terminal/special statuses not on the main pipeline
  const isSpecialStatus = statusIndex === -1;

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {PIPELINE_STEPS.map((step, i) => {
          const isActive = step.status === currentStatus;
          const isPast = !isSpecialStatus && i < statusIndex;
          return (
            <React.Fragment key={step.status}>
              {i > 0 && (
                <div className={`flex-shrink-0 w-6 h-0.5 ${isPast ? 'bg-accent' : 'bg-border dark:bg-slate-700'}`} />
              )}
              <div
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  isActive
                    ? 'bg-accent text-white shadow-sm'
                    : isPast
                    ? 'bg-accent/20 text-accent dark:bg-accent/30'
                    : 'bg-background dark:bg-slate-700 text-secondary dark:text-slate-400'
                }`}
              >
                {step.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {isSpecialStatus && (
        <p className="mt-2 text-sm">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[currentStatus]}`}>
            {STATUS_LABELS[currentStatus]}
          </span>
        </p>
      )}
    </div>
  );
};

export default ApplicationDetailPage;
