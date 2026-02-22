import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../services/apiService';
import { BASE_URL } from '../services/apiService';
import { CaseResponse, CaseRequest, CategoryResponse, CaseFileResponse, PersonResponse, CasePersonResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button, Modal, Input, Textarea, Select, Spinner, PlusIcon, EditIcon, DeleteIcon, Label, Card, DownloadIcon, EyeIcon } from '../components/ui';

const CaseForm: React.FC<{
    initialData: CaseResponse | null;
    categories: CategoryResponse[];
    onSubmit: (data: CaseRequest, newFiles: File[]) => void;
    onCancel: () => void;
}> = ({ initialData, categories, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<CaseRequest>({
        caseName: initialData?.caseName || '',
        caseDescription: initialData?.caseDescription || '',
        status: initialData?.status || 'OPEN',
        courtName: initialData?.courtName || '',
        location: initialData?.location || '',
        categoryId: initialData?.categoryId || categories[0]?.id || undefined,
    });
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [existingFiles, setExistingFiles] = useState<CaseFileResponse[]>([]);
    const [fileError, setFileError] = useState('');

    useEffect(() => {
        if (initialData?.id) {
            const fetchFiles = async () => {
                try {
                    const allFiles = await api.getCaseFiles();
                    setExistingFiles(allFiles.filter(f => f.caseId === initialData.id));
                } catch (error) {
                    console.error("Failed to fetch existing files for case", error);
                }
            };
            fetchFiles();
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'categoryId' ? Number(value) : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError('');
        if (e.target.files) {
            const addedFiles = Array.from(e.target.files);
            // Fix: Explicitly type 'file' as 'File' to resolve error "Property 'type' does not exist on type 'unknown'".
            const pdfFiles = addedFiles.filter((file: File) => file.type === 'application/pdf');
            if (pdfFiles.length !== addedFiles.length) {
                setFileError('Chỉ chấp nhận tập tin PDF.');
            }
            setNewFiles(prev => [...prev, ...pdfFiles]);
        }
    };
    
    const handleRemoveNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDeleteExistingFile = async (fileId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu này không?')) {
            try {
                await api.deleteCaseFile(fileId);
                setExistingFiles(prev => prev.filter(f => f.id !== fileId));
            } catch (error: any) {
                if (error.message && error.message.toLowerCase().includes('foreign key constraint fails')) {
                    alert('Không thể xóa tài liệu này. Có thể đang được tham chiếu bởi các bản ghi khác.');
                } else {
                    alert('Không thể xoá tài liệu.');
                }
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData, newFiles);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="caseName">Tên hồ sơ</Label>
                    <Input id="caseName" name="caseName" value={formData.caseName} onChange={handleChange} required />
                </div>
                 <div>
                    <Label htmlFor="status">Trạng thái</Label>
                    <Input id="status" name="status" value={formData.status || ''} onChange={handleChange} required />
                </div>
                 <div>
                    <Label htmlFor="courtName">Trường đại học</Label>
                    <Input id="courtName" name="courtName" value={formData.courtName || ''} onChange={handleChange} />
                </div>
                <div>
                    <Label htmlFor="location">Quốc gia</Label>
                    <Input id="location" name="location" value={formData.location || ''} onChange={handleChange} />
                </div>
                <div className="md:col-span-2">
                    <Label htmlFor="categoryId">Chương trình</Label>
                    <Select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </Select>
                </div>
                <div className="md:col-span-2">
                    <Label htmlFor="caseDescription">Mô tả</Label>
                    <Textarea id="caseDescription" name="caseDescription" value={formData.caseDescription || ''} onChange={handleChange} rows={4} />
                </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-border">
                <Label>Tài liệu hồ sơ</Label>
                 {existingFiles.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-secondary">Các tài liệu hiện có:</p>
                        <ul className="space-y-2">
                            {existingFiles.map(file => (
                                <li key={file.id} className="flex justify-between items-center text-sm p-2 bg-background rounded-md">
                                    <span>{file.fileName}</span>
                                    <button type="button" onClick={() => handleDeleteExistingFile(file.id)} className="text-red-500 hover:text-red-700 font-semibold">&times;</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div>
                     <Label htmlFor="files" className="text-sm font-medium text-secondary">Thêm tài liệu mới (Chỉ PDF):</Label>
                     <Input id="files" type="file" multiple accept=".pdf" onChange={handleFileChange} />
                     {fileError && <p className="text-red-500 text-sm mt-1">{fileError}</p>}
                </div>
                {newFiles.length > 0 && (
                    <ul className="space-y-2">
                        {newFiles.map((file, index) => (
                             <li key={index} className="flex justify-between items-center text-sm p-2 bg-background rounded-md">
                                <span>{file.name}</span>
                                <button type="button" onClick={() => handleRemoveNewFile(index)} className="text-red-500 hover:text-red-700 font-semibold">&times;</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-border">
                <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
                <Button type="submit">Lưu hồ sơ</Button>
            </div>
        </form>
    );
};

const ManageCasePersonsModal: React.FC<{
    caseItem: CaseResponse;
    onClose: () => void;
    onSave: () => void;
}> = ({ caseItem, onClose, onSave }) => {
    const [allPersons, setAllPersons] = useState<PersonResponse[]>([]);
    const [associatedPersonIds, setAssociatedPersonIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [personToAssign, setPersonToAssign] = useState<string>('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [persons, casePersons] = await Promise.all([api.getPersons(), api.getCasePersons()]);
            setAllPersons(persons);
            const currentIds = casePersons.filter(cp => cp.caseId === caseItem.id).map(cp => cp.personId);
            setAssociatedPersonIds(new Set(currentIds));
        } catch (error) {
            console.error("Failed to load persons data:", error);
        } finally {
            setLoading(false);
        }
    }, [caseItem.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddPerson = async () => {
        if (!personToAssign) return;
        const personId = Number(personToAssign);
        try {
            await api.createCasePerson({ caseId: caseItem.id, personId });
            setAssociatedPersonIds(prev => new Set(prev).add(personId));
            setPersonToAssign('');
        } catch (error) {
            alert('Không thể gán sinh viên.');
        }
    };

    const handleRemovePerson = async (personId: number) => {
        try {
            await api.deleteCasePerson(caseItem.id, personId);
            setAssociatedPersonIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(personId);
                return newSet;
            });
        } catch (error) {
            alert('Không thể gỡ bỏ sinh viên.');
        }
    };

    const associatedPersons = allPersons.filter(p => associatedPersonIds.has(p.id));
    const unassociatedPersons = allPersons.filter(p => !associatedPersonIds.has(p.id));
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`Quản lý sinh viên cho ${caseItem.caseName}`}>
            {loading ? <Spinner /> : (
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Các sinh viên liên quan</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {associatedPersons.length > 0 ? associatedPersons.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2 bg-background rounded">
                                    <span>{p.name} <span className="text-xs text-secondary">({p.role})</span></span>
                                    <Button variant="danger" onClick={() => handleRemovePerson(p.id)} className="px-2 py-1 text-xs">Gỡ bỏ</Button>
                                </div>
                            )) : <p className="text-secondary text-sm">Chưa có sinh viên nào được gán.</p>}
                        </div>
                    </div>

                    <div className="border-t border-border pt-4">
                        <h3 className="font-semibold mb-2">Gán sinh viên mới</h3>
                        <div className="flex gap-2">
                            <Select value={personToAssign} onChange={e => setPersonToAssign(e.target.value)} className="flex-grow">
                                <option value="">Chọn một sinh viên...</option>
                                {unassociatedPersons.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                                ))}
                            </Select>
                            <Button onClick={handleAddPerson} disabled={!personToAssign}>Thêm</Button>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                        <Button variant="primary" onClick={() => { onSave(); onClose(); }}>Xong</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const UploadFileModal: React.FC<{
    caseItem: CaseResponse;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ caseItem, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        setSelectedFile(null);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                setError('Chỉ chấp nhận tập tin PDF.');
                return;
            }
            const MAX_SIZE = 200 * 1024 * 1024; // 200MB
            if (file.size > MAX_SIZE) {
                setError('File size exceeds the 200MB limit.');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !user) {
            setError('Vui lòng chọn một tập tin.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('caseId', caseItem.id.toString());
            formData.append('fileName', selectedFile.name);
            formData.append('filePath', `/files/${caseItem.id}`);
            formData.append('fileType', 'pdf');
            if (user?.id) {
                formData.append('uploadedBy', user.id.toString());
            }
            await api.createCaseFile(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Không thể tải lên tài liệu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Tải lên tài liệu cho ${caseItem.caseName}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="file-upload">Chọn tài liệu</Label>
                    <Input id="file-upload" type="file" accept=".pdf" onChange={handleFileChange} />
                    <p className="text-xs text-secondary mt-1">Kích thước tài liệu tối đa: 200MB. Chỉ cho phép các tài liệu PDF.</p>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {selectedFile && !error && (
                    <p className="text-sm text-primary bg-background p-2 rounded-md">
                        Đã chọn: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                )}
                <div className="flex justify-end gap-4 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Hủy</Button>
                    <Button type="submit" disabled={!selectedFile || !!error || isLoading}>
                        {isLoading ? 'Đang tải lên...' : 'Tải lên'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};


const CaseDetail: React.FC<{ caseId: string }> = ({ caseId }) => {
    const [caseItem, setCaseItem] = useState<CaseResponse | null>(null);
    const [files, setFiles] = useState<CaseFileResponse[]>([]);
    const [associatedPersons, setAssociatedPersons] = useState<PersonResponse[]>([]);
    const [category, setCategory] = useState<CategoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<CaseFileResponse | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isManagePersonsModalOpen, setIsManagePersonsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { isAdmin } = useAuth();
    const token = localStorage.getItem('authToken');

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            const caseData = await api.getCaseById(Number(caseId));
            setCaseItem(caseData);

            if (caseData.categoryId) {
                const categoryData = await api.getCategoryById(caseData.categoryId);
                setCategory(categoryData);
            }

            const [allFiles, allPersons, allCasePersons] = await Promise.all([
                api.getCaseFiles(),
                api.getPersons(),
                api.getCasePersons()
            ]);

            setFiles(allFiles.filter(f => f.caseId === Number(caseId)));

            const personIdsForCase = allCasePersons
                .filter(cp => cp.caseId === Number(caseId))
                .map(cp => cp.personId);
            setAssociatedPersons(allPersons.filter(p => personIdsForCase.includes(p.id)));

        } catch (e: any) {
            setError("Không thể tải chi tiết hồ sơ.");
        } finally {
            setLoading(false);
        }
    }, [caseId]);


    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleDeleteFile = async (fileId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu này không? Hành động này không thể được hoàn tác.')) {
            setError('');
            try {
                await api.deleteCaseFile(fileId);
                setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
            } catch (err: any) {
                console.error("Failed to delete file:", err);
                if (err.message && err.message.toLowerCase().includes('foreign key constraint fails')) {
                    setError('Cannot delete this file. It may be referenced by other records (e.g., audit logs).');
                } else {
                    setError(err.message || 'Không thể xoá tài liệu.');
                }
            }
        }
    };

    const handlePreview = async (file: CaseFileResponse) => {
        try {
            const response = await fetch(`${BASE_URL}/casefiles/preview/${file.caseId}/${file.fileName}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Không thể xem trước tài liệu');
            const blob = await response.blob();
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            setPreviewUrl(url);
            setPreviewFile(file);
            setIsPreviewOpen(true);
        } catch (error) {
            console.error(error);
            alert('Lỗi khi xem trước tài liệu');
        }
    };
    
    const handleClosePreview = () => {
        if(previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
        }
        setIsPreviewOpen(false);
        setPreviewUrl(null);
        setPreviewFile(null);
    }

    const handleDownload = async (file: CaseFileResponse) => {
        try {
            const response = await fetch(`${BASE_URL}/casefiles/download/${file.caseId}/${file.fileName}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Tải xuống thất bại');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('Error downloading file');
        }
    };

    if (loading) return <div className="flex justify-center mt-10"><Spinner /></div>;
    if (error && !isPreviewOpen) return <p className="text-red-500">{error}</p>;
    if (!caseItem) return <p>Không tìm thấy hồ sơ.</p>;

    const groupedPersons = associatedPersons.reduce((acc, person) => {
        const role = person.role;
        if (!acc[role]) {
            acc[role] = [];
        }
        acc[role].push(person);
        return acc;
    }, {} as Record<string, PersonResponse[]>);


    return (
        <div>
            <Link to="/app/cases" className="text-accent hover:underline mb-6 inline-block font-semibold">&larr; Quay lại danh sách hồ sơ</Link>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-primary mb-2">{caseItem.caseName}</h1>
                    <p className="text-secondary">Chi tiết hồ sơ ID: {caseItem.id}</p>
                </div>
                 <span className="px-3 py-1.5 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">{caseItem.status}</span>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-primary">Thông tin hồ sơ</h2>
                        <div className="space-y-4 text-primary text-md">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <p><strong className="font-semibold text-secondary block mb-1">Trường đại học:</strong> {caseItem.courtName || 'N/A'}</p>
                                <p><strong className="font-semibold text-secondary block mb-1">Quốc gia:</strong> {caseItem.location || 'N/A'}</p>
                                <p><strong className="font-semibold text-secondary block mb-1">Chương trình:</strong> {category?.name || 'N/A'}</p>
                           </div>
                            <p><strong className="font-semibold text-secondary block mb-1">Mô tả:</strong> {caseItem.caseDescription || 'Chưa có mô tả.'}</p>
                        </div>
                    </Card>
                     <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-primary">Sinh viên liên quan</h2>
                            {isAdmin && <Button variant="secondary" onClick={() => setIsManagePersonsModalOpen(true)}>Manage</Button>}
                        </div>
                        <div className="space-y-4">
                            {(Object.entries(groupedPersons) as [string, PersonResponse[]][]).map(([role, persons]) => (
                                <div key={role}>
                                    <h3 className="font-semibold text-secondary capitalize">{role}s</h3>
                                    <ul className="list-disc list-inside ml-2">
                                        {persons.map(p => <li key={p.id} className="text-primary">{p.name}</li>)}
                                    </ul>
                                </div>
                            ))}
                            {associatedPersons.length === 0 && <p className="text-secondary">Không có sinh viên nào liên quan đến hồ sơ này.</p>}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-primary">Tài liệu hồ sơ</h2>
                             {isAdmin && <Button variant="secondary" onClick={() => setIsUploadModalOpen(true)}><PlusIcon/> Tải lên tài liệu</Button>}
                        </div>
                        {files.length > 0 ? (
                            <ul className="space-y-3">
                                {files.map(file => (
                                    <li key={file.id} className="flex justify-between items-center p-3 bg-background rounded-lg hover:bg-border/50 transition-colors">
                                        <span className="text-primary font-medium">{file.fileName}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handlePreview(file)} title="Preview" className="p-2 text-secondary hover:text-primary hover:bg-border rounded-full transition-colors"><EyeIcon /></button>
                                            <button onClick={() => handleDownload(file)} title="Download" className="p-2 text-secondary hover:text-primary hover:bg-border rounded-full transition-colors"><DownloadIcon /></button>
                                            {isAdmin && (
                                                <button onClick={() => handleDeleteFile(file.id)} title="Delete" className="p-2 text-secondary hover:text-red-500 hover:bg-border rounded-full transition-colors">
                                                    <DeleteIcon />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-secondary">Không có tài liệu nào liên quan đến hồ sơ này.</p>}
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold mb-4 text-primary">Metadata</h2>
                        <div className="space-y-3 text-primary">
                            <p><strong className="font-semibold text-secondary block">Created:</strong> {new Date(caseItem.createdAt).toLocaleString()}</p>
                            <p><strong className="font-semibold text-secondary block">Last Updated:</strong> {new Date(caseItem.updatedAt).toLocaleString()}</p>
                        </div>
                    </Card>
                </div>
            </div>

            {isPreviewOpen && previewFile && (
                <Modal isOpen={isPreviewOpen} onClose={handleClosePreview} title={`Preview: ${previewFile.fileName}`} >
                    <div className="w-full h-[75vh]">
                        {previewUrl ? (
                            <iframe src={previewUrl} className="w-full h-full rounded-lg border" title={previewFile.fileName}></iframe>
                        ) : (
                            <div className="flex items-center justify-center h-full"><Spinner /></div>
                        )}
                    </div>
                </Modal>
            )}
             {isManagePersonsModalOpen && (
                <ManageCasePersonsModal 
                    caseItem={caseItem}
                    onClose={() => setIsManagePersonsModalOpen(false)}
                    onSave={fetchAllData}
                />
            )}
            {isUploadModalOpen && caseItem && (
                 <UploadFileModal
                    caseItem={caseItem}
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={fetchAllData}
                 />
            )}
        </div>
    );
};

const CaseList: React.FC = () => {
    const [cases, setCases] = useState<CaseResponse[]>([]);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ search: '', category: 'all', status: 'all' });
    const { isAdmin, user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCase, setEditingCase] = useState<CaseResponse | null>(null);

    const fetchCasesAndCategories = useCallback(async () => {
        try {
            setLoading(true);
            const [casesData, categoriesData] = await Promise.all([api.getCases(), api.getCategories()]);
            setCases(casesData.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
            setCategories(categoriesData);
            setError('');
        } catch (err: any) {
            setError('Không thể tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCasesAndCategories();
    }, [fetchCasesAndCategories]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleOpenModal = (caseItem: CaseResponse | null = null) => {
        setError('');
        setEditingCase(caseItem);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCase(null);
    };

    const handleFormSubmit = async (data: CaseRequest, newFiles: File[]) => {
        try {
            let caseId: number;
            if (editingCase) {
                const updatedCase = await api.updateCase(editingCase.id, data);
                caseId = updatedCase.id;
            } else {
                const newCase = await api.createCase(data);
                caseId = newCase.id;
            }

            // Fix: Add Array.isArray check to fix "Property 'map' does not exist on type 'unknown'" error.
            if (Array.isArray(newFiles) && newFiles.length > 0) {
                // Fix: Explicitly typing `file` as `File` to resolve a type inference issue.
                const uploadPromises = newFiles.map((file: File) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('caseId', caseId.toString());
                    formData.append('fileName', file.name);
                    formData.append('filePath', `/files/${caseId}`);
                    formData.append('fileType', 'pdf');
                    // Fix: Changed user.userId to user.id to match the User interface.
                     if (user?.id) {
                        formData.append('uploadedBy', user.id.toString());
                    }
                    return api.createCaseFile(formData);
                });
                await Promise.all(uploadPromises);
            }
            handleCloseModal();
            fetchCasesAndCategories();
        } catch (err: any) {
            setError(err.message || 'Không thể lưu hồ sơ.');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xoá hồ sơ này không? Hành động này không thể được hoàn tác.')) {
            setError('');
            try {
                await api.deleteCase(id);
                fetchCasesAndCategories();
            } catch (err: any) {
                if (err.message && err.message.toLowerCase().includes('foreign key constraint fails')) {
                    setError('Không thể xoá hồ sơ này. Nó có các tài liệu hoặc sinh viên liên kết. Vui lòng gỡ bỏ chúng trước khi xoá hồ sơ.');
                } else {
                    setError(err.message || 'Không thể xoá hồ sơ.');
                }
            }
        }
    };

    const uniqueStatuses = useMemo(() => {
        const statuses = new Set(cases.map(c => c.status));
        return Array.from(statuses);
    }, [cases]);

    const filteredCases = useMemo(() => {
        return cases.filter(c => {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = c.caseName.toLowerCase().includes(searchLower) || c.courtName.toLowerCase().includes(searchLower);
            const matchesCategory = filters.category === 'all' || c.categoryId === Number(filters.category);
            const matchesStatus = filters.status === 'all' || c.status === filters.status;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [cases, filters]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Hồ sơ</h1>
                 {isAdmin && <Button onClick={() => handleOpenModal()}><PlusIcon /> Thêm hồ sơ mới</Button>}
            </div>

            <Card className="mb-8 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input name="search" placeholder="Tìm kiếm theo tên hoặc trường..." value={filters.search} onChange={handleFilterChange} />
                    <Select name="category" value={filters.category} onChange={handleFilterChange}>
                        <option value="all">Tất cả chương trình</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </Select>
                    <Select name="status" value={filters.status} onChange={handleFilterChange}>
                        <option value="all">Tất cả trạng thái</option>
                        {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </Select>
                </div>
            </Card>

            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            
            {loading ? <div className="flex justify-center"><Spinner /></div> : (
                 filteredCases.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCases.map(caseItem => (
                            <Card key={caseItem.id} className="p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-lg font-semibold text-primary group-hover:text-accent transition-colors pr-2">{caseItem.caseName}</h2>
                                        {isAdmin && (
                                            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(caseItem)} className="p-1 text-secondary hover:text-primary"><EditIcon /></button>
                                                <button onClick={() => handleDelete(caseItem.id)} className="p-1 text-secondary hover:text-red-500"><DeleteIcon /></button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-secondary mb-4">
                                        <span className="font-medium">{categories.find(c => c.id === caseItem.categoryId)?.name || 'N/A'}</span>
                                        <span className="mx-2">&middot;</span>
                                        <span>Trường: {caseItem.courtName}</span>
                                    </p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                     <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">{caseItem.status}</span>
                                    <Link to={`/app/cases/${caseItem.id}`} className="text-sm font-semibold text-accent opacity-75 group-hover:opacity-100 group-hover:underline transition-all">Xem chi tiết &rarr;</Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-secondary">Không tìm thấy hồ sơ nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
                    </div>
                )
            )}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCase ? 'Chỉnh sửa hồ sơ' : 'Thêm hồ sơ mới'}>
                <CaseForm
                    initialData={editingCase}
                    categories={categories}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

const CasesPage: React.FC = () => {
    const { caseId } = useParams<{ caseId?: string }>();
    return caseId ? <CaseDetail caseId={caseId} /> : <CaseList />;
};

export default CasesPage;