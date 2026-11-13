import React from 'react';
import { EpisodePlayer } from '../index';
import quickDemoPlan from '@fixtures/episode_quick_demo.json';
import type { EpisodePlan } from '@contracts';

export default function EngineHarness() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Engine Dev Harness (/dev/engine)</h1>
      <p className="text-slate-600">Owner: Maegan. Used for seeking, timeline testing, and recording.</p>
      <EpisodePlayer
        plan={quickDemoPlan as unknown as EpisodePlan}
        audio={null}
        mode="watch"
      />
    </div>
  );
}

