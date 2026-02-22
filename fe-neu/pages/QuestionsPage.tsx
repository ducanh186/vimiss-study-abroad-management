
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as api from '../services/apiService';
import { QuestionResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button, Spinner, Textarea, Label, Card } from '../components/ui';

const QuestionDetail: React.FC<{ questionId: string }> = ({ questionId }) => {
    const [question, setQuestion] = useState<QuestionResponse | null>(null);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                // In a real app with per-question endpoint, you'd fetch one. Here we filter from all.
                const allQuestions = await api.getAllQuestions();
                const q = allQuestions.find(q => q.id.toString() === questionId);
                if (q) {
                    setQuestion(q);
                    setAnswer(q.answer || '');
                } else {
                    setError("Không tìm thấy câu hỏi.");
                }
            } catch (err) {
                setError("Không thể tải chi tiết câu hỏi.");
            } finally {
                setLoading(false);
            }
        };
        fetchQuestion();
    }, [questionId]);

    const handleSubmitAnswer = async () => {
        if (!question || !answer.trim()) return;
        try {
            await api.answerQuestion(question.id, answer);
            alert('Answer submitted successfully!');
            navigate('/app/questions');
        } catch (err: any) {
            setError(err.message || 'Không thể gửi trả lời.');
        }
    };

    if (loading) return <div className="flex justify-center mt-10"><Spinner /></div>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!question) return <p>Không tìm thấy câu hỏi.</p>;

    return (
        <div>
            <Link to="/app/questions" className="text-accent hover:underline mb-6 inline-block font-semibold">&larr; Quay lại danh sách câu hỏi</Link>
            <Card className="p-6">
                <div>
                    <p className="text-sm text-secondary mb-2">Từ: {question.questionerName} | Nhận được: {new Date(question.createdAt).toLocaleString()}</p>
                    <h2 className="text-2xl font-semibold text-primary mb-4">Question:</h2>
                    <p className="text-primary whitespace-pre-wrap bg-background p-4 rounded-md">{question.content}</p>

                    <div className="mt-6">
                        <Label htmlFor="answer">Trả lời của bạn</Label>
                        <Textarea
                            id="answer"
                            rows={8}
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder={question.answer ? "This question has been answered." : "Type your answer here..."}
                            readOnly={!!question.answer}
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    {!question.answer && (
                         <div className="mt-6 flex justify-end">
                            <Button onClick={handleSubmitAnswer} disabled={!answer.trim()}>
                                Gửi trả lời
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};


const QuestionList: React.FC = () => {
    const [questions, setQuestions] = useState<QuestionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { lawyerPersonId } = useAuth();

    const fetchQuestions = useCallback(async () => {
        if (!lawyerPersonId) {
            setError("Không thể xác định cố vấn đang đăng nhập.");
            setLoading(false);
            return;
        };
        try {
            setLoading(true);
            const allQuestions = await api.getAllQuestions();
            const myQuestions = allQuestions
                .filter(q => q.lawyerId === lawyerPersonId)
                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setQuestions(myQuestions);
        } catch (err: any) {
            setError('Không thể tải câu hỏi.');
        } finally {
            setLoading(false);
        }
    }, [lawyerPersonId]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-8">Câu hỏi của sinh viên</h1>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            {loading ? <div className="flex justify-center"><Spinner /></div> : (
                <div className="space-y-4">
                    {questions.length > 0 ? (
                        questions.map(q => (
                            <Link to={`/app/questions/${q.id}`} key={q.id} className="block">
                                <Card className="p-4 transition-all duration-300 hover:shadow-md hover:border-accent hover:-translate-y-0.5">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-primary truncate pr-4">{q.content}</p>
                                            <p className="text-sm text-secondary">Từ: {q.questionerName} vào {new Date(q.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            {q.answer ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Đã trả lời</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Chờ xử lý</span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <p className="text-center text-secondary py-16">Bạn không có câu hỏi nào.</p>
                    )}
                </div>
            )}
        </div>
    );
};

const QuestionsPage: React.FC = () => {
    const { questionId } = useParams<{ questionId?: string }>();
    const { isLawyer } = useAuth();
    
    if (!isLawyer) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold">Truy cập bị từ chối</h1>
                <p className="text-secondary">Trang này chỉ dành cho cố vấn.</p>
            </div>
        );
    }
    
    return questionId ? <QuestionDetail questionId={questionId} /> : <QuestionList />;
};

export default QuestionsPage;
