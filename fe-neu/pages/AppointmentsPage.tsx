import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as api from '../services/apiService';
import { AppointmentResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button, Spinner, Card } from '../components/ui';

const AppointmentDetail: React.FC<{ appointmentId: string }> = ({ appointmentId }) => {
    const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                // Not using getById because getAll is already implemented
                const allAppointments = await api.getAllAppointments();
                const appt = allAppointments.find(a => a.id.toString() === appointmentId);
                if (appt) {
                    setAppointment(appt);
                } else {
                    setError("Không tìm thấy lịch hẹn.");
                }
            } catch (err) {
                setError("Không thể tải chi tiết lịch hẹn.");
            } finally {
                setLoading(false);
            }
        };
        fetchAppointment();
    }, [appointmentId]);

    const handleUpdateStatus = async (status: 'ACCEPTED' | 'REJECTED') => {
        if (!appointment) return;
        try {
            await api.updateAppointmentStatus(appointment.id, status);
            alert(`Lịch hẹn đã  ${status === 'ACCEPTED' ? 'được chấp nhận' : 'bị từ chối'}.`);
            navigate('/app/appointments');
        } catch (err: any) {
            setError(err.message || 'Không thể cập nhật trạng thái.');
        }
    };
    
    const formatDateTime = (dateTimeString: string) => {
        return new Date(dateTimeString.replace(' ', 'T')).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });
    }

    if (loading) return <div className="flex justify-center mt-10"><Spinner /></div>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!appointment) return <p>Không tìm thấy lịch hẹn.</p>;

    return (
        <div>
            <Link to="/app/appointments" className="text-accent hover:underline mb-6 inline-block font-semibold">&larr; Quay lại danh sách lịch hẹn</Link>
            <Card className="p-6">
                <p className="text-sm text-secondary mb-2">Từ: {appointment.userName}</p>
                <h2 className="text-2xl font-semibold text-primary mb-1">Yêu cầu lịch hẹn</h2>
                <p className="text-lg text-primary font-medium mb-4">{formatDateTime(appointment.appointmentTime)}</p>

                {appointment.notes && (
                    <>
                        <h3 className="font-semibold text-secondary mt-4">Ghi chú từ sinh viên:</h3>
                        <p className="text-primary whitespace-pre-wrap bg-background p-4 rounded-md">{appointment.notes}</p>
                    </>
                )}
                
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                
                {appointment.status === 'PENDING' && (
                    <div className="mt-6 flex justify-end gap-4 border-t border-border pt-6">
                        <Button variant="danger" onClick={() => handleUpdateStatus('REJECTED')}>Từ chối</Button>
                        <Button variant="primary" onClick={() => handleUpdateStatus('ACCEPTED')}>Chấp nhận</Button>
                    </div>
                )}
                
                 {appointment.status !== 'PENDING' && (
                    <div className="mt-6 border-t border-border pt-4">
                        <p className="font-semibold text-lg">Trạng thái: <span className="font-bold">{appointment.status === 'ACCEPTED' ? 'Đã chấp nhận' : 'Đã từ chối'}</span></p>
                    </div>
                 )}
            </Card>
        </div>
    );
};


const AppointmentList: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const fetchAppointments = useCallback(async () => {
        if (!user) {
            setError("Không thể xác định cố vấn đã đăng nhập.");
            setLoading(false);
            return;
        };
        try {
            setLoading(true);
            const allAppointments = await api.getAllAppointments();
            const lawyerAppointments = allAppointments
                .filter(a => a.lawyerEmail === user.email) 
                .sort((a,b) => new Date(a.appointmentTime.replace(' ', 'T')).getTime() - new Date(b.appointmentTime.replace(' ', 'T')).getTime());
            setAppointments(lawyerAppointments);
        } catch (err: any) {
            setError('Không thể tải lịch hẹn.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);
    
     const getStatusColor = (status: AppointmentResponse['status']) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'ACCEPTED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const formatDateTime = (dateTimeString: string) => {
        return new Date(dateTimeString.replace(' ', 'T')).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-8">Lịch hẹn từ sinh viên</h1>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            {loading ? <div className="flex justify-center"><Spinner /></div> : (
                <div className="space-y-4">
                    {appointments.length > 0 ? (
                        appointments.map(a => (
                            <Link to={`/app/appointments/${a.id}`} key={a.id} className="block">
                                <Card className="p-4 transition-all duration-300 hover:shadow-md hover:border-accent hover:-translate-y-0.5">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-primary">Yêu cầu từ: {a.userName}</p>
                                            <p className="text-sm text-secondary">{formatDateTime(a.appointmentTime)}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(a.status)}`}>{a.status === 'ACCEPTED' ? 'Đã đồng ý' : a.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ xử lý'}</span>
                                    </div>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <p className="text-center text-secondary py-16">Bạn không có yêu cầu lịch hẹn nào.</p>
                    )}
                </div>
            )}
        </div>
    );
};

const AppointmentsPage: React.FC = () => {
    const { appointmentId } = useParams<{ appointmentId?: string }>();
    const { isLawyer } = useAuth();
    
    if (!isLawyer) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold">Truy cập bị từ chối</h1>
                <p className="text-secondary">Trang này chỉ dành cho cố vấn.</p>
            </div>
        );
    }
    
    return appointmentId ? <AppointmentDetail appointmentId={appointmentId} /> : <AppointmentList />;
};

export default AppointmentsPage;
