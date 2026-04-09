import { Request, Response } from 'express';
import { PageModel } from '../models/Page';
import { PageBlockModel } from '../models/PageBlock';

export class PageController {
    static async getAll(req: Request, res: Response): Promise<void> {
        const pages = await PageModel.getAll(false);
        res.json(pages);
    }

    static async getBySlug(req: Request, res: Response): Promise<void> {
        const { slug } = req.params;

        if (!slug || typeof slug !== 'string') {
            res.status(400).json({ error: 'Slug is required' });
            return;
        }

        const page = await PageModel.findBySlug(slug);
        if (!page) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }

        res.json(page);
    }

    static async create(req: Request, res: Response): Promise<void> {
        const { title, slug, content, meta_title, meta_description, is_published, is_main_page, navigation_buttons } = req.body;

        if (!title || typeof title !== 'string') {
            res.status(400).json({ error: 'Title is required' });
            return;
        }

        const id = await PageModel.create({
            title,
            slug: typeof slug === 'string' ? slug : undefined,
            content: typeof content === 'string' ? content : '',
            meta_title: typeof meta_title === 'string' ? meta_title : undefined,
            meta_description: typeof meta_description === 'string' ? meta_description : undefined,
            is_published: typeof is_published === 'number' ? is_published : parseInt(is_published as string) || 1,
            is_main_page: typeof is_main_page === 'number' ? is_main_page : parseInt(is_main_page as string) || 0,
            navigation_buttons: navigation_buttons,
        });

        res.json({ success: true, id });
    }

    static async update(req: Request, res: Response): Promise<void> {
        const idParam = req.params.id;
        const id = typeof idParam === 'string' ? parseInt(idParam) : NaN;

        if (isNaN(id) || id <= 0) {
            res.status(400).json({ error: 'Invalid page id' });
            return;
        }

        const data: any = {};

        if (req.body.title !== undefined) data.title = req.body.title;
        if (req.body.slug !== undefined) data.slug = req.body.slug;
        if (req.body.content !== undefined) data.content = req.body.content;
        if (req.body.meta_title !== undefined) data.meta_title = req.body.meta_title;
        if (req.body.meta_description !== undefined) data.meta_description = req.body.meta_description;
        if (req.body.is_published !== undefined) data.is_published = parseInt(req.body.is_published);
        if (req.body.is_main_page !== undefined) data.is_main_page = parseInt(req.body.is_main_page);
        if (req.body.navigation_buttons !== undefined) data.navigation_buttons = req.body.navigation_buttons;

        const updated = await PageModel.update(id, data);
        if (updated) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to update page' });
        }
    }

    static async delete(req: Request, res: Response): Promise<void> {
        const idParam = req.params.id;
        const id = typeof idParam === 'string' ? parseInt(idParam) : NaN;

        if (isNaN(id) || id <= 0) {
            res.status(400).json({ error: 'Invalid page id' });
            return;
        }

        const deleted = await PageModel.delete(id);
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to delete page' });
        }
    }

    static async getNavigation(req: Request, res: Response): Promise<void> {
        const slug = req.query.slug;

        if (slug && typeof slug === 'string') {
            const page = await PageModel.findBySlug(slug);
            if (page && (page as any).navigation_buttons) {
                res.json((page as any).navigation_buttons);
                return;
            }
        }

        res.json([]);
    }

    static async getBlocks(req: Request, res: Response): Promise<void> {
        const blocks = await PageBlockModel.getAll();
        res.json(blocks);
    }

    static async getHeroImage(req: Request, res: Response): Promise<void> {
        const url = await PageBlockModel.getHeroImage();
        res.json({ url });
    }

    static async createBlock(req: Request, res: Response): Promise<void> {
        const { type, title, content, settings, sort_order, is_active } = req.body;

        if (!type || typeof type !== 'string' || !title || typeof title !== 'string') {
            res.status(400).json({ error: 'Type and title are required' });
            return;
        }

        const id = await PageBlockModel.create({
            type,
            title,
            content: typeof content === 'string' ? content : '',
            settings: typeof settings === 'string' ? settings : (settings ? JSON.stringify(settings) : '{}'),
            sort_order: typeof sort_order === 'number' ? sort_order : parseInt(sort_order as string) || 0,
            is_active: typeof is_active === 'number' ? is_active : (is_active === 'true' || is_active === 1 ? 1 : 0),
        });

        res.json({ success: true, id });
    }

    static async updateBlock(req: Request, res: Response): Promise<void> {
        const idParam = req.params.id;
        const id = typeof idParam === 'string' ? parseInt(idParam) : NaN;

        if (isNaN(id) || id <= 0) {
            res.status(400).json({ error: 'Invalid block id' });
            return;
        }

        const data: any = {};

        if (req.body.type !== undefined) data.type = req.body.type;
        if (req.body.title !== undefined) data.title = req.body.title;
        if (req.body.content !== undefined) data.content = req.body.content;
        if (req.body.settings !== undefined) {
            data.settings = typeof req.body.settings === 'string' ? req.body.settings : JSON.stringify(req.body.settings);
        }
        if (req.body.sort_order !== undefined) data.sort_order = parseInt(req.body.sort_order);
        if (req.body.is_active !== undefined) data.is_active = parseInt(req.body.is_active);

        const updated = await PageBlockModel.update(id, data);
        if (updated) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to update block' });
        }
    }

    static async deleteBlock(req: Request, res: Response): Promise<void> {
        const idParam = req.params.id;
        const id = typeof idParam === 'string' ? parseInt(idParam) : NaN;

        if (isNaN(id) || id <= 0) {
            res.status(400).json({ error: 'Invalid block id' });
            return;
        }

        const deleted = await PageBlockModel.delete(id);
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to delete block' });
        }
    }

    static async updateBlocksOrder(req: Request, res: Response): Promise<void> {
        const { blocks_order } = req.body;

        let order: any[] = [];
        if (typeof blocks_order === 'string') {
            order = JSON.parse(blocks_order);
        } else if (Array.isArray(blocks_order)) {
            order = blocks_order;
        }

        if (!Array.isArray(order)) {
            res.status(400).json({ error: 'Invalid data format' });
            return;
        }

        await PageBlockModel.updateOrder(order);
        res.json({ success: true });
    }
}