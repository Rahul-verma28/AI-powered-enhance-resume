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

    let currentModel = this.model;
    let lastError: Error | null = null;
    let fallbackTriggered = false;

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

        console.log(`[Ollama] Calling model "${currentModel}" (attempt ${attempt + 1})...`);
        const startTime = Date.now();

        const response = await axios.post(
          `${this.baseUrl}/api/generate`,
          {
            model: currentModel,
            prompt,
            system: systemPrompt,
            stream: false,
            options: {
              temperature,
              num_predict: options.maxTokens || 4096,
              num_ctx: 16384, // Increase context window for long resumes and JDs
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
          model: currentModel,
          tokensUsed: response.data.eval_count,
        };
      } catch (error: any) {
        lastError = error;

        // Log detailed error from Ollama if available
        let detailedError = '';
        if (error.response?.data) {
          detailedError = typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);
          console.error(`[Ollama] Detailed API Error Response:`, detailedError);
        }

        if (error.code === 'ECONNREFUSED') {
          // Don't retry if Ollama isn't running at all
          throw new Error(
            'Ollama is not running. Start it with: ollama serve'
          );
        }

        // Don't retry on model not found
        if (error.response?.status === 404) {
          throw new Error(
            `Ollama model "${currentModel}" not found. Pull it with: ollama pull ${currentModel}`
          );
        }

        // Check if error is due to memory constraints and we haven't triggered fallback yet
        const isMemoryError =
          detailedError.toLowerCase().includes('memory') ||
          error.message?.toLowerCase().includes('memory') ||
          detailedError.toLowerCase().includes('vram');

        if (isMemoryError && !fallbackTriggered) {
          console.warn(`[Ollama] Model "${currentModel}" failed due to system memory limits. Triggering fallback resolution...`);
          try {
            const tagsRes = await axios.get(`${this.baseUrl}/api/tags`);
            const installedModels = tagsRes.data?.models || [];
            
            // Check if llama3.2:1b is installed
            const hasLlama1b = installedModels.some((m: any) => m.name.startsWith('llama3.2:1b'));
            
            if (hasLlama1b) {
              console.log(`[Ollama] Automatically switching to lightweight model "llama3.2:1b" as fallback...`);
              currentModel = 'llama3.2:1b';
              fallbackTriggered = true;
              attempt = -1; // Reset attempts so fallback model gets retries if needed
              continue;
            } else {
              // Find any other installed model that is smaller than 4GB
              const smallerModel = installedModels.find((m: any) => m.size < 4000000000 && m.name !== currentModel);
              if (smallerModel) {
                console.log(`[Ollama] Automatically switching to installed fallback model "${smallerModel.name}"...`);
                currentModel = smallerModel.name;
                fallbackTriggered = true;
                attempt = -1;
                continue;
              }
            }
          } catch (tagErr) {
            console.error('[Ollama] Failed to fetch tags for fallback resolution:', (tagErr as Error).message);
          }
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

    const oomTip = currentModel === 'gemma4:e4b'
      ? ' TIP: The 9.6GB gemma4 model requires high VRAM. If your machine is running out of memory, try switching OLLAMA_MODEL to "llama3.2:1b" in backend/.env.'
      : '';
    throw new Error(`Ollama API error after ${MAX_RETRIES + 1} attempts: ${lastError?.message || lastError}.${oomTip}`);
  }
}

export const ollamaService = new OllamaService();
