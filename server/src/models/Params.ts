import { db } from '../config/database';
import fs from 'fs';
import path from 'path';

export class ParamsModel {
    static async createTable(): Promise<void> {
        await db.query(`
      CREATE TABLE IF NOT EXISTS params (
        id INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(50) NOT NULL UNIQUE,
        \`value\` TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    }

    static async get(key: string): Promise<string | null> {
        const rows = await db.query<{ value: string }[]>(
            'SELECT value FROM params WHERE `key` = ?',
            [key]
        );
        return rows[0]?.value || null;
    }

    static async getAll(keys?: string[]): Promise<Record<string, string>> {
        let query = 'SELECT `key`, value FROM params';
        const values: string[] = [];

        if (keys && keys.length > 0) {
            query += ` WHERE \`key\` IN (${keys.map(() => '?').join(',')})`;
            values.push(...keys);
        }

        const rows = await db.query<{ key: string; value: string }[]>(query, values);
        const result: Record<string, string> = {};

        for (const row of rows) {
            result[row.key] = row.value;
        }

        return result;
    }

    static async set(key: string, value: string): Promise<void> {
        await db.query(
            'INSERT INTO params (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
            [key, value]
        );
    }

    static async saveMultiple(data: Record<string, any>): Promise<void> {
        for (const [key, value] of Object.entries(data)) {
            await this.set(key, String(value));
        }
    }

    static async delete(key: string): Promise<boolean> {
        const result = await db.query('DELETE FROM params WHERE `key` = ?', [key]);
        return (result as any).affectedRows > 0;
    }

    static async getThemeCssPath(): Promise<string> {
        const stylesDir = path.join(process.cwd(), 'styles');
        if (!fs.existsSync(stylesDir)) {
            fs.mkdirSync(stylesDir, { recursive: true });
        }
        return path.join(stylesDir, 'theme.css');
    }

    static async getThemeCss(): Promise<string> {
        const cssPath = await this.getThemeCssPath();
        if (!fs.existsSync(cssPath)) {
            return '';
        }
        return fs.readFileSync(cssPath, 'utf-8');
    }

    static async getThemeColorsFilePath(): Promise<string> {
        const stylesDir = path.join(process.cwd(), 'styles');
        if (!fs.existsSync(stylesDir)) {
            fs.mkdirSync(stylesDir, { recursive: true });
        }
        return path.join(stylesDir, 'theme-colors.json');
    }

    static async getThemeColors(): Promise<Record<string, string>> {
        const filePath = await this.getThemeColorsFilePath();
        if (!fs.existsSync(filePath)) {
            return {};
        }

        try {
            const raw = fs.readFileSync(filePath, 'utf-8').trim();
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return {};
            }

            const colors: Record<string, string> = {};
            for (const [name, value] of Object.entries(parsed)) {
                if (!name.match(/^--[a-zA-Z0-9_-]+$/)) continue;
                if (typeof value !== 'string' || value.trim() === '') continue;
                colors[name] = value.trim();
            }
            return colors;
        } catch {
            return {};
        }
    }

    static async saveThemeCss(css: string): Promise<void> {
        const cssPath = await this.getThemeCssPath();
        fs.writeFileSync(cssPath, css, 'utf-8');
    }

    static async saveThemeColors(colors: Record<string, string>): Promise<void> {
        const filePath = await this.getThemeColorsFilePath();
        const normalized: Record<string, string> = {};

        for (const [name, value] of Object.entries(colors)) {
            if (!name.match(/^--[a-zA-Z0-9_-]+$/)) continue;
            if (!value || value.trim() === '') continue;
            normalized[name] = value.trim();
        }

        fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), 'utf-8');
    }

    static async resetThemeCss(): Promise<void> {
        const filePath = await this.getThemeColorsFilePath();
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    static async getTitle(): Promise<string> {
        const title = await this.get('title');
        return title || '';
    }

    static async getDescription(): Promise<string> {
        const description = await this.get('description');
        return description || '';
    }

    static async getLogo(): Promise<string> {
        const logo = await this.get('logo');
        return logo || '';
    }
}