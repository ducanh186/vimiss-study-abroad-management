import React, { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../services/api';

// ============================================================================
// Notification Bell (for Topbar) - shows unread count badge
// ============================================================================
export const NotificationBell = ({ onClick }) => {
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(async () => {
        try {
            const data = await notificationApi.unreadCount();
            setCount(data.count || 0);
        } catch (err) {
            // silent fail
        }
    }, []);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, [fetchCount]);

    return (
        <button
            onClick={onClick}
            style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.25rem 0.5rem',
                color: 'var(--color-text-primary)',
            }}
            title="Notifications"
        >
            🔔
            {count > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: 'var(--color-error, #ef4444)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                }}>
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    );
};

// ============================================================================
// Notifications List Page
// ============================================================================
export const NotificationsPage = ({ AdminLayout, useAuth, useToast, useI18n }) => {
    const toast = useToast();
    const { t } = useI18n();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationApi.list();
            setNotifications(data.notifications || []);
        } catch (err) {
            toast?.error(t('notification.failedLoad'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const handleMarkRead = async (id) => {
        try {
            await notificationApi.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        } catch (err) {
            // silent
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
            toast?.success(t('notification.allMarkedRead'));
        } catch (err) {
            toast?.error(t('common.failed'));
        }
    };

    const typeIcons = {
        mentor_assigned: '👨‍🏫',
        application_status: '📋',
        document_label: '📄',
        document_need_more: '⚠️',
        review_result: '✅',
        scholarship_deadline: '🎓',
        general: 'ℹ️',
    };

    return (
        <AdminLayout title={t('notification.notifications')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{t('notification.notifications')}</h2>
                <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>{t('notification.markAllRead')}</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
            ) : notifications.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">🔔</div><div className="empty-state-title">{t('notification.noNotifications')}</div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {notifications.map(n => (
                        <div
                            key={n.id}
                            className="card"
                            style={{
                                opacity: n.read_at ? 0.7 : 1,
                                borderLeft: n.read_at ? '3px solid var(--color-border)' : '3px solid var(--color-primary)',
                                cursor: 'pointer',
                            }}
                            onClick={() => handleMarkRead(n.id)}
                        >
                            <div className="card-body" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.4rem' }}>{typeIcons[n.type] || 'ℹ️'}</span>
                                <div style={{ flex: 1 }}>
                                    <div className="font-medium">{n.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{n.body}</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                    {new Date(n.created_at).toLocaleString()}
                                </div>
                                {!n.read_at && <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{t('common.new')}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
};
