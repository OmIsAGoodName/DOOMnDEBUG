import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EpisodeRecord } from '@contracts';
import { api } from '../lib/api';
import { Card, Button, Spinner, EmptyState, SafetyBadge } from '../ui';

export default function Library() {
  const [episodes, setEpisodes] = useState<EpisodeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEpisodes() {
      try {
        setLoading(true);
        setError(null);

        // Fetch user episodes
        let userEps: EpisodeRecord[] = [];
        try {
          userEps = await api.listEpisodes();
        } catch {
          // If offline / demo mode
        }

        // Fetch demo bundled episodes
        const demoList = await api.listDemoEpisodes();
        const demoEps: EpisodeRecord[] = demoList.map((d) => ({
          id: d.id,
          title: d.title,
          status: 'ready',
          video_url: d.video_url,
          created_at: new Date().toISOString(),
          plan: {
            schema_version: '1.0',
            episode_id: d.id,
            title: d.title,
            age_band: '4-6',
            start_scene: 'sc1',
            interactive: d.interactive,
            cast: [],
            scenes: []
          }
        }));

        // Merge (deduplicating by ID)
        const combined = [...userEps];
        for (const dep of demoEps) {
          if (!combined.some((e) => e.id === dep.id)) {
            combined.push(dep);
          }
        }

        setEpisodes(combined);
      } catch (err: any) {
        setError(err.message || 'Could not load library');
      } finally {
        setLoading(false);
      }
    }

    loadEpisodes();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Loading your story library...</p>
      </div>
    );
  }

  return (
    <div className="py-10 px-6 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📚</span> Story Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and replay your animated stories and offline episodes.
          </p>
        </div>

        <Link to="/quick">
          <Button variant="primary" size="md">
            + New Quick Story
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
          {error}
        </div>
      )}

      {/* Episode Grid */}
      {episodes.length === 0 ? (
        <EmptyState
          icon="🎬"
          title="No stories created yet"
          description="Create your first animated bedtime story with our Quick Story generator!"
          action={
            <Link to="/quick">
              <Button variant="primary" size="md">
                Create a Story
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {episodes.map((ep) => {
            const isDemo = ep.id.startsWith('demo_');
            const isInteractive = ep.plan?.interactive;

            return (
              <Link key={ep.id} to={`/episode/${ep.id}`} className="group block">
                <Card
                  hoverEffect
                  className="h-full flex flex-col justify-between overflow-hidden border-slate-200 group-hover:border-indigo-400 group-hover:-translate-y-1 transition-all"
                  padding="none"
                >
                  {/* Thumbnail / Header Preview */}
                  <div className="aspect-video bg-gradient-to-br from-indigo-900 to-slate-900 relative flex items-center justify-center overflow-hidden">
                    <span className="text-4xl select-none group-hover:scale-110 transition-transform">
                      🎬
                    </span>

                    {/* Interactive Badge */}
                    {isInteractive && (
                      <span className="absolute top-3 left-3 bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                        🎙 Interactive
                      </span>
                    )}

                    {isDemo && (
                      <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow">
                        Offline Ready
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {ep.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Age: {ep.plan?.age_band || '4-6'} &bull; Status: {ep.status}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <SafetyBadge status={ep.safety?.verdict || 'pass'} />
                      <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Play &rarr;
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
