import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import type { EpisodePlayerProps, EpisodePlayerHandle } from '@contracts';

export type { EpisodePlayerHandle };

export const EpisodePlayer = forwardRef<EpisodePlayerHandle, EpisodePlayerProps>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(ref, () => ({
    play: () => console.log('[EpisodePlayer stub] play'),
    pause: () => console.log('[EpisodePlayer stub] pause'),
    seek: (t: number) => console.log('[EpisodePlayer stub] seek', t),
    resolveChoice: (optionId: string) => console.log('[EpisodePlayer stub] resolveChoice', optionId),
    startRecording: () => console.log('[EpisodePlayer stub] startRecording'),
    stopRecording: async () => new Blob([], { type: 'video/webm' }),
    getTime: () => 0,
    getDuration: () => 30,
    getChosenPath: () => [],
  }));

  return (
    <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-lg overflow-hidden flex flex-col items-center justify-center text-white border border-slate-700 shadow-lg">
      <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-contain" />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none p-4 text-center">
        <p className="text-xl font-bold text-amber-400">EpisodePlayer Stub (Maegan)</p>
        <p className="text-sm text-slate-300 mt-1">Plan: {props.plan?.title || 'No plan loaded'} | Mode: {props.mode}</p>
      </div>
    </div>
  );
});

EpisodePlayer.displayName = 'EpisodePlayer';
export default EpisodePlayer;

