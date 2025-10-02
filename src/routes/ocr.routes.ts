import { Router } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs-extra";
import {
    handleOCR,
    handleSimpleOCR,
    extractStructuredData,
    healthCheck
} from "../controllers/ocr.controller";

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
fs.ensureDirSync(uploadsDir);

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const fileName = `receipt-${uniqueSuffix}${fileExtension}`;
        cb(null, fileName);
    }
});

// File filter for images and PDFs
const fileFilter = (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'application/pdf'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, BMP, TIFF) and PDF files are allowed.'));
    }
};

// Multer upload configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
        files: 1
    }
});

// Routes

/**
 * GET /health - Health check endpoint
 */
router.get("/health", healthCheck);

/**
 * POST /scan - Complete OCR processing with structured data extraction
 * Body params:
 * - ocrMethod: 'tesseract' | 'ocrspace' | 'both' (default: 'both')
 * - extractStructuredData: boolean (default: true)
 * - cleanText: boolean (default: true)
 */
router.post("/scan", upload.single("receipt"), handleOCR);

/**
 * POST /extract-text - Simple text extraction only
 */
router.post("/extract-text", upload.single("receipt"), handleSimpleOCR);

/**
 * POST /extract-data - Extract structured data from provided text
 * Body: { text: string }
 */
router.post("/extract-data", extractStructuredData);

/**
 * GET /methods - Get available OCR methods
 */
router.get("/methods", (req, res) => {
    res.json({
        success: true,
        methods: {
            tesseract: {
                name: 'Tesseract.js',
                description: 'Local OCR processing',
                available: true
            },
            ocrspace: {
                name: 'OCR Space API',
                description: 'Cloud-based OCR service',
                available: !!process.env.OCR_SPACE_API_KEY
            },
            openai: {
                name: 'OpenAI GPT',
                description: 'AI-powered structured data extraction',
                available: !!process.env.OPENAI_API_KEY
            }
        }
    });
});

export default router;

