import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { EpisodeRecord } from '@contracts';
import { api } from '../lib/api';
import { EpisodeView, Spinner, Button } from '../ui';

export default function Episode() {
  const { id } = useParams<{ id: string }>();
  const [episode, setEpisode] = useState<EpisodeRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    api
      .getEpisode(id)
      .then((ep) => {
        setEpisode(ep);
        setLoading(false);
      })
      .catch((err) => {
        setError(`Failed to load episode: ${err.message}`);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading animated episode...</p>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Episode Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'This episode could not be retrieved.'}</p>
        <Link to="/library">
          <Button variant="secondary" size="md">
            &larr; Back to Library
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto mb-4">
        <Link
          to="/library"
          className="text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors"
        >
          &larr; Back to Library
        </Link>
      </div>
      <EpisodeView episode={episode} />
    </div>
  );
}
