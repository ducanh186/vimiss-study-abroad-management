import React, { useState, useEffect } from 'react';
import { mentorApi, studentApi } from '../services/api';

// ============================================================================
// Admin Mentor Management Page (CRUD + disable/enable + reassignment)
// ============================================================================
export const AdminMentorPage = ({ AdminLayout, useAuth, useToast, useI18n, navigate }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', specialty: '', bio: '', capacity_max: 5 });
    const [editing, setEditing] = useState(null);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const data = await mentorApi.adminList();
            setMentors(data.data || []);
        } catch (err) {
            toast?.error('Failed to load mentors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMentors(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await mentorApi.store(form);
            toast?.success('Mentor created');
            setShowCreate(false);
            setForm({ name: '', email: '', password: '', specialty: '', bio: '', capacity_max: 5 });
            fetchMentors();
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to create');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await mentorApi.update(editing.user_id, editing);
            toast?.success('Mentor updated');
            setEditing(null);
            fetchMentors();
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to update');
        }
    };

    const handleToggle = async (mentor) => {
        try {
            if (mentor.is_active) {
                await mentorApi.disable(mentor.user_id);
                toast?.success('Mentor disabled, affected applications set to on_hold');
            } else {
                await mentorApi.enable(mentor.user_id);
                toast?.success('Mentor enabled');
            }
            fetchMentors();
        } catch (err) {
            toast?.error('Failed to toggle mentor status');
        }
    };

    return (
        <AdminLayout title="Mentor Management">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Mentors</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
                    {showCreate ? 'Cancel' : '+ Create Mentor'}
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="card mb-4">
                    <div className="card-header"><span className="card-title">New Mentor</span></div>
                    <div className="card-body">
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="form-group"><label>Name *</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                                <div className="form-group"><label>Email *</label><input type="email" className="form-input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                                <div className="form-group"><label>Password *</label><input type="password" className="form-input" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                                <div className="form-group"><label>Specialty</label>
                                    <select className="form-input" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}>
                                        <option value="">Select...</option>
                                        <option value="hoc_bong_toan_phan">Học bổng toàn phần</option>
                                        <option value="hoc_bong_ban_phan">Học bổng bán phần</option>
                                        <option value="tu_tuc">Tự túc</option>
                                        <option value="lien_ket">Liên kết</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Capacity Max</label><input type="number" className="form-input" min="1" max="20" value={form.capacity_max} onChange={e => setForm({ ...form, capacity_max: parseInt(e.target.value) })} /></div>
                                <div className="form-group"><label>Bio</label><input className="form-input" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></div>
                            </div>
                            <button type="submit" className="btn btn-primary mt-4">Create</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editing && (
                <div className="card mb-4" style={{ border: '2px solid var(--color-primary)' }}>
                    <div className="card-header"><span className="card-title">Edit Mentor: {editing.user?.name}</span></div>
                    <div className="card-body">
                        <form onSubmit={handleUpdate}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="form-group"><label>Specialty</label>
                                    <select className="form-input" value={editing.specialty || ''} onChange={e => setEditing({ ...editing, specialty: e.target.value })}>
                                        <option value="">Select...</option>
                                        <option value="hoc_bong_toan_phan">Học bổng toàn phần</option>
                                        <option value="hoc_bong_ban_phan">Học bổng bán phần</option>
                                        <option value="tu_tuc">Tự túc</option>
                                        <option value="lien_ket">Liên kết</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Capacity Max</label><input type="number" className="form-input" min="1" max="20" value={editing.capacity_max || 5} onChange={e => setEditing({ ...editing, capacity_max: parseInt(e.target.value) })} /></div>
                                <div className="form-group"><label>Bio</label><input className="form-input" value={editing.bio || ''} onChange={e => setEditing({ ...editing, bio: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mentors Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
                    ) : mentors.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-title">No mentors found</div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Staff Code</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Specialty</th>
                                    <th>Students</th>
                                    <th>Active</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mentors.map(m => (
                                    <tr key={m.id}>
                                        <td className="font-medium">{m.staff_code}</td>
                                        <td>{m.user?.name}</td>
                                        <td>{m.user?.email}</td>
                                        <td>{m.specialty || '—'}</td>
                                        <td>{m.current_student_count ?? '—'} / {m.capacity_max}</td>
                                        <td>
                                            <span className={`badge ${m.is_active ? 'badge-success' : 'badge-error'}`}>
                                                {m.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button className="btn btn-outline btn-sm" onClick={() => setEditing({ ...m })}>Edit</button>
                                            <button className={`btn btn-sm ${m.is_active ? 'btn-outline' : 'btn-primary'}`}
                                                style={m.is_active ? { color: 'var(--color-error)', borderColor: 'var(--color-error)' } : {}}
                                                onClick={() => handleToggle(m)}>
                                                {m.is_active ? 'Disable' : 'Enable'}
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

// ============================================================================
// Admin Assign / Reassign Page
// ============================================================================
export const AdminAssignmentPage = ({ AdminLayout, useAuth, useToast, useI18n, navigate }) => {
    const toast = useToast();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignForm, setAssignForm] = useState({ student_id: '', mentor_id: '' });
    const [reassignForm, setReassignForm] = useState({ student_id: '', new_mentor_id: '', reason: '' });

    const fetchStudents = async () => {
        try {
            // Use admin student list endpoint
            const data = await studentApi.adminList?.() || { students: [] };
            setStudents(data.students || []);
        } catch (err) {
            // fallback
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStudents(); }, []);

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await studentApi.adminAssign(assignForm.student_id, { mentor_id: parseInt(assignForm.mentor_id) });
            toast?.success('Student assigned to mentor');
            setAssignForm({ student_id: '', mentor_id: '' });
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Assignment failed');
        }
    };

    const handleReassign = async (e) => {
        e.preventDefault();
        try {
            await studentApi.adminReassign(reassignForm.student_id, {
                new_mentor_id: parseInt(reassignForm.new_mentor_id),
                reason: reassignForm.reason
            });
            toast?.success('Student reassigned');
            setReassignForm({ student_id: '', new_mentor_id: '', reason: '' });
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Reassignment failed');
        }
    };

    return (
        <AdminLayout title="Mentor Assignments">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
                {/* Manual Assign */}
                <div className="card">
                    <div className="card-header"><span className="card-title">Manual Assignment</span></div>
                    <div className="card-body">
                        <form onSubmit={handleAssign}>
                            <div className="form-group"><label>Student User ID</label><input type="number" className="form-input" required value={assignForm.student_id} onChange={e => setAssignForm({ ...assignForm, student_id: e.target.value })} /></div>
                            <div className="form-group"><label>Mentor User ID</label><input type="number" className="form-input" required value={assignForm.mentor_id} onChange={e => setAssignForm({ ...assignForm, mentor_id: e.target.value })} /></div>
                            <button type="submit" className="btn btn-primary btn-sm">Assign</button>
                        </form>
                    </div>
                </div>

                {/* Reassign */}
                <div className="card">
                    <div className="card-header"><span className="card-title">Reassign Student</span></div>
                    <div className="card-body">
                        <form onSubmit={handleReassign}>
                            <div className="form-group"><label>Student User ID</label><input type="number" className="form-input" required value={reassignForm.student_id} onChange={e => setReassignForm({ ...reassignForm, student_id: e.target.value })} /></div>
                            <div className="form-group"><label>New Mentor User ID</label><input type="number" className="form-input" required value={reassignForm.new_mentor_id} onChange={e => setReassignForm({ ...reassignForm, new_mentor_id: e.target.value })} /></div>
                            <div className="form-group"><label>Reason</label><input className="form-input" value={reassignForm.reason} onChange={e => setReassignForm({ ...reassignForm, reason: e.target.value })} /></div>
                            <button type="submit" className="btn btn-primary btn-sm">Reassign</button>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};
