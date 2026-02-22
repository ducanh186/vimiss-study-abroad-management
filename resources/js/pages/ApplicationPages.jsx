import React, { useState, useEffect } from 'react';
import { applicationApi, documentApi } from '../services/api';

// ============================================================================
// Applications List Page (Student view-only, Mentor manage, Admin manage)
// ============================================================================
export const ApplicationsListPage = ({ AdminLayout, useAuth, useToast, useI18n, navigate }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchApps = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const data = await applicationApi.list(params);
            setApplications(data.data || []);
        } catch (err) {
            toast?.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchApps(); }, [statusFilter]);

    const statusColors = {
        draft: 'badge-info',
        in_progress: 'badge-info',
        documents_pending: 'badge-warning',
        documents_reviewing: 'badge-warning',
        submitted_to_university: 'badge-info',
        accepted: 'badge-success',
        rejected: 'badge-error',
        on_hold_needs_mentor: 'badge-error',
        cancelled: 'badge-error',
    };

    const isAdmin = user?.role === 'admin';
    const isMentor = user?.role === 'mentor';
    const title = (user?.role === 'student' || user?.role === 'mentor') ? 'My Applications' : 'All Applications';

    return (
        <AdminLayout title={title}>
            <div className="card">
                <div className="card-header" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="card-title">{title}</span>
                    <div style={{ marginLeft: 'auto' }}>
                        <select className="form-input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="in_progress">In Progress</option>
                            <option value="documents_pending">Documents Pending</option>
                            <option value="documents_reviewing">Documents Reviewing</option>
                            <option value="submitted_to_university">Submitted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="on_hold_needs_mentor">On Hold</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
                    ) : applications.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No applications found</div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Student</th>
                                    <th>Mentor</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map(app => (
                                    <tr key={app.id}>
                                        <td>#{app.id}</td>
                                        <td className="font-medium">{app.student?.name}</td>
                                        <td>{app.mentor?.name}</td>
                                        <td><span className={`badge ${statusColors[app.status] || 'badge-info'}`}>{app.status?.replace(/_/g, ' ')}</span></td>
                                        <td>{new Date(app.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-outline btn-sm" onClick={() => navigate?.(`/applications/${app.id}`)}>View</button>
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

// ============================================================================
// Application Detail Page
// ============================================================================
export const ApplicationDetailPage = ({ AdminLayout, useAuth, useToast, useI18n, navigate, applicationId }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [app, setApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editStatus, setEditStatus] = useState('');
    const [editNotes, setEditNotes] = useState('');
    // Document upload
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadType, setUploadType] = useState('passport');
    const [uploadNotes, setUploadNotes] = useState('');
    // Reassign
    const [newMentorId, setNewMentorId] = useState('');

    const fetchApp = async () => {
        setLoading(true);
        try {
            const data = await applicationApi.show(applicationId);
            setApp(data.application);
            setEditStatus(data.application.status);
            setEditNotes(data.application.notes || '');
        } catch (err) {
            toast?.error('Failed to load application');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchApp(); }, [applicationId]);

    const handleUpdate = async () => {
        try {
            await applicationApi.update(applicationId, { status: editStatus, notes: editNotes });
            toast?.success('Application updated');
            fetchApp();
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to update');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('type', uploadType);
        if (uploadNotes) formData.append('notes', uploadNotes);
        try {
            await documentApi.upload(applicationId, formData);
            toast?.success('Document uploaded');
            setUploadFile(null);
            setUploadNotes('');
            fetchApp();
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Upload failed');
        }
    };

    const handleLabelChange = async (docId, newLabel, notes) => {
        try {
            await documentApi.updateLabel(docId, { label_status: newLabel, notes });
            toast?.success('Label updated');
            fetchApp();
        } catch (err) {
            toast?.error('Failed to update label');
        }
    };

    const handleReassign = async () => {
        if (!newMentorId) return;
        try {
            await applicationApi.reassign(applicationId, { new_mentor_id: parseInt(newMentorId) });
            toast?.success('Application reassigned');
            fetchApp();
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Reassign failed');
        }
    };

    if (loading) return <AdminLayout title="Application Detail"><div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div></AdminLayout>;
    if (!app) return <AdminLayout title="Application Detail"><div className="empty-state"><div className="empty-state-title">Application not found</div></div></AdminLayout>;

    const canEdit = user?.role === 'admin' || (user?.role === 'mentor' && app.mentor_id === user.id);
    const isAdmin = user?.role === 'admin';

    const labelColors = {
        pending_review: 'badge-warning',
        valid: 'badge-success',
        need_more: 'badge-error',
        translating: 'badge-info',
        submitted: 'badge-success',
    };

    return (
        <AdminLayout title={`Application #${app.id}`}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button className="btn btn-outline btn-sm" onClick={() => navigate?.(-1)}>← Back</button>
            </div>

            {/* Info Card */}
            <div className="card mb-4">
                <div className="card-header"><span className="card-title">Application Info</span></div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div><label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Student</label><p className="font-medium">{app.student?.name}</p></div>
                        <div><label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Mentor</label><p className="font-medium">{app.mentor?.name}</p></div>
                        <div><label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Status</label><p><span className="badge badge-info">{app.status?.replace(/_/g, ' ')}</span></p></div>
                        <div><label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Created</label><p>{new Date(app.created_at).toLocaleString()}</p></div>
                    </div>
                    {app.notes && <div className="mt-4"><label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Notes</label><p>{app.notes}</p></div>}
                </div>
            </div>

            {/* Edit (mentor/admin) */}
            {canEdit && (
                <div className="card mb-4">
                    <div className="card-header"><span className="card-title">Update Application</span></div>
                    <div className="card-body">
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Status</label>
                                <select className="form-input" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                    {['draft','in_progress','documents_pending','documents_reviewing','submitted_to_university','accepted','rejected','on_hold_needs_mentor','cancelled'].map(s => (
                                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
                                <label>Notes</label>
                                <input className="form-input" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                            </div>
                            <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin: Reassign */}
            {isAdmin && (
                <div className="card mb-4">
                    <div className="card-header"><span className="card-title">Reassign Mentor</span></div>
                    <div className="card-body">
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>New Mentor User ID</label>
                                <input type="number" className="form-input" value={newMentorId} onChange={e => setNewMentorId(e.target.value)} />
                            </div>
                            <button className="btn btn-outline" onClick={handleReassign}>Reassign</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Documents */}
            <div className="card mb-4">
                <div className="card-header"><span className="card-title">Documents ({app.documents?.length || 0})</span></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {(!app.documents || app.documents.length === 0) ? (
                        <div className="empty-state" style={{ padding: '1rem' }}><div className="empty-state-title">No documents yet</div></div>
                    ) : (
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Type</th><th>Label</th><th>Uploaded By</th><th>Date</th>{canEdit && <th>Actions</th>}</tr></thead>
                            <tbody>
                                {app.documents.map(doc => (
                                    <tr key={doc.id}>
                                        <td><a href={documentApi.downloadUrl(doc.id)} target="_blank" rel="noopener">{doc.original_name}</a></td>
                                        <td>{doc.type}</td>
                                        <td>
                                            {canEdit ? (
                                                <select className="form-input" style={{ width: 'auto', padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                                                    value={doc.label_status} onChange={e => handleLabelChange(doc.id, e.target.value)}>
                                                    {['pending_review','valid','need_more','translating','submitted'].map(l => (
                                                        <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`badge ${labelColors[doc.label_status] || 'badge-info'}`}>{doc.label_status?.replace(/_/g, ' ')}</span>
                                            )}
                                        </td>
                                        <td>{doc.uploader?.name || '—'}</td>
                                        <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                                        {canEdit && <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }}
                                            onClick={async () => { await documentApi.delete(doc.id); toast?.success('Deleted'); fetchApp(); }}>🗑</button></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Upload form (mentor/admin only) */}
                {canEdit && (
                    <div className="card-body" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Upload New Document</h4>
                        <form onSubmit={handleUpload} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>File</label>
                                <input type="file" className="form-input" onChange={e => setUploadFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Type</label>
                                <select className="form-input" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                                    {['passport','transcript','hsk_cert','hskk_cert','recommendation','personal_statement','photo','medical_report','other'].map(t => (
                                        <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
                                <label>Notes</label>
                                <input className="form-input" value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm" disabled={!uploadFile}>Upload</button>
                        </form>
                    </div>
                )}
            </div>

            {/* History */}
            {app.histories && app.histories.length > 0 && (
                <div className="card">
                    <div className="card-header"><span className="card-title">History</span></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead><tr><th>Date</th><th>Changed By</th><th>Field</th><th>Old</th><th>New</th><th>Notes</th></tr></thead>
                            <tbody>
                                {app.histories.map(h => (
                                    <tr key={h.id}>
                                        <td>{new Date(h.created_at).toLocaleString()}</td>
                                        <td>{h.changer?.name}</td>
                                        <td>{h.field_changed}</td>
                                        <td>{h.old_value || '—'}</td>
                                        <td>{h.new_value}</td>
                                        <td>{h.notes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};
