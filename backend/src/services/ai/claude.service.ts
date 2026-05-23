import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';
import type { AICallOptions, AIResponse } from '../../types';

/**
 * Claude AI Service — production option A.
 * Uses Anthropic's Claude API for high-quality structured output.
 */
export class ClaudeService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.ai.claude.apiKey,
    });
  }

  async call(
    prompt: string,
    systemPrompt: string,
    options: AICallOptions = {}
  ): Promise<AIResponse> {
    const { maxTokens = 4096, temperature = 0.3 } = options;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      const content = textBlock ? textBlock.text : '';

      return {
        content,
        provider: 'claude',
        model: 'claude-sonnet-4-20250514',
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      };
    } catch (error: any) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }
}

export const claudeService = new ClaudeService();
