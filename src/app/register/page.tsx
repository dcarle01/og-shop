// SHOP_src_app_register_page.tsx
// Version: 1.0.1 | Created: 2026-03-14 | Last Modified 2026-03-29 | Author: Open Gateways Team
// Description: Shop-native registration page — bilingual
// ✅ Creates account in shared users table
// ✅ Auto-logs in after registration
// ✅ Redirects to /products on success

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = t.required;
    if (!formData.lastName.trim())  newErrors.lastName  = t.required;

    if (!formData.email) {
      newErrors.email = t.required;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = language === 'es' ? 'Correo inválido' : 'Invalid email';
    }

    if (!formData.password) {
      newErrors.password = t.required;
    } else if (formData.password.length < 8) {
      newErrors.password = t.passwordTooShort;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t.required;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.passwordMismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name:  formData.lastName.trim(),
          email:      formData.email.toLowerCase().trim(),
          password:   formData.password,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setSubmitError(
          data.error === 'email_exists' ? t.emailAlreadyExists : t.errorGeneric
        );
        return;
      }

      // Auto-login
      await login(formData.email.toLowerCase().trim(), formData.password);
      router.push('/products');

    } catch {
      setSubmitError(t.errorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <CartDrawer />

      <main className="register-page">
        <div className="container">
          <div className="register-card glass-card">
            {/* Header */}
            <div className="register-header">
              <div className="register-icon">✨</div>
              <h1 className="register-title">{t.registerTitle}</h1>
              <p className="register-subtitle">{t.registerSubtitle}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="register-form" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {t.firstName} <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className={`form-input${errors.firstName ? ' error' : ''}`}
                    value={formData.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    autoFocus
                  />
                  {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t.lastName} <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className={`form-input${errors.lastName ? ' error' : ''}`}
                    value={formData.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                  />
                  {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t.email} <span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className={`form-input${errors.email ? ' error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t.password} <span className="required-star">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  className={`form-input${errors.password ? ' error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t.confirmPassword} <span className="required-star">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className={`form-input${errors.confirmPassword ? ' error' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>

              {submitError && (
                <div className="submit-error">{submitError}</div>
              )}

              <button
                type="submit"
                className="btn btn-primary submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? t.registering : t.createAccount}
              </button>
            </form>

            {/* Sign-in link */}
            <div className="register-footer">
              <span className="footer-text">{t.alreadyHaveAccount}</span>{' '}
              <button
                className="footer-link footer-btn"
                onClick={() => {
                  const origin = (typeof window !== 'undefined'
                    && sessionStorage.getItem('og_signin_origin')) || '/products';
                  sessionStorage.setItem('og_open_signin', '1');
                  router.push(origin);
                }}
              >
                {t.signIn}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .register-page {
          min-height: calc(100vh - 80px);
          padding: 48px 0 72px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .register-card {
          max-width: 500px;
          margin: 0 auto;
          padding: 48px;
        }

        .register-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .register-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .register-title {
          margin: 0 0 8px 0;
          font-size: 1.75rem;
          color: var(--color-text-primary);
        }

        .register-subtitle {
          margin: 0;
          color: var(--color-text-muted);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .required-star {
          color: var(--color-error);
        }

        .form-input.error {
          border-color: var(--color-error);
        }

        .field-error {
          font-size: 0.8rem;
          color: var(--color-error);
        }

        .submit-error {
          padding: 12px 14px;
          background: rgba(245, 101, 101, 0.1);
          border: 1px solid var(--color-error);
          border-radius: 8px;
          color: var(--color-error);
          font-size: 0.875rem;
        }

        .submit-btn {
          width: 100%;
          font-size: 1rem;
          padding: 14px;
          margin-top: 4px;
        }

        .submit-btn:disabled {
          opacity: 0.7;
        }

        .register-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          text-align: center;
          font-size: 0.875rem;
        }

        .footer-text {
          color: var(--color-text-muted);
        }

        .footer-link {
          color: var(--color-primary);
          font-weight: 500;
          text-decoration: none;
        }

        .footer-link:hover {
          text-decoration: underline;
        }

        .footer-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;
        }
      
        .footer-link-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;
        }
      
        @media (max-width: 480px) {
          .register-card {
            padding: 32px 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
