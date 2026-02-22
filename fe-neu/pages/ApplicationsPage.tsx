import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/apiService';
import type { Application, ApplicationStatus, PaginatedResponse } from '../types';
import { Card, Spinner, Select, Input, Button, PlusIcon } from '../components/ui';

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

const APP_TYPE_LABELS: Record<string, string> = {
  master: 'Thạc sĩ',
  engineer: 'Kỹ sư',
  bachelor: 'Cử nhân',
  undergraduate: 'Đại học',
  language: 'Ngôn ngữ',
  other: 'Khác',
};

// ── Component ───────────────────────────────────────────────────

const ApplicationsPage: React.FC = () => {
  const { user, isAdmin, isDirector, isMentor } = useAuth();
  const [data, setData] = useState<PaginatedResponse<Application> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const canCreate = isAdmin || isMentor;

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getApplications({
        status: statusFilter || undefined,
        application_type: typeFilter || undefined,
        page,
        per_page: 15,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, page]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-slate-100">Hồ sơ du học</h1>
          <p className="text-sm text-secondary dark:text-slate-400 mt-1">
            {data ? `${data.total} hồ sơ` : 'Đang tải…'}
          </p>
        </div>
        {canCreate && (
          <Link to="/app/applications/new">
            <Button>
              <PlusIcon /> Tạo hồ sơ
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-secondary dark:text-slate-400 mb-1">Trạng thái</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Tất cả</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary dark:text-slate-400 mb-1">Loại hồ sơ</label>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Tất cả</option>
              {Object.entries(APP_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
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
                  {(isAdmin || isDirector) && <th className="px-4 py-3 font-semibold">Cố vấn</th>}
                  <th className="px-4 py-3 font-semibold">Loại</th>
                  <th className="px-4 py-3 font-semibold">Trường</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-4 py-3 font-semibold"></th>
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
                    {(isAdmin || isDirector) && (
                      <td className="px-4 py-3 text-secondary dark:text-slate-400">{app.mentor?.name ?? '—'}</td>
                    )}
                    <td className="px-4 py-3">
                      {APP_TYPE_LABELS[app.application_type] ?? app.application_type}
                    </td>
                    <td className="px-4 py-3 text-secondary dark:text-slate-400">
                      {app.university?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] ?? ''}`}>
                        {STATUS_LABELS[app.status] ?? app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary dark:text-slate-400 text-xs">
                      {new Date(app.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/app/applications/${app.id}`}
                        className="text-accent hover:text-accent-hover font-medium text-sm"
                      >
                        Chi tiết
                      </Link>
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
          <p className="text-secondary dark:text-slate-400">Không có hồ sơ nào.</p>
        </Card>
      )}
    </div>
  );
};

export default ApplicationsPage;
