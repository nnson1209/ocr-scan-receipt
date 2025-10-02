import fs from 'fs';
import path from 'path';

export interface FileInfo {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    path: string;
    extension: string;
}

/**
 * File utility functions
 */
export class FileUtils {

    /**
     * Check if file exists
     */
    static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get file info
     */
    static async getFileInfo(filePath: string): Promise<FileInfo | null> {
        try {
            const stats = await fs.promises.stat(filePath);
            const parsedPath = path.parse(filePath);

            return {
                filename: parsedPath.base,
                originalName: parsedPath.base,
                size: stats.size,
                mimetype: FileUtils.getMimeType(parsedPath.ext),
                path: filePath,
                extension: parsedPath.ext
            };
        } catch {
            return null;
        }
    }

    /**
     * Get MIME type from file extension
     */
    static getMimeType(extension: string): string {
        const mimeTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.tiff': 'image/tiff',
            '.tif': 'image/tiff',
            '.pdf': 'application/pdf'
        };

        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Check if file is an image
     */
    static isImage(filename: string): boolean {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif'];
        const ext = path.extname(filename).toLowerCase();
        return imageExtensions.includes(ext);
    }

    /**
     * Check if file is a PDF
     */
    static isPDF(filename: string): boolean {
        return path.extname(filename).toLowerCase() === '.pdf';
    }

    /**
     * Validate file for OCR processing
     */
    static validateOCRFile(file: Express.Multer.File | FileInfo): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            errors.push('File size must be less than 10MB');
        }

        // Check file type
        const isValidImage = FileUtils.isImage(file.filename || '');
        const isValidPDF = FileUtils.isPDF(file.filename || '');

        if (!isValidImage && !isValidPDF) {
            errors.push('File must be an image (JPG, PNG, GIF, BMP, TIFF) or PDF');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Clean up file
     */
    static async deleteFile(filePath: string): Promise<boolean> {
        try {
            await fs.promises.unlink(filePath);
            return true;
        } catch (error) {
            console.error('Failed to delete file:', filePath, error);
            return false;
        }
    }

    /**
     * Ensure directory exists
     */
    static async ensureDir(dirPath: string): Promise<void> {
        try {
            await fs.promises.mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error('Failed to create directory:', dirPath, error);
            throw error;
        }
    }

    /**
     * Generate unique filename
     */
    static generateUniqueFilename(originalName: string, prefix: string = 'file'): string {
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1000);

        return `${prefix}-${name}-${timestamp}-${random}${ext}`;
    }

    /**
     * Get file size in human readable format
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}