import React, { useState } from 'react';
import liveDemoPlan from '@fixtures/episode_live_demo.json';
import type { EpisodePlan } from '@contracts';
import { LiveController, matchChoice } from '../index';

export default function LiveHarness() {
  const plan = liveDemoPlan as unknown as EpisodePlan;
  const [simulatedText, setSimulatedText] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [episodeEnded, setEpisodeEnded] = useState(false);
  const [chosenHistory, setChosenHistory] = useState<string[]>([]);

  const handleTestMatch = () => {
    const options = [
      { id: 'a', label: 'Follow the firefly', keywords: ['firefly', 'follow'], next_scene: 'sc2a' },
      { id: 'b', label: 'Open the door', keywords: ['door', 'open'], next_scene: 'sc2b' },
    ];
    const match = matchChoice(simulatedText, options);
    setTestResult(JSON.stringify(match));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 text-slate-100">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-emerald-400">
          Live Mode Dev Harness (/dev/live)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Owner: Maegan. Tests Web Speech recognition, tap buttons fallback, and client keyword matching.
        </p>
      </div>

      {/* Main Interactive Controller */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <LiveController
          plan={plan}
          audio={null}
          onChoiceSelected={(optId) => {
            console.log('[LiveHarness] Choice selected:', optId);
            setChosenHistory((prev) => [...prev, optId]);
          }}
          onEnd={() => {
            console.log('[LiveHarness] Episode ended!');
            setEpisodeEnded(true);
          }}
        />
      </div>

      {/* Test / Simulation Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Keyword Match Simulator
          </h2>
          <p className="text-xs text-slate-400">
            Simulate spoken text to verify client keyword match rules:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={simulatedText}
              onChange={(e) => setSimulatedText(e.target.value)}
              placeholder="e.g. 'the door please' or 'firefly'"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <button
              onClick={handleTestMatch}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-xs"
            >
              Test
            </button>
          </div>
          {testResult && (
            <div className="p-2 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-amber-300">
              {testResult}
            </div>
          )}
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-400">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Live Session Stats
          </h2>
          <div>
            <span className="font-semibold text-slate-200">Chosen Path:</span>{' '}
            {chosenHistory.length > 0 ? chosenHistory.join(' -> ') : 'None yet'}
          </div>
          <div>
            <span className="font-semibold text-slate-200">Episode Status:</span>{' '}
            {episodeEnded ? 'Complete' : 'In Progress'}
          </div>
        </div>
      </div>
    </div>
  );
}
