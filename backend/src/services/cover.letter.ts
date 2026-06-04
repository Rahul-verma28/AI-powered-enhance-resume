import { callAI } from './ai/ai.provider';
import {
  COVER_LETTER_SYSTEM_PROMPT,
  buildCoverLetterPrompt,
} from '../prompts';
import type { CoverLetterTone, CoverLetterResult } from '../types';

/**
 * Clean up metadata headers (like Application for... or For:...) that the model
 * might generate at the beginning of the cover letter.
 */
function cleanCoverLetterContent(content: string): string {
  const lines = content.split('\n');
  let startIndex = 0;
  
  while (startIndex < lines.length) {
    const line = lines[startIndex].trim().toLowerCase();
    if (
      line === '' ||
      line.startsWith('application for') ||
      line.startsWith('for:') ||
      line.startsWith('subject:') ||
      line.startsWith('to:') ||
      line.startsWith('date:') ||
      line.startsWith('re:')
    ) {
      startIndex++;
    } else {
      break;
    }
  }
  
  return lines.slice(startIndex).join('\n').trim();
}

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

    const rawContent = response.content.trim();
    const content = cleanCoverLetterContent(rawContent);
    const subject = `Application for ${jobTitle}${company ? ` at ${company}` : ''}`;

    return {
      content,
      subject,
      tone,
    };
  }
}

export const coverLetterGenerator = new CoverLetterGenerator();
