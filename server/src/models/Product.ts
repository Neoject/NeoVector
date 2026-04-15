import { db } from '../config/database';
import {writeLog} from "../config/log";

export interface Product {
    id: number;
    name: string;
    description: string | null;
    peculiarities: string;
    material: string;
    price: number;
    price_sale: number | null;
    category: string;
    product_type_id: number | null;
    image: string;
    image_description: string;
    visibility: number;
    sort_order: number;
    created_by: number;
    created_at: Date;
    last_changed_by: number;
    last_changed_at: Date;
}

export interface ProductImage {
    id: number;
    product_id: number;
    image_path: string;
    file_type: 'image' | 'video';
    sort_order: number;
    uploaded_by: number;
    created_at: Date;
}

export class ProductModel {
    static async createTables(): Promise<void> {
        await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        peculiarities TEXT,
        material VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        price_sale INT NULL,
        category VARCHAR(64) NOT NULL,
        product_type_id INT NULL,
        image VARCHAR(255) NOT NULL,
        image_description TEXT,
        visibility INT NOT NULL DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_changed_by INT NOT NULL,
        last_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_visibility (visibility),
        INDEX idx_sort (sort_order)
      )
    `);

        await db.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_path VARCHAR(255) NOT NULL,
        file_type ENUM('image','video') DEFAULT 'image',
        sort_order INT DEFAULT 0,
        uploaded_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product (product_id)
      )
    `);

        await this.createTablesForOptions();
    }

    static async getAll(): Promise<Product[]> {
        const products = await db.query<Product[]>(`
      SELECT * FROM products ORDER BY sort_order, id
    `);
        return products;
    }

    static async getById(id: number): Promise<Product | null> {
        const rows = await db.query<Product[]>(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async getProductWithMedia(id: number): Promise<any> {
        const product = await this.getById(id);
        if (!product) return null;

        const images = await db.query<ProductImage[]>(
            'SELECT image_path, file_type FROM product_images WHERE product_id = ? ORDER BY sort_order',
            [id]
        );

        const additionalImages = images.filter(i => i.file_type === 'image').map(i => i.image_path);
        const additionalVideos = images.filter(i => i.file_type === 'video').map(i => i.image_path);

        return {
            ...product,
            price: product.price / 100,
            price_sale: product.price_sale ? product.price_sale / 100 : null,
            peculiarities: product.peculiarities ? JSON.parse(product.peculiarities) : [],
            additional_images: additionalImages,
            additional_videos: additionalVideos,
        };
    }

    static async create(data: any, userId: number): Promise<number> {
        const result = await db.query(
            `INSERT INTO products 
       (name, description, peculiarities, material, price, price_sale, category, product_type_id, image, image_description, created_by, last_changed_by, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.name,
                data.description,
                JSON.stringify(data.peculiarities || []),
                data.material,
                Math.round(data.price * 100),
                data.price_sale ? Math.round(data.price_sale * 100) : null,
                data.category,
                data.product_type_id || null,
                data.image,
                data.image_description,
                userId,
                userId,
                data.sort_order || 0,
            ]
        );
        return (result as any).insertId;
    }

    static async update(id: number, data: any, userId: number): Promise<boolean> {
        const result = await db.query(
            `UPDATE products SET 
        name = ?, description = ?, peculiarities = ?, material = ?, 
        price = ?, price_sale = ?, category = ?, product_type_id = ?, 
        image = ?, image_description = ?, last_changed_by = ?
       WHERE id = ?`,
            [
                data.name,
                data.description,
                JSON.stringify(data.peculiarities || []),
                data.material,
                Math.round(data.price * 100),
                data.price_sale ? Math.round(data.price_sale * 100) : null,
                data.category,
                data.product_type_id || null,
                data.image,
                data.image_description,
                userId,
                id,
            ]
        );
        return (result as any).affectedRows > 0;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.query('DELETE FROM products WHERE id = ?', [id]);
        return (result as any).affectedRows > 0;
    }

    static async updateSortOrder(order: Array<{ id: number; sort_order: number }>, userId: number): Promise<void> {
        for (const item of order) {
            await db.query(
                'UPDATE products SET sort_order = ?, last_changed_by = ? WHERE id = ?',
                [item.sort_order, userId, item.id]
            );
        }
    }

    static async updateVisibility(id: number, visibility: number, userId: number): Promise<boolean> {
        const result = await db.query(
            'UPDATE products SET visibility = ?, last_changed_by = ? WHERE id = ?',
            [visibility, userId, id]
        );
        return (result as any).affectedRows > 0;
    }

    static async addImage(productId: number, imagePath: string, fileType: 'image' | 'video', userId: number, sortOrder: number): Promise<number> {
        const result = await db.query(
            'INSERT INTO product_images (product_id, image_path, file_type, sort_order, uploaded_by) VALUES (?, ?, ?, ?, ?)',
            [productId, imagePath, fileType, sortOrder, userId]
        );
        return (result as any).insertId;
    }

    static async deleteImage(imageId: number): Promise<string | null> {
        const rows = await db.query<{ image_path: string }[]>(
            'SELECT image_path FROM product_images WHERE id = ?',
            [imageId]
        );
        if (rows.length === 0) return null;

        const imagePath = rows[0].image_path;
        await db.query('DELETE FROM product_images WHERE id = ?', [imageId]);
        return imagePath;
    }

    static async getOptions(typeId: number = 0): Promise<any[]> {
        let query = 'SELECT `group`, `value`, `sort_order` FROM `product_options`';
        const params: any[] = [];

        if (typeId > 0) {
            query += ' WHERE `product_type_id` = ?';
            params.push(typeId);
        }

        query += ' ORDER BY `group`, `sort_order`, `id`';

        const rows = await db.query<any[]>(query, params);

        const groups: Record<string, { name: string; values: string[] }> = {};

        for (const row of rows) {
            const group = row.group;
            if (!groups[group]) {
                groups[group] = { name: group, values: [] };
            }
            groups[group].values.push(row.value);
        }

        return Object.values(groups);
    }

    static async saveOptions(options: any[], typeId: number = 0): Promise<void> {
        // Clear existing options for this type
        if (typeId > 0) {
            await db.query('DELETE FROM product_options WHERE product_type_id = ?', [typeId]);
        } else {
            await db.query('TRUNCATE TABLE product_options');
        }

        if (!options || options.length === 0) return;

        for (const optionType of options) {
            const group = optionType.group || optionType.name;
            const values = optionType.values || [];

            if (!group || !Array.isArray(values) || values.length === 0) continue;

            for (let i = 0; i < values.length; i++) {
                const value = typeof values[i] === 'object' ? values[i].value : values[i];
                if (!value) continue;

                await db.query(
                    'INSERT INTO product_options (`group`, `value`, `sort_order`, `product_type_id`) VALUES (?, ?, ?, ?)',
                    [group, value, i, typeId > 0 ? typeId : null]
                );
            }
        }
    }

    static async getTypes(): Promise<any[]> {
        const rows = await db.query<any[]>(
            'SELECT `id`, `name` FROM `product_types` ORDER BY `sort_order`, `id`'
        );
        return rows;
    }

    static async saveTypes(types: any[]): Promise<void> {
        // Clear existing types
        await db.query('TRUNCATE TABLE product_types');

        if (!types || types.length === 0) return;

        for (let i = 0; i < types.length; i++) {
            const name = typeof types[i] === 'object' ? types[i].name : types[i];
            if (!name) continue;

            await db.query(
                'INSERT INTO product_types (`name`, `sort_order`) VALUES (?, ?)',
                [name, i]
            );
        }
    }

    static async createTablesForOptions(): Promise<void> {
        await db.query(`
    CREATE TABLE IF NOT EXISTS product_options (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`group\` VARCHAR(255) NOT NULL,
      \`value\` VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0,
      product_type_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY group_value_unique (\`group\`, \`value\`)
    )
  `);

        await db.query(`
    CREATE TABLE IF NOT EXISTS product_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
    }
}