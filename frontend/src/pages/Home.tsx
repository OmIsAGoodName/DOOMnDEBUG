import React from 'react';
import { Link } from 'react-router-dom';
import { Card, VoxFableLogo } from '../ui';

export default function Home() {
  return (
    <div className="py-12 px-6 max-w-5xl mx-auto space-y-12 text-stone-800 dark:text-slate-200 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-amber-500/10 dark:bg-amber-400/5 blur-3xl pointer-events-none rounded-full" />
      {/* Hero Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto relative z-10">
        <div className="flex justify-center">
          <VoxFableLogo size={64} className="drop-shadow-md" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight text-stone-900 dark:text-slate-100">
          Where Bedtime Stories <br />
          <span className="text-amber-500 dark:text-amber-400">
            Come to Life
          </span>
        </h1>
        <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
          Original, child-safe interactive cartoon engine. Turn any bedtime prompt into an animated story where kids can talk back to the characters.
        </p>
      </div>

      {/* Main 3 Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Quick Story */}
        <Link to="/quick" className="group">
          <Card
            hoverEffect
            className="h-full flex flex-col justify-between border-stone-200/90 dark:border-midnight-700/80 bg-white/95 dark:bg-midnight-800/95 hover:border-amber-400/80 dark:hover:border-amber-400/60 shadow-storybook-sm group-hover:shadow-storybook transition-all"
          >
            <div className="space-y-3">
              <div className="w-13 h-13 bg-amber-500/15 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-storybook-sm">
                🌙
              </div>
              <h2 className="text-2xl font-bold font-display text-stone-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Quick Story
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
                Generate an animated episode from a single sentence prompt. Includes live interactive voice choices and instant playback.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
              <span>Start Story</span>
              <span>&rarr;</span>
            </div>
          </Card>
        </Link>

        {/* Studio Mode */}
        <Link to="/studio" className="group">
          <Card
            hoverEffect
            className="h-full flex flex-col justify-between border-stone-200/90 dark:border-midnight-700/80 bg-white/95 dark:bg-midnight-800/95 hover:border-amber-400/80 dark:hover:border-amber-400/60 shadow-storybook-sm group-hover:shadow-storybook transition-all"
          >
            <div className="space-y-3">
              <div className="w-13 h-13 bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-storybook-sm">
                🎬
              </div>
              <h2 className="text-2xl font-bold font-display text-stone-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Studio Mode
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
                Create persistent series worlds, customize characters with accessories and color palettes, and generate complete seasons.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
              <span>Open Studio</span>
              <span>&rarr;</span>
            </div>
          </Card>
        </Link>

        {/* Library */}
        <Link to="/library" className="group">
          <Card
            hoverEffect
            className="h-full flex flex-col justify-between border-stone-200/90 dark:border-midnight-700/80 bg-white/95 dark:bg-midnight-800/95 hover:border-amber-400/80 dark:hover:border-amber-400/60 shadow-storybook-sm group-hover:shadow-storybook transition-all"
          >
            <div className="space-y-3">
              <div className="w-13 h-13 bg-meadow-500/15 border border-meadow-500/30 text-meadow-500 rounded-2xl flex items-center justify-center text-2xl shadow-storybook-sm">
                📚
              </div>
              <h2 className="text-2xl font-bold font-display text-stone-900 dark:text-slate-100 group-hover:text-meadow-600 dark:group-hover:text-meadow-400 transition-colors">
                Episode Library
              </h2>
              <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
                Browse your saved episodes, replay offline bundled adventures, inspect safety badges, and export to 720p MP4.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-meadow-600 dark:text-meadow-400">
              <span>View Library</span>
              <span>&rarr;</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Developer Links */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex gap-4">
          <Link to="/dev/art" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold">
            🎨 Art Gallery (/dev/art)
          </Link>
          <Link to="/dev/engine" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold">
            ⚙️ Dev Engine Harness
          </Link>
          <Link to="/dev/live" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold">
            🎙 Dev Live Mode Harness
          </Link>
        </div>
        <div>
          <span>PS 16 &bull; VoxFable Autonomous Studio</span>
        </div>
      </div>
    </div>
  );
}
