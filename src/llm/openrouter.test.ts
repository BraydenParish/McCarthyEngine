import { afterEach, describe, expect, it, vi } from 'vitest';
import { callOpenRouter } from './openrouter';

describe('callOpenRouter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends chat completion requests to the OpenRouter API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { content: 'Hello world' }
          }
        ]
      })
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    const content = await callOpenRouter(
      [
        { role: 'system', content: 'Be kind.' },
        { role: 'user', content: 'Say hi' }
      ],
      { model: 'test-model', apiKey: 'test-key' }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json'
        })
      })
    );
    expect(content).toBe('Hello world');
  });

  it('throws a helpful error when the API responds with failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid key'
    });
    vi.stubGlobal('fetch', mockFetch as unknown as typeof fetch);

    await expect(
      callOpenRouter([{ role: 'user', content: 'Hi' }], { model: 'test-model', apiKey: 'bad' })
    ).rejects.toThrow('OpenRouter request failed with status 401 Unauthorized: Invalid key');
  });
});
