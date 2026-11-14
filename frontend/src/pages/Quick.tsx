import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { EpisodeRecord } from '@contracts';
import { api, useGeneration } from '../lib/api';
import {
  Button,
  Stepper,
  EpisodeView,
  Spinner
} from '../ui';

const EXAMPLE_PROMPTS = [
  'A shy owl learns to share her treehouse',
  'A fox loses his kite and finds a new friend',
  'A curious kid discovers a glowing door in the forest'
];

export default function Quick() {
  const [searchParams] = useSearchParams();
  const [prompt, setPrompt] = useState<string>(() => searchParams.get('prompt') || '');
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
  const { generation } = useGeneration(generationId);

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
      } as any);

      setGenerationId(res.generation_id);
    } catch (err: any) {
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

  // 1. Episode Ready State: Render Episode View + Saved Notice
  if (episode) {
    return (
      <div className="py-8 px-4 w-[94%] md:w-[75%] mx-auto space-y-4">
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

  // 2. Generating / Progress State
  if (generationId && !episode) {
    return (
      <div className="py-16 px-4 w-[94%] md:w-[75%] max-w-xl mx-auto space-y-6 relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-vox-gold/15 blur-[100px] pointer-events-none rounded-full" />
        <div className="relative z-10 text-center space-y-6 p-8 sm:p-10 rounded-[32px] border-t border-white/20 border-l border-white/15 border-r border-white/10 border-b border-black/40 bg-white/80 dark:bg-[#131d2e]/85 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-vox-gold/20 text-vox-gold border border-vox-gold/40 rounded-2xl flex items-center justify-center text-2xl shadow-gold-sm animate-pulse">
              ✨
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold font-display text-vox-midnight dark:text-vox-cream">Crafting Your Story...</h2>
            <p className="text-xs text-vox-lightMuted dark:text-vox-muted italic max-w-sm mx-auto line-clamp-2">"{prompt}"</p>
          </div>

          <div className="text-left bg-black/5 dark:bg-[#0c1524]/70 p-5 rounded-2xl border border-vox-warmBorder/60 dark:border-white/10 backdrop-blur-md">
            <Stepper
              currentStage={generation?.stage || 'understanding'}
              progress={generation?.progress}
            />
          </div>

          {loadingEpisode && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-vox-gold">
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
                  ⚙️ Diagnostics
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Main Quick Story Form (Glassmorphism 75% Width Inspired by Image 1)
  return (
    <div className="py-10 px-4 sm:px-6 w-[94%] md:w-[75%] mx-auto space-y-8 relative">
      {/* Ambient Corner Specular Glow (Inspired by Image 1's top-corner illumination) */}
      <div className="absolute -top-12 -left-12 w-96 h-96 bg-vox-gold/15 dark:bg-vox-gold/12 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 -right-16 w-80 h-80 bg-vox-mint/10 dark:bg-vox-mint/8 blur-[100px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="text-center space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 bg-vox-gold/15 text-vox-midnight dark:text-vox-gold border border-vox-gold/30 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide backdrop-blur-md">
          <span>🌙</span>
          <span>Bedtime Story Atelier</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-vox-midnight dark:text-vox-cream tracking-tight">
          What story shall we tell tonight?
        </h1>
        <p className="text-vox-lightMuted dark:text-vox-muted text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Type an idea or choose a prompt below. VoxFable writes, directs, and animates it with full voiceover.
        </p>
      </div>

      {/* Glassmorphic Card Container (Inspired by Image 1) */}
      <div className="relative z-10 rounded-[32px] p-6 sm:p-10 border-t border-white/30 border-l border-white/20 border-r border-white/10 border-b border-black/40 bg-white/70 dark:bg-[#131d2e]/80 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] dark:shadow-[0_25px_65px_-15px_rgba(0,0,0,0.85)]">
        {/* Specular Edge Highlight Overlay */}
        <div className="absolute inset-0 rounded-[32px] pointer-events-none border border-white/10 dark:border-white/5" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* Prompt Sunken Glass Input Well */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-vox-lightMuted dark:text-vox-muted">
              Story Idea
            </label>
            <div className="rounded-2xl p-4 sm:p-5 border border-vox-warmBorder/80 dark:border-white/10 bg-black/[0.03] dark:bg-[#0c1524]/65 backdrop-blur-md focus-within:border-vox-gold/80 focus-within:ring-2 focus-within:ring-vox-gold/25 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)]">
              <textarea
                rows={4}
                placeholder="e.g. A shy little owl named Pip who is afraid of flying during the day meets Rusty the Fox..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                className="w-full bg-transparent text-sm sm:text-base text-vox-midnight dark:text-vox-cream placeholder:text-vox-lightMuted/60 dark:placeholder:text-vox-muted/60 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Example Prompt Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-vox-lightMuted dark:text-vox-muted/80">
                Or try an idea:
              </span>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 backdrop-blur-sm text-left ${
                      prompt === ex
                        ? 'bg-vox-gold/20 text-vox-gold border border-vox-gold/60 font-semibold shadow-gold-sm'
                        : 'bg-black/[0.04] dark:bg-white/[0.04] text-vox-lightMuted dark:text-vox-muted border border-vox-warmBorder/60 dark:border-white/10 hover:border-vox-gold/40 hover:text-vox-midnight dark:hover:text-vox-cream'
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Duration Selector Glass Chips (Inspired by Image 1) */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-vox-lightMuted dark:text-vox-muted">
              Story Duration
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    className={`p-3.5 sm:p-4 rounded-2xl border text-center transition-all duration-150 backdrop-blur-md active:scale-[0.98] ${
                      selected
                        ? 'border-vox-gold bg-vox-gold/20 dark:bg-vox-gold/15 shadow-gold-sm ring-1 ring-vox-gold/50'
                        : 'border-vox-warmBorder/80 dark:border-white/10 bg-black/[0.03] dark:bg-[#0c1524]/50 hover:bg-black/[0.06] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className={`text-sm sm:text-base font-bold ${selected ? 'text-vox-midnight dark:text-vox-gold' : 'text-vox-midnight dark:text-vox-cream'}`}>
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-vox-lightMuted dark:text-vox-muted mt-0.5">
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Grid (Age Band & Live Mic) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Age Level Select */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-vox-lightMuted dark:text-vox-muted">
                Age Level
              </label>
              <div className="relative">
                <select
                  value={ageBand}
                  onChange={(e) => setAgeBand(e.target.value as any)}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-vox-warmBorder/80 dark:border-white/10 bg-white/70 dark:bg-[#0c1524]/60 backdrop-blur-md text-xs sm:text-sm font-semibold text-vox-midnight dark:text-vox-cream focus:outline-none focus:border-vox-gold/80 focus:ring-2 focus:ring-vox-gold/25 transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer pr-8"
                >
                  <option value="3-5" className="bg-white dark:bg-vox-sidebar">Ages 3 - 5 (Simple rhymes & repetition)</option>
                  <option value="4-6" className="bg-white dark:bg-vox-sidebar">Ages 4 - 6 (Storybook adventure & dialogue)</option>
                  <option value="6-8" className="bg-white dark:bg-vox-sidebar">Ages 6 - 8 (Riddles & gentle choices)</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-vox-lightMuted dark:text-vox-muted text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Live Interactive Voice Toggle */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-vox-lightMuted dark:text-vox-muted">
                Interactive Voice Choices
              </label>
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-vox-warmBorder/80 dark:border-white/10 bg-white/70 dark:bg-[#0c1524]/60 backdrop-blur-md cursor-pointer hover:border-vox-gold/50 transition-all select-none">
                <input
                  type="checkbox"
                  checked={isInteractive}
                  onChange={(e) => setIsInteractive(e.target.checked)}
                  className="rounded text-vox-gold focus:ring-vox-gold h-4 w-4 accent-vox-gold"
                />
                <span className="text-xs sm:text-sm font-semibold text-vox-midnight dark:text-vox-cream flex items-center gap-2">
                  <span>🎙️</span>
                  <span>Let cartoon listen (Live Mode)</span>
                </span>
              </label>
            </div>
          </div>

          {/* Interactive Branching Choice Screens Config (Om's Multi-Tier Tree Options) */}
          {isInteractive && (
            <div className="p-4 sm:p-5 rounded-2xl border border-vox-gold/30 bg-vox-gold/5 dark:bg-vox-gold/[0.06] backdrop-blur-md space-y-4 animate-fadeIn">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-vox-gold">
                    Branching Choice Points (Quest Complexity)
                  </label>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-vox-gold/20 text-vox-gold border border-vox-gold/40">
                    Live Audio Enabled
                  </span>
                </div>
                <p className="text-xs text-vox-lightMuted dark:text-vox-muted">
                  How many times will characters pause and listen to the child's voice to branch the storyline?
                </p>
              </div>

              {/* Number of Choices Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    val: 1,
                    label: '1 Choice Screen',
                    desc: '5 scenes, 2 branching endings (Fast)'
                  },
                  {
                    val: 2,
                    label: '2 Choice Screens',
                    desc: '7 scenes, 4 unique endings (Recommended)',
                    highlight: true
                  },
                  {
                    val: 3,
                    label: '3 Choice Screens',
                    desc: '9 scenes, 3-tier deep quest tree'
                  }
                ].map((opt) => {
                  const selected = numChoices === opt.val;
                  return (
                    <button
                      type="button"
                      key={opt.val}
                      onClick={() => setNumChoices(opt.val)}
                      className={`p-3.5 rounded-2xl border text-left transition-all backdrop-blur-sm ${
                        selected
                          ? 'border-vox-gold bg-vox-gold/20 dark:bg-vox-gold/15 ring-1 ring-vox-gold/50 shadow-gold-sm'
                          : 'border-vox-warmBorder/80 dark:border-white/10 bg-white/70 dark:bg-[#0c1524]/60 hover:border-vox-gold/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${selected ? 'text-vox-midnight dark:text-vox-gold' : 'text-vox-midnight dark:text-vox-cream'}`}>
                          {opt.label}
                        </span>
                        {opt.highlight && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-vox-gold text-vox-midnight">
                            REC
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-vox-lightMuted dark:text-vox-muted mt-1 leading-tight">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Force Large Tree Toggle */}
              <div className="pt-2 border-t border-vox-gold/20">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={forceInteractiveTree}
                    onChange={(e) => setForceInteractiveTree(e.target.checked)}
                    className="rounded text-vox-gold focus:ring-vox-gold h-4 w-4 accent-vox-gold"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-vox-midnight dark:text-vox-cream flex items-center gap-1.5">
                      <span>⚡</span> Force Large Long Tree (Deep Multi-Path Expansion)
                    </span>
                    <p className="text-[10px] text-vox-lightMuted dark:text-vox-muted">
                      Enforces completely separate backgrounds and distinct climax resolutions for all branches.
                    </p>
                  </div>
                </label>
              </div>

              {/* Gemini Strict Requirement Notice */}
              {numChoices > 1 && (
                <div className="bg-vox-gold/10 border border-vox-gold/30 rounded-xl p-2.5 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-vox-midnight dark:text-vox-cream font-medium">
                    <span>💎</span>
                    <span>Multi-choice trees strictly require <strong>Google Gemini</strong> for fast deep-tree synthesis.</span>
                  </div>
                  <a
                    href="/debug"
                    className="text-vox-gold font-bold hover:underline shrink-0 text-[10px]"
                  >
                    Check Diagnostics ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Custom Character Generation Glass Banner */}
          <div className="p-4 rounded-2xl border border-vox-warmBorder/80 dark:border-white/10 bg-black/[0.02] dark:bg-[#0c1524]/40 backdrop-blur-sm">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={generateCharacters}
                onChange={(e) => setGenerateCharacters(e.target.checked)}
                className="mt-0.5 rounded text-vox-gold focus:ring-vox-gold h-4 w-4 accent-vox-gold"
              />
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-semibold text-vox-midnight dark:text-vox-cream flex items-center gap-1.5">
                  <span>🎨</span> Try generating new character designs for this story
                </span>
                <p className="text-[11px] text-vox-lightMuted dark:text-vox-muted leading-snug">
                  Newly generated characters will be added to your Library. <span className="font-semibold text-vox-gold">(Takes ~15–20s longer)</span>
                </p>
              </div>
            </label>
          </div>

          {/* Radiant Action Button (Inspired by Image 1's luminous accent button) */}
          <button
            type="submit"
            disabled={!prompt.trim() || isSubmitting}
            className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-200 select-none ${
              !prompt.trim() || isSubmitting
                ? 'opacity-50 cursor-not-allowed bg-vox-gold/30 text-vox-midnight'
                : 'bg-gradient-to-r from-vox-gold via-lantern-500 to-vox-gold hover:from-lantern-400 hover:to-lantern-500 text-vox-midnight shadow-gold-glow hover:shadow-[0_0_28px_rgba(233,173,97,0.45)] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                <span>Launching Story Forge...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Create Cartoon Story</span>
                <span className="w-7 h-7 rounded-full bg-vox-midnight/15 flex items-center justify-center text-xs font-bold">
                  &rarr;
                </span>
              </>
            )}
          </button>
        </form>

        {/* Offline Fallback Callout */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-2xl bg-vox-coral/10 border border-vox-coral/30 space-y-3">
            <p className="text-xs text-vox-coral font-semibold">{errorMessage}</p>
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
      </div>
    </div>
  );
}
