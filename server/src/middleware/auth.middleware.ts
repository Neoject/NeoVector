import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

declare global {
    namespace Express {
        interface Request {
            userId?: number;
            userRole?: string;
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decodedToken = jwt.verify(token, env.jwtSecret);
        if (typeof decodedToken === 'string') {
            return res.status(401).json({ error: 'Invalid token payload' });
        }
        const decoded = decodedToken as JwtPayload & { userId?: number; role?: string };
        if (!decoded.userId || !decoded.role) {
            return res.status(401).json({ error: 'Invalid token payload' });
        }
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            const decodedToken = jwt.verify(token, env.jwtSecret);
            if (typeof decodedToken !== 'string') {
                const decoded = decodedToken as JwtPayload & { userId?: number; role?: string };
                if (decoded.userId && decoded.role) {
                    req.userId = decoded.userId;
                    req.userRole = decoded.role;
                }
            }
        } catch {
            // Ignore invalid token
        }
    }
    next();
};