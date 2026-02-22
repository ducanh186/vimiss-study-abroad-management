import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/apiService';
import type { Application, ApplicationStatus, PaginatedResponse } from '../types';
import { Card, Spinner, Button } from '../components/ui';

// ── Status display helpers ──────────────────────────────────────

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

// ── Queue tabs based on role ────────────────────────────────────

type QueueTab = 'step1' | 'step2';

const ApprovalsQueuePage: React.FC = () => {
  const { user, isAdmin, isDirector } = useAuth();
  const isReviewer = user?.role === 'reviewer';

  // Reviewer can only see step1; director/admin see both
  const canSeeStep1 = isReviewer || isDirector || isAdmin;
  const canSeeStep2 = isDirector || isAdmin;

  const [tab, setTab] = useState<QueueTab>(canSeeStep2 ? 'step2' : 'step1');
  const [data, setData] = useState<PaginatedResponse<Application> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Quick-action state
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const statusForTab = tab === 'step1' ? 'review_step_1' : 'review_step_2';

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getApplications({
        status: statusForTab,
        page,
        per_page: 20,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách chờ duyệt.');
    } finally {
      setLoading(false);
    }
  }, [statusForTab, page]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  // ── Quick approval/reject actions ─────────────────────────────

  const handleApprove = async (appId: number) => {
    setActionLoading(appId);
    try {
      if (tab === 'step1') {
        await api.approveStep1(appId);
      } else {
        await api.approveStep2(appId);
      }
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Thao tác thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appId: number) => {
    const notes = prompt('Lý do từ chối (tùy chọn):');
    if (notes === null) return; // cancelled
    setActionLoading(appId);
    try {
      if (tab === 'step1') {
        await api.rejectStep1(appId, notes || undefined);
      } else {
        await api.rejectStep2(appId, notes || undefined);
      }
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Thao tác thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary dark:text-slate-100">Hàng đợi phê duyệt</h1>
        <p className="text-sm text-secondary dark:text-slate-400 mt-1">
          Hồ sơ cần bạn xem xét và phê duyệt
        </p>
      </div>

      {/* Tab Switcher */}
      {canSeeStep1 && canSeeStep2 && (
        <div className="border-b border-border dark:border-slate-700">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setTab('step1')}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                tab === 'step1'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-slate-100'
              }`}
            >
              Bước 1 — Reviewer
            </button>
            <button
              onClick={() => setTab('step2')}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                tab === 'step2'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-slate-100'
              }`}
            >
              Bước 2 — Giám đốc
            </button>
          </nav>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Queue Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : data && data.data.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-700 text-left text-secondary dark:text-slate-400">
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Sinh viên</th>
                  <th className="px-4 py-3 font-semibold">Cố vấn</th>
                  <th className="px-4 py-3 font-semibold">Loại</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-slate-700">
                {data.data.map((app) => (
                  <tr key={app.id} className="hover:bg-background dark:hover:bg-slate-700/50 transition">
                    <td className="px-4 py-3 font-mono text-xs">#{app.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-primary dark:text-slate-100">{app.student?.name ?? '—'}</p>
                      <p className="text-xs text-secondary dark:text-slate-400">{app.student?.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-secondary dark:text-slate-400">{app.mentor?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {app.application_type?.replace(/_/g, ' ') ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary dark:text-slate-400 text-xs">
                      {new Date(app.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/app/applications/${app.id}`}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border dark:border-slate-700 text-secondary dark:text-slate-400 hover:bg-background dark:hover:bg-slate-700 transition"
                        >
                          Chi tiết
                        </Link>
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={actionLoading === app.id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          {actionLoading === app.id ? '…' : 'Duyệt'}
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={actionLoading === app.id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          {actionLoading === app.id ? '…' : 'Từ chối'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border dark:border-slate-700">
              <p className="text-xs text-secondary dark:text-slate-400">
                Trang {data.current_page} / {data.last_page} — {data.total} kết quả
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.current_page <= 1}
                  className="px-3 py-1 rounded-lg text-sm border border-border dark:border-slate-700 text-secondary dark:text-slate-400 hover:bg-background dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
                  disabled={data.current_page >= data.last_page}
                  className="px-3 py-1 rounded-lg text-sm border border-border dark:border-slate-700 text-secondary dark:text-slate-400 hover:bg-background dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <div className="space-y-2">
            <p className="text-4xl">✅</p>
            <p className="text-primary dark:text-slate-100 font-medium">Không có hồ sơ nào cần duyệt</p>
            <p className="text-sm text-secondary dark:text-slate-400">Hàng đợi {tab === 'step1' ? 'Bước 1' : 'Bước 2'} đang trống.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ApprovalsQueuePage;
