import { describe, expect, it } from 'vitest';
import { Fact, Rule, forwardChain } from './engine';

describe('forwardChain', () => {
  it('derives new facts from Horn clause rules', () => {
    const facts: Fact[] = [
      { predicate: 'parent', args: ['alice', 'bob'] },
      { predicate: 'parent', args: ['bob', 'carol'] }
    ];

    const rules: Rule[] = [
      {
        head: { predicate: 'grandparent', args: ['?x', '?z'] },
        body: [
          { predicate: 'parent', args: ['?x', '?y'] },
          { predicate: 'parent', args: ['?y', '?z'] }
        ]
      }
    ];

    const result = forwardChain(facts, rules);

    expect(result.iterations).toBeGreaterThan(0);
    expect(result.derived).toContainEqual({ predicate: 'grandparent', args: ['alice', 'carol'] });
    expect(result.derived).toEqual(
      expect.arrayContaining([
        { predicate: 'parent', args: ['alice', 'bob'] },
        { predicate: 'parent', args: ['bob', 'carol'] }
      ])
    );
  });

  it('remains stable when rerun on its own output (property test)', () => {
    const facts: Fact[] = [
      { predicate: 'sibling', args: ['dave', 'erin'] }
    ];
    const rules: Rule[] = [];

    const once = forwardChain(facts, rules);
    const twice = forwardChain(once.derived, rules);

    expect(twice.derived).toEqual(once.derived);
    expect(twice.iterations).toBeLessThanOrEqual(once.iterations + 1);
  });
});
