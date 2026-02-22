import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../services/apiService';
import { Button, Card, Input, Label } from '../components/ui';

const Logo = ({ className = 'h-6 w-6', color = '#0077B6' }) => (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill={color} d="M24.2,2.3c-0.2,0-0.4,0-0.5,0c-0.3,0-0.5,0.1-0.8,0.2c-11.4,2.6-18.1,13.7-15.5,25.1c2,9,9.6,15.7,18.5,16.2c0.2,0,0.3,0,0.5,0c11.8-0.6,21.3-10.4,21.3-22.3C47.6,11.8,37.2,2.4,24.2,2.3z M24,43.3C14.7,43.3,7,35.5,7,26.3c0-8.2,5.9-15.1,13.9-16.5l15.8,15.8C35.6,33.5,29.9,34.2,24,43.3z M30.9,23.3L15.1,7.5c1.4-0.6,3-1,4.6-1.1c9.4-0.5,17.2,6.8,17.2,16.2C36.9,22.8,32,23.1,30.9,23.3z"/>
    </svg>
);


const ForgotPasswordPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await api.forgotPasswordRequest({ email });
            setStep(2);
            setSuccess('');
        } catch (err: any) {
            setError(err.message || 'Không thể gửi mã đặt lại. Hãy chắc chắn email đã đăng ký.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            const responseMessage = await api.forgotPasswordReset({
                email,
                verification_code: verificationCode,
                password: newPassword,
            });
            setSuccess(`${responseMessage} Bây giờ bạn có thể đăng nhập bằng mật khẩu mới của bạn.`);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra mã và thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-blue-50 to-accent/10 pt-20 px-4">
             <div className="max-w-md w-full mx-auto text-center">
                <Link to="/" className="inline-flex items-center gap-3 mb-8">
                    <Logo className="h-10 w-10" />
                    <span className="text-3xl font-bold text-primary">VIMISS</span>
                </Link>
                <Card className="text-left p-8">
                    <h2 className="text-3xl font-bold text-center text-primary mb-2">Quên mật khẩu</h2>
                    <p className="text-center text-secondary mb-8">
                        {step === 1 ? 'Nhập email của bạn để nhận mã đặt lại.' : `Một mã đã được gửi tới ${email}.`}
                    </p>

                    {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-center text-sm">{error}</p>}
                    {success && (step === 1 || (step === 2 && !error)) && <p className="text-green-600 bg-green-100 p-3 rounded-md mb-4 text-center text-sm">{success}</p>}

                    {step === 1 ? (
                        <form onSubmit={handleSendCode} className="space-y-6">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Nhập email đã đăng ký của bạn"
                                />
                            </div>
                            <div>
                                <Button type="submit" className="w-full py-3" disabled={isLoading}>
                                    {isLoading ? 'Đang gửi...' : 'Gửi mã đặt lại'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div>
                                <Label htmlFor="verificationCode">Mã Xác nhận</Label>
                                <Input
                                    id="verificationCode"
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    required
                                    placeholder="Nhập mã từ email"
                                />
                            </div>
                            <div>
                                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Nhập mật khẩu mới của bạn"
                                />
                            </div>
                            <div>
                                <Button type="submit" className="w-full py-3" disabled={isLoading || (!!success && step === 2)}>
                                    {isLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                                </Button>
                            </div>
                        </form>
                    )}

                    <p className="text-center text-sm text-secondary mt-6">
                        Nhớ lại mật khẩu rồi?{' '}
                        <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
                            Đăng nhập
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;