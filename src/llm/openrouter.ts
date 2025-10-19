export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterOptions {
  model: string;
  apiKey?: string;
}

interface OpenRouterChoice {
  message?: { content?: string };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
}

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Sends chat completion requests to OpenRouter and returns the assistant's response content.
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: options.model,
      messages
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `OpenRouter request failed with status ${response.status} ${response.statusText}: ${errorText || 'No response body'}`
    );
  }

  const payload = (await response.json()) as OpenRouterResponse;
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('OpenRouter response did not include assistant content');
  }

  return content;
}
