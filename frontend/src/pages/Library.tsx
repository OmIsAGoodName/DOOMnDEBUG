import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { EpisodeRecord } from '@contracts';
import { api } from '../lib/api';
import { Card, Button, Spinner, EmptyState, SafetyBadge } from '../ui';

interface AssetCatalog {
  characters: any[];
  backgrounds: any[];
  props: any[];
  music: any[];
  sfx: any[];
}

function formatEpisodeDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

export default function Library() {
  const [activeTab, setActiveTab] = useState<'stories' | 'characters' | 'backgrounds' | 'props'>('stories');
  const [episodes, setEpisodes] = useState<EpisodeRecord[]>([]);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>(
    () => searchParams.get('q') || searchParams.get('search') || ''
  );

  // Sync when search params change from navbar
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
      setActiveTab('stories');
    }
  }, [searchParams]);
  const [assets, setAssets] = useState<AssetCatalog>({
    characters: [],
    backgrounds: [],
    props: [],
    music: [],
    sfx: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New character creator state
  const [showCreator, setShowCreator] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newSpecies, setNewSpecies] = useState<'rabbit' | 'turtle' | 'fox' | 'owl' | 'kid'>('rabbit');
  const [newPersonality, setNewPersonality] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Scenery creator state
  const [showBgCreator, setShowBgCreator] = useState<boolean>(false);
  const [newBgName, setNewBgName] = useState<string>('');
  const [newBgMood, setNewBgMood] = useState<'day' | 'night' | 'sunset' | 'cozy' | 'magical'>('day');
  const [newBgDesc, setNewBgDesc] = useState<string>('');
  const [isCreatingBg, setIsCreatingBg] = useState<boolean>(false);
  const [isSpammingBgs, setIsSpammingBgs] = useState<boolean>(false);

  // Prop & Audio creator state
  const [showPropCreator, setShowPropCreator] = useState<boolean>(false);
  const [newPropName, setNewPropName] = useState<string>('');
  const [newPropSlot, setNewPropSlot] = useState<'hand' | 'head' | 'ground'>('hand');
  const [newPropEmoji, setNewPropEmoji] = useState<string>('✨');
  const [isCreatingProp, setIsCreatingProp] = useState<boolean>(false);

  const [showAudioCreator, setShowAudioCreator] = useState<boolean>(false);
  const [newAudioName, setNewAudioName] = useState<string>('');
  const [newAudioType, setNewAudioType] = useState<'music' | 'sfx'>('music');
  const [newAudioMood, setNewAudioMood] = useState<string>('cheerful');
  const [isCreatingAudio, setIsCreatingAudio] = useState<boolean>(false);
  const [isSpammingPropsAudio, setIsSpammingPropsAudio] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch user & demo episodes
        let userEps: EpisodeRecord[] = [];
        try {
          userEps = await api.listEpisodes();
        } catch {}

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

        const combined = [...userEps];
        for (const dep of demoEps) {
          if (!combined.some((e) => e.id === dep.id)) {
            combined.push(dep);
          }
        }
        setEpisodes(combined);

        // 2. Fetch Assets Catalog (characters, backgrounds, props, audio)
        try {
          const assetData = await api.getAssets();
          setAssets(assetData);
        } catch {
          // Fallback initial characters if endpoint not yet loaded
          setAssets({
            characters: [
              { id: 'barnaby_rabbit', name: 'Barnaby', species: 'rabbit', tags: ['bouncy', 'optimistic'], default_palette: { primary: '#f3f4f6', secondary: '#fbcfe8', accent: '#60a5fa', outline: '#1f2937' }, default_voice: { engine_voice: 'en-US-BrianMultilingualNeural' } },
              { id: 'toby_turtle', name: 'Toby', species: 'turtle', tags: ['patient', 'steady'], default_palette: { primary: '#15803d', secondary: '#86efac', accent: '#fef08a', outline: '#14532d' }, default_voice: { engine_voice: 'en-US-ChristopherNeural' } },
              { id: 'rusty_fox', name: 'Rusty', species: 'fox', tags: ['energetic', 'playful'], default_palette: { primary: '#d95f32', secondary: '#f4c28d', accent: '#2f3e46', outline: '#2b1e1a' }, default_voice: { engine_voice: 'en-US-AndrewMultilingualNeural' } },
              { id: 'pip_owl', name: 'Pip', species: 'owl', tags: ['gentle', 'observant'], default_palette: { primary: '#8b5e3c', secondary: '#d9b38c', accent: '#f2a65a', outline: '#3b2a1e' }, default_voice: { engine_voice: 'en-US-EmmaNeural' } },
              { id: 'mia_kid', name: 'Mia', species: 'kid', tags: ['curious', 'friendly'], default_palette: { primary: '#3a86ff', secondary: '#ffbe0b', accent: '#ff006e', outline: '#1e293b' }, default_voice: { engine_voice: 'en-US-AvaMultilingualNeural' } }
            ],
            backgrounds: [
              { id: 'forest_day', name: 'Sunny Forest', mood_hint: 'day' },
              { id: 'forest_night', name: 'Night Forest', mood_hint: 'night' },
              { id: 'meadow_day', name: 'Green Meadow', mood_hint: 'day' },
              { id: 'treehouse_interior', name: 'Cozy Treehouse', mood_hint: 'cozy' },
              { id: 'village_street', name: 'Village Street', mood_hint: 'day' }
            ],
            props: [{ id: 'golden_map' }, { id: 'flower' }, { id: 'balloon' }, { id: 'backpack' }],
            music: [{ id: 'calm' }, { id: 'playful' }],
            sfx: [{ id: 'chime' }, { id: 'sparkle' }, { id: 'pop' }]
          });
        }
      } catch (err: any) {
        setError(err.message || 'Could not load library');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setIsCreating(true);
      setCreateSuccess(null);
      const created = await api.createCharacter({
        name: newName.trim(),
        species: newSpecies,
        personality: newPersonality.trim() || 'Friendly adventurer',
      });

      setAssets((prev) => ({
        ...prev,
        characters: [created, ...prev.characters]
      }));

      setCreateSuccess(`✨ Created "${created.name}"! Available in all stories.`);
      setNewName('');
      setNewPersonality('');
      setTimeout(() => setCreateSuccess(null), 5000);
      setShowCreator(false);
    } catch (err: any) {
      setError(`Failed to create character: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateBackground = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBgName.trim()) return;
    try {
      setIsCreatingBg(true);
      setCreateSuccess(null);
      const created = await api.createBackground({
        name: newBgName.trim(),
        mood_hint: newBgMood,
        description: newBgDesc.trim() || `Custom scenery: ${newBgName.trim()}`,
        base_variant: newBgMood === 'night' ? 'forest_night' : 'forest_day',
      });
      setAssets((prev) => ({
        ...prev,
        backgrounds: [created, ...prev.backgrounds],
      }));
      setCreateSuccess(`🌳 Created scenery "${created.name}"! Available in all stories.`);
      setNewBgName('');
      setNewBgDesc('');
      setShowBgCreator(false);
      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (err: any) {
      setError(`Failed to create scenery: ${err.message}`);
    } finally {
      setIsCreatingBg(false);
    }
  };

  const handleSpamBackgrounds = async () => {
    try {
      setIsSpammingBgs(true);
      setCreateSuccess(null);
      const SCENERY_PRESETS = [
        { name: 'Crystal Cavern', mood_hint: 'magical', description: 'Gleaming jewel-lit caverns with glowing crystals', base_variant: 'forest_night' },
        { name: 'Starlit Mountain Peak', mood_hint: 'night', description: 'A majestic high snowy ledge under a starry galaxy', base_variant: 'forest_night' },
        { name: 'Sunlit Willow Glen', mood_hint: 'day', description: 'Golden weeping willows and sparkling babbling stream', base_variant: 'forest_day' },
        { name: 'Sunset Blossom Orchard', mood_hint: 'sunset', description: 'Pink cherry blossom trees illuminated by warm sunset', base_variant: 'forest_day' },
        { name: 'Cozy Treehouse Hearth', mood_hint: 'cozy', description: 'Warm wooden treehouse parlor with fireplace glow', base_variant: 'forest_night' },
        { name: 'Enchanted Mushroom Grove', mood_hint: 'magical', description: 'Giant glowing violet mushrooms and drifting pollen', base_variant: 'forest_night' },
      ];
      const shuffled = [...SCENERY_PRESETS].sort(() => 0.5 - Math.random()).slice(0, 3);
      const results = await Promise.all(
        shuffled.map((item) =>
          api.createBackground({
            name: `${item.name} ${Math.floor(Math.random() * 90 + 10)}`,
            mood_hint: item.mood_hint,
            description: item.description,
            base_variant: item.base_variant,
          })
        )
      );
      setAssets((prev) => ({
        ...prev,
        backgrounds: [...results, ...prev.backgrounds],
      }));
      setCreateSuccess(`⚡ Quick-generated 3 diverse sceneries! Ready for stories and direction.`);
      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (err: any) {
      setError(`Failed to batch create sceneries: ${err.message}`);
    } finally {
      setIsSpammingBgs(false);
    }
  };

  const handleCreateProp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;
    try {
      setIsCreatingProp(true);
      setCreateSuccess(null);
      const created = await api.createProp({
        name: newPropName.trim(),
        default_slot: newPropSlot,
        emoji: newPropEmoji,
        description: `Custom stage prop: ${newPropName.trim()}`,
      });
      setAssets((prev) => ({
        ...prev,
        props: [created, ...prev.props],
      }));
      setCreateSuccess(`🪄 Created prop "${created.name}"!`);
      setNewPropName('');
      setShowPropCreator(false);
      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (err: any) {
      setError(`Failed to create prop: ${err.message}`);
    } finally {
      setIsCreatingProp(false);
    }
  };

  const handleCreateAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAudioName.trim()) return;
    try {
      setIsCreatingAudio(true);
      setCreateSuccess(null);
      const created = await api.createAudio({
        name: newAudioName.trim(),
        type: newAudioType,
        mood: newAudioMood,
        description: `Custom ${newAudioType}: ${newAudioName.trim()}`,
      });
      setAssets((prev) => ({
        ...prev,
        music: created.type === 'music' ? [created, ...prev.music] : prev.music,
        sfx: created.type === 'sfx' ? [created, ...prev.sfx] : prev.sfx,
      }));
      setCreateSuccess(`🎵 Created audio "${created.name}"!`);
      setNewAudioName('');
      setShowAudioCreator(false);
      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (err: any) {
      setError(`Failed to create audio: ${err.message}`);
    } finally {
      setIsCreatingAudio(false);
    }
  };

  const handleSpamPropsAndAudio = async () => {
    try {
      setIsSpammingPropsAudio(true);
      setCreateSuccess(null);
      const PROP_PRESETS = [
        { name: 'Star Wand', default_slot: 'hand', emoji: '🪄', description: 'Sparkling wand topped with a miniature star' },
        { name: 'Golden Compass', default_slot: 'hand', emoji: '🧭', description: 'Ornate explorer compass guiding true hearts' },
        { name: 'Acorn Crown', default_slot: 'head', emoji: '👑', description: 'Rustic woodland crown braided with oak leaves' },
        { name: 'Crystal Prism', default_slot: 'hand', emoji: '💎', description: 'Rainbow-casting prism of ancient lore' },
        { name: 'Feather Quill', default_slot: 'hand', emoji: '🪶', description: 'Legendary quill used to chronicle great deeds' },
        { name: 'Bedtime Lantern', default_slot: 'hand', emoji: '🏮', description: 'Warm glowing paper lantern for twilight paths' },
      ];
      const AUDIO_PRESETS = [
        { name: 'Sparkle Shimmer SFX', type: 'sfx' as const, mood: 'magical', description: 'Delicate glitter chime for wonder' },
        { name: 'Gentle Lullaby Melody', type: 'music' as const, mood: 'cozy', description: 'Soothing bedtime acoustic harp melody' },
        { name: 'Triumph Chime Fanfare', type: 'sfx' as const, mood: 'cheerful', description: 'Crisp orchestral celebration bell' },
        { name: 'Forest Breeze Ambient', type: 'music' as const, mood: 'peaceful', description: 'Rustling leaves with twilight crickets' },
      ];
      const randomProps = [...PROP_PRESETS].sort(() => 0.5 - Math.random()).slice(0, 2);
      const randomAudios = [...AUDIO_PRESETS].sort(() => 0.5 - Math.random()).slice(0, 2);

      const [p1, p2, a1, a2] = await Promise.all([
        api.createProp({
          name: `${randomProps[0].name} ${Math.floor(Math.random() * 90 + 10)}`,
          default_slot: randomProps[0].default_slot,
          emoji: randomProps[0].emoji,
          description: randomProps[0].description,
        }),
        api.createProp({
          name: `${randomProps[1].name} ${Math.floor(Math.random() * 90 + 10)}`,
          default_slot: randomProps[1].default_slot,
          emoji: randomProps[1].emoji,
          description: randomProps[1].description,
        }),
        api.createAudio({
          name: `${randomAudios[0].name} ${Math.floor(Math.random() * 90 + 10)}`,
          type: randomAudios[0].type,
          mood: randomAudios[0].mood,
          description: randomAudios[0].description,
        }),
        api.createAudio({
          name: `${randomAudios[1].name} ${Math.floor(Math.random() * 90 + 10)}`,
          type: randomAudios[1].type,
          mood: randomAudios[1].mood,
          description: randomAudios[1].description,
        }),
      ]);

      setAssets((prev) => ({
        ...prev,
        props: [p1, p2, ...prev.props],
        music: [
          ...(a1.type === 'music' ? [a1] : []),
          ...(a2.type === 'music' ? [a2] : []),
          ...prev.music,
        ],
        sfx: [
          ...(a1.type === 'sfx' ? [a1] : []),
          ...(a2.type === 'sfx' ? [a2] : []),
          ...prev.sfx,
        ],
      }));
      setCreateSuccess(`⚡ Quick-generated 2 Props and 2 Audio Cues! Ready for stories.`);
      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (err: any) {
      setError(`Failed to batch create props/audio: ${err.message}`);
    } finally {
      setIsSpammingPropsAudio(false);
    }
  };

  const handleClearAllEpisodes = async () => {
    if (!window.confirm('Clear all old story records? Fresh prompts will generate brand-new videos!')) return;
    try {
      await api.clearEpisodes();
      setEpisodes([]);
      setCreateSuccess('✨ Library cleared! Ready for fresh new generations.');
      setTimeout(() => setCreateSuccess(null), 4000);
    } catch (err: any) {
      setError(`Failed to clear stories: ${err.message}`);
    }
  };

  const handleDeleteEpisode = async (e: React.MouseEvent, episodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.deleteEpisode(episodeId);
      setEpisodes((prev) => prev.filter((ep) => ep.id !== episodeId));
      setCreateSuccess('Story removed.');
      setTimeout(() => setCreateSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to delete: ${err.message}`);
    }
  };

  const getSpeciesEmoji = (species?: string) => {
    switch (species?.toLowerCase()) {
      case 'rabbit': return '🐰';
      case 'turtle': return '🐢';
      case 'fox': return '🦊';
      case 'owl': return '🦉';
      case 'kid': return '🧒';
      default: return '✨';
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Loading your creative asset library...</p>
      </div>
    );
  }

  return (
    <div className="py-10 px-6 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/90 dark:border-midnight-700/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-500/25 dark:border-amber-400/20 px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide mb-2">
            <span>📚</span>
            <span>Studio Catalog</span>
          </div>
          <h1 className="text-3xl font-bold font-display text-stone-900 dark:text-slate-100 tracking-tight">
            Asset Library
          </h1>
          <p className="text-sm text-stone-600 dark:text-slate-300 mt-1">
            Browse episodes, character rosters, backgrounds, and generate custom character designs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setActiveTab('characters');
              setShowCreator(true);
            }}
          >
            + New Character
          </Button>

          <Link to="/quick">
            <Button variant="primary" size="md">
              + New Quick Story
            </Button>
          </Link>
        </div>
      </div>

      {createSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {createSuccess}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold text-amber-800 dark:text-amber-300">
          {error}
        </div>
      )}

      {/* Library Navigation Tabs */}
      <div className="flex border-b border-stone-200/90 dark:border-midnight-700/80 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stories')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'stories'
              ? 'border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>🎬</span> Stories ({episodes.length})
        </button>

        <button
          onClick={() => setActiveTab('characters')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'characters'
              ? 'border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>🦊</span> Characters ({assets.characters.length})
        </button>

        <button
          onClick={() => setActiveTab('backgrounds')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'backgrounds'
              ? 'border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>🌳</span> Backgrounds ({assets.backgrounds.length})
        </button>

        <button
          onClick={() => setActiveTab('props')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'props'
              ? 'border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>🪄</span> Props & Audio ({assets.props.length + assets.music.length + assets.sfx.length})
        </button>
      </div>

      {/* TAB 1: Stories */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          {/* Stories Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:max-w-xs relative">
              <input
                type="text"
                placeholder="Search stories by title or character..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>Showing {episodes.filter((ep) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return ep.title.toLowerCase().includes(q) || ep.plan?.cast?.some((c) => c.name.toLowerCase().includes(q));
              }).length} of {episodes.length} stories</span>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Newest First
              </span>
              {episodes.length > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                  <button
                    type="button"
                    onClick={handleClearAllEpisodes}
                    className="text-rose-500 hover:text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                  >
                    🗑️ Clear Old Stories
                  </button>
                </>
              )}
            </div>
          </div>

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
              {episodes
                .filter((ep) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return ep.title.toLowerCase().includes(q) || ep.plan?.cast?.some((c) => c.name.toLowerCase().includes(q));
                })
                .map((ep, idx) => {
                  const isDemo = ep.id.startsWith('demo_');
                  const isInteractive = ep.plan?.interactive;
                  const timeLabel = formatEpisodeDate(ep.created_at);
                  const isNewest = idx === 0 && !isDemo;

                  return (
                    <Link key={ep.id} to={`/episode/${ep.id}`} className="group block">
                      <Card
                        hoverEffect
                        className="h-full flex flex-col justify-between overflow-hidden border-slate-200 dark:border-slate-800 group-hover:border-indigo-400 group-hover:-translate-y-1 transition-all"
                        padding="none"
                      >
                        <div className="aspect-video bg-gradient-to-br from-indigo-900 to-slate-900 relative flex items-center justify-center overflow-hidden">
                          <span className="text-4xl select-none group-hover:scale-110 transition-transform">
                            🎬
                          </span>

                          {/* Left Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                            {isInteractive && (
                              <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                                🎙 Interactive Tree
                              </span>
                            )}
                            {isNewest && (
                              <span className="bg-indigo-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow animate-pulse">
                                ✨ Latest Story
                              </span>
                            )}
                          </div>

                          {/* Right Badges */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            {isDemo ? (
                              <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow">
                                Offline Ready
                              </span>
                            ) : timeLabel ? (
                              <span className="bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow border border-slate-700">
                                {timeLabel}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {ep.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Age: {ep.plan?.age_band || '4-6'} &bull;{' '}
                              {ep.plan?.scenes?.length ? `${ep.plan.scenes.length} Scenes` : 'Full Animated Tale'}
                            </p>
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                            <SafetyBadge status={ep.safety?.verdict || 'pass'} />
                            <div className="flex items-center gap-3">
                              {!isDemo && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteEpisode(e, ep.id)}
                                  className="text-slate-400 hover:text-rose-500 text-xs p-1 rounded transition-colors"
                                  title="Delete story"
                                >
                                  🗑️
                                </button>
                              )}
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Play &rarr;
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Characters */}
      {activeTab === 'characters' && (
        <div className="space-y-6">
          {/* Creator Trigger Card */}
          <div className="bg-amber-500/10 dark:bg-midnight-850 p-6 rounded-3xl border border-amber-500/20 dark:border-midnight-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-storybook-sm">
            <div>
              <h2 className="text-lg font-bold font-display text-stone-900 dark:text-slate-100 flex items-center gap-2">
                <span>🎨</span> Create & Generate New Character Designs
              </h2>
              <p className="text-xs text-stone-600 dark:text-slate-300 mt-1">
                Invent new story characters with custom species, personality, colors, and voices that automatically join the studio cast!
              </p>
            </div>
            <Button
              variant={showCreator ? 'secondary' : 'primary'}
              size="md"
              onClick={() => setShowCreator(!showCreator)}
            >
              {showCreator ? 'Close Form' : '+ Generate Character'}
            </Button>
          </div>

          {/* Inline Character Creator Form */}
          {showCreator && (
            <Card className="border-amber-500/30 dark:border-midnight-600 shadow-storybook p-6 bg-white dark:bg-midnight-800">
              <form onSubmit={handleCreateCharacter} className="space-y-5">
                <h3 className="font-bold font-display text-base text-stone-900 dark:text-slate-100">
                  New Character Design Studio
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300 mb-1.5">
                      Character Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Leo the Brave, Penny"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300 mb-1.5">
                      Species Base
                    </label>
                    <select
                      value={newSpecies}
                      onChange={(e: any) => setNewSpecies(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                    >
                      <option value="rabbit">🐰 Rabbit (Bouncy, curious)</option>
                      <option value="turtle">🐢 Turtle (Patient, steady)</option>
                      <option value="fox">🦊 Fox (Clever, energetic)</option>
                      <option value="owl">🦉 Owl (Thoughtful, flying)</option>
                      <option value="kid">🧒 Kid (Adventurous explorer)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300 mb-1.5">
                    Personality & Visual Style Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lavender sweater, loves stargazing, very cheerful"
                    value={newPersonality}
                    onChange={(e) => setNewPersonality(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-midnight-700 bg-white dark:bg-midnight-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCreator(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isCreating || !newName.trim()}
                  >
                    {isCreating ? 'Generating Design...' : 'Save to Library'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Characters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.characters.map((char) => {
              const pal = char.default_palette || {};
              const isCustom = char.tags?.includes('custom') || char.id.startsWith('custom_');

              return (
                <Card
                  key={char.id}
                  className="p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm"
                >
                  <div className="space-y-4">
                    {/* Header: Avatar Emoji & Name */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-2xl flex items-center justify-center shadow-inner">
                          {getSpeciesEmoji(char.species)}
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 leading-tight">
                            {char.name}
                          </h3>
                          <span className="text-xs font-semibold capitalize text-slate-400 dark:text-slate-500">
                            {char.species} {isCustom ? '• Custom' : '• Core Cast'}
                          </span>
                        </div>
                      </div>

                      {isCustom && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                          Custom
                        </span>
                      )}
                    </div>

                    {/* Color Palette Chips */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                        Color Palette
                      </p>
                      <div className="flex items-center gap-2">
                        {pal.primary && (
                          <div className="flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm" style={{ backgroundColor: pal.primary }} title={`Primary: ${pal.primary}`} />
                          </div>
                        )}
                        {pal.secondary && (
                          <div className="flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm" style={{ backgroundColor: pal.secondary }} title={`Secondary: ${pal.secondary}`} />
                          </div>
                        )}
                        {pal.accent && (
                          <div className="flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm" style={{ backgroundColor: pal.accent }} title={`Accent: ${pal.accent}`} />
                          </div>
                        )}
                        {pal.outline && (
                          <div className="flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm" style={{ backgroundColor: pal.outline }} title={`Outline: ${pal.outline}`} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Voice Spec */}
                    {char.default_voice && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Voice: </span>
                        {char.default_voice.engine_voice?.replace('Neural', '').replace('Multilingual', '') || 'Default Voice'}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="pt-4 flex flex-wrap gap-1 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                    {char.tags?.map((t: string) => (
                      <span key={t} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Backgrounds */}
      {activeTab === 'backgrounds' && (
        <div className="space-y-6">
          {/* Scenery Generator & Quick Spam Actions */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-950/40 dark:via-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold font-display text-stone-900 dark:text-slate-100 flex items-center gap-2">
                <span>🌳</span> Scenery & Background Environments
              </h2>
              <p className="text-xs text-stone-600 dark:text-slate-300 mt-1 max-w-xl">
                Create custom locations or generate a batch of unique storybook backgrounds for your story scenes.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBgCreator(!showBgCreator)}
                className="whitespace-nowrap"
              >
                {showBgCreator ? '✕ Cancel' : '+ New Scenery'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSpamBackgrounds}
                disabled={isSpammingBgs}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap shadow-sm"
              >
                {isSpammingBgs ? '⚡ Generating 3...' : '⚡ Quick Spam 3 Sceneries'}
              </Button>
            </div>
          </div>

          {/* Inline Scenery Creation Form */}
          {showBgCreator && (
            <Card className="p-6 border-amber-300 dark:border-amber-700 shadow-md animate-fadeIn bg-white/90 dark:bg-midnight-800/90">
              <form onSubmit={handleCreateBackground} className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-midnight-700 pb-3">
                  <h3 className="font-bold text-base text-stone-900 dark:text-slate-100 flex items-center gap-2">
                    <span>🎨</span> Add Custom Scenery
                  </h3>
                  <span className="text-xs text-stone-500 dark:text-slate-400">Available across all episodes</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                      Scenery / Location Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Whispering Willows, Starlit Observatory, Dragon's Peak"
                      value={newBgName}
                      onChange={(e) => setNewBgName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                      Atmospheric Mood
                    </label>
                    <select
                      value={newBgMood}
                      onChange={(e) => setNewBgMood(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="day">☀️ Sunny Day</option>
                      <option value="night">🌙 Starlit Night</option>
                      <option value="sunset">🌅 Golden Sunset</option>
                      <option value="cozy">🏡 Cozy Hearth</option>
                      <option value="magical">✨ Magical Glow</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                    Visual Description (for Story Writer)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A serene clearing with gentle fireflies and blooming bluebells"
                    value={newBgDesc}
                    onChange={(e) => setNewBgDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowBgCreator(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={isCreatingBg || !newBgName.trim()}>
                    {isCreatingBg ? 'Saving Scenery...' : 'Save Scenery'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Backgrounds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.backgrounds.map((bg) => (
              <Card key={bg.id} className="p-5 space-y-3 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
                  <span>
                    {bg.mood_hint === 'night' ? '🌙' : bg.mood_hint === 'cozy' ? '🏡' : bg.mood_hint === 'sunset' ? '🌅' : bg.mood_hint === 'magical' ? '✨' : '🌳'}
                  </span>
                  {bg.id.startsWith('custom_') && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/90 text-white shadow-sm">
                      Original
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {bg.name || bg.id}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                    ID: {bg.id}
                  </p>
                  {bg.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {bg.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    Mood: {bg.mood_hint || 'day'}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span>✓</span> Ready
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Props & Sound Cues */}
      {activeTab === 'props' && (
        <div className="space-y-8">
          {/* Generator & Quick Spam Actions */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-950/40 dark:via-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold font-display text-stone-900 dark:text-slate-100 flex items-center gap-2">
                <span>🪄</span> Stage Props & Audio Atmosphere
              </h2>
              <p className="text-xs text-stone-600 dark:text-slate-300 mt-1 max-w-xl">
                Add hand/head items for characters to carry, or create ambient music and sound effects cues.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowPropCreator(!showPropCreator);
                  setShowAudioCreator(false);
                }}
                className="whitespace-nowrap"
              >
                {showPropCreator ? '✕ Cancel' : '+ New Prop'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAudioCreator(!showAudioCreator);
                  setShowPropCreator(false);
                }}
                className="whitespace-nowrap"
              >
                {showAudioCreator ? '✕ Cancel' : '+ New Audio Cue'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSpamPropsAndAudio}
                disabled={isSpammingPropsAudio}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap shadow-sm"
              >
                {isSpammingPropsAudio ? '⚡ Generating...' : '⚡ Quick Spam Props & Audio'}
              </Button>
            </div>
          </div>

          {/* Inline Prop Creator */}
          {showPropCreator && (
            <Card className="p-6 border-amber-300 dark:border-amber-700 shadow-md animate-fadeIn bg-white/90 dark:bg-midnight-800/90">
              <form onSubmit={handleCreateProp} className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-midnight-700 pb-3">
                  <h3 className="font-bold text-base text-stone-900 dark:text-slate-100 flex items-center gap-2">
                    <span>🪄</span> Create Stage Prop
                  </h3>
                  <span className="text-xs text-stone-500 dark:text-slate-400">Available in character attachments</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                      Prop Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Star Wand, Golden Key, Bedtime Book"
                      value={newPropName}
                      onChange={(e) => setNewPropName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                      Attachment Slot
                    </label>
                    <select
                      value={newPropSlot}
                      onChange={(e) => setNewPropSlot(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="hand">Hand / Carried</option>
                      <option value="head">Head / Hat</option>
                      <option value="ground">Ground / Stage</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowPropCreator(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={isCreatingProp || !newPropName.trim()}>
                    {isCreatingProp ? 'Saving Prop...' : 'Save Prop'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Inline Audio Creator */}
          {showAudioCreator && (
            <Card className="p-6 border-amber-300 dark:border-amber-700 shadow-md animate-fadeIn bg-white/90 dark:bg-midnight-800/90">
              <form onSubmit={handleCreateAudio} className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-midnight-700 pb-3">
                  <h3 className="font-bold text-base text-stone-900 dark:text-slate-100 flex items-center gap-2">
                    <span>🎵</span> Create Audio Cue
                  </h3>
                  <span className="text-xs text-stone-500 dark:text-slate-400">Atmospheric score or sound effect</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                      Audio Type
                    </label>
                    <select
                      value={newAudioType}
                      onChange={(e) => setNewAudioType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="music">🎵 Music Track (Looping)</option>
                      <option value="sfx">✨ Sound Effect (SFX)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                      Cue Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Whispering Breeze, Magic Chime Fanfare"
                      value={newAudioName}
                      onChange={(e) => setNewAudioName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-midnight-600 bg-white dark:bg-midnight-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowAudioCreator(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={isCreatingAudio || !newAudioName.trim()}>
                    {isCreatingAudio ? 'Saving Audio...' : 'Save Audio Cue'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Props Grid */}
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span>🪄</span> Stage Props & Accessories ({assets.props.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {assets.props.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <span className="text-2xl">
                    {p.emoji || (p.id.includes('map') ? '🗺️' : p.id.includes('flower') ? '🌸' : p.id.includes('balloon') ? '🎈' : p.id.includes('lantern') ? '🏮' : '🎒')}
                  </span>
                  <div className="truncate">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 capitalize truncate">
                      {p.name || p.id.replace('custom_prop_', '').replace('_', ' ')}
                    </h4>
                    <span className="text-[10px] text-slate-400 capitalize">
                      Slot: {p.default_slot || 'hand'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Music Grid */}
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span>🎵</span> Music & Ambient Scores ({assets.music.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {assets.music.map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 capitalize truncate">
                      {m.name || m.id.replace('music_', '').replace('custom_music_', '')}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {m.mood ? `Mood: ${m.mood}` : 'Atmospheric score'}
                    </span>
                  </div>
                  <span className="text-xl">🎶</span>
                </div>
              ))}
            </div>
          </div>

          {/* SFX Grid */}
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span>✨</span> Sound Effects ({assets.sfx.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {assets.sfx.map((s) => (
                <div key={s.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 capitalize truncate pr-2">
                    {s.name || s.id.replace('sfx_', '').replace('custom_sfx_', '')}
                  </span>
                  <span className="text-base">🔔</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
