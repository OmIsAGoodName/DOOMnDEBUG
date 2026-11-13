/**
 * VoxFable Dev Art Gallery (/dev/art)
 *
 * Owner: Nigel
 * Complete testing suite for:
 * - 3 Species (Owl, Fox, Kid)
 * - 5 Backgrounds (forest_day, forest_night, meadow_day, treehouse_interior, village_street)
 * - 8 Poses x 6 Expressions x 3 Mouth shapes
 * - 6 Accessories (scarf, glasses, hat, bow, backpack, cape)
 * - 12 Interactive Props
 * - Direction mirroring (facing right default, facing left mirrored)
 * - Palette swatch customizer
 */

import React, { useState, useEffect, useRef } from 'react';
import type { CharacterDrawState, Palette } from '@contracts';
import { drawCharacter } from '../../characters';
import { drawBackground } from '../../backgrounds';
import { drawProp } from '../../props';

const ALL_POSES = ['idle', 'walk', 'talk', 'wave', 'laugh', 'listen', 'react', 'point'] as const;
const ALL_EXPRESSIONS = ['neutral', 'happy', 'sad', 'surprised', 'worried', 'excited'] as const;
const ALL_MOUTHS = ['closed', 'half', 'wide'] as const;
const ALL_ACCESSORIES = ['scarf', 'glasses', 'hat', 'bow', 'backpack', 'cape'] as const;

const ALL_PROPS = [
  'lantern',
  'key',
  'treasure_chest',
  'book',
  'apple',
  'basket',
  'umbrella',
  'balloon',
  'flower',
  'glowing_door',
  'firefly_jar',
  'kite'
] as const;

const DEFAULT_PALETTES: Record<string, Palette> = {
  owl: {
    primary: '#8b5e3c',
    secondary: '#d9b38c',
    accent: '#f2a65a',
    outline: '#3b2a1e'
  },
  fox: {
    primary: '#d95f32',
    secondary: '#f4c28d',
    accent: '#2f3e46',
    outline: '#2b1e1a'
  },
  kid: {
    primary: '#3a86ff',
    secondary: '#ffbe0b',
    accent: '#ff006e',
    outline: '#1e293b'
  },
  rabbit: {
    primary: '#f3f4f6',
    secondary: '#fbcfe8',
    accent: '#60a5fa',
    outline: '#1f2937'
  },
  turtle: {
    primary: '#15803d',
    secondary: '#86efac',
    accent: '#fef08a',
    outline: '#14532d'
  }
};

export default function ArtGallery() {
  const [species, setSpecies] = useState<'owl' | 'fox' | 'kid' | 'rabbit' | 'turtle'>('owl');
  const [backgroundId, setBackgroundId] = useState<string>('forest_day');
  const [selectedPose, setSelectedPose] = useState<string>('idle');
  const [selectedExpression, setSelectedExpression] = useState<string>('happy');
  const [selectedMouth, setSelectedMouth] = useState<'closed' | 'half' | 'wide'>('half');
  const [facingLeft, setFacingLeft] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1.0);
  const [activeAccessories, setActiveAccessories] = useState<string[]>(['scarf', 'hat']);
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTES.owl);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [time, setTime] = useState<number>(0);
  const [showGroundBand, setShowGroundBand] = useState<boolean>(false);
  const [selectedProp, setSelectedProp] = useState<string>('lantern');

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const handleSpeciesChange = (newSpecies: 'owl' | 'fox' | 'kid' | 'rabbit' | 'turtle') => {
    setSpecies(newSpecies);
    setPalette(DEFAULT_PALETTES[newSpecies] || DEFAULT_PALETTES.owl);
  };

  const toggleAccessory = (acc: string) => {
    setActiveAccessories((prev) =>
      prev.includes(acc) ? prev.filter((a) => a !== acc) : [...prev, acc]
    );
  };

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (lastTimestampRef.current == null) {
        lastTimestampRef.current = timestamp;
      }
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (isPlaying) {
        setTime((t) => t + delta);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Main Canvas render (1280 x 720)
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1280;
    const h = 720;
    ctx.clearRect(0, 0, w, h);

    // 1. Background
    if (backgroundId && backgroundId !== 'none') {
      drawBackground(ctx, backgroundId, time, w, h);
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);
    }

    // Ground band guide lines
    if (showGroundBand) {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.fillRect(0, h * 0.62, w, h * 0.3);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.62);
      ctx.lineTo(w, h * 0.62);
      ctx.moveTo(0, h * 0.92);
      ctx.lineTo(w, h * 0.92);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = '12px sans-serif';
      ctx.fillText('Ground band min (0.62)', 20, h * 0.62 - 8);
      ctx.fillText('Ground band max (0.92)', 20, h * 0.92 + 18);
      ctx.restore();
    }

    // 2. Character on Ground Band (y = 0.77 * 720)
    const charX = w / 2;
    const charY = h * 0.77;

    const charState: CharacterDrawState = {
      characterId: `${species}_demo`,
      species,
      x: charX,
      y: charY,
      scale,
      facing: facingLeft ? 'left' : 'right',
      palette,
      accessories: activeAccessories,
      expression: selectedExpression,
      mouth: selectedMouth,
      pose: selectedPose,
      poseT: time % 2,
      time
    };

    ctx.save();
    if (facingLeft) {
      ctx.translate(charX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-charX, 0);
    }
    drawCharacter(ctx, charState);
    ctx.restore();

    // 3. Active Prop on Ground next to character
    if (selectedProp && selectedProp !== 'none') {
      drawProp(ctx, selectedProp, charX + 130 * scale, charY, scale * 0.9, time);
    }
  }, [
    species,
    backgroundId,
    selectedPose,
    selectedExpression,
    selectedMouth,
    facingLeft,
    scale,
    activeAccessories,
    palette,
    time,
    showGroundBand,
    selectedProp
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <span>🎨</span> VoxFable Art Gallery
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic Canvas 2D Art Testing Suite &bull; Owner: <strong>Nigel</strong>
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => setTime(0)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-sm"
          >
            Reset Time
          </button>
          <span className="text-xs font-mono text-slate-500 min-w-16">
            t = {time.toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Main Preview Showcase: 1280 x 720 */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 text-sm">Full Scene Preview</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-mono">
              1280 &times; 720 Canvas
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={facingLeft}
                onChange={(e) => setFacingLeft(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">Mirror Left (ctx.scale(-1, 1))</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showGroundBand}
                onChange={(e) => setShowGroundBand(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium">Show Ground Band (0.62-0.92)</span>
            </label>
          </div>
        </div>

        <div className="p-4 flex justify-center bg-slate-900/5">
          <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-inner border border-slate-300 bg-white">
            <canvas
              ref={mainCanvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {/* Col 1: Species & Background */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">
            1. Characters & Locations
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">SPECIES</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(['owl', 'fox', 'kid', 'rabbit', 'turtle'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeciesChange(s)}
                  className={`px-2 py-2 rounded-xl text-xs sm:text-sm font-semibold capitalize transition-all ${
                    species === s
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {s === 'owl' ? '🦉 Owl' : s === 'fox' ? '🦊 Fox' : s === 'kid' ? '🧒 Kid' : s === 'rabbit' ? '🐰 Rabbit' : '🐢 Turtle'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">BACKGROUND (All 5 Implemented)</label>
            <select
              value={backgroundId}
              onChange={(e) => setBackgroundId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="forest_day">Sunny Forest (forest_day)</option>
              <option value="forest_night">Night Forest (forest_night)</option>
              <option value="meadow_day">Green Meadow (meadow_day)</option>
              <option value="treehouse_interior">Treehouse (treehouse_interior)</option>
              <option value="village_street">Village Street (village_street)</option>
              <option value="none">None (Plain Canvas)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">ACTIVE PROP (12 Vocabulary)</label>
            <select
              value={selectedProp}
              onChange={(e) => setSelectedProp(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              {ALL_PROPS.map((p) => (
                <option key={p} value={p}>
                  {p.replace('_', ' ')}
                </option>
              ))}
              <option value="none">None</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>SCALE: {scale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        {/* Col 2: Pose, Expression & Mouth */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">
            2. Animation State
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">ACTIVE POSE</label>
            <select
              value={selectedPose}
              onChange={(e) => setSelectedPose(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              {ALL_POSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">EXPRESSION</label>
              <select
                value={selectedExpression}
                onChange={(e) => setSelectedExpression(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
              >
                {ALL_EXPRESSIONS.map((expr) => (
                  <option key={expr} value={expr}>
                    {expr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">MOUTH SHAPE</label>
              <select
                value={selectedMouth}
                onChange={(e) => setSelectedMouth(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
              >
                {ALL_MOUTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Accessories */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">ACCESSORIES</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ACCESSORIES.map((acc) => {
                const active = activeAccessories.includes(acc);
                return (
                  <button
                    key={acc}
                    onClick={() => toggleAccessory(acc)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-amber-100 border-amber-400 text-amber-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {acc}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Col 3: Palette Swatches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-bold text-slate-900 text-base">3. Palette Swatches</h2>
            <button
              onClick={() => setPalette(DEFAULT_PALETTES[species] || DEFAULT_PALETTES.owl)}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['primary', 'secondary', 'accent', 'outline'] as const).map((key) => (
              <div key={key} className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase">
                  {key}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={palette[key]}
                    onChange={(e) =>
                      setPalette((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                  />
                  <span className="font-mono text-xs text-slate-600">{palette[key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 8 Poses Live Matrix */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">8 Poses Preview Matrix ({species})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ALL_POSES.map((pose) => (
            <PoseCard
              key={pose}
              pose={pose}
              species={species}
              palette={palette}
              accessories={activeAccessories}
              expression={selectedExpression}
              mouth={selectedMouth}
              time={time}
              scale={0.7}
              isSelected={selectedPose === pose}
              onSelect={() => setSelectedPose(pose)}
            />
          ))}
        </div>
      </div>

      {/* 12 Props Showcase Grid */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">12 Vocabulary Props Showcase</h2>
          <span className="text-xs text-slate-500 font-mono">Origin: Bottom Center</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ALL_PROPS.map((p) => (
            <PropCard
              key={p}
              propId={p}
              time={time}
              isSelected={selectedProp === p}
              onSelect={() => setSelectedProp(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PoseCardProps {
  pose: string;
  species: string;
  palette: Palette;
  accessories: string[];
  expression: string;
  mouth: 'closed' | 'half' | 'wide';
  time: number;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
}

function PoseCard({
  pose,
  species,
  palette,
  accessories,
  expression,
  mouth,
  time,
  scale,
  isSelected,
  onSelect
}: PoseCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 240;
    const h = 260;
    ctx.clearRect(0, 0, w, h);

    const charState: CharacterDrawState = {
      characterId: `${species}_${pose}`,
      species,
      x: w / 2,
      y: h - 30,
      scale,
      facing: 'right',
      palette,
      accessories,
      expression,
      mouth,
      pose,
      poseT: time % 2,
      time
    };

    drawCharacter(ctx, charState);
  }, [pose, species, palette, accessories, expression, mouth, time, scale]);

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl p-3 border transition-all cursor-pointer flex flex-col items-center shadow-sm hover:shadow-md ${
        isSelected
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="w-full aspect-[4/4.5] flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
        <canvas ref={canvasRef} width={240} height={260} className="w-full h-full object-contain" />
      </div>
      <div className="mt-2.5 flex items-center justify-between w-full px-1">
        <span className="font-semibold text-sm capitalize text-slate-800">{pose}</span>
        {isSelected && (
          <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
            ACTIVE
          </span>
        )}
      </div>
    </div>
  );
}

interface PropCardProps {
  propId: string;
  time: number;
  isSelected: boolean;
  onSelect: () => void;
}

function PropCard({ propId, time, isSelected, onSelect }: PropCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 120;
    const h = 120;
    ctx.clearRect(0, 0, w, h);

    drawProp(ctx, propId, w / 2, h - 16, 0.7, time);
  }, [propId, time]);

  return (
    <div
      onClick={onSelect}
      className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="w-full aspect-square flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} width={120} height={120} className="w-full h-full object-contain" />
      </div>
      <div className="mt-1.5 text-xs font-semibold text-slate-700 capitalize truncate">
        {propId.replace('_', ' ')}
      </div>
    </div>
  );
}
