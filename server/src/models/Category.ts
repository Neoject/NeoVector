import { db } from '../config/database';

export interface Category {
    id: number;
    slug: string;
    name: string;
    sort_order: number;
}

export class CategoryModel {
    static async createTable(): Promise<void> {
        await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        INDEX idx_sort (sort_order)
      )
    `);
    }

    static async getAll(): Promise<Category[]> {
        return await db.query<Category[]>(
            'SELECT id, slug, name, sort_order FROM categories ORDER BY sort_order ASC, name ASC'
        );
    }

    static async getById(id: number): Promise<Category | null> {
        const rows = await db.query<Category[]>(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async getBySlug(slug: string): Promise<Category | null> {
        const rows = await db.query<Category[]>(
            'SELECT * FROM categories WHERE slug = ?',
            [slug]
        );
        return rows[0] || null;
    }

    static async create(data: { name: string; slug?: string; sort_order?: number }): Promise<number> {
        let slug = data.slug;
        if (!slug) {
            slug = this.generateSlug(data.name);
        }

        const result = await db.query(
            'INSERT INTO categories (slug, name, sort_order) VALUES (?, ?, ?)',
            [slug, data.name, data.sort_order || 0]
        );
        return (result as any).insertId;
    }

    static async update(id: number, data: { name?: string; slug?: string; sort_order?: number }): Promise<boolean> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) {
            updates.push('name = ?');
            values.push(data.name);

            if (!data.slug) {
                updates.push('slug = ?');
                values.push(this.generateSlug(data.name));
            }
        }

        if (data.slug !== undefined) {
            updates.push('slug = ?');
            values.push(data.slug);
        }

        if (data.sort_order !== undefined) {
            updates.push('sort_order = ?');
            values.push(data.sort_order);
        }

        if (updates.length === 0) return false;

        values.push(id);
        const result = await db.query(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        return (result as any).affectedRows > 0;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.query('DELETE FROM categories WHERE id = ?', [id]);
        return (result as any).affectedRows > 0;
    }

    static async updateOrder(order: number[]): Promise<void> {
        for (let i = 0; i < order.length; i++) {
            await db.query(
                'UPDATE categories SET sort_order = ? WHERE id = ?',
                [i, order[i]]
            );
        }
    }

    static generateSlug(name: string): string {
        const translit: Record<string, string> = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ь': '', 'ъ': ''
        };

        let slug = name.toLowerCase();
        for (const [ru, en] of Object.entries(translit)) {
            slug = slug.replace(new RegExp(ru, 'g'), en);
        }
        slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return slug;
    }
}