import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 4) {
      setPin(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await login({ username: username.trim(), pin });

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed');
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
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2 transition-theme">Login</h1>
          <p className="text-slate-600 dark:text-slate-400 transition-theme">Welcome back to Gaming Hub</p>
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
              placeholder="Enter your username"
              className="w-full px-4 py-3 glass-light rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-theme"
              disabled={isSubmitting}
              autoFocus
            />
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
              onChange={handlePinChange}
              placeholder="Enter your 4-digit PIN"
              className="w-full px-4 py-3 glass-light rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-theme text-center text-2xl tracking-widest"
              disabled={isSubmitting}
              maxLength={4}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 text-center">
              {pin.length}/4 digits
            </p>
          </div>

          {error && (
            <div className="animate-fade-in p-4 glass-light rounded-xl border-2 border-red-500 dark:border-red-400">
              <p className="text-red-700 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="space-y-3 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <button
              type="submit"
              disabled={isSubmitting || !username.trim() || pin.length !== 4}
              className="w-full py-3 px-6 glass-heavy rounded-xl font-semibold text-white shadow-glow hover:shadow-glow-intense transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>

            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
