import React, { useState, useEffect } from 'react';
import { scholarshipApi } from '../services/api';

// ============================================================================
// Scholarships List Page (view for all, CRUD for admin)
// ============================================================================
export const ScholarshipsPage = ({ AdminLayout, useAuth, useToast, useI18n, navigate }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [scholarships, setScholarships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        university_id: '', name: '', type: 'hoc_bong_toan_phan',
        description: '', deadline: '', quota: '', min_hsk: '', min_gpa: ''
    });
    const isAdmin = user?.role === 'admin';

    const fetchScholarships = async () => {
        setLoading(true);
        try {
            const data = await scholarshipApi.list();
            setScholarships(data.scholarships || []);
        } catch (err) {
            toast?.error('Failed to load scholarships');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchScholarships(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await scholarshipApi.store(form);
            toast?.success('Scholarship created');
            setShowCreate(false);
            setForm({ university_id: '', name: '', type: 'hoc_bong_toan_phan', description: '', deadline: '', quota: '', min_hsk: '', min_gpa: '' });
            fetchScholarships();
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to create');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this scholarship?')) return;
        try {
            await scholarshipApi.destroy(id);
            toast?.success('Deleted');
            fetchScholarships();
        } catch (err) {
            toast?.error('Failed to delete');
        }
    };

    const isExpired = (deadline) => deadline && new Date(deadline) < new Date();

    return (
        <AdminLayout title="Scholarships">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Scholarships Database</h2>
                {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ Add Scholarship'}</button>}
            </div>

            {showCreate && isAdmin && (
                <div className="card mb-4">
                    <div className="card-header"><span className="card-title">New Scholarship</span></div>
                    <div className="card-body">
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="form-group"><label>Name *</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                                <div className="form-group"><label>University ID *</label><input type="number" className="form-input" required value={form.university_id} onChange={e => setForm({ ...form, university_id: e.target.value })} /></div>
                                <div className="form-group"><label>Type</label>
                                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="hoc_bong_toan_phan">Học bổng toàn phần</option>
                                        <option value="hoc_bong_ban_phan">Học bổng bán phần</option>
                                        <option value="tu_tuc">Tự túc</option>
                                        <option value="lien_ket">Liên kết</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Deadline</label><input type="date" className="form-input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                                <div className="form-group"><label>Quota</label><input type="number" className="form-input" value={form.quota} onChange={e => setForm({ ...form, quota: e.target.value })} /></div>
                                <div className="form-group"><label>Min HSK</label><input type="number" className="form-input" min="1" max="6" value={form.min_hsk} onChange={e => setForm({ ...form, min_hsk: e.target.value })} /></div>
                                <div className="form-group"><label>Min GPA</label><input type="number" step="0.01" className="form-input" value={form.min_gpa} onChange={e => setForm({ ...form, min_gpa: e.target.value })} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Description</label><textarea className="form-input" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            </div>
                            <button type="submit" className="btn btn-primary mt-4">Create</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
                    ) : scholarships.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">🎓</div><div className="empty-state-title">No scholarships found</div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>University</th>
                                    <th>Type</th>
                                    <th>Deadline</th>
                                    <th>Quota</th>
                                    <th>Min HSK</th>
                                    <th>Min GPA</th>
                                    <th>Status</th>
                                    {isAdmin && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {scholarships.map(s => {
                                    const expired = isExpired(s.deadline);
                                    return (
                                        <tr key={s.id} style={expired ? { opacity: 0.6 } : {}}>
                                            <td className="font-medium">{s.name}</td>
                                            <td>{s.university?.name || s.university_id}</td>
                                            <td>{s.type?.replace(/_/g, ' ')}</td>
                                            <td>{s.deadline ? new Date(s.deadline).toLocaleDateString() : '—'}</td>
                                            <td>{s.quota ?? '—'}</td>
                                            <td>{s.min_hsk ?? '—'}</td>
                                            <td>{s.min_gpa ?? '—'}</td>
                                            <td>
                                                {expired ? (
                                                    <span className="badge badge-error">Expired</span>
                                                ) : (
                                                    <span className="badge badge-success">Open</span>
                                                )}
                                            </td>
                                            {isAdmin && (
                                                <td>
                                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(s.id)}>🗑</button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};
