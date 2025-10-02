# OCR Scan Receipt (Learning Project)

# 📄 OCR Scan Receipt API

A powerful Express.js-based OCR service for scanning and extracting structured data from receipts and invoices using multiple OCR engines and AI-powered data extraction.

## 🚀 Features

- **Multiple OCR Engines**: Tesseract.js (local) and OCR Space API (cloud)
- **AI-Powered Data Extraction**: OpenAI GPT for structured data extraction
- **Smart File Handling**: Support for images (JPG, PNG, GIF, BMP, TIFF) and PDF files
- **Data Validation**: Automatic validation and cleaning of extracted data
- **Comprehensive API**: Multiple endpoints for different use cases
- **Error Handling**: Robust error handling and logging
- **File Security**: Automatic cleanup of uploaded files

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
cd ocr-scan-receipt
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=3000
NODE_ENV=development

# OCR API Keys (optional but recommended)
OCR_SPACE_API_KEY=your_ocr_space_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# API Configuration
API_PREFIX=/api
CORS_ORIGIN=http://localhost:3000,http://localhost:4200
```

3. **Run the server:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📋 API Endpoints

### Health Check
```
GET /health
```
Returns server status and available capabilities.

### OCR Processing

#### 1. Complete Receipt Scan (Recommended)
```
POST /api/scan
Content-Type: multipart/form-data

Form fields:
- receipt: [file] - Image or PDF file
- ocrMethod: [string] - 'tesseract' | 'ocrspace' | 'both' (default: 'both')
- extractStructuredData: [boolean] - Extract structured data (default: true)
- cleanText: [boolean] - Clean extracted text (default: true)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rawText": "Original OCR text...",
    "processedText": "Cleaned OCR text...",
    "confidence": 85.5,
    "processingTime": 2340,
    "extractedData": {
      "vendorName": "ABC Store",
      "invoiceNumber": "INV-001",
      "date": "2024-10-02",
      "totalAmount": 25.99,
      "items": [
        {
          "name": "Product 1",
          "quantity": 2,
          "price": 12.99
        }
      ],
      "taxAmount": 2.08,
      "subtotal": 23.91,
      "currency": "USD"
    }
  },
  "file": {
    "originalName": "receipt.jpg",
    "size": 1048576,
    "mimeType": "image/jpeg"
  }
}
```

#### 2. Simple Text Extraction
```
POST /api/extract-text
Content-Type: multipart/form-data

Form fields:
- receipt: [file] - Image or PDF file
```

#### 3. Extract Structured Data from Text
```
POST /api/extract-data
Content-Type: application/json

{
  "text": "Receipt text to process..."
}
```

#### 4. Available Methods
```
GET /api/methods
```
Returns information about available OCR methods and AI capabilities.

## 🔧 Configuration Options

### OCR Methods
- **tesseract**: Local processing using Tesseract.js (always available)
- **ocrspace**: Cloud-based OCR using OCR Space API (requires API key)
- **both**: Try OCR Space first, fallback to Tesseract (recommended)

### Environment Variables
- `OCR_SPACE_API_KEY`: OCR Space API key for cloud OCR
- `OPENAI_API_KEY`: OpenAI API key for structured data extraction
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 10MB)
- `UPLOAD_DIR`: Directory for temporary file uploads
- `CORS_ORIGIN`: Allowed CORS origins

## 💡 Usage Examples

### cURL Examples

**Basic receipt scan:**
```bash
curl -X POST http://localhost:3000/api/scan \
  -F "receipt=@receipt.jpg"
```

**With specific OCR method:**
```bash
curl -X POST http://localhost:3000/api/scan \
  -F "receipt=@receipt.jpg" \
  -F "ocrMethod=tesseract"
```

**Extract data from text:**
```bash
curl -X POST http://localhost:3000/api/extract-data \
  -H "Content-Type: application/json" \
  -d '{"text":"ABC Store\nTotal: $25.99\nDate: 2024-10-02"}'
```

### JavaScript/Fetch Example

```javascript
const formData = new FormData();
formData.append('receipt', fileInput.files[0]);
formData.append('ocrMethod', 'both');
formData.append('extractStructuredData', 'true');

const response = await fetch('/api/scan', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data.extractedData);
```

## 🔍 Data Extraction

The AI-powered extraction can identify:
- **Vendor Information**: Store name, address
- **Transaction Details**: Invoice number, date, time
- **Financial Data**: Total amount, subtotal, tax, currency
- **Line Items**: Product names, quantities, individual prices
- **Payment Information**: Payment method, change

## 🚀 Performance

- **Local OCR (Tesseract)**: ~2-5 seconds depending on image complexity
- **Cloud OCR (OCR Space)**: ~1-3 seconds with internet connection
- **AI Extraction**: ~1-2 seconds additional processing
- **File Size Limit**: 10MB (configurable)

## 🛡️ Security

- Automatic file cleanup after processing
- File type validation
- Size limitations
- CORS configuration
- Error handling without sensitive data exposure

## 🐛 Troubleshooting

### Common Issues

1. **"OCR Space API key not configured"**
   - Set `OCR_SPACE_API_KEY` in your `.env` file
   - Or use `ocrMethod: 'tesseract'` for local processing

2. **"File too large"**
   - Reduce image size or increase `MAX_FILE_SIZE`
   - Optimize images before upload

3. **Poor OCR accuracy**
   - Ensure good image quality (300+ DPI recommended)
   - Good lighting and contrast
   - Try different OCR methods

### Debugging

Enable debug logging:
```bash
NODE_ENV=development npm run dev
```

## 📝 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests (if available)
npm test
```

## 🤝 API Integration

This OCR service can be easily integrated into larger applications as a microservice. It provides a clean REST API that can be consumed by web applications, mobile apps, or other backend services.

Example integration with a document management system:
```javascript
// Upload and process receipt
const processReceipt = async (file) => {
  const formData = new FormData();
  formData.append('receipt', file);
  
  const response = await fetch(`${OCR_SERVICE_URL}/api/scan`, {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};
```

## 🚀 Run locally
```bash
npm install
npm run dev

