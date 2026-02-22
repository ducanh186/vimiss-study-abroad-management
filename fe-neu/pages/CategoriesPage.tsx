import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../services/apiService';
import { CategoryResponse, CategoryRequest, CaseResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button, Modal, Input, Textarea, Spinner, PlusIcon, EditIcon, DeleteIcon, Label, Card } from '../components/ui';

const CategoryForm: React.FC<{
  initialData: CategoryRequest | null;
  onSubmit: (data: CategoryRequest) => void;
  onCancel: () => void;
}> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<CategoryRequest>(initialData || { name: '', description: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                <Label htmlFor="name">Tên chương trình</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} />
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
                <Button type="submit">Lưu chương trình</Button>
            </div>
        </form>
    );
};


const CategoryDetail: React.FC<{ categoryId: string }> = ({ categoryId }) => {
    const [category, setCategory] = useState<CategoryResponse | null>(null);
    const [cases, setCases] = useState<CaseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const categoryData = await api.getCategoryById(Number(categoryId));
                setCategory(categoryData);
                const allCases = await api.getCases();
                setCases(allCases.filter(c => c.categoryId === Number(categoryId)));
            } catch (e) {
                setError("Không thể tải chi tiết chương trình.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [categoryId]);

    if (loading) return <div className="flex justify-center mt-10"><Spinner /></div>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!category) return <p>Không tìm thấy chương trình.</p>;

    return (
        <div>
            <Link to="/app/categories" className="text-accent hover:underline mb-6 inline-block font-semibold">&larr; Quay lại danh sách chương trình</Link>
            <h1 className="text-4xl font-bold text-primary mb-2">{category.name}</h1>
            <p className="text-secondary mb-8 text-lg">{category.description}</p>
            
            <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4 text-primary">Hồ sơ trong chương trình này ({cases.length})</h2>
                {cases.length > 0 ? (
                    <div className="divide-y divide-border -mx-6">
                        {cases.map(caseItem => (
                            <div key={caseItem.id} className="py-4 px-6 flex justify-between items-center hover:bg-background transition-colors">
                                <div>
                                    <h3 className="font-semibold text-primary">{caseItem.caseName}</h3>
                                    <p className="text-sm text-secondary">{caseItem.courtName}</p>
                                </div>
                                <Link to={`/app/cases/${caseItem.id}`} className="text-accent hover:underline text-sm font-semibold">Xem chi tiết &rarr;</Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-secondary py-8 text-center">Không có hồ sơ nào trong chương trình này.</p>
                )}
            </Card>
        </div>
    );
};


const CategoryList: React.FC = () => {
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { isAdmin } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getCategories();
            setCategories(data);
            setError('');
        } catch (err: any) {
            setError('Không thể tải chương trình.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleOpenModal = (category: CategoryResponse | null = null) => {
        setError('');
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleFormSubmit = async (data: CategoryRequest) => {
        try {
            if (editingCategory) {
                await api.updateCategory(editingCategory.id, data);
            } else {
                await api.createCategory(data);
            }
            handleCloseModal();
            fetchCategories();
        } catch (err: any) {
            setError(err.message || 'Không thể lưu chương trình.');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa chương trình này không?')) {
            setError('');
            try {
                await api.deleteCategory(id);
                fetchCategories();
            } catch (err: any) {
                if (err.message && err.message.toLowerCase().includes('foreign key constraint fails')) {
                    setError('Không thể xóa chương trình này. Nó hiện được liên kết với một hoặc nhiều hồ sơ. Vui lòng tái chỉ định hoặc xóa các hồ sơ liên kết trước.');
                } else {
                    setError(err.message || 'Không thể xóa chương trình.');
                }
            }
        }
    };

    const filteredCategories = useMemo(() => {
        return categories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [categories, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Chương trình</h1>
                 {isAdmin && <Button onClick={() => handleOpenModal()}><PlusIcon/> Thêm chương trình mới</Button>}
            </div>

            <div className="mb-6">
                <Input 
                    placeholder="Tìm kiếm theo tên chương trình..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            
            {loading ? <div className="flex justify-center"><Spinner /></div> : (
                filteredCategories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCategories.map(category => (
                            <Card key={category.id} className="p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-xl font-semibold text-primary group-hover:text-accent transition-colors pr-2">{category.name}</h2>
                                        {isAdmin && (
                                            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(category)} className="p-1 text-secondary hover:text-primary"><EditIcon /></button>
                                                <button onClick={() => handleDelete(category.id)} className="p-1 text-secondary hover:text-red-500"><DeleteIcon /></button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-secondary text-sm mb-4 line-clamp-3 h-15">{category.description}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border text-right">
                                    <Link to={`/app/categories/${category.id}`} className="text-sm font-semibold text-accent opacity-75 group-hover:opacity-100 group-hover:underline transition-all">Xem chi tiết &rarr;</Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-secondary">Không tìm thấy chương trình nào phù hợp với tìm kiếm của bạn.</p>
                    </div>
                )
            )}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCategory ? 'Chỉnh sửa chương trình' : 'Thêm chương trình mới'}>
                <CategoryForm
                    initialData={editingCategory}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCloseModal}
                />
            </Modal>
        </div>
    );
};

const CategoriesPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId?: string }>();
    return categoryId ? <CategoryDetail categoryId={categoryId} /> : <CategoryList />;
};

export default CategoriesPage;