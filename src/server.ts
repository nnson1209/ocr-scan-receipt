import app from "./app";
import { FileUtils } from "./utils/file";
import path from "path";

const PORT = process.env.PORT || 3000;

// Ensure required directories exist
const setupDirectories = async () => {
  const uploadsDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
  await FileUtils.ensureDir(uploadsDir);
  console.log(`📁 Upload directory ready: ${uploadsDir}`);
};

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Clean up resources here if needed
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    await setupDirectories();

    app.listen(PORT, () => {
      console.log(`🚀 OCR Scan Receipt API Server is running`);
      console.log(`   Local:   http://localhost:${PORT}`);
      console.log(`   Health:  http://localhost:${PORT}/health`);
      console.log(`   API:     http://localhost:${PORT}${process.env.API_PREFIX || '/api'}`);
      console.log(`   Docs:    Check available endpoints at /health`);
      console.log('');
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 OCR Methods Available:`);
      console.log(`   - Tesseract.js: ✅ Available`);
      console.log(`   - OCR Space API: ${process.env.OCR_SPACE_API_KEY ? '✅' : '❌'} ${process.env.OCR_SPACE_API_KEY ? 'Available' : 'Not configured'}`);
      console.log(`   - OpenAI GPT: ${process.env.OPENAI_API_KEY ? '✅' : '❌'} ${process.env.OPENAI_API_KEY ? 'Available' : 'Not configured'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
