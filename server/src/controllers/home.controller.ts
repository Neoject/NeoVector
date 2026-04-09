import { Request, Response } from 'express';
import { HomeContentModel, HomeContentItem } from '../models/HomeContent';

export class HomeController {
    static async getAll(req: Request, res: Response): Promise<void> {
        const content = await HomeContentModel.getAll();
        res.json(content);
    }

    static async save(req: Request, res: Response): Promise<void> {
        let contentData: HomeContentItem[] = [];

        if (typeof req.body.content === 'string') {
            contentData = JSON.parse(req.body.content);
        } else if (Array.isArray(req.body.content)) {
            contentData = req.body.content;
        }

        if (!Array.isArray(contentData)) {
            res.status(400).json({ error: 'Invalid content data' });
            return;
        }

        await HomeContentModel.saveAll(contentData);
        res.json({ success: true });
    }
}