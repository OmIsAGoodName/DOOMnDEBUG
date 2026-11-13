import React, { useState, useEffect } from 'react';
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
        generate_characters: generateCharacters
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
      <div className="py-8 px-4">
        <EpisodeView episode={episode} onReset={handleReset} />
      </div>
    );
  }

  // 2. Generating / Pipeline Stage State
  if (generationId && !episode) {
    return (
      <div className="py-16 px-4 max-w-lg mx-auto space-y-6">
        <Card padding="lg" className="text-center space-y-6 shadow-md border-slate-200 dark:border-slate-800">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center animate-bounce shadow-inner">
              ✨
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Crafting Your Story...</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{prompt}"</p>
          </div>

          <div className="text-left bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Stepper
              currentStage={generation?.stage || 'understanding'}
              progress={generation?.progress}
            />
          </div>

          {loadingEpisode && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Spinner size="sm" />
              <span>Loading animation assets into player...</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300 text-left space-y-2">
              <p>{errorMessage}</p>
              <Button variant="danger" size="sm" onClick={handleReset}>
                ↺ Try Again
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // 3. Prompt Input Form
  return (
    <div className="py-10 px-4 max-w-2xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300/40 px-3 py-1 rounded-full text-xs font-extrabold uppercase">
          <span>⚡</span> Quick Bedtime Story
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          What story shall we tell tonight?
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Type an idea or pick an example below. VoxFable writes, directs, and animates it in seconds.
        </p>
      </div>

      <Card padding="lg" className="border-slate-200 dark:border-slate-800 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt Textarea */}
          <div className="space-y-2">
            <Textarea
              label="Story Idea"
              rows={3}
              placeholder="e.g. A shy little owl named Pip who is afraid of flying during the day meets Rusty the Fox..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />

            {/* Example Prompt Chips */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Story Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
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
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`text-sm font-extrabold ${selected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Interactive Voice Choices
              </label>
              <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={isInteractive}
                  onChange={(e) => setIsInteractive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  🎙 Let cartoon listen (Live Mode)
                </span>
              </label>
            </div>
          </div>

          {/* Custom Character Generation Checkbox */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={generateCharacters}
                onChange={(e) => setGenerateCharacters(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🎨</span> Try generating new character designs for this story
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Newly generated characters will be added to your Library. <span className="font-semibold text-amber-600 dark:text-amber-400">(Note: this takes ~15–20s longer)</span>
                </p>
              </div>
            </label>
          </div>

          {/* Submit Big-Kid Button */}
          <Button
            type="submit"
            variant="big-kid"
            className="w-full"
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
