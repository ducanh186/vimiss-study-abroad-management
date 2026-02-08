/**
 * i18n - Internationalization System
 * Supports: English (en), Vietnamese (vi)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './locales/en';
import vi from './locales/vi';

const locales = { en, vi };

const STORAGE_KEY = 'vimiss_language';
const DEFAULT_LOCALE = 'vi';

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
    const [locale, setLocaleState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE;
        }
        return DEFAULT_LOCALE;
    });

    const setLocale = useCallback((newLocale) => {
        if (locales[newLocale]) {
            setLocaleState(newLocale);
            localStorage.setItem(STORAGE_KEY, newLocale);
            document.documentElement.lang = newLocale;
        }
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const t = useCallback((key, params = {}) => {
        const keys = key.split('.');
        let value = locales[locale];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`i18n: Missing key "${key}" for locale "${locale}"`);
                return key;
            }
        }

        if (typeof value === 'string') {
            return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
                return params[paramKey] !== undefined ? params[paramKey] : `{${paramKey}}`;
            });
        }

        return key;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, locales: Object.keys(locales) }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
};
