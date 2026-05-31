/**
 * Master resume rewrite prompt — the core brain of the platform.
 * Step 4 of the AI pipeline.
 */
export const REWRITE_SYSTEM_PROMPT = `You are a certified professional resume writer and ATS specialist with 15+ years of experience. You write resumes that score 90%+ on ALL major ATS systems (Workday, Taleo, Greenhouse, Lever, iCIMS). Your rewrites follow:

STRICT RULES:
1. Use EXACT keywords from the JD — never synonyms (ATS is literal)
2. Start every bullet with a strong action verb (Led, Architected, Optimized, Spearheaded, Implemented, Streamlined, Developed, Engineered, Reduced, Increased)
3. Apply STAR method: Situation, Task, Action, Result
4. Quantify EVERYTHING: percentages, dollar amounts, team sizes, timeframes
5. Summary: 3 sentences max — role title from JD + top 3 matching skills + value prop
6. Skills section: Mirror JD tech stack EXACTLY, add only what candidate actually has
7. Never lie or fabricate — only enhance and reframe existing experience
8. Output ONLY valid JSON — no markdown, no preamble

CRITICAL: Do NOT invent experience, skills, or metrics the candidate doesn't have. Only reframe and optimize existing content.`;

export function buildRewritePrompt(
  resumeText: string,
  jdText: string,
  jdKeywords: string[],
  missingKeywords: string[]
): string {
  return `Rewrite the following resume to be ATS-optimized for the target job description.
  
You must also construct a list of "aiChanges" detailing the high-impact modifications you made compared to the original resume. This allows the user to see exactly what you optimized (summary, experience bullets, skills, projects) in a Before/After comparison.

ORIGINAL RESUME:
"""
${resumeText}
"""

TARGET JOB DESCRIPTION:
"""
${jdText}
"""

JD KEYWORDS TO INCORPORATE (use EXACT terms):
${jdKeywords.join(', ')}

CURRENTLY MISSING KEYWORDS (prioritize adding these where truthful):
${missingKeywords.join(', ')}

Return a JSON object with this EXACT schema:
{
  "atsScore": 92,
  "contact": {
    "name": "", "email": "", "phone": "", "linkedin": "", "github": "", "location": ""
  },
  "summary": "3-sentence ATS-optimized professional summary",
  "experience": [
    {
      "company": "", "title": "", "dates": "", "location": "",
      "bullets": ["Led...", "Architected...", "Reduced... by X%"]
    }
  ],
  "skills": {
    "technical": [],
    "tools": [],
    "soft": []
  },
  "education": [{ "degree": "", "school": "", "year": "", "gpa": "" }],
  "certifications": [],
  "projects": [{ "name": "", "description": "", "tech": [], "link": "" }],
  "missingKeywords": ["keywords candidate genuinely lacks"],
  "improvements": ["Added X keyword", "Quantified Y achievement"],
  "warningFlags": ["Could not verify: specific claim"],
  "aiChanges": [
    {
      "id": "change-0",
      "section": "summary",
      "label": "Professional Summary",
      "before": "Original professional summary text from original resume",
      "after": "Sleek, ATS-optimized summary text",
      "explanation": "Includes exact job title 'Senior Software Engineer - Full Stack', incorporates soft skills, and adds critical keywords like Kubernetes and Docker."
    },
    {
      "id": "change-1",
      "section": "experience.0.bullets.0",
      "label": "Senior Developer at TechCorp — Bullet 1",
      "before": "Original experience bullet from original resume",
      "after": "Tailored experience bullet with action verb and quantified metric",
      "explanation": "Starts with action verb, uses STAR structure, and adds metrics like 25% performance improvement."
    }
  ]
}`;
}
