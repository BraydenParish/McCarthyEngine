export interface KnowledgeTriple {
  subject: string;
  predicate: string;
  object: string;
}

export interface KnowledgeBase {
  triples: KnowledgeTriple[];
}

const VARIABLE_PREFIX = '?';

function isVariable(token: string | undefined): token is string {
  return typeof token === 'string' && token.startsWith(VARIABLE_PREFIX);
}

function normaliseTriple(triple: KnowledgeTriple): KnowledgeTriple {
  return {
    subject: String(triple.subject),
    predicate: String(triple.predicate),
    object: String(triple.object)
  };
}

export function parseKnowledgeBase(jsonl: string): KnowledgeBase {
  const triples: KnowledgeTriple[] = [];

  for (const line of jsonl.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const parsed = JSON.parse(trimmed) as Partial<KnowledgeTriple>;
    if (!parsed.subject || !parsed.predicate || !parsed.object) {
      throw new Error('Malformed triple encountered while parsing knowledge base');
    }

    triples.push(normaliseTriple(parsed as KnowledgeTriple));
  }

  return { triples };
}

export function queryKnowledgeBase(
  kb: KnowledgeBase,
  pattern: Partial<KnowledgeTriple>
): KnowledgeTriple[] {
  const matches: KnowledgeTriple[] = [];

  for (const triple of kb.triples) {
    const bindings: Record<string, string> = {};
    let valid = true;

    (['subject', 'predicate', 'object'] as const).forEach((field) => {
      if (!valid) {
        return;
      }

      const expected = pattern[field];
      const actual = triple[field];

      if (expected === undefined) {
        return;
      }

      if (isVariable(expected)) {
        const current = bindings[expected];
        if (current && current !== actual) {
          valid = false;
          return;
        }
        bindings[expected] = actual;
      } else if (expected !== actual) {
        valid = false;
      }
    });

    if (valid) {
      matches.push(triple);
    }
  }

  return matches;
}
