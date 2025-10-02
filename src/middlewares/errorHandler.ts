import { Request, Response, NextFunction } from 'express';


interface ErrorWithStatus extends Error {
    status?: number;
    statusCode?: number;
}

export const errorHandler = (
    err: ErrorWithStatus,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error occurred:', err);

    // Default error
    let error = {
        status: err.status || err.statusCode || 500,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    // Specific error handling
    if (err.name === 'ValidationError') {
        error.status = 400;
        error.message = 'Validation Error';
    }

    if (err.name === 'CastError') {
        error.status = 400;
        error.message = 'Invalid ID format';
    }

    if (err.name === 'MulterError') {
        error.status = 400;
        if (err.message.includes('LIMIT_FILE_SIZE')) {
            error.message = 'File too large';
        }
    }

    res.status(error.status).json({
        success: false,
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};