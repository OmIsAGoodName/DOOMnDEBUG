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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create an Account</h1>
          <p className="text-sm text-slate-500">Join VoxFable to make children's cartoons</p>
        </div>

        <Card padding="lg" className="border-slate-200 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      accountType === t.key
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
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
