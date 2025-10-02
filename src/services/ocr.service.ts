import Tesseract from "tesseract.js";
import { ocrSpace } from 'ocr-space-api-wrapper';
import OpenAI from 'openai';
import fs from 'fs-extra';
import path from 'path';

export interface OCRResult {
  rawText: string;
  processedText?: string;
  confidence?: number;
  extractedData?: any;
  processingTime: number;
}

export interface ExtractedReceiptData {
  vendorName?: string;
  invoiceNumber?: string;
  date?: string;
  totalAmount?: number;
  items?: Array<{
    name: string;
    quantity?: number;
    price?: number;
  }>;
  taxAmount?: number;
  subtotal?: number;
  currency?: string;
}

export class OCRService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Extract text from image using Tesseract.js
   */
  async extractTextWithTesseract(filePath: string): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      const result = await Tesseract.recognize(filePath, "eng+vie", {
        logger: (info) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Tesseract: ${info.status} - ${info.progress * 100}%`);
          }
        },
      });

      const processingTime = Date.now() - startTime;

      return {
        rawText: result.data.text,
        confidence: result.data.confidence,
        processingTime
      };
    } catch (error) {
      console.error('Tesseract OCR failed:', error);
      throw new Error(`Tesseract OCR failed: ${error.message}`);
    }
  }

  /**
   * Extract text from image using OCR Space API
   */
  async extractTextWithOCRSpace(filePath: string): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      if (!process.env.OCR_SPACE_API_KEY) {
        throw new Error('OCR_SPACE_API_KEY is not configured');
      }

      const result = await ocrSpace(filePath, {
        apiKey: process.env.OCR_SPACE_API_KEY,
        language: 'eng',
        isOverlayRequired: false,
      });

      const processingTime = Date.now() - startTime;

      if (!result.ParsedResults || result.ParsedResults.length === 0) {
        throw new Error('No text found in image');
      }

      return {
        rawText: result.ParsedResults[0].ParsedText,
        processingTime
      };
    } catch (error) {
      console.error('OCR Space failed:', error);
      throw new Error(`OCR Space failed: ${error.message}`);
    }
  }

  /**
   * Extract text using both methods and return the best result
   */
  async extractText(filePath: string, preferredMethod: 'tesseract' | 'ocrspace' | 'both' = 'both'): Promise<OCRResult> {
    try {
      // Validate file exists
      if (!await fs.pathExists(filePath)) {
        throw new Error('File not found');
      }

      // Check file size (max 10MB)
      const stats = await fs.stat(filePath);
      if (stats.size > 10 * 1024 * 1024) {
        throw new Error('File too large (max 10MB)');
      }

      switch (preferredMethod) {
        case 'tesseract':
          return await this.extractTextWithTesseract(filePath);

        case 'ocrspace':
          return await this.extractTextWithOCRSpace(filePath);

        case 'both':
        default:
          // Try OCR Space first (usually faster), fallback to Tesseract
          try {
            return await this.extractTextWithOCRSpace(filePath);
          } catch (ocrSpaceError) {
            console.warn('OCR Space failed, trying Tesseract:', ocrSpaceError.message);
            return await this.extractTextWithTesseract(filePath);
          }
      }
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw error;
    }
  }

  /**
   * Clean and process raw OCR text
   */
  cleanText(rawText: string): string {
    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract structured data from OCR text using OpenAI
   */
  async extractStructuredData(ocrText: string): Promise<ExtractedReceiptData> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `
Extract important information from this receipt/invoice OCR text and return ONLY a JSON object with the following structure:
{
  "vendorName": "string",
  "invoiceNumber": "string", 
  "date": "YYYY-MM-DD format",
  "totalAmount": number,
  "items": [{"name": "string", "quantity": number, "price": number}],
  "taxAmount": number,
  "subtotal": number,
  "currency": "string"
}

OCR Text:
${ocrText}

Return only valid JSON, no explanations:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        return JSON.parse(content);
      } catch (jsonError) {
        console.error('Failed to parse OpenAI response as JSON:', content);
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      console.error('OpenAI extraction failed:', error);
      throw new Error(`AI extraction failed: ${error.message}`);
    }
  }

  /**
   * Process complete OCR workflow
   */
  async processReceipt(filePath: string, options: {
    ocrMethod?: 'tesseract' | 'ocrspace' | 'both';
    extractStructuredData?: boolean;
    cleanText?: boolean;
  } = {}): Promise<OCRResult> {
    const {
      ocrMethod = 'both',
      extractStructuredData = true,
      cleanText = true
    } = options;

    try {
      // Step 1: Extract raw text
      const ocrResult = await this.extractText(filePath, ocrMethod);

      // Step 2: Clean text if requested
      if (cleanText) {
        ocrResult.processedText = this.cleanText(ocrResult.rawText);
      }

      // Step 3: Extract structured data if requested and OpenAI is available
      if (extractStructuredData && this.openai) {
        try {
          const textToProcess = ocrResult.processedText || ocrResult.rawText;
          ocrResult.extractedData = await this.extractStructuredData(textToProcess);
        } catch (aiError) {
          console.warn('AI extraction failed, continuing without structured data:', aiError.message);
        }
      }

      return ocrResult;
    } catch (error) {
      console.error('Receipt processing failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const ocrService = new OCRService();

// Legacy function for backward compatibility
export const extractTextFromImage = async (filePath: string): Promise<string> => {
  const result = await ocrService.extractText(filePath, 'tesseract');
  return result.rawText;
};
