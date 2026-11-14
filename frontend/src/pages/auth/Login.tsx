import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { Card, Button, Input, VoxFableLogo } from '../../ui';

export default function Login() {
  const { signIn, enterDemoMode, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await signIn(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoMode = () => {
    enterDemoMode();
    navigate('/');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <VoxFableLogo size={48} />
          </div>
          <h1 className="text-3xl font-bold font-display text-stone-900 dark:text-slate-100 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-stone-600 dark:text-slate-300">Sign in to your VoxFable account</p>
        </div>

        <Card padding="lg" className="border-stone-200/90 dark:border-midnight-700/80 shadow-storybook bg-white dark:bg-midnight-800 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={submitting || authLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 dark:border-midnight-700 space-y-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full font-semibold text-amber-950 dark:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25"
              onClick={handleDemoMode}
            >
              ⚡ Continue in Demo Mode
            </Button>
            <p className="text-xs text-center text-stone-500 dark:text-slate-400">
              Works offline with sample episodes &bull; No login required
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-stone-500 dark:text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/signup" className="font-semibold text-amber-600 dark:text-amber-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
