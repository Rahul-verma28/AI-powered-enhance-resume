import type { ATSBreakdown, ATSResult, TailoredResumeData } from '../types';

/**
 * ATS Scoring Engine
 * Calculates a weighted ATS compatibility score.
 *
 * Weights:
 *  - Keyword Match:       40%
 *  - Section Completeness: 20%
 *  - Bullet Quality:       20%
 *  - Formatting:           10%
 *  - Length:               10%
 */

const ACTION_VERBS = new Set([
  'led', 'managed', 'developed', 'created', 'designed', 'implemented',
  'built', 'launched', 'delivered', 'architected', 'optimized', 'improved',
  'increased', 'reduced', 'streamlined', 'automated', 'established',
  'spearheaded', 'orchestrated', 'executed', 'transformed', 'engineered',
  'drove', 'accelerated', 'scaled', 'mentored', 'collaborated',
  'analyzed', 'negotiated', 'resolved', 'consolidated', 'pioneered',
  'revamped', 'deployed', 'integrated', 'configured', 'maintained',
  'coordinated', 'facilitated', 'presented', 'trained', 'supervised',
]);

export class ATSScorer {
  /**
   * Calculate the full ATS score for a tailored resume against JD keywords.
   */
  score(
    tailoredData: TailoredResumeData,
    jdKeywords: string[]
  ): ATSResult {
    const keywordResult = this.calculateKeywordScore(tailoredData, jdKeywords);
    const sectionScore = this.calculateSectionScore(tailoredData);
    const bulletQuality = this.calculateBulletQuality(tailoredData);
    const formattingScore = this.calculateFormattingScore(tailoredData);
    const lengthScore = this.calculateLengthScore(tailoredData);

    const breakdown: ATSBreakdown = {
      keywordScore: keywordResult.score,
      sectionScore,
      bulletQuality,
      formattingScore,
      lengthScore,
    };

    // Weighted total
    const total = Math.round(
      breakdown.keywordScore * 0.4 +
      breakdown.sectionScore * 0.2 +
      breakdown.bulletQuality * 0.2 +
      breakdown.formattingScore * 0.1 +
      breakdown.lengthScore * 0.1
    );

    return {
      total,
      breakdown,
      matchedKeywords: keywordResult.matched,
      missingKeywords: keywordResult.missing,
    };
  }

  /**
   * Keyword match score (40% weight).
   * Checks how many JD keywords appear in the resume.
   */
  private calculateKeywordScore(
    data: TailoredResumeData,
    jdKeywords: string[]
  ): { score: number; matched: string[]; missing: string[] } {
    if (!jdKeywords.length) {
      return { score: 100, matched: [], missing: [] };
    }

    // Build a searchable text from all resume sections
    const resumeText = this.buildSearchText(data).toLowerCase();

    const matched: string[] = [];
    const missing: string[] = [];

    for (const keyword of jdKeywords) {
      const kw = keyword.toLowerCase().trim();
      if (kw && resumeText.includes(kw)) {
        matched.push(keyword);
      } else if (kw) {
        missing.push(keyword);
      }
    }

    const score = Math.round((matched.length / jdKeywords.length) * 100);
    return { score, matched, missing };
  }

  /**
   * Section completeness score (20% weight).
   * Checks for presence of critical sections.
   */
  private calculateSectionScore(data: TailoredResumeData): number {
    let score = 0;
    const maxScore = 100;
    const sectionWeights = {
      contact: 20,
      summary: 20,
      experience: 25,
      skills: 20,
      education: 15,
    };

    // Contact
    if (data.contact?.name && data.contact?.email) {
      score += sectionWeights.contact;
    }

    // Summary
    if (data.summary && data.summary.length > 30) {
      score += sectionWeights.summary;
    }

    // Experience
    if (data.experience?.length > 0) {
      score += sectionWeights.experience;
    }

    // Skills
    if (
      data.skills?.technical?.length > 0 ||
      data.skills?.tools?.length > 0
    ) {
      score += sectionWeights.skills;
    }

    // Education
    if (data.education?.length > 0) {
      score += sectionWeights.education;
    }

    return Math.min(score, maxScore);
  }

  /**
   * Bullet quality score (20% weight).
   * Checks for action verbs and quantification.
   */
  private calculateBulletQuality(data: TailoredResumeData): number {
    const allBullets: string[] = [];
    for (const exp of data.experience || []) {
      allBullets.push(...(exp.bullets || []));
    }

    if (allBullets.length === 0) return 0;

    let actionVerbCount = 0;
    let quantifiedCount = 0;

    for (const bullet of allBullets) {
      const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
      if (firstWord && ACTION_VERBS.has(firstWord)) {
        actionVerbCount++;
      }

      // Check for numbers, percentages, or dollar amounts
      if (/\d+%|\$[\d,]+|\d+\+?\s*(years?|months?|users?|clients?|members?|projects?)/i.test(bullet)) {
        quantifiedCount++;
      }
    }

    const actionScore = (actionVerbCount / allBullets.length) * 50;
    const quantScore = (quantifiedCount / allBullets.length) * 50;

    return Math.min(Math.round(actionScore + quantScore), 100);
  }

  /**
   * Formatting compliance score (10% weight).
   */
  private calculateFormattingScore(data: TailoredResumeData): number {
    let score = 100;

    // Check summary length (should be 2-4 sentences)
    if (data.summary) {
      const sentences = data.summary.split(/[.!?]+/).filter(Boolean);
      if (sentences.length > 5) score -= 15;
      if (sentences.length < 2) score -= 10;
    }

    // Check for standard section names (no creative naming)
    if (!data.experience || data.experience.length === 0) score -= 20;
    if (!data.skills) score -= 15;

    return Math.max(score, 0);
  }

  /**
   * Length optimization score (10% weight).
   * Estimates page count from content volume.
   */
  private calculateLengthScore(data: TailoredResumeData): number {
    const totalBullets = (data.experience || []).reduce(
      (acc, exp) => acc + (exp.bullets?.length || 0),
      0
    );
    const totalExperience = data.experience?.length || 0;

    // Rough estimation: 1 page ≈ 6-8 bullets + summary + skills + education
    const estimatedLength = totalBullets + totalExperience * 2;

    // Ideal: 15-25 items for 1-2 pages
    if (estimatedLength >= 12 && estimatedLength <= 30) return 100;
    if (estimatedLength >= 8 && estimatedLength <= 35) return 80;
    if (estimatedLength < 8) return 50; // Too short
    return 60; // Too long
  }

  /**
   * Build a single searchable string from all resume sections.
   */
  private buildSearchText(data: TailoredResumeData): string {
    const parts: string[] = [];

    if (data.summary) parts.push(data.summary);

    for (const exp of data.experience || []) {
      parts.push(exp.title || '');
      parts.push(exp.company || '');
      parts.push(...(exp.bullets || []));
    }

    if (data.skills) {
      parts.push(...(data.skills.technical || []));
      parts.push(...(data.skills.tools || []));
      parts.push(...(data.skills.soft || []));
    }

    for (const edu of data.education || []) {
      parts.push(edu.degree || '');
      parts.push(edu.school || '');
    }

    parts.push(...(data.certifications || []));

    for (const proj of data.projects || []) {
      parts.push(proj.name || '');
      parts.push(proj.description || '');
      parts.push(...(proj.tech || []));
    }

    return parts.join(' ');
  }
}

export const atsScorer = new ATSScorer();
