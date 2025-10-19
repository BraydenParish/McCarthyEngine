import { describe, expect, it } from 'vitest';
import { KnowledgeBase, KnowledgeTriple, parseKnowledgeBase, queryKnowledgeBase } from './base';

describe('knowledge base', () => {
  const sample = `{"subject":"alice","predicate":"likes","object":"coffee"}\n` +
    `{"subject":"bob","predicate":"likes","object":"tea"}`;

  it('parses JSONL triples into a knowledge base', () => {
    const kb = parseKnowledgeBase(sample);

    expect(kb.triples).toHaveLength(2);
    expect(kb.triples[0]).toEqual({ subject: 'alice', predicate: 'likes', object: 'coffee' });
  });

  it('matches triples using variables and concrete filters', () => {
    const kb: KnowledgeBase = parseKnowledgeBase(sample);

    const matches: KnowledgeTriple[] = queryKnowledgeBase(kb, {
      subject: '?person',
      predicate: 'likes',
      object: 'coffee'
    });

    expect(matches).toEqual([{ subject: 'alice', predicate: 'likes', object: 'coffee' }]);
  });
});
