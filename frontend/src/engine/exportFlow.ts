import type { EpisodePlayerHandle } from '@contracts';

export interface ExportProgress {
  stage: 'recording' | 'uploading' | 'converting' | 'done' | 'error';
  progress?: number; // 0..1
  elapsedSeconds?: number;
  totalSeconds?: number;
  error?: string;
}

export interface ExportEpisodeOptions {
  handle: EpisodePlayerHandle;
  episodeId: string;
  uploader: (blob: Blob, episodeId: string) => Promise<{ exportId: string }>;
  onProgress?: (p: ExportProgress) => void;
  signal?: AbortSignal;
}

/**
 * Orchestrates episode export:
 * 1. Starts recording on player handle (local muted so user doesn't hear double audio)
 * 2. Seeks to t=0 and plays
 * 3. Monitors playback until completion
 * 4. Stops recording and receives WebM blob
 * 5. Injects uploader function to send blob to backend without coupling engine to APIs
 */
export async function exportEpisode(options: ExportEpisodeOptions): Promise<{ exportId: string }> {
  const { handle, episodeId, uploader, onProgress, signal } = options;

  if (signal?.aborted) {
    throw new Error('Export aborted');
  }

  const duration = handle.getDuration() || 1.0;

  // 1. Start recording
  handle.seek(0);
  handle.startRecording({ muteLocal: true });
  handle.play();

  onProgress?.({
    stage: 'recording',
    progress: 0,
    elapsedSeconds: 0,
    totalSeconds: duration,
  });

  // 2. Poll until playback completes or aborted
  await new Promise<void>((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(checkInterval);
        handle.pause();
        handle.stopRecording().catch(() => {});
        reject(new Error('Export aborted'));
        return;
      }

      const currentTime = handle.getTime();
      const progress = Math.min(1.0, currentTime / duration);

      onProgress?.({
        stage: 'recording',
        progress,
        elapsedSeconds: currentTime,
        totalSeconds: duration,
      });

      if (currentTime >= duration) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 200);
  });

  // 3. Stop recording & collect WebM blob
  handle.pause();
  const blob = await handle.stopRecording();

  onProgress?.({
    stage: 'uploading',
    progress: 0.95,
    elapsedSeconds: duration,
    totalSeconds: duration,
  });

  if (signal?.aborted) {
    throw new Error('Export aborted');
  }

  // 4. Injected uploader
  try {
    const result = await uploader(blob, episodeId);
    onProgress?.({
      stage: 'done',
      progress: 1.0,
      elapsedSeconds: duration,
      totalSeconds: duration,
    });
    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    onProgress?.({
      stage: 'error',
      error: errorMsg,
    });
    throw err;
  }
}

