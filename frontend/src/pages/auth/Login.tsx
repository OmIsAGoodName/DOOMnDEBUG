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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-slate-500">Sign in to your VoxFable account</p>
        </div>

        <Card padding="lg" className="border-slate-200 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
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
              className="w-full"
              loading={submitting || authLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full font-bold text-slate-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
              onClick={handleDemoMode}
            >
              ⚡ Continue in Demo Mode
            </Button>
            <p className="text-[11px] text-center text-slate-400">
              Works completely offline with bundled sample episodes &bull; No login required
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/signup" className="font-bold text-indigo-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
