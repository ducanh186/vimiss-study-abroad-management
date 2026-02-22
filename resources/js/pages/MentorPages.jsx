import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { mentorApi, studentApi } from '../services/api';

// ============================================================================
// Student: My Mentor Page
// ============================================================================
export const MyMentorPage = ({ AdminLayout, useAuth, useToast, useI18n }) => {
    const { user } = useAuth();
    const toast = useToast();
    const { t } = useI18n();
    const [mentor, setMentor] = useState(null);
    const [mentorProfile, setMentorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasMentor, setHasMentor] = useState(false);

    const fetchMyMentor = async () => {
        setLoading(true);
        try {
            const data = await studentApi.myMentor();
            setMentor(data.mentor);
            setMentorProfile(data.mentor_profile);
            setHasMentor(!!data.mentor);
        } catch (err) {
            setHasMentor(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyMentor(); }, []);

    if (loading) return <AdminLayout title="My Mentor"><div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div></AdminLayout>;

    if (!hasMentor) {
        return (
            <AdminLayout title="My Mentor">
                <div className="card">
                    <div className="card-body">
                        <div className="empty-state">
                            <div className="empty-state-icon">👨‍🏫</div>
                            <div className="empty-state-title">No mentor assigned yet</div>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                Choose a mentor from the directory or get one randomly assigned.
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                <a href="/mentor-directory" className="btn btn-primary">Browse Mentors</a>
                                <RandomMentorButton onAssigned={fetchMyMentor} toast={toast} />
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="My Mentor">
            <div className="card">
                <div className="card-header">
                    <span className="card-title">My Mentor</span>
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
                            <p className="font-medium">{mentor?.name}</p>
                        </div>
                        <div>
                            <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
                            <p>{mentor?.email}</p>
                        </div>
                        <div>
                            <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Staff Code</label>
                            <p><span className="badge badge-info">{mentorProfile?.staff_code}</span></p>
                        </div>
                        <div>
                            <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Specialty</label>
                            <p><span className="badge badge-success">{mentorProfile?.specialty}</span></p>
                        </div>
                        {mentorProfile?.bio && (
                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Bio</label>
                                <p>{mentorProfile.bio}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

// ============================================================================
// Student: Mentor Directory Page
// ============================================================================
export const MentorDirectoryPage = ({ AdminLayout, useAuth, useToast, useI18n }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [specialty, setSpecialty] = useState('');
    const [search, setSearch] = useState('');

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const params = {};
            if (specialty) params.specialty = specialty;
            if (search) params.search = search;
            const data = await mentorApi.directory(params);
            setMentors(data.data || []);
        } catch (err) {
            toast?.error('Failed to load mentors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMentors(); }, [specialty]);

    const handleChoose = async (mentorUserId) => {
        try {
            await studentApi.chooseMentor(mentorUserId);
            toast?.success('Mentor assigned successfully!');
            window.location.href = '/my-mentor';
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to choose mentor');
        }
    };

    return (
        <AdminLayout title="Mentor Directory">
            <div className="card">
                <div className="card-header" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="card-title">Available Mentors</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                        <select className="form-input" style={{ width: 'auto' }} value={specialty} onChange={e => setSpecialty(e.target.value)}>
                            <option value="">All Specialties</option>
                            <option value="CSC">CSC</option>
                            <option value="CIS">CIS</option>
                            <option value="self-funded">Self-funded</option>
                            <option value="general">General</option>
                        </select>
                        <input className="form-input" style={{ width: 200 }} placeholder="Search..." value={search}
                            onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchMentors()} />
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
                    ) : mentors.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-title">No mentors found</div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Staff Code</th>
                                    <th>Name</th>
                                    <th>Specialty</th>
                                    <th>Available Slots</th>
                                    {user?.role === 'student' && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {mentors.map(m => (
                                    <tr key={m.id}>
                                        <td><span className="badge badge-info">{m.staff_code}</span></td>
                                        <td className="font-medium">{m.user?.name}</td>
                                        <td><span className="badge badge-success">{m.specialty}</span></td>
                                        <td>{m.available_slots} / {m.capacity_max}</td>
                                        {user?.role === 'student' && (
                                            <td>
                                                <button className="btn btn-primary btn-sm" onClick={() => handleChoose(m.user_id)}
                                                    disabled={m.available_slots <= 0}>
                                                    {m.available_slots > 0 ? 'Choose' : 'Full'}
                                                </button>
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

// ============================================================================
// Random Mentor Button (reusable)
// ============================================================================
const RandomMentorButton = ({ onAssigned, toast }) => {
    const [loading, setLoading] = useState(false);

    const handleRandom = async () => {
        setLoading(true);
        try {
            await studentApi.randomMentor();
            toast?.success('Mentor randomly assigned!');
            onAssigned?.();
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to assign random mentor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button className="btn btn-outline" onClick={handleRandom} disabled={loading}>
            {loading ? <span className="btn-spinner"></span> : '🎲 Random Mentor'}
        </button>
    );
};
