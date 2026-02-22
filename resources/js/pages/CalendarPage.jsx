import React, { useState, useEffect } from 'react';
import { calendarApi } from '../services/api';

// ============================================================================
// Calendar Events Page (view for all, CRUD for admin)
// ============================================================================
export const CalendarPage = ({ AdminLayout, useAuth, useToast, useI18n }) => {
    const { user } = useAuth();
    const toast = useToast();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', start_date: '', end_date: '',
        type: 'deadline', visibility: 'all', related_id: ''
    });
    const isAdmin = user?.role === 'admin';

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await calendarApi.list();
            setEvents(data.events || []);
        } catch (err) {
            toast?.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await calendarApi.store(form);
            toast?.success('Event created');
            setShowCreate(false);
            setForm({ title: '', description: '', start_date: '', end_date: '', type: 'deadline', visibility: 'all', related_id: '' });
            fetchEvents();
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to create event');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            await calendarApi.destroy(id);
            toast?.success('Deleted');
            fetchEvents();
        } catch (err) {
            toast?.error('Failed to delete');
        }
    };

    const typeColors = {
        deadline: 'badge-error',
        meeting: 'badge-info',
        reminder: 'badge-warning',
        holiday: 'badge-success',
        other: 'badge-info',
    };

    const isPast = (date) => new Date(date) < new Date();

    return (
        <AdminLayout title="Calendar">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Calendar Events</h2>
                {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ Add Event'}</button>}
            </div>

            {showCreate && isAdmin && (
                <div className="card mb-4">
                    <div className="card-header"><span className="card-title">New Event</span></div>
                    <div className="card-body">
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="form-group"><label>Title *</label><input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                                <div className="form-group"><label>Start Date *</label><input type="datetime-local" className="form-input" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                                <div className="form-group"><label>End Date</label><input type="datetime-local" className="form-input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                                <div className="form-group"><label>Type</label>
                                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="deadline">Deadline</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="reminder">Reminder</option>
                                        <option value="holiday">Holiday</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Visibility</label>
                                    <select className="form-input" value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>
                                        <option value="all">All Users</option>
                                        <option value="admin">Admin Only</option>
                                        <option value="mentor">Mentors</option>
                                        <option value="student">Students</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Description</label><textarea className="form-input" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            </div>
                            <button type="submit" className="btn btn-primary mt-4">Create</button>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
            ) : events.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-title">No events scheduled</div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {events.map(evt => (
                        <div key={evt.id} className="card" style={{ opacity: isPast(evt.start_date) ? 0.6 : 1 }}>
                            <div className="card-body" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span className="font-medium">{evt.title}</span>
                                        <span className={`badge ${typeColors[evt.type] || 'badge-info'}`} style={{ fontSize: '0.7rem' }}>{evt.type}</span>
                                        {isPast(evt.start_date) && <span className="badge badge-error" style={{ fontSize: '0.65rem' }}>Past</span>}
                                    </div>
                                    {evt.description && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{evt.description}</div>}
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                    <div>{new Date(evt.start_date).toLocaleString()}</div>
                                    {evt.end_date && <div style={{ color: 'var(--color-text-secondary)' }}>→ {new Date(evt.end_date).toLocaleString()}</div>}
                                </div>
                                {isAdmin && (
                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(evt.id)}>🗑</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
};
