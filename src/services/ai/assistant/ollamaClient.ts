// ============================================================
// RentHub AI Assistant - Ollama Client
// ============================================================
// Lightweight HTTP client for the local Ollama API.
// Gracefully handles: Ollama not running, model not installed,
// connection failure, timeout, empty response, invalid JSON.
// ============================================================

import env from '../../../config/env';
import logger from '../../../config/logger';

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

export class OllamaError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'OllamaError';
    this.code = code;
  }
}

/**
 * Check if Ollama is reachable and the configured model is installed.
 * Returns { ok, error? } — never throws.
 */
export async function checkOllamaHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${env.ollama.baseUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return { ok: false, error: `Ollama responded with status ${res.status}` };
    }
    const data = (await res.json()) as { models?: { name?: string }[] };
    const models = data.models || [];
    const modelName = env.ollama.model;
    const installed = models.some((m) => m.name && (m.name === modelName || m.name.startsWith(`${modelName}:`)));
    if (!installed) {
      return { ok: false, error: `Model "${modelName}" is not installed. Run: ollama pull ${modelName}` };
    }
    logger.info(`Ollama connection: OK`);
    logger.info(`Ollama URL: ${env.ollama.baseUrl}`);
    logger.info(`Ollama model: ${modelName}`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: `Cannot reach Ollama at ${env.ollama.baseUrl}: ${message}` };
  }
}

/**
 * Send a chat completion request to Ollama.
 * Returns the raw text response, or throws OllamaError on failure.
 */
export async function ollamaChat(messages: OllamaChatMessage[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ollama.timeoutMs);

  try {
    const res = await fetch(`${env.ollama.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.ollama.model,
        messages,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 1024,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new OllamaError('MODEL_NOT_FOUND', `Model "${env.ollama.model}" is not installed. Run: ollama pull ${env.ollama.model}`);
      }
      throw new OllamaError('OLLAMA_ERROR', `Ollama responded with status ${res.status}`);
    }

    const data = (await res.json()) as OllamaChatResponse;
    const content = data?.message?.content?.trim();
    if (!content) {
      throw new OllamaError('EMPTY_RESPONSE', 'Ollama returned an empty response.');
    }
    return content;
  } catch (err) {
    if (err instanceof OllamaError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new OllamaError('TIMEOUT', `Ollama request timed out after ${env.ollama.timeoutMs}ms.`);
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.warn(`Ollama request failed: ${message}`);
    throw new OllamaError('CONNECTION_FAILED', `Cannot reach Ollama at ${env.ollama.baseUrl}. Is it running?`);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Extract a JSON object from an LLM response.
 * Handles markdown code fences and trailing text gracefully.
 */
export function extractJsonFromResponse(text: string): unknown {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  // Find the first { ... } block
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new OllamaError('INVALID_JSON', 'AI response did not contain a JSON object.');
  }

  const jsonStr = candidate.substring(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new OllamaError('INVALID_JSON', 'AI response contained invalid JSON.');
  }
}