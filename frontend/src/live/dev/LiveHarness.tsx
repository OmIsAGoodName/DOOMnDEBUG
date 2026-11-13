import React from 'react';
import { LiveController } from '../index';

export default function LiveHarness() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Live Mode Dev Harness (/dev/live)</h1>
      <p className="text-slate-600">Owner: Maegan. Used for speech recognition, mic permissions, and tap buttons.</p>
      <LiveController />
    </div>
  );
}

