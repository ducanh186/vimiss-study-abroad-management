import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary">
      <h1 className="text-6xl font-bold text-accent">404</h1>
      <h2 className="text-2xl mt-4">Trang không tìm thấy</h2>
      <p className="mt-2 text-secondary">Xin lỗi, trang bạn đang tìm kiếm không tồn tại.</p>
      <Link to="/" className="mt-6">
        <Button>
            Về trang chủ
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;