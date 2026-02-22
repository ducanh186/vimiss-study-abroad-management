

import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/apiService';
import { QuestionResponse, QuestionRequest, PersonResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Spinner, Card, Button, PlusIcon, Modal, Label, Select, Textarea } from '../components/ui';

export const AskQuestionModal: React.FC<{
    onClose: () => void;
    onSuccess: () => void;
    initialLawyerId?: number;
}> = ({ onClose, onSuccess, initialLawyerId }) => {
    const { user } = useAuth();
    const [lawyers, setLawyers] = useState<PersonResponse[]>([]);
    const [lawyerId, setLawyerId] = useState(initialLawyerId?.toString() || '');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

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
                setError('Failed to load lawyers list.');
            } finally {
                setLoading(false);
            }
        };
        fetchLawyers();
    }, [initialLawyerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!user || !lawyerId || !content) {
            setError('Vui lòng chọn cố vấn và viết câu hỏi của bạn.');
            return;
        }

        const requestData: QuestionRequest = {
            idQuestioner: user.id,
            idLawyerPerson: Number(lawyerId),
            content: content,
        };

        try {
            await api.createQuestion(requestData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to send question.');
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Hỏi một câu hỏi">
            {loading ? <Spinner /> : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <Label htmlFor="lawyerId">Cho cố vấn</Label>
                        <Select id="lawyerId" value={lawyerId} onChange={e => setLawyerId(e.target.value)} required disabled={!!initialLawyerId}>
                            {lawyers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="content">Câu hỏi của bạn</Label>
                        <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={6} required />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Gửi câu hỏi</Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};


const MyQuestionsPage: React.FC = () => {
    const [questions, setQuestions] = useState<QuestionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchQuestions = useCallback(async () => {
        if (!user) {
            setError("You must be logged in to see your questions.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const myQuestions = await api.getQuestionsByUser(user.id);
            setQuestions(myQuestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (err: any) {
            setError('Failed to fetch your questions.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const toggleExpand = (id: number) => {
        setExpandedId(prevId => (prevId === id ? null : id));
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Câu hỏi của tôi</h1>
                <Button onClick={() => setIsModalOpen(true)}><PlusIcon /> Đặt câu hỏi mới</Button>
            </div>
            
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            {loading ? <div className="flex justify-center"><Spinner /></div> : (
                <div className="space-y-4">
                    {questions.length > 0 ? (
                        questions.map(q => (
                            <Card key={q.id} className="p-4">
                                <div onClick={() => toggleExpand(q.id)} className="cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-primary">{q.content}</p>
                                            <p className="text-sm text-secondary">Gửi tới: {q.lawyerName} vào {new Date(q.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {q.answer ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Đã trả lời</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Chờ xử lý</span>
                                            )}
                                             <span className={`transform transition-transform text-secondary ${expandedId === q.id ? 'rotate-180' : ''}`}>
                                                ▼
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedId === q.id ? 'max-h-screen mt-4 pt-4 border-t border-border' : 'max-h-0'}`}>
                                    {q.answer ? (
                                        <div>
                                            <h3 className="font-semibold text-primary mb-2">Trả lời từ cố vấn {q.lawyerName}:</h3>
                                            <p className="text-primary whitespace-pre-wrap bg-background p-3 rounded-md">{q.answer}</p>
                                        </div>
                                    ) : (
                                        <p className="text-secondary italic">Cố vấn chưa trả lời câu hỏi này.</p>
                                    )}
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="text-center p-16">
                            <p className="text-secondary">Bạn chưa đặt câu hỏi nào.</p>
                        </Card>
                    )}
                </div>
            )}
            {isModalOpen && <AskQuestionModal onClose={() => setIsModalOpen(false)} onSuccess={fetchQuestions} />}
        </div>
    );
};

export default MyQuestionsPage;