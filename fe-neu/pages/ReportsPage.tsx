import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../services/apiService';
import { 
    CaseResponse, CategoryResponse, AppointmentResponse, QuestionResponse, 
    PersonResponse
} from '../types';
import { Card, Button, Spinner, Input, Select, Label, DownloadIcon } from '../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

type ReportType = 'DASHBOARD' | 'CASES' | 'APPOINTMENTS' | 'QUESTIONS' | 'PERSONS';

const ReportsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReportType>('DASHBOARD');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Data State
    const [cases, setCases] = useState<CaseResponse[]>([]);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
    const [questions, setQuestions] = useState<QuestionResponse[]>([]);
    const [persons, setPersons] = useState<PersonResponse[]>([]);

    // Filter State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fetch all data needed for reports
                const [
                    casesRes, 
                    catsRes, 
                    apptsRes, 
                    questsRes, 
                    personsRes
                ] = await Promise.all([
                    api.getCases(),
                    api.getCategories(),
                    api.getAllAppointments(),
                    api.getAllQuestions(),
                    api.getPersons()
                ]);

                setCases(casesRes);
                setCategories(catsRes);
                setAppointments(apptsRes);
                setQuestions(questsRes);
                setPersons(personsRes);
                
            } catch (err: any) {
                setError("Failed to load report data. " + (err.message || ''));
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // Filter Logic
    const filterByDate = <T extends { createdAt?: string, appointmentTime?: string }>(
        items: T[], 
        dateField: keyof T
    ) => {
        if (!startDate && !endDate) return items;
        return items.filter(item => {
            const dateValue = item[dateField] as string;
            if (!dateValue) return false; // Skip if date is missing
            const itemDate = new Date(dateValue);
            if (isNaN(itemDate.getTime())) return false; // Skip if invalid date

            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date(9999, 11, 31);
            // End date should include the whole day
            end.setHours(23, 59, 59);
            return itemDate >= start && itemDate <= end;
        });
    };

    const filteredCases = useMemo(() => filterByDate(cases, 'createdAt'), [cases, startDate, endDate]);
    const filteredAppointments = useMemo(() => filterByDate(appointments, 'appointmentTime'), [appointments, startDate, endDate]);
    const filteredQuestions = useMemo(() => filterByDate(questions, 'createdAt'), [questions, startDate, endDate]);
    
    // Persons do not have a createdAt field in the provided DTO, so we do not filter them by date.
    const filteredPersons = persons; 

    // Dashboard Calculations
    const getStats = () => {
        const caseStats = {
            total: filteredCases.length,
            processing: filteredCases.filter(c => c.status === 'Đang xét xử' || c.status === 'OPEN').length,
            completed: filteredCases.filter(c => c.status === 'Đã giải quyết' || c.status === 'CLOSED').length,
            waiting: filteredCases.filter(c => c.status === 'Đang thụ lý' || c.status === 'PENDING').length,
        };
        const apptStats = {
            total: filteredAppointments.length,
            pending: filteredAppointments.filter(a => a.status === 'PENDING').length,
            approved: filteredAppointments.filter(a => a.status === 'ACCEPTED').length,
            cancelled: filteredAppointments.filter(a => a.status === 'REJECTED').length,
        };
        const questStats = {
            total: filteredQuestions.length,
            pending: filteredQuestions.filter(q => !q.answer).length,
            answered: filteredQuestions.filter(q => !!q.answer).length,
        };
        return { caseStats, apptStats, questStats };
    };

    const stats = getStats();
    const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    // Helper for safe date formatting
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '-';
        const d = new Date(dateString.replace(' ', 'T')); // Handle potential space in SQL timestamps
        return isNaN(d.getTime()) ? '-' : d.toLocaleString();
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        let headers: string[] = [];
        let data: any[] = [];
        let filename = `Report_${activeTab}_${new Date().toISOString().split('T')[0]}`;

        if (activeTab === 'CASES') {
            headers = ['STT', 'Mã hồ sơ', 'Tên hồ sơ', 'Chương trình', 'Trạng thái', 'Trường đại học', 'Quốc gia', 'Ngày tạo', 'Ngày cập nhật'];
            data = filteredCases.map((c, idx) => ({
                stt: idx + 1,
                id: c.id,
                name: c.caseName,
                category: categories.find(cat => cat.id === c.categoryId)?.name || '',
                status: c.status,
                court: c.courtName,
                location: c.location,
                created: formatDate(c.createdAt),
                updated: formatDate(c.updatedAt)
            }));
        } else if (activeTab === 'APPOINTMENTS') {
            headers = ['STT', 'Mã cuộc hẹn', 'Sinh viên', 'Cố vấn', 'Thời gian', 'Trạng thái', 'Ghi chú'];
            data = filteredAppointments.map((a, idx) => ({
                stt: idx + 1,
                id: a.id,
                client: a.userName,
                lawyer: a.lawyerName,
                time: formatDateTime(a.appointmentTime),
                status: a.status,
                notes: a.notes
            }));
        } else if (activeTab === 'QUESTIONS') {
             headers = ['STT', 'Mã câu hỏi', 'Sinh viên', 'Cố vấn', 'Thời gian', 'Trạng thái', 'Câu hỏi', 'Câu trả lời'];
             data = filteredQuestions.map((q, idx) => ({
                stt: idx + 1,
                id: q.id,
                client: q.questionerName,
                lawyer: q.lawyerName,
                date: formatDateTime(q.createdAt),
                status: q.answer ? 'Đã trả lời' : 'Chờ xử lý',
                question: q.content,
                answer: q.answer || ''
             }));
        } else if (activeTab === 'PERSONS') {
            headers = ['STT', 'Mã sinh viên', 'Họ tên', 'Vai trò', 'Thông tin liên hệ'];
            data = filteredPersons.map((p, idx) => ({
                stt: idx + 1,
                id: p.id,
                name: p.name,
                role: p.role,
                contact: p.contactInfo
            }));
        } else if (activeTab === 'DASHBOARD') {
             headers = ['Danh mục', 'Chỉ số', 'Giá trị'];
             const s = getStats();
             data = [
                { cat: 'Hồ sơ', metric: 'Tổng số hồ sơ', value: s.caseStats.total },
                { cat: 'Hồ sơ', metric: 'Đang xử lý', value: s.caseStats.processing },
                { cat: 'Hồ sơ', metric: 'Hoàn thành', value: s.caseStats.completed },
                { cat: 'Hồ sơ', metric: 'Chờ xử lý', value: s.caseStats.waiting },
                { cat: 'Lịch hẹn', metric: 'Tổng số', value: s.apptStats.total },
                { cat: 'Lịch hẹn', metric: 'Chờ duyệt', value: s.apptStats.pending },
                { cat: 'Lịch hẹn', metric: 'Đã duyệt', value: s.apptStats.approved },
                { cat: 'Lịch hẹn', metric: 'Đã hủy', value: s.apptStats.cancelled },
                { cat: 'Câu hỏi', metric: 'Tổng số', value: s.questStats.total },
                { cat: 'Câu hỏi', metric: 'Chờ xử lý', value: s.questStats.pending },
                { cat: 'Câu hỏi', metric: 'Đã trả lời', value: s.questStats.answered },
             ];
        }

        // CSV Creation
        const csvContent = [
            headers.join(','),
            ...data.map(row => Object.values(row).map(v => {
                // Escape quotes and wrap in quotes
                const val = String(v || '').replace(/"/g, '""');
                return `"${val}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Report Header for Print ---
    const PrintHeader = ({ title }: { title: string }) => (
        <div className="hidden print:block mb-8 border-b-2 border-primary pb-4">
            <div className="flex justify-between items-start">
                <div>
                     <h1 className="text-xl font-bold text-primary uppercase mb-1">HỆ THỐNG QUẢN LÝ DU HỌC VIMISS</h1>
                     <p className="text-sm text-secondary">Website quản lý hồ sơ du học</p>
                     <p className="text-sm text-secondary">Hệ thống quản lý du học VIMISS</p>
                </div>
                <div className="text-right text-xs">
                    <p>Ngày xuất: {new Date().toLocaleString()}</p>
                    <p>Người xuất: Admin</p>
                </div>
            </div>
            <h2 className="text-2xl font-bold text-center mt-8 uppercase">{title}</h2>
            <div className="mt-2 text-center text-sm italic">
                (Từ ngày: {startDate || '...'} - Đến ngày: {endDate || '...'})
            </div>
        </div>
    );

    // --- Report Footer for Print ---
    const PrintFooter = () => (
        <div className="hidden print:block mt-12 break-inside-avoid">
            <div className="flex justify-end px-10">
                <div className="text-center">
                    <p className="font-bold mb-1 uppercase">GIÁM ĐỐC</p>
                    <p className="italic text-xs mb-20">(Ký và ghi rõ họ tên)</p>
                    <p className="font-bold">__________________________</p>
                </div>
            </div>
        </div>
    );

    const TableHeader = ({ cols }: { cols: string[] }) => (
        <thead className="bg-gray-100 print:bg-gray-200">
            <tr>
                {cols.map((col, i) => (
                    <th key={i} className="px-3 py-2 text-left text-xs font-bold text-primary uppercase border border-gray-300 print:border-gray-500">
                        {col}
                    </th>
                ))}
            </tr>
        </thead>
    );

    if (loading) return <div className="flex justify-center mt-20"><Spinner /></div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-3xl font-bold text-primary">Báo cáo & Phân tích</h1>
                <div className="flex gap-2">
                    <Button onClick={handleExportExcel} variant="secondary">
                        <DownloadIcon /> Xuất Excel (CSV)
                    </Button>
                    <Button onClick={handlePrint} variant="primary">
                        <DownloadIcon /> Xuất PDF
                    </Button>
                </div>
            </div>

            {/* Controls */}
            <Card className="p-4 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <Label>Từ ngày</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <Label>Đến ngày</Label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div>
                        <Label>Loại báo cáo</Label>
                        <Select value={activeTab} onChange={e => setActiveTab(e.target.value as ReportType)}>
                            <option value="DASHBOARD">Tổng quan</option>
                            <option value="CASES">01_Báo cáo hồ sơ</option>
                            <option value="APPOINTMENTS">03_Báo cáo lịch hẹn</option>
                            <option value="QUESTIONS">04_Báo cáo hỏi đáp</option>
                            <option value="PERSONS">05_Báo cáo Sinh viên</option>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { setStartDate(''); setEndDate(''); }} className="w-full">Xoá lọc</Button>
                    </div>
                </div>
            </Card>

            {/* --- DASHBOARD VIEW --- */}
            <div className={activeTab === 'DASHBOARD' ? 'block' : 'hidden print:hidden'}>
                <PrintHeader title="DASHBOARD KPI (TỔNG HỢP TỪ CÁC SHEET BÁO CÁO)" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:grid-cols-3">
                    <Card className="p-4 print:border print:border-gray-400 print:shadow-none">
                        <h3 className="font-bold text-lg mb-2 text-center">Tổng quan các hồ sơ</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b"><th className="text-left py-1">State</th><th className="text-right py-1">Count</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>Đang xử lý</td><td className="text-right">{stats.caseStats.processing}</td></tr>
                                    <tr><td>Đã hoàn thành</td><td className="text-right">{stats.caseStats.completed}</td></tr>
                                    <tr><td>Đang chờ</td><td className="text-right">{stats.caseStats.waiting}</td></tr>
                                    <tr className="font-bold border-t"><td>Total</td><td className="text-right">{stats.caseStats.total}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                    <Card className="p-4 print:border print:border-gray-400 print:shadow-none">
                        <h3 className="font-bold text-lg mb-2 text-center">Tổng quan lịch hẹn</h3>
                         <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b"><th className="text-left py-1">Trạng thái</th><th className="text-right py-1">Số lượng</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>Chờ xử lý</td><td className="text-right">{stats.apptStats.pending}</td></tr>
                                    <tr><td>Được chấp thuận</td><td className="text-right">{stats.apptStats.approved}</td></tr>
                                    <tr><td>Đã hủy</td><td className="text-right">{stats.apptStats.cancelled}</td></tr>
                                    <tr className="font-bold border-t"><td>Tổng cộng</td><td className="text-right">{stats.apptStats.total}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                    <Card className="p-4 print:border print:border-gray-400 print:shadow-none">
                        <h3 className="font-bold text-lg mb-2 text-center">Tổng quan câu hỏi</h3>
                         <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b"><th className="text-left py-1">Trạng thái</th><th className="text-right py-1">Số lượng</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>Chờ xử lý</td><td className="text-right">{stats.questStats.pending}</td></tr>
                                    <tr><td>Đã trả lời</td><td className="text-right">{stats.questStats.answered}</td></tr>
                                    <tr className="font-bold border-t"><td>Tổng cộng</td><td className="text-right">{stats.questStats.total}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
                    <Card className="p-6 h-80">
                         <h3 className="font-bold mb-4">Hồ sơ theo chương trình</h3>
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categories.map(c => ({ name: c.name, count: filteredCases.filter(k => k.categoryId === c.id).length }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#0077B6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card className="p-6 h-80">
                         <h3 className="font-bold mb-4">Trạng thái lịch hẹn</h3>
                          <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={[
                                            { name: 'Chờ xử lý', value: stats.apptStats.pending },
                                            { name: 'Được chấp thuận', value: stats.apptStats.approved },
                                            { name: 'Đã hủy', value: stats.apptStats.cancelled },
                                        ]} 
                                        cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label
                                    >
                                        {['Chờ xử lý', 'Được chấp thuận', 'Đã hủy'].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                    </Card>
                </div>
                <PrintFooter />
            </div>

            {/* --- CASES REPORT --- */}
            <div className={activeTab === 'CASES' ? 'block' : 'hidden print:hidden'}>
                <PrintHeader title="BÁO CÁO TÌNH TRẠNG Xử LÝ HỒ SƠ DU HỌC" />
                <Card className="overflow-hidden print:shadow-none print:border-0">
                    <table className="min-w-full text-xs md:text-sm border-collapse border border-gray-300 print:border-gray-500">
                        <TableHeader cols={['STT', 'Mã hồ sơ', 'Tên hồ sơ', 'Chương trình', 'Trạng thái', 'Trường/Quốc gia', 'Ngày tạo', 'Ngày cập nhật']} />
                        <tbody>
                            {filteredCases.map((c, idx) => (
                                <tr key={c.id} className="border border-gray-300 print:border-gray-500 hover:bg-gray-50 print:break-inside-avoid">
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 text-center">{idx + 1}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{c.id}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 font-medium">{c.caseName || '-'}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{categories.find(cat => cat.id === c.categoryId)?.name || '-'}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{c.status || '-'}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{c.courtName || '-'} / {c.location || '-'}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 whitespace-nowrap">{formatDate(c.updatedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
                <PrintFooter />
            </div>

            {/* --- APPOINTMENTS REPORT --- */}
            <div className={activeTab === 'APPOINTMENTS' ? 'block' : 'hidden print:hidden'}>
                <PrintHeader title="BÁO CÁO LỊCH HẸN TƯ VẤN" />
                <Card className="overflow-hidden print:shadow-none print:border-0">
                    <table className="min-w-full text-xs md:text-sm border-collapse border border-gray-300 print:border-gray-500">
                        <TableHeader cols={['STT', 'Mã lịch hẹn', 'Sinh viên', 'Cố vấn', 'Thời gian', 'Trạng thái', 'Ghi chú']} />
                        <tbody>
                            {filteredAppointments.map((a, idx) => (
                                <tr key={a.id} className="border border-gray-300 print:border-gray-500 hover:bg-gray-50 print:break-inside-avoid">
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 text-center">{idx + 1}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{a.id}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 font-medium">{a.userName || '-'}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{a.lawyerName || '-'}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 whitespace-nowrap">{formatDateTime(a.appointmentTime)}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{a.status}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 italic">{a.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
                <PrintFooter />
            </div>

            {/* --- QUESTIONS REPORT --- */}
            <div className={activeTab === 'QUESTIONS' ? 'block' : 'hidden print:hidden'}>
                <PrintHeader title="BÁO CÁO HỎI – ĐÁP TƯ VẤN" />
                <Card className="overflow-hidden print:shadow-none print:border-0">
                    <table className="min-w-full text-xs md:text-sm border-collapse border border-gray-300 print:border-gray-500">
                        <TableHeader cols={['STT', 'Mã câu hỏi', 'Sinh viên', 'Cố vấn', 'Ngày hỏi', 'Trạng thái', 'Câu hỏi']} />
                        <tbody>
                            {filteredQuestions.map((q, idx) => (
                                <tr key={q.id} className="border border-gray-300 print:border-gray-500 hover:bg-gray-50 print:break-inside-avoid">
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 text-center">{idx + 1}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{q.id}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 font-medium">{q.questionerName || '-'}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{q.lawyerName || '-'}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 whitespace-nowrap">{formatDateTime(q.createdAt)}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">
                                        {q.answer ? <span className="text-green-600 font-bold print:text-black">Đã trả lời</span> : <span className="text-yellow-600 font-bold print:text-black">Chờ xử lý</span>}
                                    </td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 max-w-xs truncate">{q.content || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
                <PrintFooter />
            </div>

             {/* --- PERSONS REPORT --- */}
             <div className={activeTab === 'PERSONS' ? 'block' : 'hidden print:hidden'}>
                <PrintHeader title="BÁO CÁO DANH SÁCH SINH VIÊN" />
                <Card className="overflow-hidden print:shadow-none print:border-0">
                    <table className="min-w-full text-xs md:text-sm border-collapse border border-gray-300 print:border-gray-500">
                        <TableHeader cols={['STT', 'Mã sinh viên', 'Tên', 'Vai trò', 'Thông tin liên hệ']} />
                        <tbody>
                            {filteredPersons.map((p, idx) => (
                                <tr key={p.id} className="border border-gray-300 print:border-gray-500 hover:bg-gray-50 print:break-inside-avoid">
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 text-center">{idx + 1}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{p.id}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500 font-bold">{p.name || '-'}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{p.role || '-'}</td>
                                    <td className="px-3 py-2 border border-gray-300 print:border-gray-500">{p.contactInfo || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
                <PrintFooter />
            </div>

            {/* Style to hide non-printing elements when printing */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                    #root, #root > div, main, .p-4, .p-6 {
                        padding: 0;
                        margin: 0;
                        background: white;
                    }
                    /* Specifically target the active tab content to be visible */
                    .block {
                        display: block !important;
                        visibility: visible !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    /* Make all children of the active tab visible */
                    .block * {
                        visibility: visible !important;
                    }
                    /* Ensure tables look good */
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    th, td {
                        border: 1px solid #000 !important;
                        padding: 4px 8px !important;
                        color: #000 !important;
                    }
                    /* Hide scrollbars */
                    ::-webkit-scrollbar {
                        display: none;
                    }
                    /* Page breaks */
                    tr {
                        break-inside: avoid;
                    }
                    h1, h2, h3, p {
                        color: #000 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ReportsPage;