import React, { useState, useEffect } from 'react';
import { mentorApi, applicationApi } from '../services/api';

// ============================================================================
// Mentor: My Students Page
// ============================================================================
export const MyStudentsPage = ({ AdminLayout, useAuth, useToast, useI18n, navigate }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await mentorApi.myStudents();
                setStudents(data.students || []);
            } catch (err) {
                toast?.error('Failed to load students');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleCreateApp = async (studentId) => {
        try {
            const data = await applicationApi.create({ student_id: studentId });
            toast?.success('Application created!');
            navigate?.(`/my-applications`);
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to create application');
        }
    };

    return (
        <AdminLayout title="My Students">
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Assigned Students</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
                    ) : students.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">👩‍🎓</div><div className="empty-state-title">No students assigned</div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Scholarship Type</th>
                                    <th>GPA</th>
                                    <th>HSK</th>
                                    <th>Assigned At</th>
                                    <th>Actions</th>
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
                                                + Create Application
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
