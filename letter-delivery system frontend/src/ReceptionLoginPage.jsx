import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Mail,
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

function ReceptionLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/reception/dashboard';

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
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Incorrect username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = () => {
    if (error) setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'CapsLock') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'CapsLock') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  useEffect(() => {
    const input = document.getElementById('password');
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
      input.addEventListener('keyup', handleKeyUp);
      return () => {
        input.removeEventListener('keydown', handleKeyDown);
        input.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, []);

  const isFormEmpty = !username.trim() || !password;

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
          <h1 className="login-heading">Reception sign in</h1>
          <p className="login-subtext">Sign in to access the reception dashboard.</p>

          {error && (
            <div className="login-error" role="alert" aria-live="polite">
              <AlertCircle className="login-error-icon" size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="username" className="login-label">
                Username
              </label>
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
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  required
                  autoFocus
                  disabled={isSubmitting}
                  aria-describedby={error ? 'username-error' : undefined}
                  aria-invalid={!!error}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Password
              </label>
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
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  required
                  disabled={isSubmitting}
                  aria-describedby={error ? 'password-error' : capsLockOn ? 'capslock-hint' : undefined}
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
              {capsLockOn && (
                <div id="capslock-hint" className="login-capslock" aria-live="polite">
                  <AlertCircle className="login-capslock-icon" size={12} aria-hidden="true" />
                  Caps Lock is on
                </div>
              )}
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={isSubmitting || isFormEmpty}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="login-submit-spinner" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                'Sign In'
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
            Need access? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReceptionLoginPage;