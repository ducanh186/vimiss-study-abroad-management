

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/apiService';
import { AppointmentResponse, AppointmentRequest, PersonResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Spinner, Card, Button, PlusIcon, Modal, Label, Select, Input, Textarea } from '../components/ui';

export const BookingModal: React.FC<{
    onClose: () => void;
    onSuccess: () => void;
    initialLawyerId?: number;
}> = ({ onClose, onSuccess, initialLawyerId }) => {
    const { user } = useAuth();
    const [lawyers, setLawyers] = useState<PersonResponse[]>([]);
    const [lawyerId, setLawyerId] = useState(initialLawyerId?.toString() || '');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        const fetchLawyers = async () => {
            try {
                const persons = await api.getPersons();
                const lawyerList = persons.filter(p => p.role.toLowerCase() === 'lawyer');
                setLawyers(lawyerList);
                if (lawyerList.length > 0 && !initialLawyerId) {
                    setLawyerId(lawyerList[0].id.toString());
                }
            } catch (err) {
                setError('Không thể tải danh sách cố vấn.');
            } finally {
                setLoading(false);
            }
        };
        fetchLawyers();
    }, [initialLawyerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!user || !lawyerId || !selectedDate || !selectedTime) {
            setError('Vui lòng chọn cố vấn, ngày và giờ.');
            return;
        }
        
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const appointmentDateTime = new Date(selectedDate);
        appointmentDateTime.setHours(hours, minutes);

        // Format to "YYYY-MM-DDTHH:mm"
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formattedDateTime = `${appointmentDateTime.getFullYear()}-${pad(appointmentDateTime.getMonth() + 1)}-${pad(appointmentDateTime.getDate())}T${pad(appointmentDateTime.getHours())}:${pad(appointmentDateTime.getMinutes())}`;

        const requestData: AppointmentRequest = {
            userId: user.id,
            lawyerId: Number(lawyerId),
            appointmentTime: formattedDateTime,
            notes,
        };

        try {
            await api.createAppointment(requestData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Không thể đăng ký lịch hẹn.');
        }
    };
    
    // --- Calendar Logic ---
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const generateCalendar = () => {
        const days = [];
        const numDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        for (let day = 1; day <= numDays; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const isPast = date < new Date() && !isToday;

            days.push(
                <button
                    key={day}
                    type="button"
                    disabled={isPast}
                    onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                        isPast ? 'text-secondary/50 cursor-not-allowed' : 'hover:bg-accent/20'
                    } ${isSelected ? 'bg-accent text-white' : ''} ${isToday ? 'font-bold' : ''}`}
                >
                    {day}
                </button>
            );
        }
        return days;
    };
    
    const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00"];

    return (
        <Modal isOpen={true} onClose={onClose} title="Đặt lịch hẹn">
            {loading ? <Spinner /> : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <Label htmlFor="lawyerId">Cố vấn</Label>
                        <Select id="lawyerId" value={lawyerId} onChange={e => setLawyerId(e.target.value)} required disabled={!!initialLawyerId}>
                            {lawyers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Calendar */}
                        <div>
                            <Label>Ngày</Label>
                            <div className="p-2 bg-background rounded-lg">
                                <div className="flex justify-between items-center mb-2 px-2">
                                    <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>&lt;</button>
                                    <span className="font-semibold">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                    <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>&gt;</button>
                                </div>
                                <div className="grid grid-cols-7 justify-items-center">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="w-10 h-10 flex items-center justify-center text-xs text-secondary">{d}</div>)}
                                    {generateCalendar()}
                                </div>
                            </div>
                        </div>

                        {/* Time Slots */}
                        <div>
                            <Label>Giờ</Label>
                            {selectedDate ? (
                                 <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                                    {timeSlots.map(time => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => setSelectedTime(time)}
                                            className={`p-2 rounded-md border text-sm transition-colors ${
                                                selectedTime === time ? 'bg-accent text-white border-accent' : 'bg-surface hover:bg-accent/20 border-border'
                                            }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full bg-background rounded-lg">
                                    <p className="text-sm text-secondary">Chọn ngày trước</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-border">
                        <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
                        <Button type="submit">Đặt lịch hẹn</Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};


const MyAppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchAppointments = useCallback(async () => {
        if (!user) {
            setError("You must be logged in to see your appointments.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const allAppointments = await api.getAllAppointments();
            const myAppointments = allAppointments
                .filter(a => a.userName === user.username)
                .sort((a, b) => new Date(a.appointmentTime.replace(' ', 'T')).getTime() - new Date(b.appointmentTime.replace(' ', 'T')).getTime());
            setAppointments(myAppointments);
        } catch (err: any) {
            setError('Không thể tải lịch hẹn của bạn.');
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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Lịch hẹn của tôi</h1>
                <Button onClick={() => setIsModalOpen(true)}><PlusIcon /> Đặt lịch hẹn</Button>
            </div>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            {loading ? <div className="flex justify-center"><Spinner /></div> : (
                <div className="space-y-4">
                    {appointments.length > 0 ? (
                        appointments.map(a => (
                            <Card key={a.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-primary">Lịch hẹn với cố vấn {a.lawyerName}</p>
                                        <p className="text-sm text-secondary">
                                            {formatDateTime(a.appointmentTime)}
                                        </p>
                                        {a.notes && <p className="text-sm text-primary mt-2 pt-2 border-t border-border">Ghi chú: {a.notes}</p>}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(a.status)}`}>{a.status}</span>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="text-center p-16">
                            <p className="text-secondary">Bạn chưa có lịch hẹn nào.</p>
                        </Card>
                    )}
                </div>
            )}
            {isModalOpen && <BookingModal onClose={() => setIsModalOpen(false)} onSuccess={fetchAppointments} />}
        </div>
    );
};

export default MyAppointmentsPage;