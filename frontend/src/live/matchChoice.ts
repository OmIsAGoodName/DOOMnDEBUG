import type { ChoiceOption } from '@contracts';

function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      // Simple kid-speech stemming
      if (word.endsWith('ies')) return word.slice(0, -3) + 'y'; // fireflies -> firefly
      if (word.endsWith('es')) return word.slice(0, -2); // boxes -> box
      if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1); // doors -> door
      if (word.endsWith('ing')) return word.slice(0, -3); // opening -> open, following -> follow
      return word;
    });
}

export interface MatchResult {
  matchedId: string | null;
  confidence: number;
  method: 'keyword' | 'none';
}

/**
 * Pure function: matches spoken transcript against choice options.
 * Tolerates filler words ("umm", "like", "the", "one", "please").
 */
export function matchChoice(
  transcript: string,
  options: ChoiceOption[]
): MatchResult {
  if (!transcript || options.length === 0) {
    return { matchedId: null, confidence: 0, method: 'none' };
  }

  const tokens = normalizeText(transcript);
  if (tokens.length === 0) {
    return { matchedId: null, confidence: 0, method: 'none' };
  }

  const scores = new Map<string, number>();

  for (const opt of options) {
    let score = 0;
    const keywords = (opt.keywords || []).flatMap(normalizeText);
    const labelTokens = normalizeText(opt.label);
    const allOptTokens = Array.from(new Set([...keywords, ...labelTokens]));

    for (const token of tokens) {
      if (allOptTokens.includes(token)) {
        score += 2;
      } else {
        // Partial substring match for spoken variations
        for (const optTok of allOptTokens) {
          if (optTok.length > 3 && (token.includes(optTok) || optTok.includes(token))) {
            score += 1;
            break;
          }
        }
      }
    }

    scores.set(opt.id, score);
  }

  let bestOptionId: string | null = null;
  let maxScore = 0;
  let runnerUpScore = 0;

  for (const [optId, score] of scores.entries()) {
    if (score > maxScore) {
      runnerUpScore = maxScore;
      maxScore = score;
      bestOptionId = optId;
    } else if (score > runnerUpScore) {
      runnerUpScore = score;
    }
  }

  // Clear winner
  if (maxScore > 0 && maxScore > runnerUpScore) {
    const confidence = maxScore >= 2 ? 0.9 : 0.65;
    return {
      matchedId: bestOptionId,
      confidence,
      method: 'keyword',
    };
  }

  return { matchedId: null, confidence: 0, method: 'none' };
}

