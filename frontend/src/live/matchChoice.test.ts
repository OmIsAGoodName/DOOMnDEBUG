import { describe, it, expect } from 'vitest';
import type { ChoiceOption } from '@contracts';
import { matchChoice } from './matchChoice';

describe('matchChoice', () => {
  const options: ChoiceOption[] = [
    {
      id: 'a',
      label: 'Follow the firefly',
      keywords: ['firefly', 'follow'],
      next_scene: 'sc2a',
    },
    {
      id: 'b',
      label: 'Open the door',
      keywords: ['door', 'open'],
      next_scene: 'sc2b',
    },
  ];

  it('matches direct keyword "door"', () => {
    const res = matchChoice('door', options);
    expect(res.matchedId).toBe('b');
    expect(res.confidence).toBeGreaterThan(0.5);
  });

  it('matches kid phrase with filler: "the door!"', () => {
    const res = matchChoice('the door!', options);
    expect(res.matchedId).toBe('b');
  });

  it('matches kid phrase: "umm the firefly one"', () => {
    const res = matchChoice('umm the firefly one', options);
    expect(res.matchedId).toBe('a');
  });

  it('matches action verb: "open it please"', () => {
    const res = matchChoice('open it please', options);
    expect(res.matchedId).toBe('b');
  });

  it('handles plurals/stemming: "following fireflies"', () => {
    const res = matchChoice('following fireflies', options);
    expect(res.matchedId).toBe('a');
  });

  it('returns null on empty or unhelpful phrase', () => {
    const res = matchChoice('banana ice cream', options);
    expect(res.matchedId).toBeNull();
  });
});

