import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import path from "path";
import ocrRoutes from "./routes/ocr.routes";
import { errorHandler } from "./middlewares/errorHandler";
import { logger } from "./middlewares/logger";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
app.use(morgan("combined"));
app.use(logger);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'OCR Scan Receipt API'
    });
});

// API routes
app.use("/api/ocr", ocrRoutes);

// Root API info
app.get(process.env.API_PREFIX || "/api", (req, res) => {
    res.json({
        service: "OCR Scan Receipt API",
        version: "1.0.0",
        endpoints: {
            health: "GET /health",
            ocrScan: "POST /api/ocr/scan",
            extractText: "POST /api/ocr/extract-text",
            extractData: "POST /api/ocr/extract-data",
            methods: "GET /api/ocr/methods"
        },
        documentation: "See README.md for full API documentation"
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware
app.use(errorHandler);

export default app;

