import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ParamsModel } from '../models/Params';

export class SettingsController {
    static async getAll(req: Request, res: Response): Promise<void> {
        const defaults: Record<string, string> = {
            logo: '',
            title: '',
            main_title: '',
            email: '',
            description: '',
            image_meta_tags: '',
            pickup_address: '',
            work_hours: '',
            store_phone: '',
            show_cart: 'true',
            show_wish_list: 'true',
            admin_only: 'true',
            delivery_bel: '0',
            delivery_rus: '0',
        };

        const params = await ParamsModel.getAll();
        res.json({ ...defaults, ...params });
    }

    static async save(req: Request, res: Response): Promise<void> {
        const data = req.body;

        const fields: Record<string, any> = {
            email: data.email,
            title: data.title,
            main_title: data.main_title,
            description: data.description,
            image_meta_tags: data.image_meta_tags,
            pickup_address: data.pickup_address,
            work_hours: data.work_hours,
            store_phone: data.store_phone,
            show_cart: data.show_cart,
            show_wish_list: data.show_wish_list,
            admin_only: data.admin_only,
            delivery_bel: SettingsController.formatNumber(data.delivery_bel),
            delivery_rus: SettingsController.formatNumber(data.delivery_rus),
        };

        await ParamsModel.saveMultiple(fields);
        res.json({ success: true });
    }

    static async setTitle(req: Request, res: Response): Promise<void> {
        const { title } = req.body;

        if (typeof title !== 'string') {
            res.status(400).json({ error: 'Title must be a string' });
            return;
        }

        await ParamsModel.set('title', title.trim());
        res.json({ success: true, title: title.trim() });
    }

    static async uploadLogo(req: Request, res: Response): Promise<void> {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const relativePath = `/assets/${req.file.filename}`;
        await ParamsModel.set('logo', relativePath);

        res.json({ success: true, url: relativePath });
    }

    static async deleteLogo(req: Request, res: Response): Promise<void> {
        try {
            const logoPath = await ParamsModel.get('logo');

            if (logoPath) {
                const fullPath = path.join(process.cwd(), logoPath);
                const _path = path.normalize(fullPath);

                if (!_path.startsWith(process.cwd())) {
                    console.error('Security: attempted path traversal');
                    res.status(400).json({ success: false, error: 'Invalid path' });
                    return;
                }

                await fs.promises.unlink(fullPath).catch((err) => {
                    if (err.code !== 'ENOENT') {
                        console.error('Error deleting file:', err);
                    }
                });

                await ParamsModel.delete('logo');
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error in deleteLogo:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    static async uploadBackground(req: Request, res: Response): Promise<void> {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const relativePath = `/assets/backgrounds/${req.file.filename}`;
        await ParamsModel.set('background', relativePath);

        res.json({ success: true, url: relativePath });
    }

    static async getThemeColors(req: Request, res: Response): Promise<void> {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        const colors = await ParamsModel.getThemeColors();
        res.json(colors);
    }

    static async saveThemeColors(req: Request, res: Response): Promise<void> {
        let colorsObj: Record<string, string> = {};

        if (typeof req.body.colors === 'string') {
            colorsObj = JSON.parse(req.body.colors);
        } else if (typeof req.body.colors === 'object' && req.body.colors !== null) {
            colorsObj = req.body.colors;
        }

        if (typeof colorsObj !== 'object' || colorsObj === null) {
            res.status(400).json({ error: 'Invalid colors data' });
            return;
        }

        try {
            await ParamsModel.saveThemeColors(colorsObj);
            res.json({ success: true });
        } catch (error: any) {
            console.error('Failed to save theme colors:', error);
            res.status(500).json({ error: error?.message || 'Failed to save colors' });
        }
    }

    static async resetThemeCss(req: Request, res: Response): Promise<void> {
        await ParamsModel.resetThemeCss();
        res.json({ success: true });
    }

    static async getThemeCss(req: Request, res: Response): Promise<void> {
        const css = await ParamsModel.getThemeCss();
        res.json({ css });
    }

    static async saveThemeCss(req: Request, res: Response): Promise<void> {
        const { css } = req.body;

        if (!css || typeof css !== 'string') {
            res.status(400).json({ error: 'CSS is required' });
            return;
        }

        if (css.length > 1024 * 1024) {
            res.status(400).json({ error: 'CSS too large' });
            return;
        }

        await ParamsModel.saveThemeCss(css);
        res.json({ success: true });
    }

    private static formatNumber(number: string): number {
        const value = number.replace(/[^0-9]/g, '');
        return parseInt(value) || 0;
    }
}