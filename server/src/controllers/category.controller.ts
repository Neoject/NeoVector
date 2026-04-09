import { Request, Response } from 'express';
import { CategoryModel } from '../models/Category';

export class CategoryController {
    static async getAll(req: Request, res: Response): Promise<void> {
        const categories = await CategoryModel.getAll();
        res.json(categories);
    }

    static async create(req: Request, res: Response): Promise<void> {
        const { name, slug, sort_order } = req.body;

        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: 'Category name is required' });
            return;
        }

        const id = await CategoryModel.create({
            name,
            slug: typeof slug === 'string' ? slug : undefined,
            sort_order: typeof sort_order === 'number' ? sort_order : parseInt(sort_order as string) || 0
        });
        res.json({ success: true, id });
    }

    static async update(req: Request, res: Response): Promise<void> {
        const idParam = req.params.id;
        const id = typeof idParam === 'string' ? parseInt(idParam) : NaN;
        const { name, slug, sort_order } = req.body;

        if (isNaN(id) || id <= 0) {
            res.status(400).json({ error: 'Invalid category id' });
            return;
        }

        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: 'Category name is required' });
            return;
        }

        const updated = await CategoryModel.update(id, {
            name,
            slug: typeof slug === 'string' ? slug : undefined,
            sort_order: typeof sort_order === 'number' ? sort_order : parseInt(sort_order as string) || 0
        });

        if (updated) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to update category' });
        }
    }

    static async delete(req: Request, res: Response): Promise<void> {
        const idParam = req.params.id;
        const id = typeof idParam === 'string' ? parseInt(idParam) : NaN;

        if (isNaN(id) || id <= 0) {
            res.status(400).json({ error: 'Invalid category id' });
            return;
        }

        const deleted = await CategoryModel.delete(id);
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to delete category' });
        }
    }

    static async saveOrder(req: Request, res: Response): Promise<void> {
        const { categories_order } = req.body;

        let order: any[] = [];
        if (typeof categories_order === 'string') {
            order = JSON.parse(categories_order);
        } else if (Array.isArray(categories_order)) {
            order = categories_order;
        }

        if (!Array.isArray(order)) {
            res.status(400).json({ error: 'Invalid data format' });
            return;
        }

        await CategoryModel.updateOrder(order);
        res.json({ success: true });
    }
}