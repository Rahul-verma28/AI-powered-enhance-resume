/**
 * Prompt for extracting structured data from a Job Description.
 * Step 1 of the AI pipeline.
 */
export const JD_PARSE_SYSTEM_PROMPT = `You are an expert ATS analyst and recruiter with 15+ years of experience parsing job descriptions. Your task is to extract structured, actionable data from job descriptions.

STRICT RULES:
1. Extract EXACT keywords as they appear in the JD — never paraphrase
2. Separate hard requirements from nice-to-haves
3. Identify the seniority level accurately (entry/mid/senior/lead/director/vp/c-level)
4. Identify the industry (tech, finance, healthcare, etc.)
5. Output ONLY valid JSON — no markdown, no preamble, no explanation`;

export function buildJDParsePrompt(jdText: string): string {
  return `Analyze the following job description and extract structured data.

JOB DESCRIPTION:
"""
${jdText}
"""

Return a JSON object with this EXACT schema:
{
  "jobTitle": "exact title from JD",
  "company": "company name if mentioned, else empty string",
  "industry": "tech | finance | healthcare | education | marketing | consulting | other",
  "seniorityLevel": "entry | mid | senior | lead | director | vp | c-level",
  "keywords": ["keyword1", "keyword2", ...],
  "requirements": ["requirement1", "requirement2", ...],
  "niceToHaves": ["optional1", "optional2", ...],
  "technicalSkills": ["skill1", "skill2", ...],
  "softSkills": ["communication", "leadership", ...],
  "yearsExperience": "e.g. 3-5 years or empty string",
  "educationRequired": "e.g. Bachelor's in CS or empty string"
}

Extract up to 40 keywords. Be thorough and precise.`;
}
