import axios from 'axios';
import { config } from '../../config';
import type { AICallOptions, AIResponse } from '../../types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

/**
 * Ollama LLM Service — for local development.
 * Connects to a locally running Ollama instance.
 */
export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ai.ollama.baseUrl;
    this.model = config.ai.ollama.model;
  }

  async call(
    prompt: string,
    systemPrompt: string,
    options: AICallOptions = {}
  ): Promise<AIResponse> {
    const { temperature = 0.3, jsonMode = false } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[Ollama] Retry attempt ${attempt}/${MAX_RETRIES}...`);
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        }

        // First, check if Ollama is reachable
        if (attempt === 0) {
          try {
            await axios.get(`${this.baseUrl}/api/version`, { timeout: 5000 });
          } catch {
            throw new Error(
              'Ollama is not running or unreachable. Start it with: ollama serve'
            );
          }
        }

        console.log(`[Ollama] Calling model "${this.model}" (attempt ${attempt + 1})...`);
        const startTime = Date.now();

        const response = await axios.post(
          `${this.baseUrl}/api/generate`,
          {
            model: this.model,
            prompt,
            system: systemPrompt,
            stream: false,
            options: {
              temperature,
              num_predict: options.maxTokens || 4096,
            },
            format: jsonMode ? 'json' : undefined,
          },
          { timeout: 300_000 } // 5 minute timeout — large prompts on small models need time
        );

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Ollama] Response received in ${elapsed}s (${response.data.eval_count || '?'} tokens)`);

        return {
          content: response.data.response,
          provider: 'ollama',
          model: this.model,
          tokensUsed: response.data.eval_count,
        };
      } catch (error: any) {
        lastError = error;

        if (error.code === 'ECONNREFUSED') {
          // Don't retry if Ollama isn't running at all
          throw new Error(
            'Ollama is not running. Start it with: ollama serve'
          );
        }

        // Don't retry on model not found
        if (error.response?.status === 404) {
          throw new Error(
            `Ollama model "${this.model}" not found. Pull it with: ollama pull ${this.model}`
          );
        }

        // Retry on timeout or 500 errors
        const isRetryable =
          error.code === 'ECONNABORTED' ||
          error.message?.includes('timeout') ||
          error.response?.status >= 500;

        if (!isRetryable || attempt === MAX_RETRIES) {
          break;
        }

        console.warn(`[Ollama] Request failed (${error.message}), will retry...`);
      }
    }

    throw new Error(`Ollama API error after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
  }
}

export const ollamaService = new OllamaService();
