import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { EpisodeRecord } from '@contracts';
import { api, useGeneration } from '../lib/api';
import {
  Card,
  Button,
  Textarea,
  Select,
  Chip,
  Stepper,
  EpisodeView,
  Spinner,
  VoxFableLogo
} from '../ui';

const EXAMPLE_PROMPTS = [
  'A shy owl learns to share her treehouse',
  'A fox loses his kite and finds a new friend',
  'A curious kid discovers a glowing door in the forest'
];

export default function Quick() {
  const [prompt, setPrompt] = useState('');
  const [ageBand, setAgeBand] = useState<'3-5' | '4-6' | '6-8'>('4-6');
  const [isInteractive, setIsInteractive] = useState<boolean>(true);
  const [numChoices, setNumChoices] = useState<number>(2);
  const [forceInteractiveTree, setForceInteractiveTree] = useState<boolean>(true);
  const [duration, setDuration] = useState<'<1min' | '1-2mins' | '2-3mins'>('1-2mins');
  const [generateCharacters, setGenerateCharacters] = useState<boolean>(false);

  // Generation state
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Loaded ready episode
  const [episode, setEpisode] = useState<EpisodeRecord | null>(null);
  const [loadingEpisode, setLoadingEpisode] = useState<boolean>(false);

  // Poll generation status
  const { generation, error: pollError } = useGeneration(generationId);

  // Handle generation completion
  useEffect(() => {
    if (!generation) return;

    if (generation.status === 'succeeded' && generation.episode_ids.length > 0) {
      const epId = generation.episode_ids[0];
      setLoadingEpisode(true);
      api
        .getEpisode(epId)
        .then((ep) => {
          setEpisode(ep);
          setLoadingEpisode(false);
        })
        .catch((err) => {
          setErrorMessage(`Failed to load ready episode: ${err.message}`);
          setLoadingEpisode(false);
        });
    } else if (generation.status === 'failed') {
      setErrorMessage(
        generation.error || 'The story writer encountered an issue. Please try a simpler prompt.'
      );
    }
  }, [generation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setEpisode(null);

      const res = await api.createGeneration({
        kind: 'quick',
        prompt: prompt.trim(),
        age_band: ageBand,
        interactive: isInteractive,
        duration,
        generate_characters: generateCharacters,
        num_choices: isInteractive ? numChoices : 1,
        force_interactive_tree: isInteractive ? forceInteractiveTree : false
      });

      setGenerationId(res.generation_id);
    } catch (err: any) {
      // In offline / fallback demo mode, allow immediate fallback to bundled quick episode
      console.warn('API generation failed, offering offline demo episode:', err);
      setErrorMessage(
        `Backend service offline or unreachable (${err.message}). You can play our pre-baked demo episode below!`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayDemoEpisode = async (demoId: string) => {
    try {
      setLoadingEpisode(true);
      setErrorMessage(null);
      const demoEp = await api.getEpisode(demoId);
      setEpisode(demoEp);
    } catch (err: any) {
      setErrorMessage(`Could not load demo episode: ${err.message}`);
    } finally {
      setLoadingEpisode(false);
    }
  };

  const handleReset = () => {
    setGenerationId(null);
    setEpisode(null);
    setErrorMessage(null);
    setPrompt('');
  };

  // 1. Episode Ready State: Render Episode View
  if (episode) {
    return (
      <div className="py-8 px-4 max-w-4xl mx-auto space-y-4">
        {/* Saved to Library Notice Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-2xl select-none">🎉</span>
            <div>
              <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                Story Generated & Auto-Saved to Your Library!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                You can re-watch, explore branches, or export this episode anytime from the Library tab.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/library">
              <Button variant="secondary" size="sm">
                📚 View in Library
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              + New Story
            </Button>
          </div>
        </div>

        <EpisodeView episode={episode} onReset={handleReset} />
      </div>
    );
  }

  // 2. Generating / Pipeline Stage State
  if (generationId && !episode) {
    return (
      <div className="py-16 px-4 max-w-lg mx-auto space-y-6 relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 dark:bg-amber-400/5 blur-3xl pointer-events-none rounded-full" />
        <Card padding="lg" className="text-center space-y-6 relative z-10 border-stone-200/90 dark:border-midnight-700/80 shadow-storybook bg-white dark:bg-midnight-800/95 rounded-3xl">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center text-2xl shadow-storybook-sm animate-pulse">
              ✨
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold font-display text-stone-900 dark:text-slate-100">Crafting Your Story...</h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 italic max-w-sm mx-auto line-clamp-2">"{prompt}"</p>
          </div>

          <div className="text-left bg-stone-50/80 dark:bg-midnight-900/70 p-5 rounded-2xl border border-stone-200/70 dark:border-midnight-700/70">
            <Stepper
              currentStage={generation?.stage || 'understanding'}
              progress={generation?.progress}
            />
          </div>

          {loadingEpisode && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Spinner size="sm" />
              <span>Loading animation assets into player...</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300 text-left space-y-3">
              <p>{errorMessage}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="danger" size="sm" onClick={handleReset}>
                  ↺ Try Again
                </Button>
                {errorMessage.includes('High-level model') && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setNumChoices(1);
                        handleReset();
                      }}
                    >
                      🌿 Switch to 1 Choice Screen
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsInteractive(false);
                        handleReset();
                      }}
                    >
                      🎬 Switch to Non-Interactive
                    </Button>
                  </>
                )}
                <a
                  href="/debug"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  ⚙️ Diagnostics / Gemini Key
                </a>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // 3. Prompt Input Form
  return (
    <div className="py-10 px-4 max-w-2xl mx-auto space-y-8 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 dark:bg-amber-400/5 blur-3xl pointer-events-none rounded-full" />
      {/* Page Title */}
      <div className="text-center space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-500/25 dark:border-amber-400/20 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide">
          <span>🌙</span>
          <span>Bedtime Story Atelier</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-stone-900 dark:text-slate-100 tracking-tight">
          What story shall we tell tonight?
        </h1>
        <p className="text-stone-600 dark:text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
          Type an idea or choose a prompt below. VoxFable writes, directs, and animates it with full voiceover.
        </p>
      </div>

      <Card padding="lg" className="relative z-10 border-stone-200/90 dark:border-midnight-700/80 shadow-storybook dark:shadow-storybook-hover bg-white/95 dark:bg-midnight-800/95 backdrop-blur-md rounded-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt Textarea */}
          <div className="space-y-2.5">
            <Textarea
              label="Story Idea"
              rows={3}
              placeholder="e.g. A shy little owl named Pip who is afraid of flying during the day meets Rusty the Fox..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />

            {/* Example Prompt Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-slate-300 uppercase tracking-wider">
                Or try an idea:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <Chip
                    key={ex}
                    label={ex}
                    onClick={() => setPrompt(ex)}
                    selected={prompt === ex}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Duration Selector Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300">
              Story Duration
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: '<1min', label: '< 1 min', desc: 'Snack Story (2 scenes)' },
                { id: '1-2mins', label: '1 - 2 mins', desc: 'Bedtime Tale (3-4 scenes)' },
                { id: '2-3mins', label: '2 - 3 mins', desc: 'Extended Tale (4-5 scenes)' }
              ].map((opt) => {
                const selected = duration === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDuration(opt.id as any)}
                    className={`p-3.5 rounded-2xl border text-center transition-all duration-150 active:scale-[0.98] ${
                      selected
                        ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-400/10 shadow-storybook-sm ring-1 ring-amber-500/30'
                        : 'border-stone-200/80 dark:border-midnight-700/70 bg-stone-50/80 dark:bg-midnight-900/60 hover:bg-stone-100 dark:hover:bg-midnight-750'
                    }`}
                  >
                    <div className={`text-sm font-bold ${selected ? 'text-amber-700 dark:text-amber-300' : 'text-stone-800 dark:text-slate-200'}`}>
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Age Band */}
            <Select
              label="Age Level"
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value as any)}
              options={[
                { value: '3-5', label: 'Ages 3 - 5 (Simple rhymes & repetition)' },
                { value: '4-6', label: 'Ages 4 - 6 (Storybook adventure & dialogue)' },
                { value: '6-8', label: 'Ages 6 - 8 (Riddles & gentle choices)' }
              ]}
            />

            {/* Live Interactive Toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300">
                Interactive Voice Choices
              </label>
              <label className="flex items-center gap-3 p-2.5 min-h-[44px] rounded-xl border border-stone-200/80 dark:border-midnight-700/70 bg-stone-50/80 dark:bg-midnight-900/60 cursor-pointer hover:bg-stone-100 dark:hover:bg-midnight-750 transition-colors">
                <input
                  type="checkbox"
                  checked={isInteractive}
                  onChange={(e) => setIsInteractive(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4 accent-amber-500"
                />
                <span className="text-xs font-semibold text-stone-800 dark:text-slate-200">
                  🎙 Let cartoon listen (Live Mode)
                </span>
              </label>
            </div>
          </div>

          {/* Interactive Choice Tree Configuration */}
          {isInteractive && (
            <div className="p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/30 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20 space-y-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-950/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌳</span>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                      Branching Choice Tree & Story Depth
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Configure how many decision points and alternate branch endings to generate.
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white shadow-2xs">
                  {numChoices === 1
                    ? '1 Choice (5 Scenes • 2 Endings)'
                    : numChoices === 2
                    ? '2 Choices (7 Scenes • 4 Endings)'
                    : '3 Choices (9 Scenes • Epic Tree)'}
                </span>
              </div>

              {/* Number of Choice Screens Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Number of Choice Screens:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      val: 1,
                      label: '1 Choice Screen',
                      desc: '5 scenes, 2 branching endings (Fast)',
                    },
                    {
                      val: 2,
                      label: '2 Choice Screens',
                      desc: '7 scenes, 4 unique endings (Recommended)',
                      highlight: true,
                    },
                    {
                      val: 3,
                      label: '3 Choice Screens',
                      desc: '9 scenes, 3-tier deep quest tree',
                    },
                  ].map((opt) => {
                    const selected = numChoices === opt.val;
                    return (
                      <button
                        type="button"
                        key={opt.val}
                        onClick={() => setNumChoices(opt.val)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-black ${
                              selected
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </span>
                          {opt.highlight && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500 text-white">
                              HOT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Force Large Tree Toggle */}
              <div className="pt-1 border-t border-indigo-100 dark:border-indigo-950/80">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={forceInteractiveTree}
                    onChange={(e) => setForceInteractiveTree(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <div className="space-y-0.2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>⚡</span> Force Large Long Tree (Deep Multi-Path Expansion)
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Instructs the writer to enforce completely separate backgrounds and distinct climax resolutions for all branches.
                    </p>
                  </div>
                </label>
              </div>

              {/* Gemini Strict Requirement Notice */}
              {numChoices > 1 && (
                <div className="bg-indigo-100/70 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900 rounded-xl p-2.5 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-medium">
                    <span>💎</span>
                    <span>Multi-choice trees strictly require <strong>Google Gemini</strong> for fast deep-tree synthesis.</span>
                  </div>
                  <a
                    href="/debug"
                    className="text-indigo-700 dark:text-indigo-300 font-bold hover:underline shrink-0 text-[10px]"
                  >
                    Check Gemini Status ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Custom Character Generation Checkbox */}
          <div className="p-3.5 rounded-2xl border border-stone-200/80 dark:border-midnight-700/70 bg-stone-50/80 dark:bg-midnight-900/60 space-y-1">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={generateCharacters}
                onChange={(e) => setGenerateCharacters(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 h-4 w-4 border-stone-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 accent-amber-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🎨</span> Try generating new character designs for this story
                </span>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-snug">
                  Newly generated characters will be added to your Library. <span className="font-semibold text-amber-600 dark:text-amber-400">(Note: this takes ~15–20s longer)</span>
                </p>
              </div>
            </label>
          </div>

          {/* Submit Big-Kid Button */}
          <Button
            type="submit"
            variant="big-kid"
            className="w-full text-slate-950 font-extrabold text-base sm:text-lg shadow-lantern-glow-sm hover:shadow-lantern-glow"
            loading={isSubmitting}
            disabled={!prompt.trim()}
          >
            ✨ Create Cartoon Story
          </Button>
        </form>

        {/* Offline Fallback Callout */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-3">
            <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">{errorMessage}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePlayDemoEpisode('demo_quick')}
              >
                🎬 Play Bundled Quick Episode (Pip the Owl)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePlayDemoEpisode('demo_live')}
              >
                🎙 Play Bundled Interactive Episode
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
