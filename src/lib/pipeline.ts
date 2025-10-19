import { callOpenRouter, type OpenRouterMessage } from '../llm/openrouter';
import { forwardChain, type Fact, type Rule } from '../logic/engine';
import { queryKnowledgeBase, type KnowledgeBase, type KnowledgeTriple } from '../kb/base';

export interface PlannerResponse {
  plan: string;
  reasoning: string[];
}

export interface PipelineInput {
  question: string;
}

export interface PipelineOutput {
  answer: string;
  trace: string[];
}

export interface PipelineContext {
  plannerModel: string;
  verifierModel: string;
  facts: Fact[];
  rules: Rule[];
  knowledgeBase: KnowledgeBase;
  apiKey?: string;
  kbQuery?: Partial<KnowledgeTriple>;
  callLLM?: typeof callOpenRouter;
}

function summariseFacts(facts: Fact[]): string {
  if (!facts.length) {
    return 'None';
  }

  return facts.map((fact) => `${fact.predicate}(${fact.args.join(', ')})`).join('\n');
}

function summariseTriples(triples: KnowledgeTriple[]): string {
  if (!triples.length) {
    return 'None';
  }

  return triples.map((triple) => `${triple.subject} ${triple.predicate} ${triple.object}`).join('\n');
}

function parsePlannerResponse(raw: string): PlannerResponse {
  try {
    const parsed = JSON.parse(raw) as Partial<PlannerResponse>;
    if (!parsed.plan) {
      throw new Error('Missing plan field');
    }
    return {
      plan: parsed.plan,
      reasoning: parsed.reasoning ?? []
    };
  } catch {
    return {
      plan: raw.trim(),
      reasoning: []
    };
  }
}

export async function runPipeline(input: PipelineInput, context: PipelineContext): Promise<PipelineOutput> {
  const llm = context.callLLM ?? callOpenRouter;

  const plannerMessages: OpenRouterMessage[] = [
    {
      role: 'system',
      content:
        'You are the planner module of the McCarthy Engine. Respond with JSON {"plan": string, "reasoning": string[]}.'
    },
    {
      role: 'user',
      content: `Question: ${input.question}`
    }
  ];

  const plannerRaw = await llm(plannerMessages, {
    model: context.plannerModel,
    apiKey: context.apiKey
  });

  const planner = parsePlannerResponse(plannerRaw);

  const fcResult = forwardChain(context.facts, context.rules);

  const kbMatches = context.kbQuery
    ? queryKnowledgeBase(context.knowledgeBase, context.kbQuery)
    : context.knowledgeBase.triples;

  const verifierMessages: OpenRouterMessage[] = [
    {
      role: 'system',
      content:
        'You verify reasoning chains. Produce a concise answer grounded in the provided symbolic context.'
    },
    {
      role: 'user',
      content: `Question: ${input.question}\nPlan: ${planner.plan}\nDerived Facts:\n${summariseFacts(
        fcResult.derived
      )}\nKnowledge Base:\n${summariseTriples(kbMatches)}\nReasoning Steps:\n${
        planner.reasoning.length ? planner.reasoning.join('\n') : 'None'
      }\nRespond with your verified answer.`
    }
  ];

  const answer = await llm(verifierMessages, {
    model: context.verifierModel,
    apiKey: context.apiKey
  });

  const trace: string[] = [
    `Plan: ${planner.plan}`,
    planner.reasoning.length ? `Reasoning: ${planner.reasoning.join(' | ')}` : 'Reasoning: None',
    `Derived facts:\n${summariseFacts(fcResult.derived)}`,
    `KB matches:\n${summariseTriples(kbMatches)}`,
    `Answer: ${answer}`
  ];

  return {
    answer,
    trace
  };
}
