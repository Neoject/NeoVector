import { db } from '../config/database';

export interface HomeContentItem {
    id: number;
    section: string;
    title: string;
    content: string;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
}

export class HomeContentModel {
    static async createTable(): Promise<void> {
        await db.query(`
      CREATE TABLE IF NOT EXISTS home_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY section_sort (section, sort_order),
        INDEX idx_section (section)
      )
    `);
    }

    static async getAll(): Promise<HomeContentItem[]> {
        const rows = await db.query<HomeContentItem[]>(
            'SELECT * FROM home_content ORDER BY section, sort_order ASC'
        );
        return rows;
    }

    static async getBySection(section: string): Promise<HomeContentItem[]> {
        const rows = await db.query<HomeContentItem[]>(
            'SELECT * FROM home_content WHERE section = ? ORDER BY sort_order ASC',
            [section]
        );
        return rows;
    }

    static async saveAll(items: HomeContentItem[]): Promise<void> {
        await db.query('DELETE FROM home_content');

        for (const item of items) {
            await db.query(
                'INSERT INTO home_content (section, title, content, sort_order) VALUES (?, ?, ?, ?)',
                [item.section, item.title, item.content, item.sort_order || 0]
            );
        }
    }

    static async create(item: Omit<HomeContentItem, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
        const result = await db.query(
            'INSERT INTO home_content (section, title, content, sort_order) VALUES (?, ?, ?, ?)',
            [item.section, item.title, item.content, item.sort_order || 0]
        );
        return (result as any).insertId;
    }

    static async update(id: number, data: Partial<HomeContentItem>): Promise<boolean> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.section !== undefined) {
            updates.push('section = ?');
            values.push(data.section);
        }
        if (data.title !== undefined) {
            updates.push('title = ?');
            values.push(data.title);
        }
        if (data.content !== undefined) {
            updates.push('content = ?');
            values.push(data.content);
        }
        if (data.sort_order !== undefined) {
            updates.push('sort_order = ?');
            values.push(data.sort_order);
        }

        if (updates.length === 0) return false;

        values.push(id);
        const result = await db.query(
            `UPDATE home_content SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        return (result as any).affectedRows > 0;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.query('DELETE FROM home_content WHERE id = ?', [id]);
        return (result as any).affectedRows > 0;
    }

    static async deleteBySection(section: string): Promise<boolean> {
        const result = await db.query('DELETE FROM home_content WHERE section = ?', [section]);
        return (result as any).affectedRows > 0;
    }
}