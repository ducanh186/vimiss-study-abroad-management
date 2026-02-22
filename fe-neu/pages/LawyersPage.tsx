

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as api from '../services/apiService';
import { PersonResponse, PersonRequest, CaseResponse, CategoryResponse } from '../types';
import { Card, Spinner, Input, UsersIcon, Button, Modal, Label, PlusIcon, EditIcon, DeleteIcon, Select, ChatBubbleIcon, CalendarIcon } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { AskQuestionModal } from './MyQuestionsPage'; 
import { BookingModal } from './MyAppointmentsPage';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const PersonForm: React.FC<{
    initialData: PersonResponse | null;
    onSubmit: (data: PersonRequest) => void;
    onCancel: () => void;
}> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<PersonRequest>({
        name: initialData?.name || '',
        role: 'lawyer',
        contactInfo: initialData?.contactInfo || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Tên cố vấn</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
                <Label htmlFor="contactInfo">Email / Thông tin liên hệ</Label>
                <Input id="contactInfo" name="contactInfo" value={formData.contactInfo} onChange={handleChange} required />
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
                <Button type="submit">Lưu cố vấn</Button>
            </div>
        </form>
    );
};

const AssignCaseModal: React.FC<{
    person: PersonResponse;
    onClose: () => void;
    onSave: () => void;
}> = ({ person, onClose, onSave }) => {
    const [allCases, setAllCases] = useState<CaseResponse[]>([]);
    const [assignedCaseIds, setAssignedCaseIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [caseToAssign, setCaseToAssign] = useState<string>('');
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [cases, casePersons] = await Promise.all([api.getCases(), api.getCasePersons()]);
                setAllCases(cases);
                const currentIds = casePersons.filter(cp => cp.personId === person.id).map(cp => cp.caseId);
                setAssignedCaseIds(new Set(currentIds));
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [person.id]);

    const handleAssign = async () => {
        if (!caseToAssign) return;
        const caseId = Number(caseToAssign);
        try {
            await api.createCasePerson({ caseId, personId: person.id });
            setAssignedCaseIds(prev => new Set(prev).add(caseId));
            setCaseToAssign('');
            onSave(); // Notify parent to refetch
        } catch (error) {
            alert('Không thể gán hồ sơ.');
        }
    };
    
    const unassignedCases = allCases.filter(c => !assignedCaseIds.has(c.id));

    return (
         <Modal isOpen={true} onClose={onClose} title={`Gán hồ sơ cho ${person.name}`}>
            {loading ? <Spinner /> : (
                 <div className="space-y-4">
                    <Label>Chọn một hồ sơ để gán</Label>
                    <div className="flex gap-2">
                        <Select value={caseToAssign} onChange={e => setCaseToAssign(e.target.value)} className="flex-grow">
                            <option value="">Chọn hồ sơ...</option>
                            {unassignedCases.map(c => (
                                <option key={c.id} value={c.id}>{c.caseName}</option>
                            ))}
                        </Select>
                        <Button onClick={handleAssign} disabled={!caseToAssign}>Gán</Button>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button variant="primary" onClick={onClose}>Xong</Button>
                    </div>
                 </div>
            )}
        </Modal>
    )
}

const LawyerDetail: React.FC<{ lawyerId: string }> = ({ lawyerId }) => {
    const [lawyer, setLawyer] = useState<PersonResponse | null>(null);
    const [assignedCases, setAssignedCases] = useState<CaseResponse[]>([]);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [casesByCategory, setCasesByCategory] = useState<{ name: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAdmin, isLawyer } = useAuth();
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const lawyerData = await api.getPersonById(Number(lawyerId));
            if (lawyerData.role.toLowerCase() !== 'lawyer') {
                setError("Người này không phải là cố vấn.");
                setLoading(false);
                return;
            }
            setLawyer(lawyerData);

            const [allCases, allCasePersons, allCategories] = await Promise.all([
                api.getCases(), 
                api.getCasePersons(),
                api.getCategories()
            ]);
            
            setCategories(allCategories);

            const caseIds = allCasePersons
                .filter(cp => cp.personId === Number(lawyerId))
                .map(cp => cp.caseId);
            
            const currentAssignedCases = allCases.filter(c => caseIds.includes(c.id));
            setAssignedCases(currentAssignedCases);

            if (currentAssignedCases.length > 0 && allCategories.length > 0) {
                const categoryCounts = currentAssignedCases.reduce((acc, currentCase) => {
                    const categoryId = currentCase.categoryId;
                    acc[categoryId] = (acc[categoryId] || 0) + 1;
                    return acc;
                }, {} as Record<number, number>);

                const chartData = Object.entries(categoryCounts).map(([categoryId, count]) => {
                    const category = allCategories.find(c => c.id === Number(categoryId));
                    return {
                        name: category ? category.name : 'Không xác định',
                        value: count
                    };
                });
                setCasesByCategory(chartData);
            } else {
                setCasesByCategory([]);
            }

        } catch (err) {
            setError("Không thể tải chi tiết cố vấn.");
        } finally {
            setLoading(false);
        }
    }, [lawyerId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRemoveFromCase = async (caseId: number) => {
        if (!lawyer) return;
        if (window.confirm("Bạn có chắc chắn muốn gỡ bỏ cố vấn này khỏi hồ sơ không?")) {
            try {
                await api.deleteCasePerson(caseId, lawyer.id);
                fetchData();
            } catch (err) {
                alert("Không thể gỡ bỏ cố vấn khỏi hồ sơ.");
            }
        }
    };
    
    const getCategoryName = (categoryId: number) => {
        return categories.find(c => c.id === categoryId)?.name || 'Unknown';
    };
    
    if (loading) return <div className="flex justify-center mt-10"><Spinner /></div>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!lawyer) return <p>Không tìm thấy cố vấn.</p>;
    
    const PIE_COLORS = ['#0077B6', '#14b8a6', '#f59e0b', '#ef4444', '#64748b', '#3b82f6'];

    return (
        <div>
            <Link to="/app/lawyers" className="text-accent hover:underline mb-6 inline-block font-semibold">&larr; Quay lại danh sách cố vấn</Link>
            <div className="md:flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-primary mb-2">{lawyer.name}</h1>
                    <p className="text-secondary">{lawyer.contactInfo}</p>
                </div>
                 <div className="flex gap-2 mt-4 md:mt-0">
                    {!isLawyer && (
                        <>
                            <Button onClick={() => setIsQuestionModalOpen(true)} variant="secondary"><ChatBubbleIcon/>Đặt câu hỏi</Button>
                            <Button onClick={() => setIsAppointmentModalOpen(true)}><CalendarIcon/>Đặt lịch hẹn</Button>
                        </>
                    )}
                    {isAdmin && <Button onClick={() => setIsAssignModalOpen(true)}>Gán hồ sơ</Button>}
                 </div>
            </div>

            <div className="space-y-8">
                <Card className="overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-2xl font-semibold text-primary">Các hồ sơ được gán ({assignedCases.length})</h2>
                    </div>
                    {assignedCases.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-background/50">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-secondary">Tên hồ sơ</th>
                                        <th className="px-6 py-4 font-semibold text-secondary">Trường</th>
                                        <th className="px-6 py-4 font-semibold text-secondary">Quốc gia</th>
                                        <th className="px-6 py-4 font-semibold text-secondary">Chương trình</th>
                                        <th className="px-6 py-4 font-semibold text-secondary">Trạng thái</th>
                                        {isAdmin && <th className="px-6 py-4 font-semibold text-secondary text-right">Hành động</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {assignedCases.map(caseItem => (
                                        <tr 
                                            key={caseItem.id} 
                                            onClick={() => navigate(`/app/cases/${caseItem.id}`)}
                                            className="hover:bg-accent/5 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 font-medium text-primary">{caseItem.caseName}</td>
                                            <td className="px-6 py-4 text-secondary">{caseItem.courtName || '-'}</td>
                                            <td className="px-6 py-4 text-secondary">{caseItem.location || '-'}</td>
                                            <td className="px-6 py-4 text-secondary">{getCategoryName(caseItem.categoryId)}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">
                                                    {caseItem.status}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-right">
                                                    <Button 
                                                        variant="danger" 
                                                        size="sm" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveFromCase(caseItem.id);
                                                        }}
                                                    >
                                                        Gỡ bỏ
                                                    </Button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="p-8 text-secondary text-center">Cố vấn này chưa được gán cho bất kỳ hồ sơ nào.</p>
                    )}
                </Card>

                <Card className="p-6">
                    <h2 className="text-2xl font-semibold text-primary mb-4">Phân bố chương trình hồ sơ</h2>
                    {casesByCategory.length > 0 ? (
                        <div className="w-full h-80">
                            <ResponsiveContainer>
                                <PieChart>
                                    {/* Fix: Explicitly type the label props to resolve "The left-hand side of an arithmetic operation must be of type 'any'..." error. */}
                                    <Pie 
                                        data={casesByCategory} 
                                        cx="50%" 
                                        cy="50%" 
                                        labelLine={false} 
                                        outerRadius={100} 
                                        fill="#8884d8" 
                                        dataKey="value" 
                                        nameKey="name" 
                                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {casesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #c5ddf0', borderRadius: '0.5rem' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-secondary py-8 text-center">Không có dữ liệu chương trình hồ sơ để hiển thị.</p>
                    )}
                </Card>
            </div>

            {isAssignModalOpen && (
                <AssignCaseModal 
                    person={lawyer}
                    onClose={() => setIsAssignModalOpen(false)}
                    onSave={fetchData}
                />
            )}
             {isQuestionModalOpen && (
                <AskQuestionModal 
                    onClose={() => setIsQuestionModalOpen(false)} 
                    onSuccess={() => {
                        alert("Your question has been sent!");
                        setIsQuestionModalOpen(false);
                    }}
                    initialLawyerId={lawyer.id}
                />
            )}
            {isAppointmentModalOpen && (
                <BookingModal 
                    onClose={() => setIsAppointmentModalOpen(false)} 
                    onSuccess={() => {
                        alert("Your appointment request has been sent!");
                        setIsAppointmentModalOpen(false);
                    }}
                    initialLawyerId={lawyer.id}
                />
            )}
        </div>
    );
};


const LawyerList: React.FC = () => {
    const [lawyers, setLawyers] = useState<PersonResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { isAdmin } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLawyer, setEditingLawyer] = useState<PersonResponse | null>(null);

    const fetchLawyers = useCallback(async () => {
        try {
            setLoading(true);
            const allPersons = await api.getPersons();
            setLawyers(allPersons.filter(person => person.role.toLowerCase() === 'lawyer'));
        } catch (err: any) {
            setError('Không thể tải thông tin cố vấn.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLawyers();
    }, [fetchLawyers]);

    const handleOpenModal = (lawyer: PersonResponse | null = null) => {
        setError('');
        setEditingLawyer(lawyer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLawyer(null);
    };
    
    const handleFormSubmit = async (data: PersonRequest) => {
        try {
            if (editingLawyer) {
                await api.updatePerson(editingLawyer.id, data);
            } else {
                await api.createPerson(data);
            }
            handleCloseModal();
            fetchLawyers();
        } catch (err: any) {
            setError(err.message || 'Không thể lưu cố vấn.');
        }
    };
    
    const handleDelete = async (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xoá cố vấn này không? Cố vấn sẽ hủy khỏi các hồ sơ.")) {
            setError('');
            try {
                await api.deletePerson(id);
                fetchLawyers();
            } catch (err: any) {
                if (err.message && err.message.toLowerCase().includes('foreign key constraint fails')) {
                    setError('Không thể xoá cố vấn này. Cố vấn được liên kết với câu hỏi, lịch hẹn hoặc hồ sơ. Vui lòng xóa các liên kết này trước tiên.');
                } else {
                    setError(err.message || 'Không thể xoá cố vấn.');
                }
            }
        }
    };

    const filteredLawyers = useMemo(() => {
        return lawyers.filter(lawyer =>
            lawyer.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [lawyers, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Cố vấn</h1>
                 {isAdmin && <Button onClick={() => handleOpenModal()}><PlusIcon/> Thêm cố vấn mới</Button>}
            </div>

            <div className="mb-6">
                <Input
                    type="text"
                    placeholder="Tìm kiếm cố vấn theo tên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg mb-6">{error}</p>}

            {loading ? (
                <div className="flex justify-center items-center h-64"><Spinner /></div>
            ) : (
                <>
                    {filteredLawyers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredLawyers.map(lawyer => (
                                <Card key={lawyer.id} className="p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                                     <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-lg font-semibold text-primary group-hover:text-accent transition-colors pr-2">{lawyer.name}</h2>
                                            {isAdmin && (
                                                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(lawyer)} className="p-1 text-secondary hover:text-primary"><EditIcon /></button>
                                                    <button onClick={() => handleDelete(lawyer.id)} className="p-1 text-secondary hover:text-red-500"><DeleteIcon /></button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-secondary text-sm mb-4">{lawyer.contactInfo}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border text-right">
                                        <Link to={`/app/lawyers/${lawyer.id}`} className="text-sm font-semibold text-accent opacity-75 group-hover:opacity-100 group-hover:underline transition-all">Xem chi tiết &rarr;</Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-secondary mt-12">
                            Không tìm thấy cố vấn nào.
                        </p>
                    )}
                </>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingLawyer ? 'Chỉnh sửa cố vấn' : 'Thêm cố vấn mới'}>
                <PersonForm
                    initialData={editingLawyer}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

const LawyersPage: React.FC = () => {
    const { lawyerId } = useParams<{ lawyerId?: string }>();
    return lawyerId ? <LawyerDetail lawyerId={lawyerId} /> : <LawyerList />;
};

export default LawyersPage;
