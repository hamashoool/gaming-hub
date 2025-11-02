import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 4) {
      setter(value);
    }
  };

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return 'Username is required';
    }
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (username.length > 20) {
      return 'Username must be at most 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate username
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    // Validate PIN
    if (pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must contain only numbers');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await signup({ username: username.trim(), pin });

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Signup failed');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-mesh-light dark:bg-gradient-mesh-dark bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-theme">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh-light dark:bg-gradient-mesh-dark bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-theme relative overflow-hidden">
      {/* Floating Theme Toggle */}
      <div className="fixed top-6 right-6 z-50 animate-fade-in">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full glass rounded-3xl shadow-glass dark:shadow-glass-dark p-8 animate-scale-in">
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2 transition-theme">Sign Up</h1>
          <p className="text-slate-600 dark:text-slate-400 transition-theme">Create your Gaming Hub account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-slide-up">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-theme">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="w-full px-4 py-3 glass-light rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-theme"
              disabled={isSubmitting}
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-theme">
              4-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => handlePinChange(e, setPin)}
              placeholder="Create a 4-digit PIN"
              className="w-full px-4 py-3 glass-light rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-theme text-center text-2xl tracking-widest"
              disabled={isSubmitting}
              maxLength={4}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 text-center">
              {pin.length}/4 digits
            </p>
          </div>

          <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-theme">
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={confirmPin}
              onChange={(e) => handlePinChange(e, setConfirmPin)}
              placeholder="Re-enter your PIN"
              className="w-full px-4 py-3 glass-light rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-theme text-center text-2xl tracking-widest"
              disabled={isSubmitting}
              maxLength={4}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 text-center">
              {confirmPin.length}/4 digits
            </p>
          </div>

          {error && (
            <div className="animate-fade-in p-4 glass-light rounded-xl border-2 border-red-500 dark:border-red-400">
              <p className="text-red-700 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="space-y-3 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <button
              type="submit"
              disabled={isSubmitting || !username.trim() || pin.length !== 4 || confirmPin.length !== 4}
              className="w-full py-3 px-6 glass-heavy rounded-xl font-semibold text-white shadow-glow hover:shadow-glow-intense transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
