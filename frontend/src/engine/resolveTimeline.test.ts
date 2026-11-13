import { describe, it, expect } from 'vitest';
import quickDemoFixture from '@fixtures/episode_quick_demo.json';
import liveDemoFixture from '@fixtures/episode_live_demo.json';
import type { EpisodePlan } from '@contracts';
import { resolveTimeline, resolveFrom, estimateSpeechDuration } from './resolveTimeline';

describe('resolveTimeline', () => {
  it('estimates speech duration consistently when no audio is present', () => {
    const text = 'This is a test of seven words here.';
    const words = 8;
    const expected = words / 2.6 + 0.3;
    expect(estimateSpeechDuration(text)).toBeCloseTo(expected, 2);
  });

  it('resolves quick demo fixture without NaN and deterministically', () => {
    const plan = quickDemoFixture as unknown as EpisodePlan;
    const timeline1 = resolveTimeline(plan, null);
    const timeline2 = resolveTimeline(plan, null);

    expect(timeline1.totalDuration).toBeGreaterThan(0);
    expect(Number.isNaN(timeline1.totalDuration)).toBe(false);
    expect(timeline1.totalDuration).toBe(timeline2.totalDuration);
    expect(timeline1.scenes.length).toBeGreaterThan(0);

    for (const sc of timeline1.scenes) {
      expect(Number.isNaN(sc.startTime)).toBe(false);
      expect(Number.isNaN(sc.endTime)).toBe(false);
      expect(sc.endTime).toBeGreaterThanOrEqual(sc.startTime);
    }
  });

  it('resolves live demo fixture and branches on choices', () => {
    const plan = liveDemoFixture as unknown as EpisodePlan;

    // Branch A
    const timelineA = resolveTimeline(plan, null, ['a']);
    // Branch B
    const timelineB = resolveTimeline(plan, null, ['b']);

    expect(timelineA.scenes.length).toBeGreaterThan(0);
    expect(timelineB.scenes.length).toBeGreaterThan(0);

    // Verify choice points
    expect(timelineA.choicePoints.length).toBeGreaterThan(0);
    const cp = timelineA.choicePoints[0];
    expect(cp.options.length).toBe(2);

    // Verify scenes follow choice: second scene in A should be sc2a, in B should be sc2b
    expect(timelineA.scenes[1].sceneId).toBe('sc2a');
    expect(timelineB.scenes[1].sceneId).toBe('sc2b');
  });

  it('resolveFrom preserves earlier times and re-branches', () => {
    const plan = liveDemoFixture as unknown as EpisodePlan;
    const initial = resolveTimeline(plan, null, ['a']);

    const choice = initial.choicePoints[0];
    const reResolved = resolveFrom(initial, choice.choiceBeatId, 'b');

    // First scene start and end times should match exactly
    expect(reResolved.scenes[0].sceneId).toBe(initial.scenes[0].sceneId);
    expect(reResolved.scenes[0].startTime).toBe(initial.scenes[0].startTime);
    expect(reResolved.scenes[0].endTime).toBe(initial.scenes[0].endTime);

    // Re-resolved branch now goes to sc2b
    expect(reResolved.scenes[1].sceneId).toBe('sc2b');
  });

  it('resolves audio lines duration over estimates when manifest is provided', () => {
    const plan = quickDemoFixture as unknown as EpisodePlan;
    const mockAudio = {
      episode_id: plan.episode_id,
      lines: [
        {
          line_id: `${plan.episode_id}:sc1:b1`,
          scene_id: 'sc1',
          beat_id: 'b1',
          speaker: 'narrator',
          url: '/demo/audio/sc1_b1.mp3',
          duration_ms: 5000,
        },
      ],
    };

    const timeline = resolveTimeline(plan, mockAudio);
    const beat1 = timeline.beats[0];
    expect(beat1.speechDuration).toBe(5.0);
    expect(beat1.estimatedSpeech).toBe(false);
    expect(beat1.duration).toBeGreaterThanOrEqual(5.3); // speech + 0.3
  });

  it('prints fixture scene summaries', () => {
    const quickPlan = quickDemoFixture as unknown as EpisodePlan;
    const livePlan = liveDemoFixture as unknown as EpisodePlan;

    const resQuick = resolveTimeline(quickPlan, null);
    const resLive = resolveTimeline(livePlan, null, ['a']);

    const quickSummary = resQuick.scenes.map((s) => `${s.sceneId}: [${s.startTime.toFixed(2)}s - ${s.endTime.toFixed(2)}s]`).join(', ');
    const liveSummary = resLive.scenes.map((s) => `${s.sceneId}: [${s.startTime.toFixed(2)}s - ${s.endTime.toFixed(2)}s]`).join(', ');

    expect(quickSummary).toBeTruthy();
    expect(liveSummary).toBeTruthy();
    console.log('[Fixture Summary Quick]:', quickSummary);
    console.log('[Fixture Summary Live]:', liveSummary);
  });
});

