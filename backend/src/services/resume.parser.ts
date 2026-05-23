import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Resume Parser Service
 * Extracts raw text from PDF and DOCX files.
 */
export class ResumeParser {
  /**
   * Parse a file buffer to extract text content.
   */
  async parse(buffer: Buffer, mimetype: string): Promise<string> {
    if (mimetype === 'application/pdf') {
      return this.parsePDF(buffer);
    }

    if (
      mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return this.parseDOCX(buffer);
    }

    throw new Error(`Unsupported file type: ${mimetype}`);
  }

  /**
   * Extract text from a PDF buffer using pdf-parse.
   */
  private async parsePDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      const text = data.text.trim();

      if (!text || text.length < 50) {
        throw new Error(
          'Could not extract meaningful text from PDF. The file may be image-based. Please use a text-based PDF.'
        );
      }

      return this.cleanText(text);
    } catch (error: any) {
      if (error.message.includes('meaningful text')) {
        throw error;
      }
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from a DOCX buffer using mammoth.
   */
  private async parseDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();

      if (!text || text.length < 50) {
        throw new Error(
          'Could not extract meaningful text from DOCX. The file may be empty or corrupted.'
        );
      }

      return this.cleanText(text);
    } catch (error: any) {
      if (error.message.includes('meaningful text')) {
        throw error;
      }
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }

  /**
   * Clean extracted text — normalize whitespace, remove control characters.
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\t/g, ' ')               // Replace tabs
      .replace(/ {3,}/g, '  ')           // Collapse excessive spaces
      .replace(/\n{4,}/g, '\n\n\n')      // Collapse excessive newlines
      .replace(/[^\S\n]+$/gm, '')        // Trim trailing whitespace per line
      .trim();
  }
}

export const resumeParser = new ResumeParser();
