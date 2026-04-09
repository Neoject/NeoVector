import { db } from '../config/database';

export interface Page {
    id: number;
    slug: string;
    title: string;
    content: string;
    meta_title: string | null;
    meta_description: string | null;
    is_published: number;
    is_main_page: number;
    navigation_buttons: string | null;
    created_at: Date;
    updated_at: Date;
}

export class PageModel {
    static async createTable(): Promise<void> {
        await db.query(`
            CREATE TABLE IF NOT EXISTS pages (
                                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                                 slug VARCHAR(255) NOT NULL UNIQUE,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                meta_title VARCHAR(255),
                meta_description TEXT,
                is_published TINYINT DEFAULT 1,
                is_main_page TINYINT DEFAULT 0,
                navigation_buttons TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_slug (slug),
                INDEX idx_published (is_published)
                )
        `);
    }

    static async findBySlug(slug: string, publishedOnly: boolean = true): Promise<Page | null> {
        let query = 'SELECT * FROM pages WHERE slug = ?';
        if (publishedOnly) query += ' AND is_published = 1';
        query += ' LIMIT 1';

        const rows = await db.query<any[]>(query, [slug]);
        if (rows.length === 0) return null;

        const page = rows[0];
        return {
            id: page.id,
            slug: page.slug,
            title: page.title,
            content: page.content,
            meta_title: page.meta_title,
            meta_description: page.meta_description,
            is_published: page.is_published,
            is_main_page: page.is_main_page,
            navigation_buttons: page.navigation_buttons ? JSON.parse(page.navigation_buttons) : null,
            created_at: page.created_at,
            updated_at: page.updated_at,
        };
    }

    static async getAll(publishedOnly: boolean = false): Promise<Page[]> {
        let query = 'SELECT * FROM pages';
        if (publishedOnly) query += ' WHERE is_published = 1';
        query += ' ORDER BY created_at DESC';

        const pages = await db.query<any[]>(query);
        return pages.map(page => ({
            id: page.id,
            slug: page.slug,
            title: page.title,
            content: page.content,
            meta_title: page.meta_title,
            meta_description: page.meta_description,
            is_published: page.is_published,
            is_main_page: page.is_main_page,
            navigation_buttons: page.navigation_buttons ? JSON.parse(page.navigation_buttons) : null,
            created_at: page.created_at,
            updated_at: page.updated_at,
        }));
    }

    static async create(data: any): Promise<number> {
        const slug = data.slug || this.generateSlug(data.title);
        const result = await db.query(
            `INSERT INTO pages
             (slug, title, content, meta_title, meta_description, is_published, is_main_page, navigation_buttons)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                slug,
                data.title,
                data.content || '',
                data.meta_title || data.title,
                data.meta_description || null,
                data.is_published !== undefined ? data.is_published : 1,
                data.is_main_page !== undefined ? data.is_main_page : 0,
                data.navigation_buttons ? JSON.stringify(data.navigation_buttons) : null,
            ]
        );
        return (result as any).insertId;
    }

    static async update(id: number, data: any): Promise<boolean> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.title !== undefined) {
            updates.push('title = ?');
            values.push(data.title);
        }
        if (data.slug !== undefined) {
            updates.push('slug = ?');
            values.push(data.slug);
        }
        if (data.content !== undefined) {
            updates.push('content = ?');
            values.push(data.content);
        }
        if (data.meta_title !== undefined) {
            updates.push('meta_title = ?');
            values.push(data.meta_title);
        }
        if (data.meta_description !== undefined) {
            updates.push('meta_description = ?');
            values.push(data.meta_description);
        }
        if (data.is_published !== undefined) {
            updates.push('is_published = ?');
            values.push(data.is_published);
        }
        if (data.is_main_page !== undefined) {
            updates.push('is_main_page = ?');
            values.push(data.is_main_page);
        }
        if (data.navigation_buttons !== undefined) {
            updates.push('navigation_buttons = ?');
            values.push(data.navigation_buttons ? JSON.stringify(data.navigation_buttons) : null);
        }

        if (updates.length === 0) return false;

        values.push(id);
        const result = await db.query(
            `UPDATE pages SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        return (result as any).affectedRows > 0;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.query('DELETE FROM pages WHERE id = ?', [id]);
        return (result as any).affectedRows > 0;
    }

    static generateSlug(title: string): string {
        const translit: Record<string, string> = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ь': '', 'ъ': ''
        };

        let slug = title.toLowerCase();
        for (const [ru, en] of Object.entries(translit)) {
            slug = slug.replace(new RegExp(ru, 'g'), en);
        }
        slug = slug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return slug;
    }

    // Добавленный метод isVirtualPageUrl
    static isVirtualPageUrl(url: string, virtualPages: string[]): boolean {
        const normalizedUrl = url.replace(/^\//, '');

        for (const virtualPage of virtualPages) {
            const virtualSlug = virtualPage.replace(/^\//, '');
            if (normalizedUrl === virtualSlug || normalizedUrl.startsWith(virtualSlug + '/')) {
                return true;
            }
        }

        return false;
    }

    // Вспомогательный метод для получения всех виртуальных страниц
    static async getVirtualPages(): Promise<string[]> {
        const pages = await this.getAll(true);
        return pages.map(page => '/' + page.slug);
    }

    // Вспомогательный метод для проверки, является ли URL виртуальной страницей
    static async isVirtualPage(url: string): Promise<boolean> {
        const virtualPages = await this.getVirtualPages();
        return this.isVirtualPageUrl(url, virtualPages);
    }
}