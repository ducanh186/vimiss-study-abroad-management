import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input, Label } from '../components/ui';

const Logo = ({ className = 'h-6 w-6', color = '#0077B6' }) => (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill={color} d="M24.2,2.3c-0.2,0-0.4,0-0.5,0c-0.3,0-0.5,0.1-0.8,0.2c-11.4,2.6-18.1,13.7-15.5,25.1c2,9,9.6,15.7,18.5,16.2c0.2,0,0.3,0,0.5,0c11.8-0.6,21.3-10.4,21.3-22.3C47.6,11.8,37.2,2.4,24.2,2.3z M24,43.3C14.7,43.3,7,35.5,7,26.3c0-8.2,5.9-15.1,13.9-16.5l15.8,15.8C35.6,33.5,29.9,34.2,24,43.3z M30.9,23.3L15.1,7.5c1.4-0.6,3-1,4.6-1.1c9.4-0.5,17.2,6.8,17.2,16.2C36.9,22.8,32,23.1,30.9,23.3z"/>
    </svg>
);

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-blue-50 to-accent/10 dark:bg-slate-900 pt-20 px-4 transition-colors duration-300">
      <div className="max-w-md w-full mx-auto text-center">
        <Link to="/" className="inline-flex items-center gap-3 mb-8">
            <Logo className="h-10 w-10" />
            <span className="text-3xl font-bold text-primary dark:text-slate-100">VIMISS</span>
        </Link>
        <Card className="text-left p-8">
          <h2 className="text-3xl font-bold text-center text-primary dark:text-slate-100 mb-2">Chào mừng trở lại</h2>
          <p className="text-center text-secondary dark:text-slate-400 mb-8">Đăng nhập để truy cập vào hệ thống quản lý du học.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Nhập email của bạn"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password-input">Mật khẩu</Label>
                <Link to="/forgot-password" university-accent-hover className="text-sm font-medium text-accent hover:text-accent-hover">
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </div>
            <p className="text-center text-sm text-secondary dark:text-slate-400">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-medium text-accent hover:text-accent-hover">
                    Đăng ký ngay
                </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;