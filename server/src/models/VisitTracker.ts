import {db} from '../config/database';
import {NextFunction, Request, Response} from 'express';
import {PageModel} from './Page';

export interface Visit {
    id: number;
    ip_address: string;
    user_agent: string | null;
    referer: string | null;
    page_url: string;
    visit_date: string;
    visit_time: string;
    created_at: Date;
}

export class VisitTracker {
    static async createTable(): Promise<void> {
        await db.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        referer TEXT,
        page_url VARCHAR(500) NOT NULL,
        visit_date DATE NOT NULL,
        visit_time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_date (visit_date),
        INDEX idx_url (page_url(255)),
        INDEX idx_ip (ip_address)
      )
    `);
    }

    static async track(req: Request): Promise<void> {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || '';
        const referer = req.headers['referer'] || '';
        let pageUrl = req.url || '/';

        const excludedPaths = ['/admin', '/api', '/assets', '/favicon.ico'];

        for (const excluded of excludedPaths) {
            if (pageUrl.startsWith(excluded)) return;
        }

        if (pageUrl.startsWith('/product') && req.query.id) {
            const productId = parseInt(req.query.id as string);

            if (!isNaN(productId) && productId > 0) {
                pageUrl = `/product?id=${productId}`;
            } else {
                return;
            }
        }

        const visitDate = new Date().toISOString().split('T')[0];
        const visitTime = new Date().toTimeString().split(' ')[0];

        try {
            await db.query(
                'INSERT INTO visits (ip_address, user_agent, referer, page_url, visit_date, visit_time) VALUES (?, ?, ?, ?, ?, ?)',
                [ip, userAgent, referer, pageUrl, visitDate, visitTime]
            );
        } catch (error) {
            console.error('Visit tracking failed:', error);
        }
    }

    static async getTotalVisits(startDate: string): Promise<number> {
        const rows = await db.query<{ total: number }[]>(
            'SELECT COUNT(*) as total FROM visits WHERE visit_date >= ?',
            [startDate]
        );

        return rows[0]?.total || 0;
    }

    static async getUniqueVisitors(startDate: string): Promise<number> {
        const rows = await db.query<{ unique_visitors: number }[]>(
            'SELECT COUNT(DISTINCT ip_address) as unique_visitors FROM visits WHERE visit_date >= ?',
            [startDate]
        );

        return rows[0]?.unique_visitors || 0;
    }

    static async getDailyVisits(startDate: string): Promise<{ date: string; count: number }[]> {
        const rows = await db.query<{ visit_date: string; count: number }[]>(
            'SELECT visit_date, COUNT(*) as count FROM visits WHERE visit_date >= ? GROUP BY visit_date ORDER BY visit_date ASC',
            [startDate]
        );

        return rows.map(row => ({ date: row.visit_date, count: row.count }));
    }

    static async getTopPages(startDate: string): Promise<{
        all: { url: string; count: number; is_virtual: boolean }[];
        virtual: { url: string; count: number; is_virtual: boolean }[];
    }> {
        const rows = await db.query<{ page_url: string; count: number }[]>(
            'SELECT page_url, COUNT(*) as count FROM visits WHERE visit_date >= ? GROUP BY page_url ORDER BY count DESC LIMIT 20',
            [startDate]
        );

        const pages = await PageModel.getAll(true);
        const virtualSlugs = pages.map(p => '/' + p.slug);

        const all: { url: string; count: number; is_virtual: boolean }[] = [];
        const virtual: { url: string; count: number; is_virtual: boolean }[] = [];

        for (const row of rows) {
            const isVirtual = virtualSlugs.includes(row.page_url) ||
                PageModel.isVirtualPageUrl(row.page_url, virtualSlugs);

            const item = { url: row.page_url, count: row.count, is_virtual: isVirtual };
            all.push(item);

            if (isVirtual) {
                virtual.push(item);
            }
        }

        return { all, virtual };
    }

    static async getHourlyVisits(startDate: string): Promise<{ hour: number; count: number }[]> {
        return await db.query<{ hour: number; count: number }[]>(
            'SELECT HOUR(visit_time) as hour, COUNT(*) as count FROM visits WHERE visit_date >= ? GROUP BY HOUR(visit_time) ORDER BY hour ASC',
            [startDate]
        );
    }

    static async getRecentVisits(startDate: string, limit: number = 50): Promise<any[]> {
        const rows = await db.query<any[]>(
            'SELECT ip_address, page_url, visit_date, visit_time, referer FROM visits WHERE visit_date >= ? ORDER BY created_at DESC LIMIT ?',
            [startDate, limit]
        );

        return rows.map(row => ({
            ip: row.ip_address,
            url: row.page_url,
            date: row.visit_date,
            time: row.visit_time,
            referer: row.referer || 'Прямой заход',
        }));
    }

    static middleware(req: Request, res: Response, next: NextFunction): void {
        VisitTracker.track(req).catch(console.error);
        next();
    }
}