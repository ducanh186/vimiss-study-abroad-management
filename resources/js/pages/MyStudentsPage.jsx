import React, { useState, useEffect } from 'react';
import { mentorApi, applicationApi } from '../services/api';

// ============================================================================
// Mentor: My Students Page
// ============================================================================
export const MyStudentsPage = ({ AdminLayout, useAuth, useToast, useI18n, navigate }) => {
    const { user } = useAuth();
    const toast = useToast();
    const { t } = useI18n();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await mentorApi.myStudents();
                setStudents(data.students || []);
            } catch (err) {
                toast?.error(t('mentor.failedLoadStudents'));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleCreateApp = async (studentId) => {
        try {
            const data = await applicationApi.create({ student_id: studentId });
            toast?.success(t('application.applicationCreated'));
            navigate?.(`/my-applications`);
        } catch (err) {
            toast?.error(err.response?.data?.message || t('application.failedCreateApp'));
        }
    };

    return (
        <AdminLayout title={t('mentor.myStudents')}>
            <div className="card">
                <div className="card-header">
                    <span className="card-title">{t('mentor.assignedStudents')}</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
                    ) : students.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">👩‍🎓</div><div className="empty-state-title">{t('mentor.noStudentsAssigned')}</div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('common.name')}</th>
                                    <th>{t('common.email')}</th>
                                    <th>{t('mentor.scholarshipType')}</th>
                                    <th>{t('mentor.gpa')}</th>
                                    <th>{t('mentor.hsk')}</th>
                                    <th>{t('mentor.assignedAt')}</th>
                                    <th>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(a => (
                                    <tr key={a.id}>
                                        <td className="font-medium">{a.student?.name}</td>
                                        <td>{a.student?.email}</td>
                                        <td><span className="badge badge-info">{a.student?.student_profile?.desired_scholarship_type || '—'}</span></td>
                                        <td>{a.student?.student_profile?.gpa || '—'}</td>
                                        <td>{a.student?.student_profile?.hsk_level || '—'}</td>
                                        <td>{new Date(a.assigned_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-primary btn-sm" onClick={() => handleCreateApp(a.student_id)}>
                                                {t('application.createApplication')}
                                            </button>
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
