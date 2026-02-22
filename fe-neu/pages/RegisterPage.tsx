import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../services/apiService';
import { Button, Card, Input, Label } from '../components/ui';

const Logo = ({ className = 'h-6 w-6', color = '#0077B6' }) => (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill={color} d="M24.2,2.3c-0.2,0-0.4,0-0.5,0c-0.3,0-0.5,0.1-0.8,0.2c-11.4,2.6-18.1,13.7-15.5,25.1c2,9,9.6,15.7,18.5,16.2c0.2,0,0.3,0,0.5,0c11.8-0.6,21.3-10.4,21.3-22.3C47.6,11.8,37.2,2.4,24.2,2.3z M24,43.3C14.7,43.3,7,35.5,7,26.3c0-8.2,5.9-15.1,13.9-16.5l15.8,15.8C35.6,33.5,29.9,34.2,24,43.3z M30.9,23.3L15.1,7.5c1.4-0.6,3-1,4.6-1.1c9.4-0.5,17.2,6.8,17.2,16.2C36.9,22.8,32,23.1,30.9,23.3z"/>
    </svg>
);

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const responseMessage = await api.registerRequestCode({ email, name: username });
      setSuccess(responseMessage);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã xác nhận.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await api.registerUser({
        email,
        name: username,
        verification_code: verificationCode,
        password,
      });
      setSuccess('Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.');
      setIsRegistrationComplete(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra thông tin của bạn.');
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
          <h2 className="text-3xl font-bold text-center text-primary mb-2">Tạo tài khoản</h2>
          <p className="text-center text-secondary mb-8">
            {step === 1 ? 'Bắt đầu bằng cách nhập tên và email của bạn.' : `Mã đã được gửi tới ${email}.`}
          </p>

          {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-center text-sm">{error}</p>}
          {success && step === 1 && <p className="text-green-600 bg-green-100 p-3 rounded-md mb-4 text-center text-sm">{success}</p>}

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <Label htmlFor="username">Họ và tên</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Nhập địa chỉ email của bạn"
                />
              </div>
              <div>
                <Button type="submit" className="w-full px-4 py-2 rounded-lg text-white bg-accent hover:bg-accent-hover transition-colors duration-300 font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-px" disabled={isLoading}>
                  {isLoading ? 'Đang gửi mã...' : 'Gửi mã xác nhận'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <Label htmlFor="password-input">Mật khẩu</Label>
                <Input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Tạo mật khẩu mạnh"
                />
              </div>
              <div>
                <Label htmlFor="verificationCode">Mã xác nhận</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  placeholder="Nhập mã từ email của bạn"
                />
              </div>
              {success && step === 2 && <p className="text-green-600 text-sm">{success}</p>}
              <div>
                <Button type="submit" className="w-full px-4 py-2 rounded-lg text-white bg-accent hover:bg-accent-hover transition-colors duration-300 font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-px" disabled={isLoading || isRegistrationComplete}>
                  {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-secondary mt-6">
            Bạn đã có tài khoản rồi?{' '}
            <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
              Đăng nhập
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;