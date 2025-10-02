import { Request, Response, NextFunction } from "express";
import { ocrService, OCRResult } from "../services/ocr.service";
import fs from "fs-extra";

export interface OCRRequest extends Request {
  file?: Express.Multer.File;
  body: {
    ocrMethod?: 'tesseract' | 'ocrspace' | 'both';
    extractStructuredData?: boolean | string;
    cleanText?: boolean | string;
  };
}

/**
 * Handle OCR processing for receipt/invoice scanning
 */
export const handleOCR = async (req: OCRRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
        message: "Please upload an image file (JPG, PNG, PDF)"
      });
    }

    const {
      ocrMethod = 'both',
      extractStructuredData = true,
      cleanText = true
    } = req.body;

    console.log(`Processing OCR for file: ${req.file.filename} using method: ${ocrMethod}`);

    // Convert string/boolean to boolean properly
    const shouldExtractStructuredData = extractStructuredData === true || extractStructuredData === 'true';
    const shouldCleanText = cleanText === true || cleanText === 'true';

    // Process the receipt
    const result: OCRResult = await ocrService.processReceipt(req.file.path, {
      ocrMethod,
      extractStructuredData: shouldExtractStructuredData,
      cleanText: shouldCleanText
    });

    // Clean up uploaded file after processing
    try {
      await fs.remove(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError);
    }

    return res.json({
      success: true,
      data: result,
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('OCR processing failed:', error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file after error:', cleanupError);
      }
    }

    // Pass error to error handler
    next(error);
  }
};

/**
 * Handle OCR with only text extraction (legacy endpoint)
 */
export const handleSimpleOCR = async (req: OCRRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    const result = await ocrService.extractText(req.file.path, 'both');

    // Clean up uploaded file
    try {
      await fs.remove(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError);
    }

    return res.json({
      success: true,
      text: result.rawText,
      confidence: result.confidence,
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error('Simple OCR processing failed:', error);

    if (req.file) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file after error:', cleanupError);
      }
    }

    next(error);
  }
};

/**
 * Extract structured data from provided text
 */
export const extractStructuredData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Text is required",
        message: "Please provide text to extract structured data from"
      });
    }

    const extractedData = await ocrService.extractStructuredData(text);

    return res.json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('Structured data extraction failed:', error);
    next(error);
  }
};

/**
 * Health check for OCR service
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const health = {
      service: 'OCR Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: {
        tesseract: true,
        ocrSpace: !!process.env.OCR_SPACE_API_KEY,
        openAI: !!process.env.OPENAI_API_KEY
      }
    };

    res.json(health);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      service: 'OCR Service',
      status: 'unhealthy',
      error: err.message
    });
  }
};

