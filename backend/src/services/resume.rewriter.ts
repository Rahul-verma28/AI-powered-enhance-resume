import { callAIJSON } from './ai/ai.provider';
import { atsScorer } from './ats.scorer';
import {
  JD_PARSE_SYSTEM_PROMPT,
  buildJDParsePrompt,
  REWRITE_SYSTEM_PROMPT,
  buildRewritePrompt,
} from '../prompts';
import type {
  JDAnalysis,
  GapAnalysis,
  RewriteResult,
  TailoredResumeData,
} from '../types';

/**
 * Resume Rewriter Service — the core 4-step AI pipeline.
 *
 * Step 1: Extract JD keywords
 * Step 2: Parse resume structure (handled by AI)
 * Step 3: Gap analysis (compare JD vs resume)
 * Step 4: Full ATS rewrite
 */
export class ResumeRewriter {
  /**
   * Main entry point — runs the full tailoring pipeline.
   */
  async tailorResume(
    resumeText: string,
    jdText: string
  ): Promise<RewriteResult> {
    // Step 1: Extract structured data from JD
    console.log('🔍 Step 1: Extracting JD keywords...');
    const jdAnalysis = await this.extractJDKeywords(jdText);

    // Step 2 + 3: Gap analysis (AI compares resume to JD)
    console.log('📊 Step 2-3: Analyzing gaps...');
    const gapAnalysis = this.analyzeGaps(resumeText, jdAnalysis);

    // Step 4: Full rewrite
    console.log('✍️  Step 4: Rewriting resume...');
    const rewriteResponse = await this.rewriteResume(
      resumeText,
      jdText,
      jdAnalysis.keywords,
      gapAnalysis.missingKeywords
    );

    // Calculate ATS score on the rewritten result
    console.log('📈 Calculating ATS score...');
    const atsResult = atsScorer.score(
      rewriteResponse.tailoredData,
      jdAnalysis.keywords
    );

    return {
      tailoredData: rewriteResponse.tailoredData,
      atsScore: atsResult.total,
      atsBreakdown: atsResult.breakdown,
      matchedKeywords: atsResult.matchedKeywords,
      missingKeywords: atsResult.missingKeywords,
      improvements: rewriteResponse.improvements,
      warningFlags: rewriteResponse.warningFlags,
    };
  }

  /**
   * Step 1: Extract structured keywords and requirements from JD.
   */
  private async extractJDKeywords(jdText: string): Promise<JDAnalysis> {
    const prompt = buildJDParsePrompt(jdText);
    const result = await callAIJSON<any>(prompt, JD_PARSE_SYSTEM_PROMPT);

    return {
      keywords: result.keywords || [],
      requirements: result.requirements || [],
      industry: result.industry || 'other',
      seniorityLevel: result.seniorityLevel || 'mid',
      jobTitle: result.jobTitle || '',
      company: result.company || '',
    };
  }

  /**
   * Step 2-3: Quick gap analysis by comparing resume text against JD keywords.
   */
  private analyzeGaps(
    resumeText: string,
    jdAnalysis: JDAnalysis
  ): GapAnalysis {
    const resumeLower = resumeText.toLowerCase();

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const keyword of jdAnalysis.keywords) {
      if (resumeLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    }

    const requiredSections = ['experience', 'education', 'skills', 'summary'];
    const missingSections = requiredSections.filter(
      (section) => !resumeLower.includes(section)
    );

    const suggestions: string[] = [];
    if (missingKeywords.length > 0) {
      suggestions.push(
        `Add these missing keywords where applicable: ${missingKeywords.slice(0, 5).join(', ')}`
      );
    }
    if (missingSections.length > 0) {
      suggestions.push(`Add missing sections: ${missingSections.join(', ')}`);
    }

    return {
      matchedKeywords,
      missingKeywords,
      missingSkills: missingKeywords, // In simple analysis, missing skills ≈ missing keywords
      missingSections,
      suggestions,
    };
  }

  /**
   * Step 4: Full AI-powered resume rewrite.
   */
  private async rewriteResume(
    resumeText: string,
    jdText: string,
    jdKeywords: string[],
    missingKeywords: string[]
  ): Promise<{
    tailoredData: TailoredResumeData;
    improvements: string[];
    warningFlags: string[];
  }> {
    const prompt = buildRewritePrompt(resumeText, jdText, jdKeywords, missingKeywords);

    const result = await callAIJSON<any>(prompt, REWRITE_SYSTEM_PROMPT, {
      maxTokens: 8192,
      temperature: 0.3,
    });

    // Validate and structure the response
    const tailoredData: TailoredResumeData = {
      contact: {
        name: result.contact?.name || '',
        email: result.contact?.email || '',
        phone: result.contact?.phone || '',
        linkedin: result.contact?.linkedin || '',
        github: result.contact?.github || '',
        location: result.contact?.location || '',
      },
      summary: result.summary || '',
      experience: (result.experience || []).map((exp: any) => ({
        company: exp.company || '',
        title: exp.title || '',
        dates: exp.dates || '',
        location: exp.location || '',
        bullets: exp.bullets || [],
      })),
      skills: {
        technical: result.skills?.technical || [],
        tools: result.skills?.tools || [],
        soft: result.skills?.soft || [],
      },
      education: (result.education || []).map((edu: any) => ({
        degree: edu.degree || '',
        school: edu.school || '',
        year: edu.year || '',
        gpa: edu.gpa || '',
      })),
      certifications: result.certifications || [],
      projects: (result.projects || []).map((proj: any) => ({
        name: proj.name || '',
        description: proj.description || '',
        tech: proj.tech || [],
        link: proj.link || '',
      })),
    };

    return {
      tailoredData,
      improvements: result.improvements || [],
      warningFlags: result.warningFlags || [],
    };
  }
}

export const resumeRewriter = new ResumeRewriter();
