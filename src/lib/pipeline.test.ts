import { describe, expect, it, vi } from 'vitest';
import type { Fact, Rule } from '../logic/engine';
import type { KnowledgeBase } from '../kb/base';
import { parseKnowledgeBase } from '../kb/base';
import { runPipeline } from './pipeline';

describe('runPipeline', () => {
  const facts: Fact[] = [{ predicate: 'goal', args: ['answer-question'] }];
  const rules: Rule[] = [
    {
      head: { predicate: 'action', args: ['?x'] },
      body: [{ predicate: 'goal', args: ['?x'] }]
    }
  ];
  const kb: KnowledgeBase = parseKnowledgeBase(
    `{"subject":"engine","predicate":"supports","object":"neuro-symbolic"}`
  );

  it('coordinates planner, logic engine, knowledge base, and verifier', async () => {
    const callLLM = vi
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({ plan: 'Use logic to derive actions', reasoning: ['Use action rule'] })
      )
      .mockResolvedValueOnce('Final answer');

    const output = await runPipeline(
      { question: 'How does the engine work?' },
      {
        plannerModel: 'planner-test',
        verifierModel: 'verifier-test',
        apiKey: 'test',
        facts,
        rules,
        knowledgeBase: kb,
        callLLM
      }
    );

    expect(callLLM).toHaveBeenCalledTimes(2);
    expect(callLLM.mock.calls[0][1]).toMatchObject({ model: 'planner-test' });
    expect(callLLM.mock.calls[1][1]).toMatchObject({ model: 'verifier-test' });

    expect(output.answer).toBe('Final answer');
    expect(output.trace).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Plan: Use logic to derive actions'),
        expect.stringContaining('Derived facts:'),
        expect.stringContaining('KB matches:')
      ])
    );
  });
});
