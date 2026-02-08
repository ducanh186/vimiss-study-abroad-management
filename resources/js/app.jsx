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
    if (!user) return <Navigate to="/auth/login" state={{ from: location }} replace />;
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
    if (!user) return <Navigate to="/auth/login" state={{ from: location }} replace />;
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
// OTP Input Component (shared)
// ============================================================================
const OtpInput = ({ value, onChange, disabled, error }) => {
    const refs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

    const handleChange = (index, val) => {
        const digit = val.replace(/\D/g, '').slice(-1);
        const newCode = [...value];
        newCode[index] = digit;
        onChange(newCode);
        if (digit && index < 5) refs[index + 1].current?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            refs[index - 1].current?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = [...value];
        for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || '';
        onChange(newCode);
        refs[Math.min(pasted.length, 5)].current?.focus();
    };

    return (
        <div className="otp-container" onPaste={handlePaste}>
            {value.map((digit, i) => (
                <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
                    className={`otp-input ${error ? 'otp-error' : ''}`}
                    value={digit} onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)} disabled={disabled} />
            ))}
        </div>
    );
};

// ============================================================================
// Landing Page (Public)
// ============================================================================
const LandingPage = () => {
    const { t, locale, setLocale } = useI18n();
    const { user } = useAuth();

    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <div className="landing-nav-brand">
                        <div className="sidebar-logo-icon" style={{ width: 36, height: 36, fontSize: '0.9rem' }}>V</div>
                        <span className="landing-brand-text">Vimiss</span>
                    </div>
                    <div className="landing-nav-links">
                        <a href="#features" className="landing-nav-link">{t('landing.navAbout')}</a>
                        <a href="#stats" className="landing-nav-link">{t('landing.navServices')}</a>
                        <a href="#contact" className="landing-nav-link">{t('landing.navContact')}</a>
                        <div className="lang-switcher" style={{ marginLeft: '0.5rem' }}>
                            <button className={`lang-btn ${locale === 'vi' ? 'active' : ''}`} onClick={() => setLocale('vi')}>VI</button>
                            <button className={`lang-btn ${locale === 'en' ? 'active' : ''}`} onClick={() => setLocale('en')}>EN</button>
                        </div>
                        {user ? (
                            <Link to="/dashboard" className="btn btn-primary btn-sm" style={{ marginLeft: '0.5rem' }}>Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/auth/login" className="btn btn-outline-light btn-sm" style={{ marginLeft: '0.5rem' }}>{t('landing.ctaLogin')}</Link>
                                <Link to="/auth/register" className="btn btn-cta btn-sm" style={{ marginLeft: '0.5rem' }}>{t('landing.ctaRegister')}</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="landing-hero">
                <div className="landing-hero-content">
                    <h1 className="landing-hero-title">{t('landing.heroTitle')}</h1>
                    <p className="landing-hero-subtitle">{t('landing.heroSubtitle')}</p>
                    <div className="landing-hero-actions">
                        <Link to="/auth/register" className="btn btn-cta btn-lg">{t('landing.ctaRegister')}</Link>
                        <Link to="/auth/login" className="btn btn-outline-light btn-lg">{t('landing.ctaLogin')}</Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="landing-section">
                <div className="landing-section-inner">
                    <h2 className="landing-section-title">{t('landing.featuresTitle')}</h2>
                    <div className="landing-features-grid">
                        {[
                            { icon: '🎓', title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
                            { icon: '📋', title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
                            { icon: '🤝', title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
                            { icon: '🌍', title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
                        ].map((f, i) => (
                            <div key={i} className="landing-feature-card">
                                <div className="landing-feature-icon">{f.icon}</div>
                                <h3 className="landing-feature-title">{f.title}</h3>
                                <p className="landing-feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section id="stats" className="landing-section landing-section-dark">
                <div className="landing-section-inner">
                    <h2 className="landing-section-title" style={{ color: '#fff' }}>{t('landing.statsTitle')}</h2>
                    <div className="landing-stats-grid">
                        {[
                            { value: '2,000+', label: t('landing.statStudents') },
                            { value: '150+', label: t('landing.statUniversities') },
                            { value: '30+', label: t('landing.statCountries') },
                            { value: '95%', label: t('landing.statSuccessRate') },
                        ].map((s, i) => (
                            <div key={i} className="landing-stat-item">
                                <div className="landing-stat-value">{s.value}</div>
                                <div className="landing-stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="landing-section landing-cta-section">
                <div className="landing-section-inner" style={{ textAlign: 'center' }}>
                    <h2 className="landing-section-title">{t('landing.ctaTitle')}</h2>
                    <p className="landing-cta-desc">{t('landing.ctaDesc')}</p>
                    <Link to="/auth/register" className="btn btn-cta btn-lg">{t('landing.ctaButton')}</Link>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-footer-col">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div className="sidebar-logo-icon" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>V</div>
                            <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff' }}>Vimiss</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', lineHeight: 1.6 }}>{t('landing.footerDesc')}</p>
                    </div>
                    <div className="landing-footer-col">
                        <h4 style={{ color: '#fff', marginBottom: '0.75rem' }}>{t('landing.footerQuickLinks')}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <a href="#features" className="landing-footer-link">{t('landing.navAbout')}</a>
                            <a href="#stats" className="landing-footer-link">{t('landing.navServices')}</a>
                            <Link to="/auth/login" className="landing-footer-link">{t('landing.ctaLogin')}</Link>
                            <Link to="/auth/register" className="landing-footer-link">{t('landing.ctaRegister')}</Link>
                        </div>
                    </div>
                    <div className="landing-footer-col">
                        <h4 style={{ color: '#fff', marginBottom: '0.75rem' }}>{t('landing.footerContact')}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                            <span>📧 contact@vimiss.vn</span>
                            <span>📞 (+84) 28 1234 5678</span>
                            <span>📍 TP. Hồ Chí Minh, Việt Nam</span>
                        </div>
                    </div>
                </div>
                <div className="landing-footer-bottom">
                    <p>{t('landing.footerRights')}</p>
                </div>
            </footer>
        </div>
    );
};

// ============================================================================
// Auth Layout (two-column for Login; single card for others)
// ============================================================================
const AuthLayout = ({ children, twoColumn = false }) => {
    const { t } = useI18n();

    if (twoColumn) {
        return (
            <div className="auth-layout-two-col">
                <div className="auth-panel-left">
                    <div className="auth-panel-left-content">
                        <Link to="/" className="auth-panel-brand">
                            <div className="sidebar-logo-icon" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>V</div>
                            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>Vimiss</span>
                        </Link>
                        <h2 className="auth-panel-left-title">{t('landing.heroTitle')}</h2>
                        <p className="auth-panel-left-subtitle">{t('landing.heroSubtitle')}</p>
                        <div className="auth-panel-left-features">
                            <div className="auth-panel-feature">✅ {t('landing.feature1Title')}</div>
                            <div className="auth-panel-feature">✅ {t('landing.feature2Title')}</div>
                            <div className="auth-panel-feature">✅ {t('landing.feature3Title')}</div>
                        </div>
                    </div>
                </div>
                <div className="auth-panel-right">
                    <div className="auth-card-inner">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-layout">
            <div className="auth-card">
                <div className="auth-header auth-header-logo">
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', textDecoration: 'none' }}>
                        <div className="sidebar-logo-icon" style={{ width: 40, height: 40, fontSize: '1rem' }}>V</div>
                        <span className="auth-logo-text">Vimiss</span>
                    </Link>
                </div>
                {children}
            </div>
        </div>
    );
};

// ============================================================================
// Login Page (two-column layout)
// ============================================================================
const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { t, locale, setLocale } = useI18n();
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
        <AuthLayout twoColumn>
            <div className="auth-lang-toggle">
                <button className={`lang-btn ${locale === 'vi' ? 'active' : ''}`} onClick={() => setLocale('vi')}>VI</button>
                <button className={`lang-btn ${locale === 'en' ? 'active' : ''}`} onClick={() => setLocale('en')}>EN</button>
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

                <div className="auth-links">
                    <Link to="/auth/forgot-password" className="text-sm text-primary">{t('auth.forgotPassword')}</Link>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {t('auth.dontHaveAccount')} <Link to="/auth/register" className="text-primary">{t('auth.register')}</Link>
                    </span>
                </div>
            </form>
        </AuthLayout>
    );
};

// ============================================================================
// Register Page (2-step: request code → fill form)
// ============================================================================
const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
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
    const { t, locale, setLocale } = useI18n();
    const { login } = useAuth();
    const navigate = useNavigate();

    const emailRef = useRef(null);
    const nameRef = useRef(null);
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
        if (!name.trim()) errors.name = t('auth.nameRequired');
        if (!email.trim()) errors.email = t('auth.emailRequired');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t('auth.emailInvalid');
        if (Object.keys(errors).length) {
            setFieldErrors(errors);
            if (errors.name) nameRef.current?.focus();
            else emailRef.current?.focus();
            return;
        }

        setIsLoading(true);
        try {
            await axios.get('/sanctum/csrf-cookie');
            await axios.post('/register/request-code', { email, name });
        } catch (err) { /* generic message */ }
        setSuccessMessage(t('auth.invitationCodeSent'));
        setStep(2);
        setCountdown(60);
        setIsLoading(false);
    };

    const handleRegister = async (e) => {
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
            return;
        }

        setIsLoading(true);
        try {
            await axios.post('/register', {
                email,
                name,
                verification_code: codeString,
                password,
                password_confirmation: passwordConfirmation,
            });
            // Auto-login was handled server-side, fetch user
            setSuccessMessage(t('auth.registerSuccess'));
            // Small delay so user sees success
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } catch (err) {
            const errs = err.response?.data?.errors;
            if (errs?.verification_code) {
                setFieldErrors({ verificationCode: errs.verification_code[0] });
            } else if (errs?.email) {
                setFieldErrors({ email: errs.email[0] });
            } else if (errs?.password) {
                setFieldErrors({ password: errs.password[0] });
            } else {
                setError(err.response?.data?.message || t('auth.registerFailed'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0 || isLoading) return;
        setIsLoading(true);
        try { await axios.post('/register/request-code', { email, name }); } catch (err) { /* ignore */ }
        setSuccessMessage(t('auth.verificationCodeResent'));
        setCountdown(60);
        setIsLoading(false);
    };

    return (
        <AuthLayout>
            <div className="auth-lang-toggle" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <button className={`lang-btn ${locale === 'vi' ? 'active' : ''}`} onClick={() => setLocale('vi')}>VI</button>
                <button className={`lang-btn ${locale === 'en' ? 'active' : ''}`} onClick={() => setLocale('en')}>EN</button>
            </div>

            {step === 1 ? (
                <form onSubmit={handleRequestCode} className="auth-form">
                    <h2 className="auth-title text-center">{t('auth.registerTitle')}</h2>
                    <p className="auth-description">{t('auth.registerDesc')}</p>
                    {error && <div className="alert alert-error mb-4">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="name">{t('auth.fullName')} <span className="text-error">*</span></label>
                        <input ref={nameRef} id="name" type="text"
                            className={`form-input ${fieldErrors.name ? 'form-input-error' : ''}`}
                            value={name} onChange={e => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: null })); }}
                            placeholder={t('auth.enterFullName')} autoFocus disabled={isLoading} />
                        {fieldErrors.name && <p className="form-error-text">{fieldErrors.name}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">{t('auth.emailAddress')} <span className="text-error">*</span></label>
                        <input ref={emailRef} id="reg-email" type="email"
                            className={`form-input ${fieldErrors.email ? 'form-input-error' : ''}`}
                            value={email} onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null })); }}
                            placeholder={t('auth.enterEmail')} disabled={isLoading} />
                        {fieldErrors.email && <p className="form-error-text">{fieldErrors.email}</p>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-block mb-4" disabled={isLoading}>
                        {isLoading ? <><span className="btn-spinner"></span> {t('auth.sending')}</> : t('auth.sendInvitationCode')}
                    </button>

                    <div className="auth-links">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('auth.alreadyHaveAccount')} <Link to="/auth/login" className="text-primary">{t('auth.login')}</Link>
                        </span>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleRegister} className="auth-form">
                    <h2 className="auth-title text-center">{t('auth.registerTitle')}</h2>
                    {successMessage && <div className="alert alert-success mb-4">{successMessage}</div>}
                    {error && <div className="alert alert-error mb-4">{error}</div>}

                    <div className="form-group">
                        <label>{t('auth.verificationCode')} <span className="text-error">*</span></label>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>{t('auth.enterInvitationCode')}</p>
                        <OtpInput value={verificationCode} onChange={(newCode) => { setVerificationCode(newCode); if (fieldErrors.verificationCode) setFieldErrors(prev => ({ ...prev, verificationCode: null })); }}
                            disabled={isLoading} error={!!fieldErrors.verificationCode} />
                        {fieldErrors.verificationCode && <p className="form-error-text text-center">{fieldErrors.verificationCode}</p>}
                        <div className="text-center mt-2">
                            <button type="button" className="btn btn-ghost btn-sm" onClick={handleResendCode} disabled={countdown > 0 || isLoading}>
                                {countdown > 0 ? t('auth.resendIn', { seconds: countdown }) : t('auth.resendCode')}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password">{t('auth.newPassword')} <span className="text-error">*</span></label>
                        <div className="form-input-wrapper">
                            <input ref={passwordRef} id="reg-password" type={showPassword ? 'text' : 'password'}
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
                        <label htmlFor="reg-confirm-password">{t('auth.confirmPassword')} <span className="text-error">*</span></label>
                        <div className="form-input-wrapper">
                            <input ref={confirmPasswordRef} id="reg-confirm-password" type={showConfirmPassword ? 'text' : 'password'}
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
                        {isLoading ? <><span className="btn-spinner"></span> {t('auth.registering')}</> : t('auth.registerButton')}
                    </button>
                    <div className="auth-links">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('auth.alreadyHaveAccount')} <Link to="/auth/login" className="text-primary">{t('auth.login')}</Link>
                        </span>
                    </div>
                </form>
            )}
        </AuthLayout>
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
            await axios.get('/sanctum/csrf-cookie');
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
            setTimeout(() => navigate('/auth/login'), 2000);
        } catch (err) {
            const errs = err.response?.data?.errors;
            if (errs?.verification_code) {
                setFieldErrors({ verificationCode: errs.verification_code[0] });
            } else if (errs?.password) {
                setFieldErrors({ password: errs.password[0] });
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

    return (
        <AuthLayout>
            {step === 1 ? (
                <form onSubmit={handleRequestCode} className="auth-form">
                    <h2 className="auth-title text-center">{t('auth.forgotPassword')}</h2>
                    <p className="auth-description">{t('auth.forgotPasswordDesc')}</p>
                    {error && <div className="alert alert-error mb-4">{error}</div>}
                    <div className="form-group">
                        <label htmlFor="fp-email">{t('auth.emailAddress')} <span className="text-error">*</span></label>
                        <input ref={emailRef} id="fp-email" type="email" className={`form-input ${fieldErrors.email ? 'form-input-error' : ''}`}
                            value={email} onChange={e => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({}); }}
                            placeholder={t('auth.enterEmail')} autoFocus disabled={isLoading} />
                        {fieldErrors.email && <p className="form-error-text">{fieldErrors.email}</p>}
                    </div>
                    <button type="submit" className="btn btn-primary btn-block mb-4" disabled={isLoading}>
                        {isLoading ? <><span className="btn-spinner"></span> {t('auth.sending')}</> : t('auth.continue')}
                    </button>
                    <div className="text-center">
                        <Link to="/auth/login" className="text-sm text-primary" style={{ textDecoration: 'none' }}>{t('auth.backToLogin')}</Link>
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
                        <OtpInput value={verificationCode} onChange={(newCode) => { setVerificationCode(newCode); if (fieldErrors.verificationCode) setFieldErrors(prev => ({ ...prev, verificationCode: null })); }}
                            disabled={isLoading} error={!!fieldErrors.verificationCode} />
                        {fieldErrors.verificationCode && <p className="form-error-text text-center">{fieldErrors.verificationCode}</p>}
                        <div className="text-center mt-2">
                            <button type="button" className="btn btn-ghost btn-sm" onClick={handleResendCode} disabled={countdown > 0 || isLoading}>
                                {countdown > 0 ? t('auth.resendIn', { seconds: countdown }) : t('auth.resendCode')}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="fp-password">{t('auth.newPassword')} <span className="text-error">*</span></label>
                        <div className="form-input-wrapper">
                            <input ref={passwordRef} id="fp-password" type={showPassword ? 'text' : 'password'}
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
                        <label htmlFor="fp-confirm-password">{t('auth.confirmPassword')} <span className="text-error">*</span></label>
                        <div className="form-input-wrapper">
                            <input ref={confirmPasswordRef} id="fp-confirm-password" type={showConfirmPassword ? 'text' : 'password'}
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
                        <Link to="/auth/login" className="text-sm text-primary" style={{ textDecoration: 'none' }}>{t('auth.backToLogin')}</Link>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
};

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
        { path: '/my-mentor', label: t('nav.myMentor'), icon: '👨‍🏫', show: isStudent },
        { path: '/my-applications', label: t('nav.applications'), icon: '📋', show: isStudent || isMentor },
        { path: '/my-students', label: t('nav.myStudents'), icon: '👩‍🎓', show: isMentor },
        { path: '/students', label: t('nav.students'), icon: '🎓', show: isManagement },
        { path: '/mentors', label: t('nav.mentors'), icon: '👥', show: isManagement },
        { path: '/applications', label: t('nav.applications'), icon: '📁', show: isManagement },
        { path: '/universities', label: t('nav.universities'), icon: '🏛️', show: isManagement },
        { path: '/approvals', label: t('nav.approvals'), icon: '✅', show: isManagement },
        { path: '/calendar', label: t('nav.calendar'), icon: '📅', show: true },
        { path: '/reports', label: t('nav.reports'), icon: '📈', show: isManagement },
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
            </div>
            <div className="topbar-right">
                <div className="lang-switcher">
                    <button className={`lang-btn ${locale === 'vi' ? 'active' : ''}`} onClick={() => setLocale('vi')}>VI</button>
                    <button className={`lang-btn ${locale === 'en' ? 'active' : ''}`} onClick={() => setLocale('en')}>EN</button>
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
            navigate('/auth/login');
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
                <div className="sidebar-overlay" onClick={() => setSidebarMobileOpen(false)} />
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
                                {isLoading ? <span className="btn-spinner"></span> : t('auth.changePassword')}
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
                    <Link to="/settings/change-password" className="btn btn-outline">{t('auth.changePassword')}</Link>
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
            {/* Public landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth routes (guest only) */}
            <Route path="/auth/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/auth/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/auth/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

            {/* Legacy routes redirect */}
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />

            {/* Protected routes - all roles */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/settings/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
            <Route path="/change-password" element={<Navigate to="/settings/change-password" replace />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><PlaceholderPage title={t('nav.calendar')} icon="📅" /></ProtectedRoute>} />

            {/* Student routes */}
            <Route path="/my-mentor" element={<RoleRoute roles={['student']}><PlaceholderPage title={t('nav.myMentor')} icon="👨‍🏫" /></RoleRoute>} />
            <Route path="/my-applications" element={<RoleRoute roles={['student', 'mentor']}><PlaceholderPage title={t('nav.applications')} icon="📋" /></RoleRoute>} />

            {/* Mentor routes */}
            <Route path="/my-students" element={<RoleRoute roles={['mentor']}><PlaceholderPage title={t('nav.myStudents')} icon="👩‍🎓" /></RoleRoute>} />

            {/* Management routes */}
            <Route path="/students" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.students')} icon="🎓" /></RoleRoute>} />
            <Route path="/mentors" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.mentors')} icon="👥" /></RoleRoute>} />
            <Route path="/applications" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.applications')} icon="📁" /></RoleRoute>} />
            <Route path="/universities" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.universities')} icon="🏛️" /></RoleRoute>} />
            <Route path="/approvals" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.approvals')} icon="✅" /></RoleRoute>} />
            <Route path="/reports" element={<RoleRoute roles={['admin', 'director']}><PlaceholderPage title={t('nav.reports')} icon="📈" /></RoleRoute>} />

            {/* Admin only */}
            <Route path="/users" element={<RoleRoute roles={['admin']}><UsersPage /></RoleRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
