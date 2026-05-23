/**
 * ATS scoring prompt — for AI-assisted scoring when needed.
 */
export const ATS_SCORE_SYSTEM_PROMPT = `You are an ATS scoring engine. You analyze resumes against job descriptions and provide detailed, accurate scoring breakdowns. Be precise and fair — don't inflate or deflate scores.

Output ONLY valid JSON matching the required schema. No markdown, no explanation.`;

export function buildATSScorePrompt(
  resumeText: string,
  jdKeywords: string[]
): string {
  return `Score the following resume against these job description keywords.

RESUME:
"""
${resumeText}
"""

JD KEYWORDS:
${jdKeywords.join(', ')}

Analyze and return a JSON object:
{
  "totalScore": 85,
  "breakdown": {
    "keywordMatch": {
      "score": 82,
      "matched": ["keyword1", "keyword2"],
      "missing": ["keyword3", "keyword4"],
      "total": 40
    },
    "sectionCompleteness": {
      "score": 90,
      "present": ["contact", "summary", "experience", "skills"],
      "missing": ["certifications"]
    },
    "bulletQuality": {
      "score": 78,
      "totalBullets": 15,
      "withActionVerb": 12,
      "withQuantification": 8
    },
    "formatting": {
      "score": 95,
      "issues": []
    },
    "length": {
      "score": 90,
      "estimatedPages": 1.5,
      "recommendation": "Good length for experience level"
    }
  }
}`;
}
