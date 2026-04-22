import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ParamsModel } from '../models/Params';

const BOOL_PARAM_KEYS = ['show_cart', 'show_wish_list', 'admin_only'] as const;

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
            admin_only: 'false',
            delivery_bel: '0',
            delivery_rus: '0',
        };

        const params = await ParamsModel.getAll();
        const merged: Record<string, string> = { ...defaults, ...params };

        for (const key of BOOL_PARAM_KEYS) {
            merged[key] = SettingsController.toBoolString(merged[key]);
        }

        res.json(merged);
    }

    static async save(req: Request, res: Response): Promise<void> {
        const data = req.body || {};

        const fields: Record<string, string> = {
            email: String(data.email ?? ''),
            title: String(data.title ?? ''),
            main_title: String(data.main_title ?? ''),
            description: String(data.description ?? ''),
            image_meta_tags: String(data.image_meta_tags ?? ''),
            pickup_address: String(data.pickup_address ?? ''),
            work_hours: String(data.work_hours ?? ''),
            store_phone: String(data.store_phone ?? ''),
            show_cart: SettingsController.toBoolString(data.show_cart),
            show_wish_list: SettingsController.toBoolString(data.show_wish_list),
            admin_only: SettingsController.toBoolString(data.admin_only),
            delivery_bel: String(SettingsController.formatNumberInput(data.delivery_bel)),
            delivery_rus: String(SettingsController.formatNumberInput(data.delivery_rus)),
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
        let colorsObj: Record<string, any> = {};

        if (typeof req.body.colors === 'string') {
            try { colorsObj = JSON.parse(req.body.colors); } catch {
                res.status(400).json({ error: 'Invalid colors JSON' });
                return;
            }
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

    private static parseBool(value: unknown): boolean {
        if (value === true || value === 1) return true;
        if (value === false || value === 0) return false;
        if (value == null) return false;
        const s = String(value).trim().toLowerCase();
        return s === 'true' || s === '1' || s === 'yes' || s === 'on';
    }

    private static toBoolString(value: unknown): 'true' | 'false' {
        return SettingsController.parseBool(value) ? 'true' : 'false';
    }

    private static formatNumberInput(value: unknown): number {
        const raw = value == null ? '' : String(value);
        const digits = raw.replace(/[^0-9]/g, '');
        return parseInt(digits, 10) || 0;
    }
}