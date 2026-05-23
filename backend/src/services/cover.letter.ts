import { callAI } from './ai/ai.provider';
import {
  COVER_LETTER_SYSTEM_PROMPT,
  buildCoverLetterPrompt,
} from '../prompts';
import type { CoverLetterTone, CoverLetterResult } from '../types';

/**
 * Cover Letter Generation Service.
 */
export class CoverLetterGenerator {
  async generate(
    resumeDataText: string,
    jdText: string,
    company: string,
    jobTitle: string,
    tone: CoverLetterTone = 'professional'
  ): Promise<CoverLetterResult> {
    const prompt = buildCoverLetterPrompt(
      resumeDataText,
      jdText,
      company,
      jobTitle,
      tone
    );

    const response = await callAI(prompt, COVER_LETTER_SYSTEM_PROMPT, {
      maxTokens: 2048,
      temperature: 0.5,
    });

    const content = response.content.trim();
    const subject = `Application for ${jobTitle}${company ? ` at ${company}` : ''}`;

    return {
      content,
      subject,
      tone,
    };
  }
}

export const coverLetterGenerator = new CoverLetterGenerator();
