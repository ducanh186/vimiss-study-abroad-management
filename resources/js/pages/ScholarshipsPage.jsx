import React, { useState, useEffect } from 'react';
import { scholarshipApi } from '../services/api';

// ============================================================================
// Scholarships List Page (view for all, CRUD for admin)
// ============================================================================
export const ScholarshipsPage = ({ AdminLayout, useAuth, useToast, useI18n, navigate }) => {
    const { user } = useAuth();
    const toast = useToast();
    const { t } = useI18n();
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
            toast?.error(t('scholarship.failedLoad'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchScholarships(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await scholarshipApi.store(form);
            toast?.success(t('scholarship.created'));
            setShowCreate(false);
            setForm({ university_id: '', name: '', type: 'hoc_bong_toan_phan', description: '', deadline: '', quota: '', min_hsk: '', min_gpa: '' });
            fetchScholarships();
        } catch (err) {
            toast?.error(err.response?.data?.message || t('scholarship.failedCreate'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('scholarship.deleteConfirm'))) return;
        try {
            await scholarshipApi.destroy(id);
            toast?.success(t('common.deleted'));
            fetchScholarships();
        } catch (err) {
            toast?.error(t('scholarship.failedDelete'));
        }
    };

    const isExpired = (deadline) => deadline && new Date(deadline) < new Date();

    return (
        <AdminLayout title={t('scholarship.scholarships')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{t('scholarship.scholarshipsDatabase')}</h2>
                {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? t('common.cancel') : t('scholarship.addScholarship')}</button>}
            </div>

            {showCreate && isAdmin && (
                <div className="card mb-4">
                    <div className="card-header"><span className="card-title">{t('scholarship.newScholarship')}</span></div>
                    <div className="card-body">
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="form-group"><label>{t('common.name')} *</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                                <div className="form-group"><label>{t('scholarship.universityId')}</label><input type="number" className="form-input" required value={form.university_id} onChange={e => setForm({ ...form, university_id: e.target.value })} /></div>
                                <div className="form-group"><label>{t('common.type')}</label>
                                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="hoc_bong_toan_phan">{t('scholarship.typeFullScholarship')}</option>
                                        <option value="hoc_bong_ban_phan">{t('scholarship.typePartialScholarship')}</option>
                                        <option value="tu_tuc">{t('scholarship.typeSelfFunded')}</option>
                                        <option value="lien_ket">{t('scholarship.typeLinked')}</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>{t('scholarship.deadline')}</label><input type="date" className="form-input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                                <div className="form-group"><label>{t('scholarship.quota')}</label><input type="number" className="form-input" value={form.quota} onChange={e => setForm({ ...form, quota: e.target.value })} /></div>
                                <div className="form-group"><label>{t('scholarship.minHsk')}</label><input type="number" className="form-input" min="1" max="6" value={form.min_hsk} onChange={e => setForm({ ...form, min_hsk: e.target.value })} /></div>
                                <div className="form-group"><label>{t('scholarship.minGpa')}</label><input type="number" step="0.01" className="form-input" value={form.min_gpa} onChange={e => setForm({ ...form, min_gpa: e.target.value })} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('common.description')}</label><textarea className="form-input" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            </div>
                            <button type="submit" className="btn btn-primary mt-4">{t('common.create')}</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
                    ) : scholarships.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">🎓</div><div className="empty-state-title">{t('scholarship.noScholarships')}</div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('common.name')}</th>
                                    <th>{t('university.universities')}</th>
                                    <th>{t('common.type')}</th>
                                    <th>{t('scholarship.deadline')}</th>
                                    <th>{t('scholarship.quota')}</th>
                                    <th>{t('scholarship.minHsk')}</th>
                                    <th>{t('scholarship.minGpa')}</th>
                                    <th>{t('common.status')}</th>
                                    {isAdmin && <th>{t('common.actions')}</th>}
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
                                                    <span className="badge badge-error">{t('scholarship.expired')}</span>
                                                ) : (
                                                    <span className="badge badge-success">{t('scholarship.open')}</span>
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
