import axios from 'axios';
import { config } from '../../config';
import type { AICallOptions, AIResponse } from '../../types';

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 2000;

/**
 * AWS Bedrock LLM Service — Production Option C.
 * Connects to Amazon Bedrock using direct bearer token (ABSK) authentication.
 * Uses the modern Converse API for a unified model interaction schema.
 */
export class BedrockService {
  private apiKey: string;
  private region: string;
  private modelId: string;

  constructor() {
    this.apiKey = config.ai.bedrock.apiKey;
    this.region = config.ai.bedrock.region;
    this.modelId = config.ai.bedrock.modelId;
  }

  async call(
    prompt: string,
    systemPrompt: string,
    options: AICallOptions = {}
  ): Promise<AIResponse> {
    const { maxTokens = 4096, temperature = 0.3 } = options;

    if (!this.apiKey) {
      throw new Error('[Bedrock] BEDROCK_API_KEY is not configured in your environment variables.');
    }

    if (!this.apiKey.startsWith('ABSK')) {
      throw new Error('[Bedrock] Invalid API key format. Bedrock Bearer tokens must start with the "ABSK" prefix.');
    }

    const encodedModelId = encodeURIComponent(this.modelId);
    const url = `https://bedrock-runtime.${this.region}.amazonaws.com/model/${encodedModelId}/converse`;

    let lastError: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff with random jitter (prevents thundering herd problems)
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000;
          console.warn(`[Bedrock] Retry attempt ${attempt}/${MAX_RETRIES} after ${delay.toFixed(0)}ms due to rate limiting or transient error...`);
          await new Promise((r) => setTimeout(r, delay));
        }

        console.log(`[Bedrock] Calling Bedrock Converse API (Model: ${this.modelId}, Region: ${this.region}, Attempt: ${attempt + 1})...`);
        const startTime = Date.now();

        const response = await axios.post(
          url,
          {
            system: [{ text: systemPrompt }],
            messages: [
              {
                role: 'user',
                content: [{ text: prompt }]
              }
            ],
            inferenceConfig: {
              maxTokens,
              temperature
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 120000 // 2-minute connection guard
          }
        );

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Bedrock] Response received in ${elapsed}s`);

        const content = response.data?.output?.message?.content?.[0]?.text || '';
        const tokensUsed = response.data?.usage?.totalTokens || 0;

        return {
          content,
          provider: 'bedrock',
          model: this.modelId,
          tokensUsed
        };

      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        const errorType = error.response?.headers?.['x-amzn-errortype'] || '';
        const errorMessage = error.response?.data?.message || error.message;

        console.error(`[Bedrock] API Call failed (Attempt ${attempt + 1}/${MAX_RETRIES + 1}). Status: ${status}, Error Type: ${errorType}, Message: ${errorMessage}`);

        // Provide descriptive production diagnostics for common Bedrock exceptions
        if (errorType.includes('AccessDeniedException')) {
          throw new Error(
            `[Bedrock] Access Denied: Verify that Model Access for "${this.modelId}" is active and granted in the Amazon Bedrock console for the "${this.region}" region.`
          );
        }

        if (errorType.includes('ValidationException')) {
          throw new Error(
            `[Bedrock] Validation Error: The model ID "${this.modelId}" is invalid or is not supported/enabled in the "${this.region}" region.`
          );
        }

        // Retry only on rate limits (429), throttling header, or transient AWS server errors (5xx)
        const isRetryable =
          status === 429 ||
          errorType.includes('ThrottlingException') ||
          status >= 500 ||
          error.code === 'ECONNABORTED'; // Axios request timeouts

        if (!isRetryable || attempt === MAX_RETRIES) {
          break;
        }
      }
    }

    throw new Error(
      `[Bedrock] Request failed after ${MAX_RETRIES + 1} attempts. Last Error: ${
        lastError.response?.data?.message || lastError.message
      }`
    );
  }
}

export const bedrockService = new BedrockService();
