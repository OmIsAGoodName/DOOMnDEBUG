import React, { useState, useEffect, useRef } from 'react';
import type { Series, CharacterRecord, EpisodeRecord, CharacterDrawState } from '@contracts';
import { getDataRepo } from '../lib/datarepo';
import { api, useGeneration } from '../lib/api';
import { drawCharacter } from '../characters';
import { SeriesForm } from '../studio/SeriesForm';
import { CharacterBuilder } from '../studio/CharacterBuilder';
import {
  Card,
  Button,
  Spinner,
  SafetyBadge,
  ContinuityBadge,
  EpisodeView
} from '../ui';

export default function Studio() {
  const repo = getDataRepo();

  // Series & Character State
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [activeSeries, setActiveSeries] = useState<Series | null>(null);
  const [characters, setCharacters] = useState<CharacterRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals / subviews
  const [isEditingSeries, setIsEditingSeries] = useState<boolean>(false);
  const [editingCharacter, setEditingCharacter] = useState<CharacterRecord | null | 'new'>(null);

  // Batch Generation State
  const [batchCount, setBatchCount] = useState<number>(3);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [seasonEpisodes, setSeasonEpisodes] = useState<EpisodeRecord[]>([]);
  const [activePlayEpisode, setActivePlayEpisode] = useState<EpisodeRecord | null>(null);

  const { generation } = useGeneration(generationId);

  // Load initial data
  const loadStudioData = async () => {
    try {
      setLoading(true);
      const allSeries = await repo.listSeries();

      if (allSeries.length === 0) {
        // Create initial default series if empty
        const defaultSeries = await repo.saveSeries({
          title: 'Tales of the Whispering Woods',
          tone: 'cozy',
          age_band: '4-6',
          language: 'en',
          world: {
            setting: 'forest',
            rules: ['Animals speak and help each other', 'Bedtime arrives gently']
          }
        });
        setSeriesList([defaultSeries]);
        setActiveSeries(defaultSeries);

        // Pre-populate with Pip the Owl
        const pip = await repo.saveCharacter({
          name: 'Pip the Owl',
          species: 'owl',
          series_id: defaultSeries.id,
          slug: 'pip_owl',
          bible: {
            id: 'pip_owl',
            name: 'Pip',
            species: 'owl',
            personality: ['shy', 'curious'],
            voice: { engine_voice: 'en-US-AnaNeural' },
            look: {
              palette: { primary: '#8b5e3c', secondary: '#d9b38c', accent: '#f2a65a', outline: '#3b2a1e' },
              accessories: ['scarf']
            }
          }
        });
        setCharacters([pip]);
      } else {
        setSeriesList(allSeries);
        const current = activeSeries || allSeries[0];
        setActiveSeries(current);
        const chars = await repo.listCharacters(current.id);
        setCharacters(chars);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, []);

  // When active series changes, load its characters
  useEffect(() => {
    if (!activeSeries) return;
    repo.listCharacters(activeSeries.id).then((chars) => setCharacters(chars));
  }, [activeSeries?.id]);

  // Handle batch generation updates
  useEffect(() => {
    if (!generation) return;

    if (generation.episode_ids && generation.episode_ids.length > seasonEpisodes.length) {
      // Fetch new episodes as they finish
      const newIds = generation.episode_ids.slice(seasonEpisodes.length);
      Promise.all(newIds.map((id) => api.getEpisode(id).catch(() => null))).then((results) => {
        const valid = results.filter(Boolean) as EpisodeRecord[];
        setSeasonEpisodes((prev) => [...prev, ...valid]);
      });
    }

    if (generation.status === 'succeeded' || generation.status === 'failed') {
      setIsGenerating(false);
    }
  }, [generation]);

  // Trigger Season Batch
  const handleGenerateSeason = async () => {
    if (!activeSeries) return;

    try {
      setIsGenerating(true);
      setSeasonEpisodes([]);

      const res = await api.createGeneration({
        kind: 'batch',
        series: activeSeries,
        characters: characters.map((c) => ({
          character_id: c.id,
          name: c.name,
          species: c.species,
          palette: c.bible?.look?.palette || { primary: '#8b5e3c', secondary: '#d9b38c', accent: '#f2a65a', outline: '#3b2a1e' },
          accessories: c.bible?.look?.accessories || [],
          voice: c.bible?.voice || { engine_voice: 'en-US-AnaNeural' }
        })),
        count: batchCount,
        age_band: activeSeries.age_band,
        language: 'en'
      });

      setGenerationId(res.generation_id);
    } catch (err: any) {
      alert(`Generation failed to start: ${err.message}. Running fallback demo season!`);
      // Fallback: load demo episodes
      const demoList = await api.listDemoEpisodes();
      const demoRecords: EpisodeRecord[] = await Promise.all(
        demoList.slice(0, batchCount).map((d) => api.getEpisode(d.id))
      );
      setSeasonEpisodes(demoRecords);
      setIsGenerating(false);
    }
  };

  const handleSaveSeries = async (s: Partial<Series> & { title: string }) => {
    const saved = await repo.saveSeries(s);
    setIsEditingSeries(false);
    loadStudioData();
  };

  const handleSaveCharacter = async (char: CharacterRecord) => {
    await repo.saveCharacter(char);
    setEditingCharacter(null);
    if (activeSeries) {
      const chars = await repo.listCharacters(activeSeries.id);
      setCharacters(chars);
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (confirm('Delete this character?')) {
      await repo.deleteCharacter(charId);
      if (activeSeries) {
        const chars = await repo.listCharacters(activeSeries.id);
        setCharacters(chars);
      }
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Loading Studio workspace...</p>
      </div>
    );
  }

  // Active Playback Overlay
  if (activePlayEpisode) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto mb-4">
          <Button variant="secondary" size="sm" onClick={() => setActivePlayEpisode(null)}>
            &larr; Back to Studio
          </Button>
        </div>
        <EpisodeView episode={activePlayEpisode} onReset={() => setActivePlayEpisode(null)} />
      </div>
    );
  }

  return (
    <div className="py-10 px-6 max-w-6xl mx-auto space-y-10 text-slate-800">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>🎨</span> VoxFable Studio Mode
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Series Showrunner &bull; Persistent Characters &bull; Multi-Episode Batch Generator
          </p>
        </div>

        {/* Series Selector */}
        <div className="flex items-center gap-2">
          <select
            value={activeSeries?.id || ''}
            onChange={(e) => {
              const selected = seriesList.find((s) => s.id === e.target.value);
              if (selected) setActiveSeries(selected);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {seriesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <Button variant="secondary" size="md" onClick={() => setIsEditingSeries(true)}>
            Edit Series
          </Button>
        </div>
      </div>

      {/* Series Edit Modal / Drawer */}
      {isEditingSeries && (
        <Card padding="lg" className="border-indigo-200 bg-indigo-50/20 shadow-md">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-900">Series Configuration</h2>
            <button
              onClick={() => setIsEditingSeries(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              &times;
            </button>
          </div>
          <SeriesForm
            initialSeries={activeSeries}
            onSave={handleSaveSeries}
            onCancel={() => setIsEditingSeries(false)}
          />
        </Card>
      )}

      {/* Section 1: Character Roster (up to 3 characters) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Character Roster</h2>
            <p className="text-xs text-slate-500">
              Cast members retain consistent personalities, color palettes, and rules across episodes.
            </p>
          </div>

          {characters.length < 3 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingCharacter('new')}
            >
              + Create Character ({characters.length}/3)
            </Button>
          )}
        </div>

        {/* Character Builder Modal */}
        {editingCharacter && (
          <Card padding="lg" className="border-indigo-300 bg-indigo-50/30 shadow-lg">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCharacter === 'new' ? 'Create New Character' : `Edit ${editingCharacter.name}`}
              </h2>
              <button
                onClick={() => setEditingCharacter(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>
            <CharacterBuilder
              initialCharacter={editingCharacter === 'new' ? null : editingCharacter}
              seriesId={activeSeries?.id}
              onSave={handleSaveCharacter}
              onCancel={() => setEditingCharacter(null)}
            />
          </Card>
        )}

        {/* Character Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              onEdit={() => setEditingCharacter(char)}
              onDelete={() => handleDeleteCharacter(char.id)}
            />
          ))}

          {characters.length === 0 && (
            <div className="col-span-3 text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-sm font-semibold text-slate-500">No characters in this series yet.</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                onClick={() => setEditingCharacter('new')}
              >
                Create First Character
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Season Batch Generator */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Season Showrunner Generator</h2>
            <p className="text-xs text-slate-500">
              Batch generate connected episodes that enforce character continuity and world rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
              <span className="text-xs font-bold text-slate-500">EPISODES:</span>
              <select
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value, 10))}
                className="text-sm font-bold text-slate-800 bg-transparent focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="md"
              loading={isGenerating}
              onClick={handleGenerateSeason}
              disabled={characters.length === 0}
            >
              ⚡ Generate Season ({batchCount} Episodes)
            </Button>
          </div>
        </div>

        {/* Generation Progress Bar */}
        {isGenerating && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
              <span>Season Generation in Progress... ({seasonEpisodes.length}/{batchCount} Ready)</span>
              <span>Stage: {generation?.stage || 'writing'}</span>
            </div>
            <div className="w-full bg-indigo-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(10, Math.round((seasonEpisodes.length / batchCount) * 100))}%`
                }}
              />
            </div>
            <p className="text-[11px] text-indigo-700 italic">
              Writing script, applying continuity fixes, generating voices and rendering canvas scenes...
            </p>
          </div>
        )}

        {/* Season Episodes Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">
            Season Episodes {seasonEpisodes.length > 0 && `(${seasonEpisodes.length})`}
          </h3>

          {seasonEpisodes.length === 0 && !isGenerating && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-sm">
              Click <strong>Generate Season</strong> above to write and direct episodes with your cast!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {seasonEpisodes.map((ep, idx) => (
              <Card key={ep.id || idx} hoverEffect className="flex flex-col justify-between border-slate-200 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>EPISODE #{idx + 1}</span>
                    <span className="text-indigo-600">{ep.plan?.age_band || '4-6'}</span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 line-clamp-1">
                    {ep.title || `Episode ${idx + 1}`}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {ep.plan?.scenes?.[0]?.beats?.[0]?.speech?.text || 'A heartwarming bedtime tale.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SafetyBadge status={ep.safety?.verdict || 'pass'} />
                    <ContinuityBadge violations={ep.continuity?.violations || []} />
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full font-bold"
                    onClick={() => setActivePlayEpisode(ep)}
                  >
                    ▶ Play Episode
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Helper Component: Character Roster Card ----------------

interface CharacterCardProps {
  character: CharacterRecord;
  onEdit: () => void;
  onDelete: () => void;
}

function CharacterCard({ character, onEdit, onDelete }: CharacterCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 180;
    const h = 200;
    ctx.clearRect(0, 0, w, h);

    const drawState: CharacterDrawState = {
      characterId: character.id,
      species: character.species,
      x: w / 2,
      y: h - 25,
      scale: 0.65,
      facing: 'right',
      palette: character.bible?.look?.palette || { primary: '#8b5e3c', secondary: '#d9b38c', accent: '#f2a65a', outline: '#3b2a1e' },
      accessories: character.bible?.look?.accessories || [],
      expression: 'happy',
      mouth: 'closed',
      pose: 'idle',
      poseT: 0,
      time: 0
    };

    drawCharacter(ctx, drawState);
  }, [character]);

  return (
    <Card hoverEffect className="flex flex-col justify-between border-slate-200">
      <div>
        <div className="w-full aspect-square bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 mb-3">
          <canvas ref={canvasRef} width={180} height={200} className="w-full h-full object-contain" />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900">{character.name}</h3>
          <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {character.species}
          </span>
        </div>

        {character.bible?.personality && character.bible.personality.length > 0 && (
          <p className="text-xs text-slate-500 mt-1 capitalize">
            {character.bible.personality.join(', ')}
          </p>
        )}

        {character.bible?.rules && character.bible.rules.length > 0 && (
          <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-2 italic">
            Rule: {character.bible.rules[0]}
          </p>
        )}
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit Look
        </Button>
        <button
          onClick={onDelete}
          className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
