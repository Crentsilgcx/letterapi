import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Mail,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import './tokens.css';
import './ReceptionLoginPage.css';

function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = () => {
    if (error) setError(null);
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="login-brand-icon" aria-hidden="true">
          <Mail size={20} />
        </span>
        <span className="login-brand-text">Letter Delivery</span>
      </div>

      <div className="login-card">
        <div className="login-card-form">
          <h1 className="login-heading">Administration</h1>
          <p className="login-subtext">Sign in to access administration.</p>

          {error && (
            <div className="login-error" role="alert" aria-live="polite">
              <AlertCircle className="login-error-icon" size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="username" className="login-label">Username</label>
              <div className="login-input-wrapper">
                <User className="login-input-icon" size={20} aria-hidden="true" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="username"
                  className={`login-input ${error ? 'error' : ''}`}
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); handleInputChange(); }}
                  required
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">Password</label>
              <div className="login-input-wrapper">
                <Lock className="login-input-icon" size={20} aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  className={`login-input ${error ? 'error' : ''}`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); handleInputChange(); }}
                  required
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={isSubmitting || !username.trim() || !password}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="login-submit-spinner" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} aria-hidden="true" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            className="login-back"
            onClick={() => navigate('/')}
            disabled={isSubmitting}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back
          </button>

          <p className="login-footer-text">
            Administrator access only.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;