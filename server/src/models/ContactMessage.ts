import { db } from '../config/database';

export interface ContactMessage {
    id: number;
    name: string;
    email: string;
    message: string;
    created_at: Date;
}

export interface MessageReply {
    id: number;
    message_id: number;
    subject: string;
    message: string;
    to_email: string;
    created_by: number;
    created_at: Date;
}

export class ContactMessageModel {
    static async createTable(): Promise<void> {
        await db.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created (created_at)
      )
    `);
    }

    static async create(name: string, email: string, message: string): Promise<number> {
        const result = await db.query(
            'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
            [name, email, message]
        );
        return (result as any).insertId;
    }

    static async getAll(): Promise<ContactMessage[]> {
        return await db.query<ContactMessage[]>(
            'SELECT * FROM contact_messages ORDER BY created_at DESC'
        );
    }

    static async getById(id: number): Promise<ContactMessage | null> {
        const rows = await db.query<ContactMessage[]>(
            'SELECT * FROM contact_messages WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.query('DELETE FROM contact_messages WHERE id = ?', [id]);
        return (result as any).affectedRows > 0;
    }
}

export class MessageReplyModel {
    static async createTable(): Promise<void> {
        await db.query(`
      CREATE TABLE IF NOT EXISTS message_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        to_email VARCHAR(255) NOT NULL,
        created_by INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_message (message_id),
        FOREIGN KEY (message_id) REFERENCES contact_messages(id) ON DELETE CASCADE
      )
    `);
    }

    static async create(data: {
        message_id: number;
        subject: string;
        message: string;
        to_email: string;
        created_by: number;
    }): Promise<number> {
        const result = await db.query(
            'INSERT INTO message_replies (message_id, subject, message, to_email, created_by) VALUES (?, ?, ?, ?, ?)',
            [data.message_id, data.subject, data.message, data.to_email, data.created_by]
        );
        return (result as any).insertId;
    }

    static async getByMessageId(messageId: number): Promise<(MessageReply & { username?: string })[]> {
        const rows = await db.query<(MessageReply & { username: string | null })[]>(
            `SELECT mr.*, u.username 
       FROM message_replies mr 
       LEFT JOIN users u ON mr.created_by = u.id 
       WHERE mr.message_id = ? 
       ORDER BY mr.created_at DESC`,
            [messageId]
        );
        return rows.map(row => ({
            ...row,
            username: row.username || 'Неизвестный пользователь',
        }));
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.query('DELETE FROM message_replies WHERE id = ?', [id]);
        return (result as any).affectedRows > 0;
    }
}