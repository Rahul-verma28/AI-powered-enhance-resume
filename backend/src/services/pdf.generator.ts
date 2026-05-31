import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import type { TailoredResumeData, TemplateId } from '../types';

/**
 * PDF Generator Service.
 * Renders HTML/CSS resume templates to PDF using Puppeteer.
 */
export class PDFGenerator {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.resolve(__dirname, '../../templates');
  }

  /**
   * Robust browser launcher that falls back to local Google Chrome or Microsoft Edge
   * on Windows when standard Puppeteer launch fails.
   */
  private async launchBrowser(): Promise<any> {
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    };

    try {
      return await puppeteer.launch(launchOptions);
    } catch (e: any) {
      console.warn("Standard puppeteer launch failed. Trying Windows local Chrome/Edge path fallback...", e.message);
      
      const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe') : '',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      ].filter(Boolean);

      for (const exePath of paths) {
        if (fs.existsSync(exePath)) {
          try {
            console.log(`Found local browser fallback: ${exePath}`);
            return await puppeteer.launch({
              ...launchOptions,
              executablePath: exePath,
            });
          } catch (err: any) {
            console.error(`Local browser launch failed for path ${exePath}:`, err.message);
          }
        }
      }
      throw e;
    }
  }


  /**
   * Generate a PDF from tailored resume data using a specific template.
   */
  async generate(
    data: TailoredResumeData,
    templateId: TemplateId = 'modern'
  ): Promise<Buffer> {
    const html = this.renderTemplate(data, templateId);

    const browser = await this.launchBrowser();

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate a beautiful Vercel-style ATS Report PDF.
   */
  async generateATSReportPDF(
    title: string,
    atsScore: number,
    breakdown: any,
    matchedKeywords: string[],
    missingKeywords: string[],
    improvements: string[],
    warningFlags: string[]
  ): Promise<Buffer> {
    const matchedBadges = matchedKeywords.map(kw => `<span class="badge matched">${kw}</span>`).join(' ') || '<p class="empty">None</p>';
    const missingBadges = missingKeywords.map(kw => `<span class="badge missing">${kw}</span>`).join(' ') || '<p class="empty">None</p>';
    const improvementList = improvements.map(imp => `<li>${imp}</li>`).join('') || '<li>No optimizations recorded yet.</li>';
    const warningList = warningFlags.map(wf => `<li class="warning-item">${wf}</li>`).join('') || '<li>No issues detected.</li>';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #111827; padding: 48px 56px; background-color: #fafafa; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 32px; }
    .title-area h1 { font-size: 20pt; font-weight: 800; color: #000; letter-spacing: -0.025em; }
    .title-area p { font-size: 9pt; color: #6b7280; margin-top: 4px; }
    .score-badge { font-size: 28pt; font-weight: 900; background: linear-gradient(135deg, #2563eb, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .section-title { font-size: 12pt; font-weight: 700; color: #111827; margin-bottom: 16px; letter-spacing: -0.01em; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; }
    .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .card { background-color: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    .breakdown-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 9.5pt; }
    .breakdown-row:last-child { margin-bottom: 0; }
    .progress-bar-bg { width: 100px; height: 6px; background-color: #f3f4f6; border-radius: 3px; overflow: hidden; margin-left: 12px; }
    .progress-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #3b82f6, #6366f1); }
    .badge { display: inline-block; font-size: 8pt; font-weight: 600; padding: 4px 8px; border-radius: 6px; margin: 0 4px 6px 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge.matched { background-color: #ecfdf5; color: #047857; border: 1px solid #d1fae5; }
    .badge.missing { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
    .empty { font-size: 9pt; color: #9ca3af; font-style: italic; }
    ul { list-style-type: none; }
    li { position: relative; padding-left: 18px; margin-bottom: 8px; font-size: 9.5pt; color: #4b5563; }
    li::before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
    li.warning-item::before { content: "⚠"; color: #f59e0b; }
    .full-width { grid-column: span 2; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-area">
      <h1>ATS Optimization Report</h1>
      <p>Target Profile: ${title} · Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="score-badge">${atsScore}% Match</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="section-title">ATS Breakdown</div>
      <div class="breakdown-row">
        <span>Keyword Match</span>
        <div style="display: flex; align-items: center;">
          <span>${breakdown?.keywordScore || 0}%</span>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${breakdown?.keywordScore || 0}%"></div></div>
        </div>
      </div>
      <div class="breakdown-row">
        <span>Section Completeness</span>
        <div style="display: flex; align-items: center;">
          <span>${breakdown?.sectionScore || 0}%</span>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${breakdown?.sectionScore || 0}%"></div></div>
        </div>
      </div>
      <div class="breakdown-row">
        <span>Bullet Quality</span>
        <div style="display: flex; align-items: center;">
          <span>${breakdown?.bulletQuality || 0}%</span>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${breakdown?.bulletQuality || 0}%"></div></div>
        </div>
      </div>
      <div class="breakdown-row">
        <span>Formatting Compliance</span>
        <div style="display: flex; align-items: center;">
          <span>${breakdown?.formattingScore || 0}%</span>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${breakdown?.formattingScore || 0}%"></div></div>
        </div>
      </div>
      <div class="breakdown-row">
        <span>Length Optimization</span>
        <div style="display: flex; align-items: center;">
          <span>${breakdown?.lengthScore || 0}%</span>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${breakdown?.lengthScore || 0}%"></div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Warning Flags & Diagnostics</div>
      <ul>
        ${warningList}
      </ul>
    </div>

    <div class="card full-width">
      <div class="section-title">Keywords Analysis</div>
      <div style="margin-bottom: 16px;">
        <div style="font-size: 9pt; font-weight: 700; color: #047857; margin-bottom: 6px;">Matched Keywords (${matchedKeywords.length})</div>
        <div style="display: flex; flex-wrap: wrap;">${matchedBadges}</div>
      </div>
      <div>
        <div style="font-size: 9pt; font-weight: 700; color: #b91c1c; margin-bottom: 6px;">Missing Keywords (${missingKeywords.length})</div>
        <div style="display: flex; flex-wrap: wrap;">${missingBadges}</div>
      </div>
    </div>

    <div class="card full-width">
      <div class="section-title">Optimizations Made</div>
      <ul>
        ${improvementList}
      </ul>
    </div>
  </div>
</body>
</html>`;

    const browser = await this.launchBrowser();

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0.4in', right: '0.5in', bottom: '0.4in', left: '0.5in' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate a PDF from plain cover letter text content.
   */
  async generateCoverLetterPDF(
    content: string,
    subject: string,
    company: string,
    jobTitle: string
  ): Promise<Buffer> {
    const safeContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
    const safeSubject = subject || (jobTitle ? `Application for ${jobTitle}` : 'Cover Letter');
    const safeMeta = company ? `For: ${company}${jobTitle ? ` — ${jobTitle}` : ''}` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, 'Helvetica Neue', sans-serif; font-size: 11pt; line-height: 1.7; color: #1a1a1a; padding: 48px 56px; }
    .header { margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
    .subject { font-size: 14pt; font-weight: 600; color: #1e3a8a; margin-bottom: 6px; }
    .meta { font-size: 10pt; color: #6b7280; }
    .body { font-size: 11pt; color: #374151; }
  </style>
</head>
<body>
  <div class="header">
    <div class="subject">${safeSubject}</div>
    ${safeMeta ? `<div class="meta">${safeMeta}</div>` : ''}
  </div>
  <div class="body">${safeContent}</div>
</body>
</html>`;

    const browser = await this.launchBrowser();

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0.5in', right: '0.6in', bottom: '0.5in', left: '0.6in' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Render an HTML template with resume data using Handlebars.
   */
  private renderTemplate(data: TailoredResumeData, templateId: TemplateId): string {
    const templatePath = path.join(this.templatesDir, `${templateId}.html`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    // Register helpers
    Handlebars.registerHelper('join', (arr: string[], separator: string) => {
      return arr.join(typeof separator === 'string' ? separator : ', ');
    });

    Handlebars.registerHelper('hasItems', (arr: unknown[]) => {
      return arr && arr.length > 0;
    });

    return template({
      ...data,
      hasProjects: data.projects && data.projects.length > 0,
      hasCertifications: data.certifications && data.certifications.length > 0,
    });
  }
}

export const pdfGenerator = new PDFGenerator();
