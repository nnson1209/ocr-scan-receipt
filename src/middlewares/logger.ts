import { Request, Response, NextFunction } from 'express';


export const logger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
        originalEnd.apply(res, args);
    };

    next();
};