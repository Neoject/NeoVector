import { db } from '../config/database';

export interface PageBlock {
    id: number;
    page_id: number | null;
    type: string;
    title: string;
    content: string;
    settings: string | null | Record<string, any>;
    sort_order: number;
    is_active: number;
    created_at: Date;
    updated_at: Date;
}

export class PageBlockModel {
    static async createTable(): Promise<void> {
        await db.query(`
            CREATE TABLE IF NOT EXISTS page_blocks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                page_id INT NULL DEFAULT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                settings TEXT,
                sort_order INT DEFAULT 0,
                is_active TINYINT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_page_sort (page_id, sort_order),
                INDEX idx_type_sort (type, sort_order),
                INDEX idx_active_sort (is_active, sort_order)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);

        try {
            await db.query(`ALTER TABLE page_blocks CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        } catch {
            // already correct charset
        }

        try {
            await db.query(`ALTER TABLE page_blocks ADD COLUMN page_id INT NULL DEFAULT NULL AFTER id`);
            await db.query(`ALTER TABLE page_blocks ADD INDEX idx_page_sort (page_id, sort_order)`);
        } catch {
            // column already exists
        }
    }

    static async getAll(activeOnly: boolean = false, pageId?: number | null): Promise<PageBlock[]> {
        const conditions: string[] = [];
        const values: any[] = [];

        if (activeOnly) {
            conditions.push('is_active = 1');
        }

        if (pageId !== undefined) {
            if (pageId === null) {
                conditions.push('page_id IS NULL');
            } else {
                conditions.push('page_id = ?');
                values.push(pageId);
            }
        }

        let query = 'SELECT * FROM page_blocks';
        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY sort_order ASC';

        const blocks = await db.query<any[]>(query, values.length ? values : undefined);

        return blocks.map(block => ({
            id: block.id,
            page_id: block.page_id ?? null,
            type: block.type,
            title: block.title,
            content: block.content,
            settings: block.settings ? JSON.parse(block.settings) : null,
            sort_order: block.sort_order,
            is_active: block.is_active,
            created_at: block.created_at,
            updated_at: block.updated_at,
        }));
    }

    static async getById(id: number): Promise<PageBlock | null> {
        const rows = await db.query<any[]>(
            'SELECT * FROM page_blocks WHERE id = ?',
            [id]
        );

        if (rows.length === 0) return null;
        const block = rows[0];

        return {
            id: block.id,
            page_id: block.page_id ?? null,
            type: block.type,
            title: block.title,
            content: block.content,
            settings: block.settings ? JSON.parse(block.settings) : null,
            sort_order: block.sort_order,
            is_active: block.is_active,
            created_at: block.created_at,
            updated_at: block.updated_at,
        };
    }

    static async getHeroImage(): Promise<string> {
        const rows = await db.query<{ settings: string }[]>(
            "SELECT settings FROM page_blocks WHERE type = 'hero' AND is_active = 1 ORDER BY sort_order ASC LIMIT 1"
        );

        if (rows.length && rows[0].settings) {
            const settings = JSON.parse(rows[0].settings);
            return settings.backgroundImage || '';
        }

        return '';
    }

    static async create(data: {
        page_id?: number | null;
        type: string;
        title: string;
        content: string;
        settings?: string | Record<string, any>;
        sort_order?: number;
        is_active?: number;
    }): Promise<number> {
        const settingsStr = typeof data.settings === 'string'
            ? data.settings
            : (data.settings ? JSON.stringify(data.settings) : '{}');

        const result = await db.query(
            'INSERT INTO page_blocks (page_id, type, title, content, settings, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                data.page_id ?? null,
                data.type,
                data.title,
                data.content,
                settingsStr,
                data.sort_order || 0,
                data.is_active !== undefined ? data.is_active : 1,
            ]
        );

        return (result as any).insertId;
    }

    static async update(id: number, data: Partial<PageBlock>): Promise<boolean> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.type !== undefined) {
            updates.push('type = ?');
            values.push(data.type);
        }
        if (data.title !== undefined) {
            updates.push('title = ?');
            values.push(data.title);
        }
        if (data.content !== undefined) {
            updates.push('content = ?');
            values.push(data.content);
        }
        if (data.settings !== undefined) {
            updates.push('settings = ?');
            const settingsStr = typeof data.settings === 'string'
                ? data.settings
                : JSON.stringify(data.settings);
            values.push(settingsStr);
        }
        if (data.sort_order !== undefined) {
            updates.push('sort_order = ?');
            values.push(data.sort_order);
        }
        if (data.is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(data.is_active);
        }

        if (updates.length === 0) return false;

        values.push(id);
        const result = await db.query(
            `UPDATE page_blocks SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        return (result as any).affectedRows > 0;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.query('DELETE FROM page_blocks WHERE id = ?', [id]);
        return (result as any).affectedRows > 0;
    }

    static async updateOrder(order: Array<{ id: number; sort_order: number }>): Promise<void> {
        for (const item of order) {
            await db.query(
                'UPDATE page_blocks SET sort_order = ? WHERE id = ?',
                [item.sort_order, item.id]
            );
        }
    }

    static async getByType(type: string, activeOnly: boolean = true): Promise<PageBlock[]> {
        let query = 'SELECT * FROM page_blocks WHERE type = ?';
        if (activeOnly) {
            query += ' AND is_active = 1';
        }
        query += ' ORDER BY sort_order ASC';

        const blocks = await db.query<any[]>(query, [type]);
        return blocks.map(block => ({
            id: block.id,
            page_id: block.page_id ?? null,
            type: block.type,
            title: block.title,
            content: block.content,
            settings: block.settings ? JSON.parse(block.settings) : null,
            sort_order: block.sort_order,
            is_active: block.is_active,
            created_at: block.created_at,
            updated_at: block.updated_at,
        }));
    }

    static async getActiveBlocks(): Promise<PageBlock[]> {
        return this.getAll(true);
    }

    static async toggleActive(id: number, isActive: boolean): Promise<boolean> {
        const result = await db.query(
            'UPDATE page_blocks SET is_active = ? WHERE id = ?',
            [isActive ? 1 : 0, id]
        );
        return (result as any).affectedRows > 0;
    }
}