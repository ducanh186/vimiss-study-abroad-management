import './bootstrap';
import '../css/app.css';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { I18nProvider, useI18n } from './i18n';

// ============================================================================
// Axios Configuration
// ============================================================================
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// ============================================================================
// Toast Context
// ============================================================================
const ToastContext = createContext(null);

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <span>{t.message}</span>
                        <button className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>×</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const useToast = () => useContext(ToastContext);

// ============================================================================
// Auth Context
// ============================================================================
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const response = await axios.get('/api/me');
            setUser(response.data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        await axios.get('/sanctum/csrf-cookie');
        await axios.post('/login', { email, password });
        await fetchUser();
    };

    const logout = async () => {
        await axios.post('/logout');
        setUser(null);
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

// ============================================================================
// Auth Guard Components
// ============================================================================
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    return children;
};

const GuestRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (user) return <Navigate to="/dashboard" replace />;
    return children;
};

const RoleRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return children;
};

// ============================================================================
// Loading Screen
// ============================================================================
const LoadingScreen = () => (
    <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
    </div>
);

// ============================================================================
// Sidebar Component
// ============================================================================
const Sidebar = ({ collapsed, mobileOpen, onToggle, onMobileClose, user }) => {
    const location = useLocation();
    const { t } = useI18n();

    const isAdmin = user?.role === 'admin';
    const isDirector = user?.role === 'director';
    const isMentor = user?.role === 'mentor';
    const isStudent = user?.role === 'student';
    const isManagement = isAdmin || isDirector;

    const navItems = [
        { path: '/dashboard', label: t('nav.dashboard'), icon: '📊', show: true },
        // Student-specific
        { path: '/my-mentor', label: t('nav.myMentor'), icon: '👨‍🏫', show: isStudent },
        { path: '/my-applications', label: t('nav.applications'), icon: '📋', show: isStudent || isMentor },
        // Mentor-specific
        { path: '/my-students', label: t('nav.myStudents'), icon: '👩‍🎓', show: isMentor },
        // Management
        { path: '/students', label: t('nav.students'), icon: '🎓', show: isManagement },
        { path: '/mentors', label: t('nav.mentors'), icon: '👥', show: isManagement },
        { path: '/applications', label: t('nav.applications'), icon: '📁', show: isManagement },
        { path: '/universities', label: t('nav.universities'), icon: '🏛️', show: isManagement },
        { path: '/approvals', label: t('nav.approvals'), icon: '✅', show: isManagement },
        { path: '/calendar', label: t('nav.calendar'), icon: '📅', show: true },
        { path: '/reports', label: t('nav.reports'), icon: '📈', show: isManagement },
        // Admin only
        { path: '/users', label: t('nav.users'), icon: '⚙️', show: isAdmin },
    ].filter(item => item.show);

    const sidebarClass = [
        'sidebar',
        collapsed ? 'collapsed' : '',
        mobileOpen ? 'mobile-open' : '',
    ].filter(Boolean).join(' ');

    return (
        <aside className={sidebarClass}>
            <div className="sidebar-header">
                <div className="sidebar-logo-icon">V</div>
                {!collapsed && <span className="sidebar-logo">Vimiss</span>}
            </div>
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={onMobileClose}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                    </Link>
                ))}
            </nav>
            <div className="sidebar-footer">
                <Link
                    to="/profile"
                    className={`sidebar-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
                    onClick={onMobileClose}
                >
                    <span className="nav-icon">👤</span>
                    {!collapsed && <span>{t('nav.profile')}</span>}
                </Link>
            </div>
        </aside>
    );
};

// ============================================================================
// Topbar Component
// ============================================================================
const Topbar = ({ user, onLogout, onMenuClick, sidebarCollapsed, onToggleSidebar }) => {
    const { t, locale, setLocale } = useI18n();

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
    };

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="topbar-toggle" onClick={onMenuClick} title="Menu">
                    ☰
                </button>
                <button className="topbar-toggle" onClick={onToggleSidebar} title="Toggle sidebar" style={{ display: 'none' }}>
                    {sidebarCollapsed ? '→' : '←'}
                </button>
            </div>
            <div className="topbar-right">
                <div className="lang-switcher">
                    <button
                        className={`lang-btn ${locale === 'vi' ? 'active' : ''}`}
                        onClick={() => setLocale('vi')}
                    >
                        VI
                    </button>
                    <button
                        className={`lang-btn ${locale === 'en' ? 'active' : ''}`}
                        onClick={() => setLocale('en')}
                    >
                        EN
                    </button>
                </div>
                <div className="topbar-user">
                    <div>
                        <div className="topbar-user-name">{user?.name}</div>
                        <div className="topbar-user-role">{t(`user.roles.${user?.role}`) || user?.role}</div>
                    </div>
                    <div className="topbar-avatar">{getInitials(user?.name)}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={onLogout}>
                    {t('auth.logout')}
                </button>
            </div>
        </header>
    );
};

// ============================================================================
// Admin Layout
// ============================================================================
const AdminLayout = ({ children, title }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    useEffect(() => {
        setSidebarMobileOpen(false);
    }, [title]);

    return (
        <div className="admin-layout">
            {sidebarMobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarMobileOpen(false)}
                />
            )}
            <Sidebar
                collapsed={sidebarCollapsed}
                mobileOpen={sidebarMobileOpen}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                onMobileClose={() => setSidebarMobileOpen(false)}
                user={user}
            />
            <div className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Topbar
                    user={user}
                    onLogout={handleLogout}
                    onMenuClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
                <main className="admin-content">
                    {title && (
                        <div className="page-header">
                            <h1 className="page-title">{title}</h1>
                        </div>
                    )}
                    <div className="page-body">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

// ============================================================================
// Login Page
// ============================================================================
const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const validate = () => {
        const errors = {};
        if (!email.trim()) {
            errors.email = t('auth.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = t('auth.emailInvalid');
        }
        if (!password) {
            errors.password = t('auth.passwordRequired');
        }
        setFieldErrors(errors);
        if (errors.email) emailRef.current?.focus();
        else if (errors.password) passwordRef.current?.focus();
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        if (!validate()) return;

        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors?.email) {
                setFieldErrors({ email: errors.email[0] });
                emailRef.current?.focus();
            } else {
                setError(err.response?.data?.message || t('auth.loginFailed'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldChange = (field, value, setter) => {
        setter(value);
        if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: null }));
        if (error) setError(null);
    };

    return (
        <div className="auth-layout">
            <div className="auth-card">
                <div className="auth-header auth-header-logo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <div className="sidebar-logo-icon" style={{ width: 40, height: 40, fontSize: '1rem' }}>V</div>
                        <span className="auth-logo-text">Vimiss</span>
                    </div>
                    <p className="auth-logo-subtitle">Study Abroad Management</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <h2 className="auth-title text-center">{t('auth.welcomeBack')}</h2>
                    <p className="auth-description">{t('auth.loginDesc')}</p>

                    {error && <div className="alert alert-error mb-4">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">{t('auth.emailAddress')} <span className="text-error">*</span></label>
                        <input
                            ref={emailRef}
                            id="email"
                            type="email"
                            className={`form-input ${fieldErrors.email ? 'form-input-error' : ''}`}
                            value={email}
                            onChange={e => handleFieldChange('email', e.target.value, setEmail)}
                            placeholder={t('auth.enterEmail')}
                            autoFocus
                            disabled={isLoading}
                        />
                        {fieldErrors.email && <p className="form-error-text">{fieldErrors.email}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t('auth.password')} <span className="text-error">*</span></label>
                        <div className="form-input-wrapper">
                            <input
                                ref={passwordRef}
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className={`form-input ${fieldErrors.password ? 'form-input-error' : ''}`}
                                value={password}
                                onChange={e => handleFieldChange('password', e.target.value, setPassword)}
                                placeholder={t('auth.enterPassword')}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="form-toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                            </button>
                        </div>
                        {fieldErrors.password && <p className="form-error-text">{fieldErrors.password}</p>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-block mb-4" disabled={isLoading}>
                        {isLoading ? (
                            <><span className="btn-spinner"></span> {t('auth.sending')}</>
                        ) : t('auth.loginButton')}
                    </button>

                    <div className="text-center">
                        <Link to="/forgot-password" className="text-sm text-primary" style={{ textDecoration: 'none' }}>
                            {t('auth.forgotPassword')}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================================================
// Forgot Password Page (2-step)
// ============================================================================
const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const { t } = useI18n();
    const navigate = useNavigate();

    const emailRef = useRef(null);
    const codeRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleRequestCode = async (e) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        const errors = {};
        if (!email.trim()) errors.email = t('auth.emailRequired');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t('auth.emailInvalid');
        if (Object.keys(errors).length) {
            setFieldErrors(errors);
            emailRef.current?.focus();
            return;
        }

        setIsLoading(true);
        try {
            await axios.post('/forgot-password/request', { email });
        } catch (err) { /* ignore - generic message */ }
        setSuccessMessage(t('auth.codeSentGeneric'));
        setStep(2);
        setCountdown(60);
        setIsLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        const errors = {};
        const codeString = verificationCode.join('');
        if (codeString.length !== 6) errors.verificationCode = t('auth.codeRequired');
        if (!password) errors.password = t('auth.passwordRequired');
        else if (password.length < 8) errors.password = t('auth.passwordTooShort');
        if (!passwordConfirmation) errors.passwordConfirmation = t('auth.confirmPasswordRequired');
        else if (password !== passwordConfirmation) {
            errors.passwordConfirmation = t('auth.passwordMismatch');
            errors.password = t('auth.passwordMismatch');
        }
        if (Object.keys(errors).length) {
            setFieldErrors(errors);
            if (errors.verificationCode) codeRefs[0].current?.focus();
            else if (errors.password) passwordRef.current?.focus();
            else confirmPasswordRef.current?.focus();
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('/forgot-password/reset', {
                email,
                verification_code: codeString,
                password,
                password_confirmation: passwordConfirmation,
            });
            setSuccessMessage(response.data.message || t('auth.passwordResetSuccess'));
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            const errs = err.response?.data?.errors;
            if (errs?.verification_code) {
                setFieldErrors({ verificationCode: errs.verification_code[0] });
                codeRefs[0].current?.focus();
            } else if (errs?.password) {
                setFieldErrors({ password: errs.password[0] });
                passwordRef.current?.focus();
            } else {
                setError(err.response?.data?.message || t('auth.failedToResetPassword'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0 || isLoading) return;
        setIsLoading(true);
        try { await axios.post('/forgot-password/request', { email }); } catch (err) { /* ignore */ }
        setSuccessMessage(t('auth.verificationCodeResent'));
        setCountdown(60);
        setIsLoading(false);
    };

    const handleCodeChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const newCode = [...verificationCode];
        newCode[index] = digit;
        setVerificationCode(newCode);
        if (fieldErrors.verificationCode) setFieldErrors(prev => ({ ...prev, verificationCode: null }));
        if (digit && index < 5) codeRefs[index + 1].current?.focus();
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            codeRefs[index - 1].current?.focus();
        }
    };

    const handleCodePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = [...verificationCode];
        for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || '';
        setVerificationCode(newCode);
        codeRefs[Math.min(pasted.length, 5)].current?.focus();
    };

    return (
        <div className="auth-layout">
            <div className="auth-card">
                <div className="auth-header auth-header-logo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <div className="sidebar-logo-icon" style={{ width: 40, height: 40, fontSize: '1rem' }}>V</div>
                        <span className="auth-logo-text">Vimiss</span>
                    </div>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleRequestCode} className="auth-form">
                        <h2 className="auth-title text-center">{t('auth.forgotPassword')}</h2>
                        <p className="auth-description">{t('auth.forgotPasswordDesc')}</p>
                        {error && <div className="alert alert-error mb-4">{error}</div>}
                        <div className="form-group">
                            <label htmlFor="email">{t('auth.emailAddress')} <span className="text-error">*</span></label>
                            <input ref={emailRef} id="email" type="email" className={`form-input ${fieldErrors.email ? 'form-input-error' : ''}`}
                                value={email} onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({}); }}
                                placeholder={t('auth.enterEmail')} autoFocus disabled={isLoading} />
                            {fieldErrors.email && <p className="form-error-text">{fieldErrors.email}</p>}
                        </div>
                        <button type="submit" className="btn btn-primary btn-block mb-4" disabled={isLoading}>
                            {isLoading ? <><span className="btn-spinner"></span> {t('auth.sending')}</> : t('auth.continue')}
                        </button>
                        <div className="text-center">
                            <Link to="/login" className="text-sm text-primary" style={{ textDecoration: 'none' }}>{t('auth.backToLogin')}</Link>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="auth-form">
                        <h2 className="auth-title text-center">{t('auth.resetPassword')}</h2>
                        {successMessage && <div className="alert alert-success mb-4">{successMessage}</div>}
                        {error && <div className="alert alert-error mb-4">{error}</div>}

                        <div className="form-group">
                            <label>{t('auth.verificationCode')} <span className="text-error">*</span></label>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>{t('auth.enterVerificationCode')}</p>
                            <div className="otp-container" onPaste={handleCodePaste}>
                                {verificationCode.map((digit, i) => (
                                    <input key={i} ref={codeRefs[i]} type="text" inputMode="numeric" maxLength={1}
                                        className={`otp-input ${fieldErrors.verificationCode ? 'otp-error' : ''}`}
                                        value={digit} onChange={e => handleCodeChange(i, e.target.value)}
                                        onKeyDown={e => handleCodeKeyDown(i, e)} disabled={isLoading} />
                                ))}
                            </div>
                            {fieldErrors.verificationCode && <p className="form-error-text text-center">{fieldErrors.verificationCode}</p>}
                            <div className="text-center mt-2">
                                <button type="button" className="btn btn-ghost btn-sm" onClick={handleResendCode}
                                    disabled={countdown > 0 || isLoading}>
                                    {countdown > 0 ? t('auth.resendIn', { seconds: countdown }) : t('auth.resendCode')}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">{t('auth.newPassword')} <span className="text-error">*</span></label>
                            <div className="form-input-wrapper">
                                <input ref={passwordRef} id="password" type={showPassword ? 'text' : 'password'}
                                    className={`form-input ${fieldErrors.password ? 'form-input-error' : ''}`}
                                    value={password} onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null })); }}
                                    disabled={isLoading} />
                                <button type="button" className="form-toggle-password" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                    {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                                </button>
                            </div>
                            {fieldErrors.password && <p className="form-error-text">{fieldErrors.password}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm-password">{t('auth.confirmPassword')} <span className="text-error">*</span></label>
                            <div className="form-input-wrapper">
                                <input ref={confirmPasswordRef} id="confirm-password" type={showConfirmPassword ? 'text' : 'password'}
                                    className={`form-input ${fieldErrors.passwordConfirmation ? 'form-input-error' : ''}`}
                                    value={passwordConfirmation} onChange={e => { setPasswordConfirmation(e.target.value); if (fieldErrors.passwordConfirmation) setFieldErrors(prev => ({ ...prev, passwordConfirmation: null })); }}
                                    disabled={isLoading} />
                                <button type="button" className="form-toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                                    {showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                                </button>
                            </div>
                            {fieldErrors.passwordConfirmation && <p className="form-error-text">{fieldErrors.passwordConfirmation}</p>}
                        </div>

                        <button type="submit" className="btn btn-primary btn-block mb-4" disabled={isLoading}>
                            {isLoading ? <><span className="btn-spinner"></span> {t('auth.resetting')}</> : t('auth.resetPassword')}
                        </button>
                        <div className="text-center">
                            <Link to="/login" className="text-sm text-primary" style={{ textDecoration: 'none' }}>{t('auth.backToLogin')}</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Change Password Page
// ============================================================================
const ChangePasswordPage = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useI18n();
    const toast = useToast();
    const navigate = useNavigate();
    const { fetchUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        const errors = {};
        if (!currentPassword) errors.currentPassword = t('auth.currentPasswordRequired');
        if (!password) errors.password = t('auth.passwordRequired');
        else if (password.length < 8) errors.password = t('auth.passwordTooShort');
        if (!passwordConfirmation) errors.passwordConfirmation = t('auth.confirmPasswordRequired');
        else if (password !== passwordConfirmation) errors.passwordConfirmation = t('auth.passwordMismatch');
        if (Object.keys(errors).length) { setFieldErrors(errors); return; }

        setIsLoading(true);
        try {
            await axios.post('/api/change-password', {
                current_password: currentPassword,
                password,
                password_confirmation: passwordConfirmation,
            });
            toast?.success(t('auth.passwordChangeSuccess'));
            await fetchUser();
            navigate('/dashboard');
        } catch (err) {
            const errs = err.response?.data?.errors;
            if (errs?.current_password) setFieldErrors({ currentPassword: errs.current_password[0] });
            else if (errs?.password) setFieldErrors({ password: errs.password[0] });
            else setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout title={t('auth.changePassword')}>
            <div style={{ maxWidth: 480 }}>
                <div className="card">
                    <div className="card-body">
                        {error && <div className="alert alert-error mb-4">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>{t('auth.currentPassword')} <span className="text-error">*</span></label>
                                <input type="password" className={`form-input ${fieldErrors.currentPassword ? 'form-input-error' : ''}`}
                                    value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setFieldErrors(prev => ({ ...prev, currentPassword: null })); }} />
                                {fieldErrors.currentPassword && <p className="form-error-text">{fieldErrors.currentPassword}</p>}
                            </div>
                            <div className="form-group">
                                <label>{t('auth.newPassword')} <span className="text-error">*</span></label>
                                <input type="password" className={`form-input ${fieldErrors.password ? 'form-input-error' : ''}`}
                                    value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: null })); }} />
                                {fieldErrors.password && <p className="form-error-text">{fieldErrors.password}</p>}
                            </div>
                            <div className="form-group">
                                <label>{t('auth.confirmPassword')} <span className="text-error">*</span></label>
                                <input type="password" className={`form-input ${fieldErrors.passwordConfirmation ? 'form-input-error' : ''}`}
                                    value={passwordConfirmation} onChange={e => { setPasswordConfirmation(e.target.value); setFieldErrors(prev => ({ ...prev, passwordConfirmation: null })); }} />
                                {fieldErrors.passwordConfirmation && <p className="form-error-text">{fieldErrors.passwordConfirmation}</p>}
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                                {isLoading ? <><span className="btn-spinner"></span></> : t('auth.changePassword')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

// ============================================================================
// Dashboard Page
// ============================================================================
const DashboardPage = () => {
    const { user } = useAuth();
    const { t } = useI18n();

    return (
        <AdminLayout title={t('dashboard.title')}>
            <div className="mb-6">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t('dashboard.welcome', { name: user?.name })}</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    {t(`user.roles.${user?.role}`)} — {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>🎓</div>
                    <div className="stat-card-value">0</div>
                    <div className="stat-card-label">{t('dashboard.totalStudents')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}>👥</div>
                    <div className="stat-card-value">0</div>
                    <div className="stat-card-label">{t('dashboard.totalMentors')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#fefce8', color: '#eab308' }}>📋</div>
                    <div className="stat-card-value">0</div>
                    <div className="stat-card-label">{t('dashboard.activeApplications')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>✅</div>
                    <div className="stat-card-value">0</div>
                    <div className="stat-card-label">{t('dashboard.pendingApprovals')}</div>
                </div>
            </div>

            <div className="card mt-4">
                <div className="card-header">
                    <span className="card-title">{t('dashboard.recentActivity')}</span>
                </div>
                <div className="card-body">
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-title">{t('common.noData')}</div>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Activity will appear here as you use the system.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

// ============================================================================
// Profile Page
// ============================================================================
const ProfilePage = () => {
    const { user, fetchUser } = useAuth();
    const { t } = useI18n();
    const toast = useToast();
    const [name, setName] = useState(user?.name || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.put('/api/profile', { name });
            await fetchUser();
            toast?.success('Profile updated successfully.');
        } catch (err) {
            toast?.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout title={t('nav.profile')}>
            <div style={{ maxWidth: 480 }}>
                <div className="card">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>{t('user.name')}</label>
                                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>{t('user.email')}</label>
                                <input type="text" className="form-input" value={user?.email || ''} disabled />
                            </div>
                            <div className="form-group">
                                <label>{t('user.role')}</label>
                                <input type="text" className="form-input" value={t(`user.roles.${user?.role}`) || user?.role} disabled />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? <span className="btn-spinner"></span> : t('common.save')}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="mt-4">
                    <Link to="/change-password" className="btn btn-outline">{t('auth.changePassword')}</Link>
                </div>
            </div>
        </AdminLayout>
    );
};

// ============================================================================
// Users Management Page (Admin)
// ============================================================================
const UsersPage = () => {
    const { t } = useI18n();
    const toast = useToast();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data.data || []);
        } catch (err) {
            toast?.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    return (
        <AdminLayout title={t('user.management')}>
            <div className="card">
                <div className="card-header">
                    <span className="card-title">{t('user.management')}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>+ {t('user.createUser')}</button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {isLoading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div></div>
                    ) : users.length === 0 ? (
                        <div className="empty-state"><div className="empty-state-icon">👤</div><div className="empty-state-title">{t('common.noData')}</div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('user.name')}</th>
                                    <th>{t('user.email')}</th>
                                    <th>{t('user.role')}</th>
                                    <th>{t('user.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="font-medium">{u.name}</td>
                                        <td>{u.email}</td>
                                        <td><span className="badge badge-info">{t(`user.roles.${u.role}`) || u.role}</span></td>
                                        <td><span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-error'}`}>{u.status === 'active' ? t('common.active') : t('common.inactive')}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showCreateModal && (
                <CreateUserModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchUsers(); }} />
            )}
        </AdminLayout>
    );
};

// ============================================================================
// Create User Modal
// ============================================================================
const CreateUserModal = ({ onClose, onCreated }) => {
    const { t } = useI18n();
    const toast = useToast();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        setIsLoading(true);
        try {
            await axios.post('/api/users', form);
            toast?.success('User created successfully.');
            onCreated();
        } catch (err) {
            if (err.response?.data?.errors) {
                setFieldErrors(Object.fromEntries(
                    Object.entries(err.response.data.errors).map(([k, v]) => [k, v[0]])
                ));
            } else {
                toast?.error(err.response?.data?.message || 'Failed to create user');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
            onClick={onClose}>
            <div className="card" style={{ width: '100%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
                <div className="card-header">
                    <span className="card-title">{t('user.createUser')}</span>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>{t('user.name')} <span className="text-error">*</span></label>
                            <input className={`form-input ${fieldErrors.name ? 'form-input-error' : ''}`}
                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            {fieldErrors.name && <p className="form-error-text">{fieldErrors.name}</p>}
                        </div>
                        <div className="form-group">
                            <label>{t('user.email')} <span className="text-error">*</span></label>
                            <input type="email" className={`form-input ${fieldErrors.email ? 'form-input-error' : ''}`}
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            {fieldErrors.email && <p className="form-error-text">{fieldErrors.email}</p>}
                        </div>
                        <div className="form-group">
                            <label>{t('auth.password')} <span className="text-error">*</span></label>
                            <input type="password" className={`form-input ${fieldErrors.password ? 'form-input-error' : ''}`}
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                            {fieldErrors.password && <p className="form-error-text">{fieldErrors.password}</p>}
                        </div>
                        <div className="form-group">
                            <label>{t('user.role')} <span className="text-error">*</span></label>
                            <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                <option value="student">{t('user.roles.student')}</option>
                                <option value="mentor">{t('user.roles.mentor')}</option>
                                <option value="director">{t('user.roles.director')}</option>
                                <option value="admin">{t('user.roles.admin')}</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-outline" onClick={onClose}>{t('common.cancel')}</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? <span className="btn-spinner"></span> : t('common.create')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Placeholder Pages
// ============================================================================
const PlaceholderPage = ({ title, icon, description }) => {
    const { t } = useI18n();
    return (
        <AdminLayout title={title}>
            <div className="empty-state">
                <div className="empty-state-icon">{icon}</div>
                <div className="empty-state-title">{title}</div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{description || 'This module will be implemented in a future phase.'}</p>
            </div>
        </AdminLayout>
    );
};

// ============================================================================
// App Router
// ============================================================================
const AppRouter = () => {
    const { t } = useI18n();

    return (
        <Routes>
            {/* Guest routes */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

            {/* Protected routes - all roles */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><PlaceholderPage title={t('nav.calendar')} icon="📅" /></ProtectedRoute>} />

            {/* Student routes */}
            <Route path="/my-mentor" element={<RoleRoute roles={['student']}><PlaceholderPage title={t('nav.myMentor')} icon="👨‍🏫" /></RoleRoute>} />
            <Route path="/my-applications" element={<RoleRoute roles={['student', 'mentor']}><PlaceholderPage title={t('nav.applications')} icon="📋" /></RoleRoute>} />

            {/* Mentor routes */}
            <Route path="/my-students" element={<RoleRoute roles={['mentor']}><PlaceholderPage title={t('nav.myStudents')} icon="👩‍🎓" /></RoleRoute>} />

            {/* Management routes (admin + director) */}
            <Route path="/students" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.students')} icon="🎓" /></RoleRoute>} />
            <Route path="/mentors" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.mentors')} icon="👥" /></RoleRoute>} />
            <Route path="/applications" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.applications')} icon="📁" /></RoleRoute>} />
            <Route path="/universities" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.universities')} icon="🏛️" /></RoleRoute>} />
            <Route path="/approvals" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.approvals')} icon="✅" /></RoleRoute>} />
            <Route path="/reports" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.reports')} icon="📈" /></RoleRoute>} />

            {/* Admin only */}
            <Route path="/users" element={<RoleRoute roles={['admin']}><UsersPage /></RoleRoute>} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

// ============================================================================
// Root App
// ============================================================================
const App = () => {
    return (
        <BrowserRouter>
            <I18nProvider>
                <ToastProvider>
                    <AuthProvider>
                        <AppRouter />
                    </AuthProvider>
                </ToastProvider>
            </I18nProvider>
        </BrowserRouter>
    );
};

// Mount
const container = document.getElementById('app');
if (container) {
    createRoot(container).render(<App />);
}
