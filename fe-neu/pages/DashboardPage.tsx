import React, { useEffect, useState } from 'react';
import { getCases, getCategories, getPersons } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Card, Spinner } from '../components/ui';
import { CaseResponse, PersonResponse } from '../types';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <Card className="text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 p-6">
        <p className="text-5xl font-bold text-accent">{value}</p>
        <h3 className="text-lg font-semibold text-secondary dark:text-slate-400 mt-2">{title}</h3>
    </Card>
);

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ cases: 0, categories: 0, persons: 0 });
    const [recentCases, setRecentCases] = useState<CaseResponse[]>([]);
    const [casesByCategory, setCasesByCategory] = useState<({ id: number; name: string; count: number; })[]>([]);
    const [casesByMonth, setCasesByMonth] = useState<({ name: string; count: number })[]>([]);
    const [personsByRole, setPersonsByRole] = useState<({ name: string; value: number })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [cases, categories, persons] = await Promise.all([
                    getCases(),
                    getCategories(),
                    getPersons()
                ]);

                setStats({
                    cases: cases.length,
                    categories: categories.length,
                    persons: persons.length,
                });

                const sortedCases = [...cases].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                setRecentCases(sortedCases.slice(0, 5));

                const categoryCounts = categories.map(category => {
                    const count = cases.filter(c => c.categoryId === category.id).length;
                    return { id: category.id, name: category.name, count };
                });
                setCasesByCategory(categoryCounts);
                
                const monthNames = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];
                const casesByMonthData = Array(12).fill(0).map((_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    return {
                        name: `${monthNames[d.getMonth()]} '${d.getFullYear().toString().slice(-2)}`,
                        count: 0,
                        month: d.getMonth(),
                        year: d.getFullYear()
                    };
                }).reverse();

                cases.forEach(c => {
                    const caseDate = new Date(c.createdAt);
                    const caseMonth = caseDate.getMonth();
                    const caseYear = caseDate.getFullYear();
                    const monthData = casesByMonthData.find(m => m.month === caseMonth && m.year === caseYear);
                    if (monthData) {
                        monthData.count++;
                    }
                });
                setCasesByMonth(casesByMonthData.map(({name, count}) => ({name, count})));

                const roleCounts = persons.reduce((acc: { [key: string]: number }, person: PersonResponse) => {
                    const role = person.role || 'Chưa rõ';
                    acc[role] = (acc[role] || 0) + 1;
                    return acc;
                }, {});

                const personsByRoleData = Object.keys(roleCounts).map(role => {
                    let vietnameseRole = role;
                    if (role === 'lawyer') vietnameseRole = 'Cố vấn';
                    if (role === 'plaintiff') vietnameseRole = 'Ứng viên';
                    if (role === 'defendant') vietnameseRole = 'Người bảo trợ';
                    return {
                        name: vietnameseRole,
                        value: roleCounts[role]
                    }
                });
                setPersonsByRole(personsByRoleData);


            } catch (err: any) {
                setError('Không thể tải dữ liệu tổng quan.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);
    
    const PIE_COLORS = ['#0077B6', '#14b8a6', '#f59e0b', '#ef4444', '#64748b'];


    return (
        <div>
            <h1 className="text-3xl font-bold text-primary dark:text-slate-100 mb-8">Tổng quan hệ thống</h1>
            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <Spinner />
                 </div>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard title="Tổng số hồ sơ" value={stats.cases} />
                        <StatCard title="Tổng số chương trình" value={stats.categories} />
                        <StatCard title="Tổng số sinh viên" value={stats.persons} />
                    </div>

                    <Card className="p-6 mb-8">
                        <h2 className="text-2xl font-semibold text-primary dark:text-slate-100 mb-4">Hồ sơ mới theo tháng (12 tháng qua)</h2>
                        <div className="w-full h-80">
                           <ResponsiveContainer>
                               <BarChart data={casesByMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                   <CartesianGrid strokeDasharray="3 3" stroke="#c5ddf0" />
                                   <XAxis dataKey="name" tick={{ fill: '#4a6785', fontSize: 12 }} />
                                   <YAxis allowDecimals={false} tick={{ fill: '#4a6785' }} />
                                   <Tooltip cursor={{ fill: '#edf4fb' }} contentStyle={{ background: '#ffffff', border: '1px solid #c5ddf0', borderRadius: '0.5rem' }} />
                                   <Bar dataKey="count" fill="#0077B6" name="Số hồ sơ" />
                               </BarChart>
                           </ResponsiveContainer>
                       </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="p-6">
                            <h2 className="text-2xl font-semibold text-primary dark:text-slate-100 mb-4">Cơ cấu sinh viên theo vai trò</h2>
                            {personsByRole.length > 0 ? (
                                <div className="w-full h-80">
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={personsByRole} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                {personsByRole.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #c5ddf0', borderRadius: '0.5rem' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <p className="text-secondary dark:text-slate-400">Không có dữ liệu sinh viên.</p>}
                        </Card>
                         <Card className="p-6">
                            <h2 className="text-2xl font-semibold text-primary dark:text-slate-100 mb-4">Hoạt động gần đây</h2>
                            {recentCases.length > 0 ? (
                                <div className="space-y-3">
                                    {recentCases.map(c => (
                                        <div key={c.id} className="flex justify-between items-center p-3 bg-background dark:bg-slate-700/50 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-primary dark:text-slate-100">{c.caseName}</p>
                                                <p className="text-sm text-secondary dark:text-slate-400">Cập nhật: {new Date(c.updatedAt).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                            <Link to={`/app/cases/${c.id}`} className="text-accent font-semibold hover:underline text-sm">Xem</Link>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-secondary dark:text-slate-400">Không có hoạt động gần đây.</p>}
                        </Card>
                         <Card className="p-6 lg:col-span-2">
                            <h2 className="text-2xl font-semibold text-primary dark:text-slate-100 mb-4">Thống kê theo chương trình</h2>
                            {casesByCategory.length > 0 ? (
                               <div className="w-full h-80">
                                   <ResponsiveContainer>
                                       <BarChart
                                           data={casesByCategory}
                                           margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                                       >
                                           <CartesianGrid strokeDasharray="3 3" stroke="#c5ddf0" />
                                           <XAxis dataKey="name" tick={{ fill: '#4a6785', fontSize: 12 }} />
                                           <YAxis allowDecimals={false} tick={{ fill: '#4a6785' }} />
                                           <Tooltip
                                               cursor={{ fill: '#edf4fb' }}
                                               contentStyle={{
                                                   background: '#ffffff',
                                                   border: '1px solid #c5ddf0',
                                                   borderRadius: '0.5rem',
                                               }}
                                           />
                                           <Bar dataKey="count" fill="#14b8a6" name="Hồ sơ" />
                                       </BarChart>
                                   </ResponsiveContainer>
                               </div>
                            ) : <p className="text-secondary dark:text-slate-400">Không có dữ liệu chương trình.</p>}
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardPage;