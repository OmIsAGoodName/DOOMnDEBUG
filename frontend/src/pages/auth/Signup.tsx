import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { Card, Button, Input, VoxFableLogo } from '../../ui';

export default function Signup() {
  const { signUp, enterDemoMode, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'parent' | 'creator' | 'school'>('parent');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill out all fields.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await signUp(email.trim(), password, displayName.trim(), accountType);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Signup failed. Please try again.');
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
          <h1 className="text-3xl font-bold font-display text-stone-900 dark:text-slate-100 tracking-tight">Create an Account</h1>
          <p className="text-sm text-stone-600 dark:text-slate-300">Join VoxFable to make children's cartoons</p>
        </div>

        <Card padding="lg" className="border-stone-200/90 dark:border-midnight-700/80 shadow-storybook bg-white dark:bg-midnight-800 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            <Input
              label="Your Name or Display Name"
              type="text"
              placeholder="e.g. Sarah Parker"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

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

            {/* Account Type Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300">
                Account Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'parent', label: 'Parent 🏡' },
                    { key: 'creator', label: 'Creator 🎬' },
                    { key: 'school', label: 'School 🏫' }
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setAccountType(t.key)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 active:scale-95 ${
                      accountType === t.key
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-storybook-sm'
                        : 'bg-stone-50 dark:bg-midnight-900 hover:bg-stone-100 dark:hover:bg-midnight-750 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-midnight-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={submitting || authLoading}
            >
              Create Account
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
              Skip login & explore sample episodes offline
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
