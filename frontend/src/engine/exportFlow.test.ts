import { describe, it, expect, vi } from 'vitest';
import type { EpisodePlayerHandle } from '@contracts';
import { exportEpisode } from './exportFlow';

describe('exportFlow', () => {
  it('runs recording to duration and invokes injected uploader', async () => {
    let mockTime = 0;
    const duration = 0.5;

    const fakeHandle: EpisodePlayerHandle = {
      play: vi.fn(() => {
        // simulate fast-forwarding time
        mockTime = duration;
      }),
      pause: vi.fn(),
      seek: vi.fn((t) => {
        mockTime = t;
      }),
      resolveChoice: vi.fn(),
      startRecording: vi.fn(),
      stopRecording: vi.fn(async () => new Blob(['test-video'], { type: 'video/webm' })),
      getTime: vi.fn(() => mockTime),
      getDuration: vi.fn(() => duration),
      getChosenPath: vi.fn(() => []),
    };

    const mockUploader = vi.fn(async (blob: Blob, epId: string) => {
      expect(blob).toBeTruthy();
      expect(epId).toBe('ep_test_123');
      return { exportId: 'exp_999' };
    });

    const progressStages: string[] = [];
    const result = await exportEpisode({
      handle: fakeHandle,
      episodeId: 'ep_test_123',
      uploader: mockUploader,
      onProgress: (p) => {
        progressStages.push(p.stage);
      },
    });

    expect(result.exportId).toBe('exp_999');
    expect(fakeHandle.startRecording).toHaveBeenCalled();
    expect(fakeHandle.stopRecording).toHaveBeenCalled();
    expect(mockUploader).toHaveBeenCalled();
    expect(progressStages).toContain('recording');
    expect(progressStages).toContain('uploading');
    expect(progressStages).toContain('done');
  });

  it('handles abort signal cleanly', async () => {
    const fakeHandle: EpisodePlayerHandle = {
      play: vi.fn(),
      pause: vi.fn(),
      seek: vi.fn(),
      resolveChoice: vi.fn(),
      startRecording: vi.fn(),
      stopRecording: vi.fn(async () => new Blob([], { type: 'video/webm' })),
      getTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 10),
      getChosenPath: vi.fn(() => []),
    };

    const controller = new AbortController();
    controller.abort();

    await expect(
      exportEpisode({
        handle: fakeHandle,
        episodeId: 'ep_aborted',
        uploader: vi.fn(),
        signal: controller.signal,
      })
    ).rejects.toThrow('Export aborted');
  });
});

