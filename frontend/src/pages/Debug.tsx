import React, { useState, useEffect } from 'react';
import { api, type SystemStatsResponse } from '../lib/api';
import { Card, Button, Spinner } from '../ui';

export default function Debug() {
  const [stats, setStats] = useState<SystemStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Key form state
  const [provider, setProvider] = useState<'groq' | 'gemini'>('groq');
  const [newKey, setNewKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('openai/gpt-oss-120b');
  const [updating, setUpdating] = useState<boolean>(false);
  const [switchingProvider, setSwitchingProvider] = useState<string | null>(null);
  const [groqModelChoice, setGroqModelChoice] = useState<string>('openai/gpt-oss-120b');
  const [geminiModelChoice, setGeminiModelChoice] = useState<string>('gemini-flash-lite-latest');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSystemStats();
      setStats(res);
      if (res.providers.groq.model) {
        setGroqModelChoice(res.providers.groq.model);
        if (res.active_provider === 'groq') {
          setSelectedModel(res.providers.groq.model);
        }
      }
      if (res.providers.gemini.model) {
        setGeminiModelChoice(res.providers.gemini.model);
        if (res.active_provider === 'gemini') {
          setSelectedModel(res.providers.gemini.model);
        }
      }
    } catch (err: any) {
      setError(`Failed to fetch system stats: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchActive = async (targetProvider: 'groq' | 'gemini', targetModel: string) => {
    try {
      setSwitchingProvider(targetProvider);
      setActionMessage(null);
      const res = await api.switchActiveProvider({
        provider: targetProvider,
        model: targetModel,
      });
      setActionMessage({ type: 'success', text: res.message });
      await fetchStats();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || `Failed to switch active engine to ${targetProvider}.`,
      });
    } finally {
      setSwitchingProvider(null);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUpdateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    try {
      setUpdating(true);
      setActionMessage(null);
      const res = await api.updateApiKey({
        provider,
        api_key: newKey.trim(),
        model: selectedModel,
      });

      setActionMessage({ type: 'success', text: res.message });
      setNewKey('');
      // Refresh stats
      await fetchStats();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to verify and update API key.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const groq = stats?.providers?.groq;
  const gemini = stats?.providers?.gemini;
  const tts = stats?.providers?.tts;

  const isRateLimited = groq?.stats?.needs_new_key || groq?.stats?.last_status === 'rate_limited';

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              System Diagnostics & Quota Monitor
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time API rate limits, model fallback tracking, and instant API key hot-swapping.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={fetchStats} loading={loading}>
            🔄 Refresh Stats
          </Button>
        </div>
      </div>

      {/* Active Generation Engine Hard Switcher */}
      <Card padding="lg" className="border-indigo-200 dark:border-indigo-900/60 shadow-md bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-950/20 dark:via-slate-900 dark:to-purple-950/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-950/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎛️</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Active Story Generation Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hard switch the active model and key used by the Writer & Director pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Currently In Use:</span>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-sm flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {(stats?.active_provider || 'groq').toUpperCase()}: {stats?.active_model || 'loading...'}
            </span>
          </div>
        </div>

        {/* Engine Switcher Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Groq Engine Card */}
          <div
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4 ${
              stats?.active_provider === 'groq'
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Groq Cloud (LPU Inference)
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {groq?.masked_key || 'No key set'}
                    </p>
                  </div>
                </div>

                {stats?.active_provider === 'groq' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                    ACTIVE
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Engine Model:
                </label>
                <select
                  value={groqModelChoice}
                  onChange={(e) => setGroqModelChoice(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Flagship Studio)</option>
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                  <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Fast & Reliable)</option>
                  <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest)</option>
                </select>
              </div>
            </div>

            <Button
              variant={stats?.active_provider === 'groq' ? 'primary' : 'secondary'}
              size="sm"
              disabled={!groq?.configured || switchingProvider === 'groq'}
              loading={switchingProvider === 'groq'}
              onClick={() => handleSwitchActive('groq', groqModelChoice)}
              className="w-full justify-center"
            >
              {stats?.active_provider === 'groq' ? '✓ Currently Active (Re-apply)' : '⚡ Switch to Groq Engine'}
            </Button>
          </div>

          {/* Gemini Engine Card */}
          <div
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4 ${
              stats?.active_provider === 'gemini'
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Google Gemini (AI Studio)
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {gemini?.masked_key || 'No key set'}
                    </p>
                  </div>
                </div>

                {stats?.active_provider === 'gemini' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                    ACTIVE
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Engine Model:
                </label>
                <select
                  value={geminiModelChoice}
                  onChange={(e) => setGeminiModelChoice(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Recommended - Fast & Free)</option>
                  <option value="gemini-flash-latest">gemini-flash-latest (Full Flash)</option>
                  <option value="gemini-pro-latest">gemini-pro-latest (Pro Quality)</option>
                </select>
              </div>
            </div>

            <Button
              variant={stats?.active_provider === 'gemini' ? 'primary' : 'secondary'}
              size="sm"
              disabled={!gemini?.configured || switchingProvider === 'gemini'}
              loading={switchingProvider === 'gemini'}
              onClick={() => handleSwitchActive('gemini', geminiModelChoice)}
              className="w-full justify-center"
            >
              {stats?.active_provider === 'gemini' ? '✓ Currently Active (Re-apply)' : '💎 Switch to Gemini Engine'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Quota Health Alert Banner */}
      {isRateLimited ? (
        <div className="bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500/80 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-xl shadow-md">
              ⚠️
            </div>
            <div>
              <h2 className="text-base font-black text-rose-900 dark:text-rose-200">
                Rate Limit Exceeded (Time for a Fresh API Key!)
              </h2>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {stats?.active_provider?.toUpperCase()} has hit its daily token allowance (TPD) or per-minute rate limit. Paste a fresh API key below or switch models to restore maximum studio story quality.
              </p>
            </div>
          </div>
          <a
            href={stats?.active_provider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://console.groq.com/keys'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
          >
            Get Free Key ↗
          </a>
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400/40 rounded-3xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">
            ✨
          </div>
          <div>
            <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <span>LLM Provider Operational & Quota Healthy</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                {stats?.active_provider || 'ACTIVE'}
              </span>
            </h2>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Active primary model: <strong className="underline font-mono">{stats?.active_model || 'openai/gpt-oss-120b'}</strong> ({stats?.active_provider === 'gemini' ? 'Google Gemini AI Studio' : 'Groq Cloud LPU'}) with multi-tier failover.
            </p>
          </div>
        </div>
      )}

      {/* Spotlight: Currently Active Model Live Stats */}
      <Card padding="md" className="border-indigo-200 dark:border-indigo-900/60 shadow-sm bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-950 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Currently Selected Model Live Stats:{' '}
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {stats?.active_model}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Provider: <strong className="uppercase">{stats?.active_provider}</strong>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                stats?.active_model_stats?.last_status === 'healthy'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                  : stats?.active_model_stats?.last_status === 'rate_limited'
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {stats?.active_model_stats?.last_status || 'idle'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Total Calls
            </span>
            <strong className="text-xl font-black text-slate-800 dark:text-slate-100">
              {stats?.active_model_stats?.calls || 0}
            </strong>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Successes
            </span>
            <strong className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {stats?.active_model_stats?.successes || 0}
            </strong>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              429 Rate Limits
            </span>
            <strong className="text-xl font-black text-amber-600 dark:text-amber-400">
              {stats?.active_model_stats?.rate_limits || 0}
            </strong>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Last Latency
            </span>
            <strong className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {stats?.active_model_stats?.last_latency_ms != null
                ? `${stats.active_model_stats.last_latency_ms} ms`
                : '—'}
            </strong>
          </div>
        </div>
      </Card>

      {/* Comprehensive All Models Breakdown Table */}
      <Card padding="lg" className="border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>📊</span> All Available Models & Real-Time Stats
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live statistics and 1-click model switching across all Groq and Gemini models.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {Object.keys(stats?.models || {}).length} models tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Calls</th>
                <th className="py-2.5 px-3 text-center">Success</th>
                <th className="py-2.5 px-3 text-center">429 Hits</th>
                <th className="py-2.5 px-3 text-center">Latency</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(stats?.models || {}).map(([modelId, mStats]) => {
                const isActive = stats?.active_model === modelId;
                const isGemini = mStats.provider === 'gemini';
                return (
                  <tr
                    key={modelId}
                    className={`transition-colors ${
                      isActive
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/30 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {modelId}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-600 text-white">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      {mStats.description && (
                        <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                          {mStats.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isGemini
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isGemini ? '💎 Gemini' : '⚡ Groq'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          mStats.last_status === 'healthy'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : mStats.last_status === 'rate_limited'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {mStats.last_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {mStats.calls}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {mStats.successes}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                      {mStats.rate_limits}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                      {mStats.last_latency_ms != null ? `${mStats.last_latency_ms} ms` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <Button
                        variant={isActive ? 'primary' : 'secondary'}
                        size="sm"
                        disabled={isActive || switchingProvider === modelId}
                        loading={switchingProvider === modelId}
                        onClick={() => handleSwitchActive(mStats.provider as any, modelId)}
                      >
                        {isActive ? '✓ Active' : 'Select'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Hot-Swap API Key Card */}
      <Card padding="lg" className="border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>🔑</span> Hot-Swap API Key (Instant Runtime Update)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Paste a fresh API key here. VoxFable will test it live against the provider, update runtime settings immediately, and persist it to backend environment.
          </p>
        </div>

        {actionMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
            }`}
          >
            {actionMessage.type === 'success' ? '✅ ' : '❌ '}
            {actionMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdateKey} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="groq">Groq (Ultra-Fast Free Tier)</option>
                <option value="gemini">Google Gemini (Flash Tier)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {provider === 'groq' ? (
                  <>
                    <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Flagship Studio Quality)</option>
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (High Quality & Versatile)</option>
                    <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Balanced & Reliable)</option>
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest 8B)</option>
                  </>
                ) : (
                  <>
                    <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Recommended - Fast & Free)</option>
                    <option value="gemini-flash-latest">gemini-flash-latest</option>
                    <option value="gemini-pro-latest">gemini-pro-latest</option>
                  </>
                )}
              </select>
            </div>

            <div className="sm:col-span-1 flex flex-col justify-end">
              <span className="text-[11px] text-slate-400 mb-1">Need a free backup key?</span>
              <a
                href={provider === 'groq' ? 'https://console.groq.com/keys' : 'https://aistudio.google.com/app/apikey'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                Create new {provider.toUpperCase()} key ↗
              </a>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              New API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={provider === 'groq' ? 'gsk_...' : 'AIza...'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 pr-24"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={updating}
              disabled={!newKey.trim()}
            >
              Verify & Apply Fresh Key
            </Button>
          </div>
        </form>
      </Card>

      {/* Provider Details & Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Groq Card */}
        <Card padding="md" className="border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                  Groq Cloud API
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {groq?.masked_key || 'Not configured'}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                groq?.stats?.needs_new_key
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : groq?.configured
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {groq?.stats?.needs_new_key
                ? 'Rate Limited'
                : groq?.configured
                ? 'Operational'
                : 'Unset'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs text-slate-400">Total Calls</span>
              <strong className="text-base text-slate-800 dark:text-slate-100">
                {groq?.stats?.calls || 0}
              </strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs text-slate-400">Successes</span>
              <strong className="text-base text-emerald-600 dark:text-emerald-400">
                {groq?.stats?.successes || 0}
              </strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs text-slate-400">429 Rate Limits</span>
              <strong className="text-base text-amber-600 dark:text-amber-400">
                {groq?.stats?.rate_limits || 0}
              </strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs text-slate-400">Active Model</span>
              <strong className="text-xs text-slate-700 dark:text-slate-200 truncate block">
                {groq?.stats?.last_model_used || groq?.model || '120b'}
              </strong>
            </div>
          </div>

          {/* Fallback Priority Queue */}
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider block">
              Auto-Failover Priority Ladder:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {['openai/gpt-oss-120b (1st)', 'llama-3.3-70b (2nd)', 'gpt-oss-20b (3rd)', 'llama-3.1-8b (4th)'].map(
                (m, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]"
                  >
                    {m}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Last Error Message if any */}
          {groq?.stats?.last_error && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl p-3 text-xs space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 block">
                Latest Groq Warning / Limit:
              </span>
              <p className="font-mono text-[11px] text-amber-900 dark:text-amber-200 line-clamp-3">
                {groq.stats.last_error}
              </p>
            </div>
          )}
        </Card>

        {/* Gemini Card */}
        <Card padding="md" className="border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💎</span>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                  Google Gemini API
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {gemini?.masked_key || 'Not configured'}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                gemini?.stats?.needs_new_key
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : gemini?.configured
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {gemini?.stats?.needs_new_key
                ? 'Rate Limited'
                : gemini?.configured
                ? 'Operational'
                : 'Unset'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs text-slate-400">Total Calls</span>
              <strong className="text-base text-slate-800 dark:text-slate-100">
                {gemini?.stats?.calls || 0}
              </strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs text-slate-400">Successes</span>
              <strong className="text-base text-emerald-600 dark:text-emerald-400">
                {gemini?.stats?.successes || 0}
              </strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs text-slate-400">Rate Limits</span>
              <strong className="text-base text-amber-600 dark:text-amber-400">
                {gemini?.stats?.rate_limits || 0}
              </strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-xs text-slate-400">Configured</span>
              <strong className="text-xs text-slate-700 dark:text-slate-200 truncate block">
                {gemini?.model || 'lite-latest'}
              </strong>
            </div>
          </div>

          {/* Model Candidates */}
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider block">
              Gemini Fallback Models:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {['gemini-flash-lite-latest (1st)', 'gemini-flash-latest (2nd)', 'gemini-pro-latest (3rd)'].map(
                (m, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]"
                  >
                    {m}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Last Gemini Error if any */}
          {gemini?.stats?.last_error && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl p-3 text-xs space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 block">
                Latest Gemini Warning / Error:
              </span>
              <p className="font-mono text-[11px] text-amber-900 dark:text-amber-200 line-clamp-3">
                {gemini.stats.last_error}
              </p>
            </div>
          )}
        </Card>

        {/* Supporting Engines Card */}
        <Card padding="md" className="border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎙</span>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                  Audio & Voice Synthesis (Edge-TTS)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Microsoft Neural Speech Engine
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Active
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Parallel Workers:</span>
              <strong className="font-mono">{tts?.concurrency || 6} workers</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Cached Audio Lines:</span>
              <strong className="font-mono">{tts?.cached_audio_clips || 0} files</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400">Export Converter:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">FFmpeg 720p/30fps</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Canvas Engine:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                1280x720 High-Q Anti-Aliased
              </strong>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            💡 <strong>Why Video Quality Varies:</strong> Flagship models like <code>openai/gpt-oss-120b</code> produce the richest, most expressive Bluey-style dialogue. When free tier quota limits are reached, the system fails over to lighter models or demo backups. Keeping a fresh key ensures 120B quality at all times.
          </div>
        </Card>
      </div>
    </div>
  );
}

