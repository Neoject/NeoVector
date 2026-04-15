import { Request, Response } from 'express';
import { VisitTracker } from '../models/VisitTracker';

export class AnalyticsController {
    static async get(req: Request, res: Response): Promise<void> {
        const periodParam = req.query.period;
        const periodDays = AnalyticsController.getValidPeriod(typeof periodParam === 'string' ? periodParam : undefined);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        const startDateStr = startDate.toISOString().split('T')[0];

        const [
            totalVisits,
            uniqueVisitors,
            dailyVisits,
            topPages,
            hourlyVisits,
            recentVisits,
        ] = await Promise.all([
            VisitTracker.getTotalVisits(startDateStr),
            VisitTracker.getUniqueVisitors(startDateStr),
            VisitTracker.getDailyVisits(startDateStr),
            VisitTracker.getTopPages(startDateStr),
            VisitTracker.getHourlyVisits(startDateStr),
            VisitTracker.getRecentVisits(startDateStr),
        ]);

        res.json({
            total_visits: totalVisits,
            unique_visitors: uniqueVisitors,
            daily_visits: dailyVisits,
            top_pages: topPages.all,
            top_virtual_pages: topPages.virtual,
            hourly_visits: hourlyVisits,
            recent_visits: recentVisits,
            period_days: periodDays,
        });
    }

    private static getValidPeriod(period?: string): number {
        let days = parseInt(period || '7');
        if (isNaN(days) || days < 1) days = 7;
        if (days > 365) days = 365;
        return days;
    }
}