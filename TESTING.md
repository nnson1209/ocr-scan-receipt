# OCR Scan Receipt - Testing Guide

## Quick Test Commands

### 1. Check Server Health
```bash
curl http://localhost:3000/health
```

### 2. Check Available Methods
```bash
curl http://localhost:3000/api/ocr/methods
```

### 3. Test OCR with sample image
```bash
# Replace 'sample-receipt.jpg' with your image file
curl -X POST http://localhost:3000/api/ocr/scan \
  -F "receipt=@sample-receipt.jpg" \
  -F "ocrMethod=tesseract"
```

### 4. Test Text Extraction Only  
```bash
curl -X POST http://localhost:3000/api/ocr/extract-text \
  -F "receipt=@sample-receipt.jpg"
```

### 5. Test Structured Data Extraction from Text
```bash
curl -X POST http://localhost:3000/api/ocr/extract-data \
  -H "Content-Type: application/json" \
  -d '{
    "text": "ABC Grocery Store\nReceipt #12345\nDate: 2024-10-02\nApples x 2 - $3.99\nBread x 1 - $2.50\nSubtotal: $6.49\nTax: $0.52\nTotal: $7.01"
  }'
```

## Test with Postman

### Setup Collection

1. **Create new collection**: "OCR Scan Receipt API"

2. **Add requests:**

**Health Check:**
- Method: GET
- URL: `http://localhost:3000/health`

**Complete OCR Scan:**
- Method: POST  
- URL: `http://localhost:3000/api/ocr/scan`
- Body: form-data
  - Key: `receipt` (File)
  - Key: `ocrMethod` (Text) = "both"
  - Key: `extractStructuredData` (Text) = "true"

**Simple Text Extraction:**
- Method: POST
- URL: `http://localhost:3000/api/ocr/extract-text`  
- Body: form-data
  - Key: `receipt` (File)

**Data Extraction from Text:**
- Method: POST
- URL: `http://localhost:3000/api/ocr/extract-data`
- Headers: Content-Type: application/json
- Body: raw JSON
```json
{
  "text": "Your receipt text here..."
}
```

## Sample Response Formats

### Health Check Response
```json
{
  "service": "OCR Service",
  "status": "healthy",
  "timestamp": "2024-10-02T10:30:00.000Z",
  "capabilities": {
    "tesseract": true,
    "ocrSpace": false,
    "openAI": false
  }
}
```

### Complete OCR Scan Response
```json
{
  "success": true,
  "data": {
    "rawText": "ABC Store\nReceipt #001\n...",
    "processedText": "ABC Store Receipt #001 ...",
    "confidence": 85.5,
    "processingTime": 2340,
    "extractedData": {
      "vendorName": "ABC Store",
      "invoiceNumber": "001",
      "date": "2024-10-02",
      "totalAmount": 25.99,
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

## Performance Testing

### Test different file sizes:
```bash
# Small image (~100KB)
curl -X POST http://localhost:3000/api/ocr/scan -F "receipt=@small-receipt.jpg"

# Medium image (~1MB)  
curl -X POST http://localhost:3000/api/ocr/scan -F "receipt=@medium-receipt.jpg"

# Large image (~5MB)
curl -X POST http://localhost:3000/api/ocr/scan -F "receipt=@large-receipt.jpg"
```

### Test different OCR methods:
```bash
# Tesseract only
curl -X POST http://localhost:3000/api/ocr/scan \
  -F "receipt=@receipt.jpg" -F "ocrMethod=tesseract"

# OCR Space only (requires API key)
curl -X POST http://localhost:3000/api/ocr/scan \
  -F "receipt=@receipt.jpg" -F "ocrMethod=ocrspace"

# Both methods (default)
curl -X POST http://localhost:3000/api/ocr/scan \
  -F "receipt=@receipt.jpg" -F "ocrMethod=both"
```

## Error Testing

### Test invalid file types:
```bash
curl -X POST http://localhost:3000/api/ocr/scan -F "receipt=@document.txt"
```

### Test file too large:
```bash
# Upload a file larger than MAX_FILE_SIZE
curl -X POST http://localhost:3000/api/ocr/scan -F "receipt=@huge-file.jpg"
```

### Test missing file:
```bash
curl -X POST http://localhost:3000/api/ocr/scan
```

## Expected Error Responses

### Invalid file type:
```json
{
  "success": false,
  "error": "Invalid file type. Only images (JPEG, PNG, GIF, BMP, TIFF) and PDF files are allowed."
}
```

### File too large:
```json
{
  "success": false,
  "error": "File too large"
}
```

### No file uploaded:
```json
{
  "success": false,
  "error": "No file uploaded",
  "message": "Please upload an image file (JPG, PNG, PDF)"
}
```