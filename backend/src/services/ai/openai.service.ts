import OpenAI from 'openai';
import { config } from '../../config';
import type { AICallOptions, AIResponse } from '../../types';

/**
 * OpenAI GPT Service — production option B.
 */
export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });
  }

  async call(
    prompt: string,
    systemPrompt: string,
    options: AICallOptions = {}
  ): Promise<AIResponse> {
    const { maxTokens = 4096, temperature = 0.3, jsonMode = false } = options;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: maxTokens,
        temperature,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        content,
        provider: 'openai',
        model: 'gpt-4o',
        tokensUsed: response.usage?.total_tokens,
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

export const openaiService = new OpenAIService();
