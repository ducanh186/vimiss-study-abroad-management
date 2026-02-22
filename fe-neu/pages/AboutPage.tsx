import React from 'react';
import { Card } from '../components/ui';

const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.5l.235-.235A2 2 0 0110 4h4a2 2 0 011.414.586l.235.235m-5.414 15.5l.235.235A2 2 0 0010 20h4a2 2 0 001.414-.586l.235-.235m-5.414-15.5l-2.121 2.121m5.414 11.263L12 18.263m3.293-3.055l2.121 2.121m-5.414-11.263L12 5.737m-3.293 3.055L6.586 6.586" />
    </svg>
);

const TargetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const PeopleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const AboutPage: React.FC = () => {
  return (
    <div className="pt-24 pb-16 bg-background dark:bg-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-semibold px-4 py-1.5 rounded-full text-sm mb-4">
            Vietnam International Study System
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-slate-100 tracking-tight">
            Hệ thống Quản lý Du học <span className="text-accent">VIMISS</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-secondary dark:text-slate-400 max-w-3xl mx-auto">
            Nền tảng số hóa toàn diện giúp kết nối sinh viên, cố vấn và chương trình du học trên toàn thế giới.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center border border-blue-50">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-2">
              <GlobeIcon />
            </div>
            <h2 className="text-2xl font-bold text-primary dark:text-slate-100 mt-4 mb-2">Kết Nối Toàn Cầu</h2>
            <p className="text-secondary dark:text-slate-400">
              VIMISS kết nối sinh viên Việt Nam với hàng trăm chương trình du học chất lượng tại các trường đại học uy tín trên thế giới.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center border border-blue-50">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-2">
              <PeopleIcon />
            </div>
            <h2 className="text-2xl font-bold text-primary dark:text-slate-100 mt-4 mb-2">Cố Vấn Chuyên Nghiệp</h2>
            <p className="text-secondary dark:text-slate-400">
              Đội ngũ cố vấn giàu kinh nghiệm đồng hành cùng sinh viên trong suốt hành trình du học — từ chọn trường, làm hồ sơ đến khi lên đường.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center border border-blue-50 md:col-span-2 lg:col-span-1">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-2">
              <TargetIcon />
            </div>
            <h2 className="text-2xl font-bold text-primary dark:text-slate-100 mt-4 mb-2">Quản Lý Minh Bạch</h2>
            <p className="text-secondary dark:text-slate-400">
              Hệ thống theo dõi hồ sơ theo thời gian thực, báo cáo tiến độ và quản lý tài liệu giúp quy trình du học rõ ràng và hiệu quả.
            </p>
          </Card>
        </div>

        {/* Stats Banner */}
        <div className="mt-16 bg-accent rounded-2xl p-8 text-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold">500+</p>
              <p className="mt-2 text-blue-100">Sinh viên được hỗ trợ</p>
            </div>
            <div>
              <p className="text-4xl font-bold">50+</p>
              <p className="mt-2 text-blue-100">Chương trình du học</p>
            </div>
            <div>
              <p className="text-4xl font-bold">30+</p>
              <p className="mt-2 text-blue-100">Cố vấn chuyên nghiệp</p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Card className="p-8 border border-blue-50">
            <h2 className="text-3xl font-bold text-center text-primary dark:text-slate-100 mb-8">Liên Hệ Với Chúng Tôi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 text-left">
              <div>
                <h3 className="text-xl font-semibold text-accent mb-3">Văn phòng chính</h3>
                <p className="text-secondary dark:text-slate-400">Đại học Kinh tế Quốc dân, 207 Giải Phóng, Hai Bà Trưng, Hà Nội</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-accent mb-3">Giờ làm việc</h3>
                <p className="text-secondary dark:text-slate-400">Thứ 2 – Thứ 6: 8:00 – 17:30</p>
                <p className="text-secondary dark:text-slate-400">Thứ 7: 8:00 – 12:00</p>
              </div>
              <div className="md:col-span-2 border-t border-border dark:border-slate-700 pt-6 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <p className="text-secondary dark:text-slate-400"><strong className="font-medium text-primary dark:text-slate-200 block">Hotline:</strong> 1900 xxxx</p>
                 <p className="text-secondary dark:text-slate-400"><strong className="font-medium text-primary dark:text-slate-200 block">Email:</strong> support@vimiss.edu.vn</p>
                 <p className="text-secondary dark:text-slate-400"><strong className="font-medium text-primary dark:text-slate-200 block">Website:</strong> vimiss.edu.vn</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;