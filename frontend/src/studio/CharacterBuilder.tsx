import React, { useState, useEffect, useRef } from 'react';
import type { CharacterRecord, CharacterDrawState, Palette } from '@contracts';
import { drawCharacter } from '../characters';
import { Button, Input, Chip } from '../ui';

export interface CharacterBuilderProps {
  initialCharacter?: CharacterRecord | null;
  onSave: (char: CharacterRecord) => void;
  onCancel: () => void;
  seriesId?: string;
}

const DEFAULT_SPECIES_PALETTES: Record<string, Palette> = {
  owl: { primary: '#8b5e3c', secondary: '#d9b38c', accent: '#f2a65a', outline: '#3b2a1e' },
  fox: { primary: '#d95f32', secondary: '#f4c28d', accent: '#2f3e46', outline: '#2b1e1a' },
  kid: { primary: '#3a86ff', secondary: '#ffbe0b', accent: '#ff006e', outline: '#1e293b' },
  rabbit: { primary: '#f3f4f6', secondary: '#fbcfe8', accent: '#60a5fa', outline: '#1f2937' },
  turtle: { primary: '#15803d', secondary: '#86efac', accent: '#fef08a', outline: '#14532d' }
};

const PERSONALITY_OPTIONS = ['shy', 'brave', 'curious', 'silly', 'kind', 'cheerful', 'clever'];
const ACCESSORY_OPTIONS = ['scarf', 'glasses', 'hat', 'bow', 'backpack', 'cape'];

export function CharacterBuilder({
  initialCharacter,
  onSave,
  onCancel,
  seriesId
}: CharacterBuilderProps) {
  const [name, setName] = useState(initialCharacter?.name || '');
  const [species, setSpecies] = useState<'owl' | 'fox' | 'kid' | 'rabbit' | 'turtle'>(
    (initialCharacter?.species as any) || 'owl'
  );
  const [palette, setPalette] = useState<Palette>(
    initialCharacter?.bible?.look?.palette || DEFAULT_SPECIES_PALETTES.owl
  );
  const [accessories, setAccessories] = useState<string[]>(
    initialCharacter?.bible?.look?.accessories || []
  );
  const [personality, setPersonality] = useState<string[]>(
    initialCharacter?.bible?.personality || ['curious']
  );
  const [catchphrase, setCatchphrase] = useState<string>(
    initialCharacter?.bible?.catchphrases?.[0] || 'Hoot hoot! Let’s explore!'
  );
  const [rule, setRule] = useState<string>(
    initialCharacter?.bible?.rules?.[0] || 'Never flies in rain without an umbrella'
  );
  const [previewExpression, setPreviewExpression] = useState<string>('happy');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [time, setTime] = useState<number>(0);

  // Live animation loop for character preview
  useEffect(() => {
    let animId: number;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setTime((t) => t + delta);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Canvas redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 260;
    const h = 320;
    ctx.clearRect(0, 0, w, h);

    const drawState: CharacterDrawState = {
      characterId: 'preview_char',
      species,
      x: w / 2,
      y: h - 35,
      scale: 0.82,
      facing: 'right',
      palette,
      accessories,
      expression: previewExpression,
      mouth: Math.sin(time * 6) > 0 ? 'half' : 'closed',
      pose: 'idle',
      poseT: 0,
      time
    };

    drawCharacter(ctx, drawState);
  }, [species, palette, accessories, previewExpression, time]);

  const handleSpeciesChange = (newSpecies: 'owl' | 'fox' | 'kid' | 'rabbit' | 'turtle') => {
    setSpecies(newSpecies);
    setPalette(DEFAULT_SPECIES_PALETTES[newSpecies]);
  };

  const toggleAccessory = (acc: string) => {
    setAccessories((prev) =>
      prev.includes(acc) ? prev.filter((a) => a !== acc) : [...prev, acc]
    );
  };

  const togglePersonality = (p: string) => {
    setPersonality((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = initialCharacter?.id || `char_${Date.now()}`;
    const savedRecord: CharacterRecord = {
      id,
      name: name.trim(),
      species,
      series_id: seriesId || null,
      slug: id,
      bible: {
        id,
        name: name.trim(),
        species,
        personality,
        catchphrases: catchphrase ? [catchphrase.trim()] : [],
        rules: rule ? [rule.trim()] : [],
        voice: {
          engine_voice:
            species === 'owl'
              ? 'en-US-AnaNeural'
              : species === 'fox'
              ? 'en-US-GuyNeural'
              : 'en-US-JennyNeural'
        },
        look: {
          palette,
          accessories
        }
      },
      created_at: initialCharacter?.created_at || new Date().toISOString()
    };

    onSave(savedRecord);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Left Column: Live Character Preview */}
      <div className="md:col-span-5 flex flex-col items-center space-y-4">
        <div className="w-full aspect-[4/5] bg-gradient-to-b from-stone-100 to-stone-50 dark:from-midnight-900 dark:to-midnight-950 rounded-3xl border border-stone-200/90 dark:border-midnight-700/80 overflow-hidden flex items-center justify-center shadow-inner relative">
          <canvas ref={canvasRef} width={260} height={320} className="w-full h-full object-contain drop-shadow-sm" />

          {/* Live Preview Badge */}
          <span className="absolute top-3 right-3 bg-white/90 dark:bg-midnight-800/90 backdrop-blur-xs text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-stone-200/80 dark:border-midnight-700/80 shadow-xs">
            Live Preview
          </span>
        </div>

        {/* Expression selector for preview */}
        <div className="w-full space-y-1.5">
          <label className="text-[11px] font-semibold text-stone-600 dark:text-slate-300 uppercase tracking-wider">
            Preview Expression:
          </label>
          <div className="flex flex-wrap gap-1">
            {['happy', 'excited', 'surprised', 'worried', 'neutral', 'sad'].map((expr) => (
              <Chip
                key={expr}
                label={expr}
                selected={previewExpression === expr}
                onClick={() => setPreviewExpression(expr)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Customization Controls */}
      <div className="md:col-span-7 space-y-5">
        <Input
          label="Character Name"
          placeholder="e.g. Barnaby the Brave"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Species selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300">
            Species
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {(['owl', 'fox', 'kid', 'rabbit', 'turtle'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeciesChange(s)}
                className={`py-2 px-2 rounded-xl border text-xs sm:text-sm font-semibold capitalize transition-all duration-150 active:scale-95 ${
                  species === s
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-storybook-sm'
                    : 'bg-stone-50 dark:bg-midnight-900 hover:bg-stone-100 dark:hover:bg-midnight-750 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-midnight-700'
                }`}
              >
                {s === 'owl' ? '🦉 Owl' : s === 'fox' ? '🦊 Fox' : s === 'kid' ? '🧒 Kid' : s === 'rabbit' ? '🐰 Rabbit' : '🐢 Turtle'}
              </button>
            ))}
          </div>
        </div>

        {/* Accessories */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300">
            Accessories
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ACCESSORY_OPTIONS.map((acc) => {
              const active = accessories.includes(acc);
              return (
                <button
                  key={acc}
                  type="button"
                  onClick={() => toggleAccessory(acc)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize active:scale-95 ${
                    active
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 font-bold shadow-xs'
                      : 'bg-stone-50 dark:bg-midnight-900 border-stone-200 dark:border-midnight-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-midnight-750'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {acc}
                </button>
              );
            })}
          </div>
        </div>

        {/* Palette Swatches */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-slate-300">
            Color Palette
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['primary', 'secondary', 'accent', 'outline'] as const).map((key) => (
              <div key={key} className="flex items-center gap-2.5 bg-stone-50 dark:bg-midnight-900/60 p-2 rounded-xl border border-stone-200 dark:border-midnight-700">
                <input
                  type="color"
                  value={palette[key]}
                  onChange={(e) =>
                    setPalette((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="w-7 h-7 rounded border border-stone-300 dark:border-midnight-600 cursor-pointer"
                />
                <span className="text-xs font-semibold capitalize text-stone-700 dark:text-slate-200">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Personality Traits
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PERSONALITY_OPTIONS.map((trait) => (
              <Chip
                key={trait}
                label={trait}
                selected={personality.includes(trait)}
                onClick={() => togglePersonality(trait)}
              />
            ))}
          </div>
        </div>

        <Input
          label="Favorite Catchphrase"
          placeholder="e.g. By the stars above!"
          value={catchphrase}
          onChange={(e) => setCatchphrase(e.target.value)}
        />

        <Input
          label="Character Continuity Rule"
          placeholder="e.g. Always carries a compass; afraid of sudden thunder"
          value={rule}
          onChange={(e) => setRule(e.target.value)}
        />

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Character
          </Button>
        </div>
      </div>
    </form>
  );
}
