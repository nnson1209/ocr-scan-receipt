import { Request, Response, NextFunction } from 'express';


export const logger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Store the original end method
    const originalEnd = res.end;

    // Override res.end with a simple wrapper
    res.end = function (this: Response, chunk?: any, encoding?: any, cb?: any) {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);

        // Call the original end method with all arguments
        return originalEnd.call(this, chunk, encoding, cb);
    } as any;

    next();
};