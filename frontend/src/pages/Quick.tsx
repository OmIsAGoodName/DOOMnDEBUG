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
        interactive: isInteractive
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
        <Card padding="lg" className="text-center space-y-6 shadow-md border-slate-200">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center animate-bounce shadow-inner">
              ✨
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Crafting Your Story...</h2>
            <p className="text-xs text-slate-500 italic">"{prompt}"</p>
          </div>

          <div className="text-left bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <Stepper
              currentStage={generation?.stage || 'understanding'}
              progress={generation?.progress}
            />
          </div>

          {loadingEpisode && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
              <Spinner size="sm" />
              <span>Loading animation assets into player...</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 text-left space-y-2">
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
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-extrabold uppercase">
          <span>⚡</span> Quick Bedtime Story
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          What story shall we tell tonight?
        </h1>
        <p className="text-slate-500 text-sm">
          Type an idea or pick an example below. VoxFable writes, directs, and animates it in seconds.
        </p>
      </div>

      <Card padding="lg" className="border-slate-200 shadow-md">
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
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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

          {/* Options Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Interactive Voice Choices
              </label>
              <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isInteractive}
                  onChange={(e) => setIsInteractive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">
                  🎙 Let cartoon listen (Live Mode)
                </span>
              </label>
            </div>
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
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <p className="text-xs text-amber-800 font-semibold">{errorMessage}</p>
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
