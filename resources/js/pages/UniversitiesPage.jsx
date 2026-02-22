import React, { useState, useEffect } from 'react';
import { universityApi } from '../services/api';

// ============================================================================
// Universities Page (Admin CRUD)
// ============================================================================
export const UniversitiesPage = ({ AdminLayout, useAuth, useToast, useI18n }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', country: 'China', city: '', ranking: '', programs: '', website: '' });
    const [editing, setEditing] = useState(null);
    const isAdmin = user?.role === 'admin';

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await universityApi.list();
            setUniversities(data.universities || []);
        } catch (err) {
            toast?.error('Failed to load universities');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (payload.programs) payload.programs = payload.programs.split(',').map(p => p.trim());
            await universityApi.store(payload);
            toast?.success('University added');
            setShowCreate(false);
            setForm({ name: '', country: 'China', city: '', ranking: '', programs: '', website: '' });
            fetchData();
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to create');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...editing };
            if (typeof payload.programs === 'string') payload.programs = payload.programs.split(',').map(p => p.trim());
            await universityApi.update(editing.id, payload);
            toast?.success('University updated');
            setEditing(null);
            fetchData();
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to update');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this university?')) return;
        try {
            await universityApi.destroy(id);
            toast?.success('Deleted');
            fetchData();
        } catch (err) {
            toast?.error('Failed to delete');
        }
    };

    const renderForm = (data, setData, onSubmit, submitLabel) => (
        <form onSubmit={onSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group"><label>Name *</label><input className="form-input" required value={data.name} onChange={e => setData({ ...data, name: e.target.value })} /></div>
                <div className="form-group"><label>Country</label><input className="form-input" value={data.country} onChange={e => setData({ ...data, country: e.target.value })} /></div>
                <div className="form-group"><label>City</label><input className="form-input" value={data.city || ''} onChange={e => setData({ ...data, city: e.target.value })} /></div>
                <div className="form-group"><label>Ranking</label><input type="number" className="form-input" value={data.ranking || ''} onChange={e => setData({ ...data, ranking: e.target.value })} /></div>
                <div className="form-group"><label>Website</label><input className="form-input" value={data.website || ''} onChange={e => setData({ ...data, website: e.target.value })} /></div>
                <div className="form-group"><label>Programs (comma-separated)</label>
                    <input className="form-input" value={Array.isArray(data.programs) ? data.programs.join(', ') : (data.programs || '')} onChange={e => setData({ ...data, programs: e.target.value })} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary btn-sm">{submitLabel}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</button>
            </div>
        </form>
    );

    return (
        <AdminLayout title="Universities">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Universities</h2>
                {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => { setShowCreate(!showCreate); setEditing(null); }}>{showCreate ? 'Cancel' : '+ Add University'}</button>}
            </div>

            {showCreate && isAdmin && (
                <div className="card mb-4">
                    <div className="card-header"><span className="card-title">New University</span></div>
                    <div className="card-body">{renderForm(form, setForm, handleCreate, 'Create')}</div>
                </div>
            )}

            {editing && (
                <div className="card mb-4" style={{ border: '2px solid var(--color-primary)' }}>
                    <div className="card-header"><span className="card-title">Edit: {editing.name}</span></div>
                    <div className="card-body">{renderForm(editing, setEditing, handleUpdate, 'Save')}</div>
                </div>
            )}

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
                    ) : universities.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">🏫</div><div className="empty-state-title">No universities found</div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Country</th>
                                    <th>City</th>
                                    <th>Ranking</th>
                                    <th>Programs</th>
                                    {isAdmin && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {universities.map(u => (
                                    <tr key={u.id}>
                                        <td className="font-medium">{u.name}</td>
                                        <td>{u.country}</td>
                                        <td>{u.city || '—'}</td>
                                        <td>{u.ranking || '—'}</td>
                                        <td>{Array.isArray(u.programs) ? u.programs.join(', ') : '—'}</td>
                                        {isAdmin && (
                                            <td style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button className="btn btn-outline btn-sm" onClick={() => { setEditing({ ...u }); setShowCreate(false); }}>Edit</button>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(u.id)}>🗑</button>
                                            </td>
                                        )}
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
