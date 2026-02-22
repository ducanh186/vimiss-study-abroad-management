

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../services/apiService';
import { PersonResponse, PersonRequest, CaseResponse } from '../types';
import { Card, Spinner, Input, Button, Modal, Label, PlusIcon, EditIcon, DeleteIcon, Select } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const PersonForm: React.FC<{
    initialData: PersonResponse | null;
    onSubmit: (data: PersonRequest) => void;
    onCancel: () => void;
}> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<PersonRequest>({
        name: initialData?.name || '',
        role: initialData?.role || 'plaintiff',
        contactInfo: initialData?.contactInfo || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
                <Label htmlFor="role">Vai trò</Label>
                <Select id="role" name="role" value={formData.role} onChange={handleChange} required>
                    <option value="plaintiff">Ứng viên</option>
                    <option value="defendant">Người bảo trợ</option>
                </Select>
            </div>
            <div>
                <Label htmlFor="contactInfo">Thông tin liên hệ</Label>
                <Input id="contactInfo" name="contactInfo" value={formData.contactInfo} onChange={handleChange} />
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
                <Button type="submit">Lưu sinh viên</Button>
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
            alert('Failed to assign case.');
        }
    };
    
    const unassignedCases = allCases.filter(c => !assignedCaseIds.has(c.id));

    return (
         <Modal isOpen={true} onClose={onClose} title={`Gán hồ sơ cho ${person.name}`}>
            {loading ? <Spinner /> : (
                 <div className="space-y-4">
                    <Label>Chọn hồ sơ để gán</Label>
                    <div className="flex gap-2">
                        <Select value={caseToAssign} onChange={e => setCaseToAssign(e.target.value)} className="flex-grow">
                            <option value="">Chọn một hồ sơ...</option>
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

const PersonDetail: React.FC<{ personId: string }> = ({ personId }) => {
    const [person, setPerson] = useState<PersonResponse | null>(null);
    const [assignedCases, setAssignedCases] = useState<CaseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAdmin } = useAuth();
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const personData = await api.getPersonById(Number(personId));
            setPerson(personData);

            const [allCases, allCasePersons] = await Promise.all([api.getCases(), api.getCasePersons()]);
            const caseIds = allCasePersons
                .filter(cp => cp.personId === Number(personId))
                .map(cp => cp.caseId);
            setAssignedCases(allCases.filter(c => caseIds.includes(c.id)));
        } catch (err) {
            setError("Không thể tải chi tiết sinh viên.");
        } finally {
            setLoading(false);
        }
    }, [personId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleRemoveFromCase = async (caseId: number) => {
        if (!person) return;
        if (window.confirm("Bạn có chắc chắn muốn gỡ bỏ sinh viên này khỏi hồ sơ không?")) {
            try {
                await api.deleteCasePerson(caseId, person.id);
                fetchData();
            } catch (err) {
                alert("Không thể gỡ bỏ sinh viên khỏi hồ sơ.");
            }
        }
    };
    
    if (loading) return <div className="flex justify-center mt-10"><Spinner /></div>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!person) return <p>Không tìm thấy sinh viên.</p>;
    
    return (
        <div>
            <Link to="/app/persons" className="text-accent hover:underline mb-6 inline-block font-semibold">&larr; Quay lại danh sách sinh viên</Link>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-primary mb-2">{person.name}</h1>
                    <p className="text-secondary capitalize">{person.role}</p>
                </div>
                 {isAdmin && <Button onClick={() => setIsAssignModalOpen(true)}>Gán hồ sơ</Button>}
            </div>

            <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4 text-primary">Hồ sơ liên quan ({assignedCases.length})</h2>
                {assignedCases.length > 0 ? (
                    <div className="divide-y divide-border -mx-6">
                        {assignedCases.map(caseItem => (
                            <div key={caseItem.id} className="py-4 px-6 flex justify-between items-center hover:bg-background transition-colors group">
                                <div>
                                    <h3 className="font-semibold text-primary">{caseItem.caseName}</h3>
                                    <p className="text-sm text-secondary">{caseItem.courtName}</p>
                                </div>
                                 <div className="flex items-center gap-4">
                                     <Link to={`/app/cases/${caseItem.id}`} className="text-accent hover:underline text-sm font-semibold">Xem hồ sơ</Link>
                                     {/* Fix: Removed size-related classes as they are now handled by the `size` prop. */}
                                     {isAdmin && <Button variant="danger" size="sm" onClick={() => handleRemoveFromCase(caseItem.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">Gỡ bỏ</Button>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-secondary py-8 text-center">Sinh viên này chưa được gán cho bất kỳ hồ sơ nào.</p>
                )}
            </Card>
             {isAssignModalOpen && (
                <AssignCaseModal 
                    person={person}
                    onClose={() => setIsAssignModalOpen(false)}
                    onSave={fetchData}
                />
            )}
        </div>
    );
};


const PersonList: React.FC = () => {
    const [persons, setPersons] = useState<PersonResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ search: '', role: 'all' });
    const { isAdmin } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<PersonResponse | null>(null);

    const fetchPersons = useCallback(async () => {
        try {
            setLoading(true);
            const allPersons = await api.getPersons();
            setPersons(allPersons.filter(person => person.role.toLowerCase() !== 'lawyer'));
        } catch (err: any) {
            setError('Không thể tải thông tin sinh viên.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPersons();
    }, [fetchPersons]);
    
     const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleOpenModal = (person: PersonResponse | null = null) => {
        setError('');
        setEditingPerson(person);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPerson(null);
    };
    
    const handleFormSubmit = async (data: PersonRequest) => {
        try {
            if (editingPerson) {
                await api.updatePerson(editingPerson.id, data);
            } else {
                await api.createPerson(data);
            }
            handleCloseModal();
            fetchPersons();
        } catch (err: any) {
            setError(err.message || 'Không thể lưu thông tin sinh viên.');
        }
    };
    
    const handleDelete = async (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa sinh viên này? Họ sẽ được gỡ bỏ khỏi tất cả hồ sơ.")) {
            setError('');
            try {
                await api.deletePerson(id);
                fetchPersons();
            } catch (err: any) {
                if (err.message && err.message.toLowerCase().includes('foreign key constraint fails')) {
                    setError('Không thể xóa sinh viên này. Họ hiện đang được liên kết với một hoặc nhiều hồ sơ. Vui lòng gỡ bỏ họ khỏi tất cả hồ sơ trước.');
                } else {
                    setError(err.message || 'Không thể xóa sinh viên.');
                }
            }
        }
    };

    const filteredPersons = useMemo(() => {
        return persons.filter(person => {
            const matchesSearch = person.name.toLowerCase().includes(filters.search.toLowerCase());
            const matchesRole = filters.role === 'all' || person.role.toLowerCase() === filters.role;
            return matchesSearch && matchesRole;
        });
    }, [persons, filters]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Sinh viên</h1>
                 {isAdmin && <Button onClick={() => handleOpenModal()}><PlusIcon/> Thêm sinh viên</Button>}
            </div>

            <Card className="mb-8 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="search" placeholder="Tìm kiếm theo tên..." value={filters.search} onChange={handleFilterChange} />
                    <Select name="role" value={filters.role} onChange={handleFilterChange}>
                        <option value="all">Tất cả vai trò</option>
                        <option value="plaintiff">Ứng viên</option>
                        <option value="defendant">Người bảo trợ</option>
                    </Select>
                </div>
            </Card>

             {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg mb-6">{error}</p>}

            {loading ? (
                <div className="flex justify-center items-center h-64"><Spinner /></div>
            ) : (
                <>
                    {filteredPersons.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPersons.map(person => (
                                <Card key={person.id} className="p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                                     <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-lg font-semibold text-primary group-hover:text-accent transition-colors pr-2">{person.name}</h2>
                                            {isAdmin && (
                                                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(person)} className="p-1 text-secondary hover:text-primary"><EditIcon /></button>
                                                    <button onClick={() => handleDelete(person.id)} className="p-1 text-secondary hover:text-red-500"><DeleteIcon /></button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-secondary text-sm capitalize">{person.role}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border text-right">
                                        <Link to={`/app/persons/${person.id}`} className="text-sm font-semibold text-accent opacity-75 group-hover:opacity-100 group-hover:underline transition-all">Xem chi tiết &rarr;</Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-secondary py-16">
                            Không có sinh viên nào phù hợp với tiêu chí tìm kiếm của bạn.
                        </p>
                    )
                }
                </>
            )}
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPerson ? 'Chỉnh sửa sinh viên' : 'Thêm sinh viên'}>
                <PersonForm
                    initialData={editingPerson}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

const PersonsPage: React.FC = () => {
    const { personId } = useParams<{ personId?: string }>();
    return personId ? <PersonDetail personId={personId} /> : <PersonList />;
};

export default PersonsPage;