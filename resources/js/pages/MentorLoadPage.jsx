import React, { useState, useEffect } from 'react';
import { mentorApi } from '../services/api';

// ============================================================================
// Mentor Load Report Page (Director / Admin view-only)
// ============================================================================
export const MentorLoadPage = ({ AdminLayout, useAuth, useToast, useI18n }) => {
    const toast = useToast();
    const { t } = useI18n();
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLoad = async () => {
        setLoading(true);
        try {
            const data = await mentorApi.mentorLoad();
            setMentors(data.mentors || []);
        } catch (err) {
            toast?.error(t('mentor.failedLoadData'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLoad(); }, []);

    const getLoadLevel = (current, max) => {
        const ratio = current / max;
        if (ratio >= 1) return { label: t('mentor.loadFull'), color: 'badge-error' };
        if (ratio >= 0.7) return { label: t('mentor.loadHigh'), color: 'badge-warning' };
        if (ratio >= 0.4) return { label: t('mentor.loadMedium'), color: 'badge-info' };
        return { label: t('mentor.loadLow'), color: 'badge-success' };
    };

    return (
        <AdminLayout title={t('mentor.loadReport')}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>{t('mentor.loadOverview')}</h2>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
            ) : mentors.length === 0 ? (
                <div className="empty-state"><div className="empty-state-title">{t('mentor.noMentorsFound')}</div></div>
            ) : (
                <>
                    {/* Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="card"><div className="card-body" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{mentors.length}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{t('mentor.totalMentors')}</div>
                        </div></div>
                        <div className="card"><div className="card-body" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{mentors.filter(m => m.is_active).length}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{t('common.active')}</div>
                        </div></div>
                        <div className="card"><div className="card-body" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{mentors.reduce((sum, m) => sum + (m.current_student_count || 0), 0)}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{t('mentor.totalAssignedStudents')}</div>
                        </div></div>
                        <div className="card"><div className="card-body" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{mentors.reduce((sum, m) => sum + ((m.capacity_max || 5) - (m.current_student_count || 0)), 0)}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{t('mentor.availableSlotsLabel')}</div>
                        </div></div>
                    </div>

                    {/* Table */}
                    <div className="card">
                        <div className="card-body" style={{ padding: 0 }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('mentor.staffCode')}</th>
                                        <th>{t('common.name')}</th>
                                        <th>{t('mentor.specialty')}</th>
                                        <th>{t('mentor.students')}</th>
                                        <th>{t('mentor.capacity')}</th>
                                        <th>{t('mentor.load')}</th>
                                        <th>{t('common.active')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mentors.map(m => {
                                        const current = m.current_student_count || 0;
                                        const max = m.capacity_max || 5;
                                        const load = getLoadLevel(current, max);
                                        return (
                                            <tr key={m.id}>
                                                <td className="font-medium">{m.staff_code}</td>
                                                <td>{m.user?.name}</td>
                                                <td>{m.specialty || '—'}</td>
                                                <td>{current}</td>
                                                <td>{max}</td>
                                                <td>
                                                    <span className={`badge ${load.color}`}>{load.label}</span>
                                                    <div style={{ background: 'var(--color-border)', borderRadius: '4px', height: '4px', marginTop: '4px', width: '60px' }}>
                                                        <div style={{ background: load.color === 'badge-error' ? 'var(--color-error)' : load.color === 'badge-warning' ? '#f59e0b' : load.color === 'badge-success' ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: '4px', height: '100%', width: `${Math.min(100, (current / max) * 100)}%` }}></div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${m.is_active ? 'badge-success' : 'badge-error'}`}>
                                                        {m.is_active ? t('common.yes') : t('common.no')}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
};
