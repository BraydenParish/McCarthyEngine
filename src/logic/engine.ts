/**
 * Fact representation compatible with Horn clauses.
 */
export interface Fact {
  predicate: string;
  args: string[];
}

/**
 * Rule representation where the head is implied when every body fact matches.
 */
export interface Rule {
  head: Fact;
  body: Fact[];
}

export interface ForwardChainResult {
  derived: Fact[];
  iterations: number;
}

type Binding = Record<string, string>;

const VARIABLE_PREFIX = '?';

function isVariable(token: string): boolean {
  return token.startsWith(VARIABLE_PREFIX);
}

function factKey(fact: Fact): string {
  return `${fact.predicate}::${fact.args.join('::')}`;
}

function matchFactToPattern(fact: Fact, pattern: Fact, binding: Binding): Binding | null {
  if (fact.predicate !== pattern.predicate || fact.args.length !== pattern.args.length) {
    return null;
  }

  const nextBinding: Binding = { ...binding };

  for (let i = 0; i < fact.args.length; i += 1) {
    const factArg = fact.args[i];
    const patternArg = pattern.args[i];

    if (isVariable(patternArg)) {
      const existing = nextBinding[patternArg];
      if (existing && existing !== factArg) {
        return null;
      }
      nextBinding[patternArg] = factArg;
    } else if (patternArg !== factArg) {
      return null;
    }
  }

  return nextBinding;
}

function applyBindingsToFact(fact: Fact, binding: Binding): Fact | null {
  const args: string[] = [];

  for (const arg of fact.args) {
    if (isVariable(arg)) {
      const resolved = binding[arg];
      if (!resolved) {
        return null;
      }
      args.push(resolved);
    } else {
      args.push(arg);
    }
  }

  return { predicate: fact.predicate, args };
}

function deriveFromRule(facts: Fact[], rule: Rule): Fact[] {
  const matches: Fact[] = [];

  const explore = (index: number, binding: Binding): void => {
    if (index === rule.body.length) {
      const head = applyBindingsToFact(rule.head, binding);
      if (head) {
        matches.push(head);
      }
      return;
    }

    for (const fact of facts) {
      const updated = matchFactToPattern(fact, rule.body[index], binding);
      if (updated) {
        explore(index + 1, updated);
      }
    }
  };

  explore(0, {});

  return matches;
}

/**
 * Executes a straightforward forward-chaining algorithm until a fixpoint is reached.
 * Facts are treated as sets (no duplicates) and variables are recognised by a leading `?`.
 */
export function forwardChain(facts: Fact[], rules: Rule[]): ForwardChainResult {
  const knownFacts: Fact[] = [...facts];
  const seen = new Map<string, Fact>();
  facts.forEach((fact) => seen.set(factKey(fact), fact));

  let iterations = 0;
  let added = true;

  while (added) {
    added = false;
    iterations += 1;

    for (const rule of rules) {
      const derivedFacts = deriveFromRule(knownFacts, rule);
      for (const derived of derivedFacts) {
        const key = factKey(derived);
        if (!seen.has(key)) {
          seen.set(key, derived);
          knownFacts.push(derived);
          added = true;
        }
      }
    }

    if (!added) {
      break;
    }
  }

  return {
    derived: [...seen.values()],
    iterations
  };
}
