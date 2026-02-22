import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

const DeprecatedLandingPage: React.FC = () => {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background text-primary text-center px-4 pt-20">
             <div className="relative z-10 flex flex-col items-center">
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                    Trang không tữ tạo
                 </h1>
                 <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-10">
                    Trang này không còn được sử dụng. Vui lòng quay về trang chủ.
                 </p>
                 <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Link to="/">
                        <Button variant="primary" className="w-full sm:w-auto px-6 py-3 text-lg">
                            Đi đến trang chủ
                        </Button>
                    </Link>
                 </div>
            </div>
        </div>
    );
};

export default DeprecatedLandingPage;
