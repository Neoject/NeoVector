import mysql from 'mysql2/promise';
import { env } from './env';

class Database {
    private static instance: Database;
    private pool: mysql.Pool;

    private constructor() {
        this.pool = mysql.createPool({
            host: env.dbHost,
            user: env.dbUser,
            password: env.dbPassword,
            database: env.dbName,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            charset: 'utf8mb4_unicode_ci',
        });
    }

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    getPool(): mysql.Pool {
        return this.pool;
    }

    async query<T = any>(sql: string, params?: any[]): Promise<T> {
        const [rows] = await this.pool.execute(sql, params);
        return rows as T;
    }

    async prepare(sql: string): Promise<mysql.PreparedStatementInfo> {
        return await this.pool.prepare(sql);
    }
}

export const db = Database.getInstance();