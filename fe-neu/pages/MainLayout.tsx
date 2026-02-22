import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardIcon, CasesIcon, CategoriesIcon, PeopleIcon, LogoutIcon, HamburgerIcon, ChevronDownIcon, UsersIcon, BellIcon, ChatBubbleIcon, CalendarIcon, ChevronDoubleLeftIcon, ReportIcon, SunIcon, MoonIcon } from '../components/ui';
import * as api from '../services/apiService';
import type { AppNotification } from '../types';

const Logo = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div className={`flex items-center gap-3 px-4 ${isCollapsed ? 'justify-center' : ''}`}>
        <svg height="32" width="32" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#0077B6" d="M24.2,2.3c-0.2,0-0.4,0-0.5,0c-0.3,0-0.5,0.1-0.8,0.2c-11.4,2.6-18.1,13.7-15.5,25.1c2,9,9.6,15.7,18.5,16.2c0.2,0,0.3,0,0.5,0c11.8-0.6,21.3-10.4,21.3-22.3C47.6,11.8,37.2,2.4,24.2,2.3z M24,43.3C14.7,43.3,7,35.5,7,26.3c0-8.2,5.9-15.1,13.9-16.5l15.8,15.8C35.6,33.5,29.9,34.2,24,43.3z M30.9,23.3L15.1,7.5c1.4-0.6,3-1,4.6-1.1c9.4-0.5,17.2,6.8,17.2,16.2C36.9,22.8,32,23.1,30.9,23.3z"/>
        </svg>
        {!isCollapsed && <span className="text-xl font-bold tracking-wide"><span className="text-accent">VIM</span><span className="text-primary dark:text-slate-100">ISS</span></span>}
    </div>
);


const NotificationBell = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;
            try {
                const [notifs, count] = await Promise.all([
                    api.getNotifications(),
                    api.getUnreadNotificationCount(),
                ]);
                setNotifications(notifs.slice(0, 10)); // show latest 10
                setUnreadCount(count);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const handleMarkAllRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
        } catch (err) {
            console.error("Failed to mark all read:", err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={bellRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full text-secondary dark:text-slate-400 hover:bg-background dark:hover:bg-slate-700 hover:text-primary dark:hover:text-slate-100">
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-surface dark:border-slate-800"></span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface dark:bg-slate-800 rounded-xl shadow-lg border border-border dark:border-slate-700 z-50">
                    <div className="p-3 font-semibold border-b border-border dark:border-slate-700 text-primary dark:text-slate-100 flex items-center justify-between">
                        <span>Thông báo</span>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-accent hover:text-accent-hover">
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>
                    <div className="py-1 max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`block px-4 py-3 text-sm hover:bg-background dark:hover:bg-slate-700 ${
                                        !n.read_at ? 'bg-blue-50 dark:bg-slate-700/50' : ''
                                    }`}
                                >
                                    <p className="font-medium text-primary dark:text-slate-100">
                                        {typeof n.data === 'object' && 'title' in n.data ? n.data.title : n.type}
                                    </p>
                                    <p className="text-xs text-secondary dark:text-slate-400 truncate mt-1">
                                        {typeof n.data === 'object' && 'body' in n.data ? n.data.body : ''}
                                    </p>
                                    <p className="text-xs text-secondary dark:text-slate-500 mt-1">
                                        {new Date(n.created_at).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="px-4 py-3 text-sm text-secondary dark:text-slate-400">Không có thông báo mới.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const UserMenu: React.FC = () => {
  const { user, isAdmin, isDirector, isMentor, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={profileMenuRef}>
      <button
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="flex items-center gap-3 text-left p-2 rounded-lg hover:bg-background dark:hover:bg-slate-700"
      >
        <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block">
          <p className="font-semibold text-sm text-primary dark:text-slate-100">{user?.name}</p>
          <p className="text-xs text-secondary dark:text-slate-400">{isAdmin ? 'Quản trị viên' : isDirector ? 'Giám đốc' : isMentor ? 'Cố vấn' : 'Sinh viên'}</p>
        </div>
        <ChevronDownIcon />
      </button>
      {isProfileOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-surface dark:bg-slate-800 rounded-xl shadow-lg border border-border dark:border-slate-700 z-50 py-2">
          <button
            onClick={() => { logout(); setIsProfileOpen(false); }}
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-background dark:hover:bg-slate-700"
          >
            <LogoutIcon />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
};


const NavItems: React.FC<{onLinkClick?: () => void, isCollapsed: boolean}> = ({ onLinkClick, isCollapsed }) => {
    const { isAdmin, isDirector, isMentor, isStudent, user } = useAuth();
    const isReviewer = user?.role === 'reviewer';
    
    const navItems = [
        { to: "/app/dashboard", icon: <DashboardIcon />, label: "Tổng quan", show: true },
        { to: "/app/applications", icon: <CasesIcon />, label: "Hồ sơ du học", show: true },
        { to: "/app/approvals", icon: <CategoriesIcon />, label: "Phê duyệt", show: isAdmin || isDirector || isReviewer },
        { to: "/app/mentors", icon: <UsersIcon />, label: "Cố vấn", show: true },
        { to: "/app/reports", icon: <ReportIcon />, label: "Báo cáo", show: isAdmin || isDirector },
    ];
    
    const navLinkClasses = `flex items-center gap-3 px-4 py-2.5 text-secondary dark:text-slate-400 rounded-lg hover:bg-background dark:hover:bg-slate-700 hover:text-primary dark:hover:text-slate-100 transition-colors font-medium ${isCollapsed ? 'justify-center' : ''}`;
    const activeNavLinkClasses = "bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent font-semibold";

    return (
         <nav className="flex-1 space-y-2 px-2">
            {navItems.filter(item => item.show).map(item => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onLinkClick}
                    className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}
                    title={isCollapsed ? item.label : undefined}
                >
                    {item.icon}
                    {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
            ))}
        </nav>
    );
}

const MainLayout: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);
  
    return (
      <div className="flex h-screen bg-background dark:bg-slate-900 text-primary dark:text-slate-100 overflow-hidden transition-colors duration-300">
        {/* Static Sidebar for Desktop */}
        <aside className={`flex-col flex-shrink-0 hidden lg:flex border-r border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-800 py-6 transition-all duration-300 print:hidden shadow-sm ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <div className="mb-8">
            <Link to="/app/dashboard">
                <Logo isCollapsed={isSidebarCollapsed} />
            </Link>
          </div>
          <NavItems isCollapsed={isSidebarCollapsed} />
          <div className="mt-auto px-2">
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className={`flex items-center gap-3 px-4 py-2.5 text-secondary dark:text-slate-400 rounded-lg hover:bg-background dark:hover:bg-slate-700 hover:text-primary dark:hover:text-slate-100 transition-colors w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}>
               <div className={`transform transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}><ChevronDoubleLeftIcon/></div>
               {!isSidebarCollapsed && <span>Thu gọn</span>}
            </button>
          </div>
        </aside>
  
        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 print:hidden">
            <div className="fixed inset-0 bg-black/40" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="w-64 flex flex-col flex-shrink-0 fixed top-0 left-0 h-full border-r border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-800 py-6 z-10">
              <Link to="/app/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="mb-8">
                <Logo isCollapsed={false} />
              </Link>
              <NavItems onLinkClick={() => setIsMobileMenuOpen(false)} isCollapsed={false} />
            </aside>
          </div>
        )}
  
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="relative z-40 h-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-blue-100 dark:border-slate-800 bg-white/90 dark:bg-slate-800/80 backdrop-blur-md print:hidden shadow-sm">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-secondary dark:text-slate-400 hover:bg-background dark:hover:bg-slate-700"
            >
              <HamburgerIcon />
            </button>
            <div className="flex-1"></div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-2 rounded-full text-secondary dark:text-slate-400 hover:bg-background dark:hover:bg-slate-700 hover:text-primary dark:hover:text-slate-100 transition-all"
                title={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              >
                {isDarkMode ? <SunIcon /> : <MoonIcon />}
              </button>
              <NotificationBell />
              <UserMenu />
            </div>
          </header>
  
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 print:p-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
};
  
export default MainLayout;