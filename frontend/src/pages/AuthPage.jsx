import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkinoraLogo from '../components/SkinoraLogo';
import { login, register } from '../api';
import AnimatedBackground from '../components/AnimatedBackground';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Footer from '../components/Footer';

const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45+'];

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '', age_range: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handle = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const fn = mode === 'login' ? login : register;
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, age_range: form.age_range || undefined };

      const res = await fn(payload);
      loginUser(res.data.token, res.data.user);

      // Route: if they already have a skin profile → dashboard; else → skin type detection
      if (res.data.user?.skin_profile?.skin_type) {
        navigate('/dashboard');
      } else {
        navigate('/skin-type');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setErrors({ general: data?.error || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', background: 'transparent' }}>
      {/* Animated background blobs (fixed, behind everything) */}
      <AnimatedBackground />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: '0 16px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card-glass" style={{ maxWidth: 440, width: '100%', padding: '40px 36px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-lg)' }}>
            <SkinoraLogo size={40} style={{ color: 'var(--clr-primary)' }} />
          </div>
          <div className="text-center mb-xl">
            <h1 style={{ fontFamily: 'var(--font-serif)' }}>Skinora</h1>
            <p className="text-muted text-sm mt-sm">Know your skin. Love your routine.</p>
          </div>

          {/* Tab switcher */}
          <div className="tabs mb-xl">
            <button className={`tab-btn${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setErrors({}); }}>
              Sign In
            </button>
            <button className={`tab-btn${mode === 'register' ? ' active' : ''}`} onClick={() => { setMode('register'); setErrors({}); }}>
              Create Account
            </button>
          </div>

          {errors.general && (
            <div className="alert alert--danger mb-md">{errors.general}</div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-md">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="name">Your Name</label>
                <input
                  id="name"
                  className={`form-input${errors.name ? ' error' : ''}`}
                  placeholder="e.g. Misba Khanum"
                  value={form.name}
                  onChange={handle('name')}
                  autoComplete="name"
                />
                {errors.name && <span className="form-error"><AlertTriangle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} /> {errors.name}</span>}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`form-input${errors.email ? ' error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handle('email')}
                autoComplete="email"
              />
              {errors.email && <span className="form-error"><AlertTriangle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} /> {errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={`form-input${errors.password ? ' error' : ''}`}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                value={form.password}
                onChange={handle('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {errors.password && <span className="form-error"><AlertTriangle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} /> {errors.password}</span>}
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="age_range">Age Range <span style={{ color: 'var(--clr-text-faint)', fontWeight: 400 }}>(optional)</span></label>
                <select
                  id="age_range"
                  className="form-input"
                  value={form.age_range}
                  onChange={handle('age_range')}
                  style={{ color: form.age_range ? 'var(--clr-text)' : 'var(--clr-text-faint)' }}
                >
                  <option value="">Select age range</option>
                  {AGE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg w-full mt-sm" disabled={loading}>
              {loading ? (
                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
              ) : (
                mode === 'login' ? 'Sign In →' : 'Start My Skin Journey →'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted mt-lg" style={{ lineHeight: 1.7 }}>
            Your skin data is never sold. Passwords are hashed and never stored in plain text.
          </p>
        </div>
      </div>
      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        <Footer variant="minimal" />
      </div>
    </div>
  );
}
