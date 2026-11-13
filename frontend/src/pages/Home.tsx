import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-4xl font-extrabold text-slate-800">VoxFable 🎬</h1>
      <p className="text-slate-600 text-lg">AI Children's Animation Studio</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <Link to="/quick" className="p-6 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition block shadow-sm">
          <h2 className="text-xl font-bold text-amber-800">Quick Story ⚡</h2>
          <p className="text-sm text-amber-700 mt-2">Generate an animated episode from a single prompt.</p>
        </Link>
        <Link to="/studio" className="p-6 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition block shadow-sm">
          <h2 className="text-xl font-bold text-indigo-800">Studio Mode 🎨</h2>
          <p className="text-sm text-indigo-700 mt-2">Series showrunner, character bible, multi-episode batching.</p>
        </Link>
        <Link to="/library" className="p-6 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition block shadow-sm">
          <h2 className="text-xl font-bold text-emerald-800">Episode Library 📚</h2>
          <p className="text-sm text-emerald-700 mt-2">Browse, play, and export your animated episodes.</p>
        </Link>
      </div>
      <div className="pt-6 border-t border-slate-200 flex gap-4 text-sm text-slate-500">
        <Link to="/dev/engine" className="hover:underline">Dev Engine</Link>
        <Link to="/dev/live" className="hover:underline">Dev Live</Link>
        <Link to="/dev/art" className="hover:underline">Dev Art Gallery</Link>
      </div>
    </div>
  );
}

