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
   * Generate a PDF from tailored resume data using a specific template.
   */
  async generate(
    data: TailoredResumeData,
    templateId: TemplateId = 'modern'
  ): Promise<Buffer> {
    const html = this.renderTemplate(data, templateId);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

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

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

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
