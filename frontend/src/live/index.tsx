import React from 'react';

export interface LiveControllerProps {
  onTranscript?: (text: string) => void;
  onChoiceSelected?: (optionId: string) => void;
}

export function LiveController({ onTranscript, onChoiceSelected }: LiveControllerProps) {
  return (
    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
      <p className="font-semibold">LiveController Stub (Maegan)</p>
      <p className="text-xs text-emerald-600 mt-1">Handles Web Speech recognition & tap fallback.</p>
    </div>
  );
}

export default LiveController;

