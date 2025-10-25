import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
}

export const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`[Error] ${statusCode}: ${message}`);
    console.error(err.stack);

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    res.status(404).json({
        error: 'Resource not found',
        path: req.path,
    });
};
