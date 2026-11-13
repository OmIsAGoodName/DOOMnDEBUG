import { useState, useEffect } from 'react';
import { config } from '../config';
import { getSupabaseClient } from './supabase';
import type { EpisodeRecord, EpisodePlan, AudioManifest } from '@contracts';

export interface HealthResponse {
  ok: boolean;
  mode: 'online' | 'demo';
  supabase: boolean;
  llm: string;
  ffmpeg: boolean;
}

export interface GenerationStatusResponse {
  id: string;
  kind: 'quick' | 'batch';
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  stage: string;
  progress?: number | null;
  episode_ids: string[];
  error?: string | null;
}

export interface LiveMatchResponse {
  option_id: string;
  confidence: number;
  method: 'keyword' | 'llm' | 'default';
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (config.isDemoMode()) {
    return {};
  }
  const sb = getSupabaseClient();
  if (!sb) return {};
  const { data: { session } } = await sb.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeader()),
    ...(options.headers || {}),
  };

  const response = await fetch(`${config.apiBase}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error?.message) {
        errorDetail = errJson.error.message;
      }
    } catch {}
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  health: async (): Promise<HealthResponse> => {
    return request<HealthResponse>('/api/health');
  },

  createGeneration: async (params: {
    kind: 'quick' | 'batch';
    prompt?: string;
    series?: any;
    characters?: any[];
    count?: number;
    age_band?: string;
    language?: string;
    interactive?: boolean;
    duration?: '<1min' | '1-2mins' | '2-3mins';
    generate_characters?: boolean;
  }): Promise<{ generation_id: string; status: string }> => {
    return request<{ generation_id: string; status: string }>('/api/generations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getGeneration: async (generationId: string): Promise<GenerationStatusResponse> => {
    return request<GenerationStatusResponse>(`/api/generations/${generationId}`);
  },

  listEpisodes: async (): Promise<EpisodeRecord[]> => {
    return request<EpisodeRecord[]>('/api/episodes');
  },

  getEpisode: async (episodeId: string): Promise<EpisodeRecord> => {
    // Check if offline/demo bundled episode exists first
    if (config.isDemoMode() || episodeId.startsWith('demo_')) {
      try {
        const planRes = await fetch(`/demo/episodes/${episodeId}/plan.json`);
        if (planRes.ok) {
          const plan = await planRes.json();
          let audioManifest = null;
          try {
            const manifestRes = await fetch(`/demo/episodes/${episodeId}/audio_manifest.json`);
            if (manifestRes.ok) {
              audioManifest = await manifestRes.json();
            }
          } catch {}
          return {
            id: episodeId,
            title: plan.title || episodeId,
            plan,
            audio_manifest: audioManifest,
            video_url: `/demo/episodes/${episodeId}/video.mp4`,
            status: 'ready',
            created_at: new Date().toISOString(),
          };
        }
      } catch {}
    }
    return request<EpisodeRecord>(`/api/episodes/${episodeId}`);
  },

  listDemoEpisodes: async (): Promise<Array<{ id: string; title: string; interactive: boolean; has_video: boolean; video_url: string }>> => {
    try {
      const res = await fetch('/demo/episodes/index.json');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return [];
  },

  matchLive: async (
    prompt: string,
    options: { id: string; label: string; keywords?: string[] }[],
    transcript: string
  ): Promise<LiveMatchResponse> => {
    return request<LiveMatchResponse>('/api/live/match', {
      method: 'POST',
      body: JSON.stringify({ prompt, options, transcript }),
    });
  },

  exportEpisode: async (episodeId: string, webmBlob: Blob): Promise<{ export_id: string }> => {
    const formData = new FormData();
    formData.append('file', webmBlob, `${episodeId}.webm`);

    const authHeaders = await getAuthHeader();
    const response = await fetch(`${config.apiBase}/api/episodes/${episodeId}/export`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    return response.json();
  },

  getExportStatus: async (exportId: string): Promise<{ status: string; mp4_url?: string; error?: string }> => {
    const res = await request<{ status: string; mp4_url?: string; error?: string }>(`/api/exports/${exportId}`);
    if (res.mp4_url && res.mp4_url.startsWith('/')) {
      res.mp4_url = `${config.apiBase}${res.mp4_url}`;
    }
    return res;
  },
};

export function triggerFileDownload(source: string | Blob, filename: string): void {
  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  if (typeof source !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}

export function useGeneration(generationId?: string | null) {
  const [generation, setGeneration] = useState<GenerationStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!generationId) {
      setGeneration(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const poll = async () => {
      try {
        const data = await api.getGeneration(generationId);
        if (isMounted) {
          setGeneration(data);
          setError(null);
          if (data.status === 'succeeded' || data.status === 'failed') {
            setLoading(false);
            return;
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err);
          setLoading(false);
          return;
        }
      }

      if (isMounted) {
        setTimeout(poll, 1500);
      }
    };

    poll();

    return () => {
      isMounted = false;
    };
  }, [generationId]);

  return { generation, loading, error };
}

export default api;
