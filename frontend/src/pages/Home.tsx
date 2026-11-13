import React from 'react';
import { Link } from 'react-router-dom';
import { Card, VoxFableLogo } from '../ui';

export default function Home() {
  return (
    <div className="py-12 px-6 max-w-5xl mx-auto space-y-12 text-slate-800">
      {/* Hero Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <VoxFableLogo size={64} className="drop-shadow-md" />
        </div>
        <h1 className="text-5xl font-black tracking-tight text-slate-900">
          Where Bedtime Stories <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 bg-clip-text text-transparent">
            Come to Life
          </span>
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          Original, child-safe interactive cartoon engine. Turn any bedtime prompt into an animated story where kids can talk back to the characters.
        </p>
      </div>

      {/* Main 3 Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Story */}
        <Link to="/quick" className="group">
          <Card
            hoverEffect
            className="h-full flex flex-col justify-between border-2 border-amber-200 bg-gradient-to-b from-amber-50/50 to-white hover:border-amber-400 group-hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-md">
                ⚡
              </div>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                Quick Story
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate an animated episode from a single sentence prompt. Includes live interactive voice choices and instant playback.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-amber-600">
              <span>Start Story</span>
              <span>&rarr;</span>
            </div>
          </Card>
        </Link>

        {/* Studio Mode */}
        <Link to="/studio" className="group">
          <Card
            hoverEffect
            className="h-full flex flex-col justify-between border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white hover:border-indigo-400 group-hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-md">
                🎨
              </div>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                Studio Mode
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Create persistent series worlds, customize characters with accessories and color palettes, and generate complete seasons.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-indigo-600">
              <span>Open Studio</span>
              <span>&rarr;</span>
            </div>
          </Card>
        </Link>

        {/* Library */}
        <Link to="/library" className="group">
          <Card
            hoverEffect
            className="h-full flex flex-col justify-between border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white hover:border-emerald-400 group-hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-md">
                📚
              </div>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                Episode Library
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Browse your saved episodes, replay offline bundled adventures, inspect safety badges, and export to 720p MP4.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-emerald-600">
              <span>View Library</span>
              <span>&rarr;</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Developer Links */}
      <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div className="flex gap-4">
          <Link to="/dev/art" className="hover:text-indigo-600 font-semibold">
            🎨 Art Gallery (/dev/art)
          </Link>
          <Link to="/dev/engine" className="hover:text-indigo-600 font-semibold">
            ⚙️ Dev Engine Harness
          </Link>
          <Link to="/dev/live" className="hover:text-indigo-600 font-semibold">
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
