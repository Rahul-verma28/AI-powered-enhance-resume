/**
 * Cover letter generation prompt.
 */
export const COVER_LETTER_SYSTEM_PROMPT = `You are a professional cover letter writer who creates compelling, personalized cover letters that complement ATS-optimized resumes. Your letters are concise, specific, and demonstrate clear value alignment with the target role.

RULES:
1. Keep it strictly under 300 words, maximum 3 paragraphs
2. Reference specific JD requirements and how the candidate meets them
3. Use a natural, confident tone — not generic or robotic
4. Include specific achievements from the resume that align with JD needs
5. End with a clear call to action
6. Never fabricate — only use information from the provided resume data
7. Output ONLY the cover letter text — no JSON, no markdown headers`;

export type CoverLetterToneParam = 'professional' | 'confident' | 'concise' | 'friendly';

export function buildCoverLetterPrompt(
  resumeData: string,
  jdText: string,
  company: string,
  jobTitle: string,
  tone: CoverLetterToneParam
): string {
  const toneInstructions: Record<CoverLetterToneParam, string> = {
    professional: 'Use a formal, polished tone. Focus on qualifications and measurable impact.',
    confident: 'Be assertive and self-assured. Highlight strengths and value proposition directly.',
    concise: 'Be direct and brief. Every sentence must add value. Maximum 250 words.',
    friendly: 'Use a warm, approachable tone. Show personality while staying professional.',
  };

  return `Write a cover letter for the following position.

CANDIDATE'S RESUME DATA:
"""
${resumeData}
"""

JOB DESCRIPTION:
"""
${jdText}
"""

COMPANY: ${company || 'the company'}
JOB TITLE: ${jobTitle || 'the position'}
TONE: ${tone} — ${toneInstructions[tone] || toneInstructions.professional}

Write the cover letter now. Start with "Dear Hiring Manager," and end with a professional closing.`;
}
