import React, { useState, useEffect } from 'react';
import { reviewApi } from '../services/api';

// ============================================================================
// Approvals Page (admin/director review queue)
// ============================================================================
export const ApprovalsPage = ({ AdminLayout, useAuth, useToast, useI18n }) => {
    const { user } = useAuth();
    const toast = useToast();
    const { t } = useI18n();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter) params.status = filter;
            const data = await reviewApi.list(params);
            setReviews(data.reviews || []);
        } catch (err) {
            toast?.error(t('approval.failedLoad'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, [filter]);

    const handleDecision = async (id, status, notes = '') => {
        try {
            await reviewApi.review(id, { status, notes });
            toast?.success(t('approval.requestStatus', { status }));
            fetchReviews();
        } catch (err) {
            toast?.error(err.response?.data?.message || t('approval.failedProcess'));
        }
    };

    const statusColors = {
        pending: 'badge-warning',
        approved: 'badge-success',
        rejected: 'badge-error',
    };

    return (
        <AdminLayout title={t('approval.approvals')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{t('approval.reviewQueue')}</h2>
                <select className="form-input" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="">{t('common.all')}</option>
                    <option value="pending">{t('approval.pending')}</option>
                    <option value="approved">{t('approval.approved')}</option>
                    <option value="rejected">{t('approval.rejected')}</option>
                </select>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
                    ) : reviews.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-title">{t('approval.noReviewRequests')}</div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('common.id')}</th>
                                    <th>{t('approval.application')}</th>
                                    <th>{t('common.type')}</th>
                                    <th>{t('approval.submittedBy')}</th>
                                    <th>{t('common.status')}</th>
                                    <th>{t('common.date')}</th>
                                    <th>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map(r => (
                                    <tr key={r.id}>
                                        <td>#{r.id}</td>
                                        <td>App #{r.application_id}</td>
                                        <td>{r.type}</td>
                                        <td>{r.submitter?.name || '—'}</td>
                                        <td><span className={`badge ${statusColors[r.status] || 'badge-info'}`}>{r.status}</span></td>
                                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                        <td>
                                            {r.status === 'pending' ? (
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleDecision(r.id, 'approved')}>{t('approval.approve')}</button>
                                                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                                                        onClick={() => {
                                                            const notes = window.prompt(t('approval.rejectionReason'));
                                                            if (notes !== null) handleDecision(r.id, 'rejected', notes);
                                                        }}>{t('approval.reject')}</button>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                                    {r.reviewed_by ? t('approval.reviewedBy', { name: r.reviewer?.name }) : '—'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};
