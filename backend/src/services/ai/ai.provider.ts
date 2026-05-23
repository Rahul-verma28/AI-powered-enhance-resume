import { config } from '../../config';
import { ollamaService } from './ollama.service';
import { claudeService } from './claude.service';
import { openaiService } from './openai.service';
import type { AIProvider, AICallOptions, AIResponse } from '../../types';

/**
 * AI Provider Abstraction Layer.
 * Routes all AI calls through a single interface.
 * Switch providers via AI_PROVIDER env variable — no code changes needed.
 */
export async function callAI(
  prompt: string,
  systemPrompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  const provider = config.ai.provider;

  switch (provider) {
    case 'ollama':
      return ollamaService.call(prompt, systemPrompt, options);
    case 'claude':
      return claudeService.call(prompt, systemPrompt, options);
    case 'openai':
      return openaiService.call(prompt, systemPrompt, options);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Call AI and parse the response as JSON.
 * Strips markdown code blocks if present (common with some models).
 */
export async function callAIJSON<T = unknown>(
  prompt: string,
  systemPrompt: string,
  options: AICallOptions = {}
): Promise<T> {
  const response = await callAI(prompt, systemPrompt, {
    ...options,
    jsonMode: true,
    temperature: options.temperature ?? 0.2, // Lower temp for structured output
  });

  let content = response.content.trim();

  // Strip markdown code blocks if present
  if (content.startsWith('```json')) {
    content = content.slice(7);
  } else if (content.startsWith('```')) {
    content = content.slice(3);
  }
  if (content.endsWith('```')) {
    content = content.slice(0, -3);
  }
  content = content.trim();

  // Sometimes models wrap in { } with trailing junk — find the JSON boundaries
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  const firstBracket = content.indexOf('[');
  const lastBracket = content.lastIndexOf(']');

  // Determine if root is object or array
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    content = content.slice(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1) {
    content = content.slice(firstBracket, lastBracket + 1);
  }

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`[AI] Failed to parse JSON from ${response.provider}. Raw response (first 500 chars):`, content.substring(0, 500));
    throw new Error(
      `Failed to parse AI response as JSON. Provider: ${response.provider}. ` +
      `Check if model "${response.model}" supports JSON output. ` +
      `Response preview: ${content.substring(0, 100)}...`
    );
  }
}

export { ollamaService } from './ollama.service';
export { claudeService } from './claude.service';
export { openaiService } from './openai.service';
