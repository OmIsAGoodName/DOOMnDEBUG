import React, { useState } from 'react';
import type { Series } from '@contracts';
import { Button, Input, Select, Chip } from '../ui';

export interface SeriesFormProps {
  initialSeries?: Series | null;
  onSave: (series: Partial<Series> & { title: string }) => void;
  onCancel: () => void;
}

const TONE_OPTIONS = ['cozy', 'playful', 'educational', 'magical', 'adventurous'];
const SETTING_OPTIONS = [
  { value: 'forest', label: 'Whispering Woods (Forest)' },
  { value: 'village', label: 'Fairytale Village (Street)' },
  { value: 'meadow', label: 'Sunlit Valley (Meadow)' },
  { value: 'treehouse', label: 'Secret Treehouse (Interior)' }
];

export function SeriesForm({ initialSeries, onSave, onCancel }: SeriesFormProps) {
  const [title, setTitle] = useState(initialSeries?.title || '');
  const [setting, setSetting] = useState(initialSeries?.world?.setting || 'forest');
  const [tone, setTone] = useState(initialSeries?.tone || 'cozy');
  const [ageBand, setAgeBand] = useState<'3-5' | '4-6' | '6-8'>(
    (initialSeries?.age_band as any) || '4-6'
  );
  const [ruleInput, setRuleInput] = useState('');
  const [rules, setRules] = useState<string[]>(
    initialSeries?.world?.rules || ['Animals can talk with children', 'Bedtime always arrives peacefully']
  );

  const addRule = () => {
    if (!ruleInput.trim()) return;
    setRules((prev) => [...prev, ruleInput.trim()]);
    setRuleInput('');
  };

  const removeRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: initialSeries?.id,
      title: title.trim(),
      tone,
      age_band: ageBand,
      language: 'en',
      world: {
        setting,
        rules
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Series Title"
        placeholder="e.g. Pip & Friends Bedtime Tales"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Primary Setting"
          value={setting}
          onChange={(e) => setSetting(e.target.value)}
          options={SETTING_OPTIONS}
        />

        <Select
          label="Target Age Band"
          value={ageBand}
          onChange={(e) => setAgeBand(e.target.value as any)}
          options={[
            { value: '3-5', label: 'Ages 3 - 5' },
            { value: '4-6', label: 'Ages 4 - 6' },
            { value: '6-8', label: 'Ages 6 - 8' }
          ]}
        />
      </div>

      {/* Tone Chips */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Series Tone
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TONE_OPTIONS.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={tone === t}
              onClick={() => setTone(t)}
            />
          ))}
        </div>
      </div>

      {/* World Rules */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          World & Continuity Rules
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Magic only works when friends cooperate"
            value={ruleInput}
            onChange={(e) => setRuleInput(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="button" variant="secondary" size="md" onClick={addRule}>
            Add Rule
          </Button>
        </div>

        <ul className="space-y-1 pt-1">
          {rules.map((r, i) => (
            <li
              key={i}
              className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
            >
              <span>&bull; {r}</span>
              <button
                type="button"
                onClick={() => removeRule(i)}
                className="text-slate-400 hover:text-rose-600 font-bold ml-2"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save Series
        </Button>
      </div>
    </form>
  );
}
