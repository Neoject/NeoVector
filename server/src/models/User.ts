import { db } from '../config/database';
import crypto from 'crypto';

export interface User {
    id: number;
    username: string;
    password_hash: string;
    role: 'user' | 'admin';
    created_at: Date;
}

export class UserModel {
    static async createTable(): Promise<void> {
        await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash CHAR(64) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    }

    static async findByUsername(username: string): Promise<User | null> {
        const rows = await db.query<User[]>(
            'SELECT * FROM users WHERE username = ? LIMIT 1',
            [username]
        );
        return rows[0] || null;
    }

    static async findById(id: number): Promise<User | null> {
        const rows = await db.query<User[]>(
            'SELECT id, username, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async create(username: string, password: string, role: string = 'user'): Promise<number> {
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        const result = await db.query<{ insertId: number }>(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, hash, role]
        );
        return (result as any).insertId;
    }

    static async updateUsername(id: number, username: string): Promise<boolean> {
        const result = await db.query(
            'UPDATE users SET username = ? WHERE id = ?',
            [username, id]
        );
        return (result as any).affectedRows > 0;
    }

    static async updatePassword(id: number, password: string): Promise<boolean> {
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        const result = await db.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hash, id]
        );
        return (result as any).affectedRows > 0;
    }

    static async getAll(): Promise<Omit<User, 'password_hash'>[]> {
        return await db.query(
            'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'
        );
    }

    static async ensureAdmin(): Promise<void> {
        const admin = await this.findByUsername('admin');
        if (!admin) {
            await this.create('admin', 'admin123', 'admin');
        }
    }

    static async validatePassword(username: string, password: string): Promise<User | null> {
        const user = await this.findByUsername(username);
        if (!user) return null;

        const hash = crypto.createHash('sha256').update(password).digest('hex');
        if (hash === user.password_hash) {
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword as User;
        }
        return null;
    }
}