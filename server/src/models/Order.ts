import { db } from '../config/database';

export interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    delivery_type: 'pickup' | 'delivery';
    delivery_address: string | null;
    delivery_date: Date | null;
    delivery_time: string | null;
    payment_type: 'cash' | 'online';
    payment_status: number;
    order_items: string;
    total_amount: number;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}

export class OrderModel {
    static async createTable(): Promise<void> {
        await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(255),
        delivery_type ENUM('pickup', 'delivery') NOT NULL,
        delivery_address TEXT,
        delivery_date DATE,
        delivery_time TIME,
        payment_type ENUM('cash', 'online') NOT NULL,
        payment_status INT NOT NULL DEFAULT 0,
        order_items TEXT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created (created_at),
        INDEX idx_status (status)
      )
    `);
    }

    static async create(data: any): Promise<number> {
        const result = await db.query(
            `INSERT INTO orders 
       (customer_name, customer_phone, customer_email, delivery_type, delivery_address, 
        delivery_date, delivery_time, payment_type, payment_status, order_items, total_amount, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.customer_name,
                data.customer_phone,
                data.customer_email || null,
                data.delivery_type,
                data.delivery_address || null,
                data.delivery_date || null,
                data.delivery_time || null,
                data.payment_type,
                data.payment_type === 'online' ? 1 : (data.payment_status || 0),
                typeof data.order_items === 'string' ? data.order_items : JSON.stringify(data.order_items),
                data.total_amount,
                data.notes || null,
            ]
        );
        return (result as any).insertId;
    }

    static async getAll(): Promise<Order[]> {
        const orders = await db.query<Order[]>(
            'SELECT * FROM orders ORDER BY created_at DESC'
        );
        return orders.map(order => ({
            ...order,
            order_items: typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items,
            total_amount: parseFloat(order.total_amount as any),
        }));
    }

    static async getById(id: number): Promise<any | null> {
        const rows = await db.query<Order[]>(
            'SELECT * FROM orders WHERE id = ?',
            [id]
        );
        if (rows.length === 0) return null;
        const order = rows[0];
        return {
            ...order,
            order_items: typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items,
            total_amount: parseFloat(order.total_amount as any),
        };
    }

    static async updateStatus(id: number, status: string): Promise<boolean> {
        const result = await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        return (result as any).affectedRows > 0;
    }

    static async updatePaymentStatus(id: number, paymentStatus: number): Promise<boolean> {
        const result = await db.query(
            'UPDATE orders SET payment_status = ? WHERE id = ?',
            [paymentStatus, id]
        );
        return (result as any).affectedRows > 0;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.query('DELETE FROM orders WHERE id = ?', [id]);
        return (result as any).affectedRows > 0;
    }

    static async deleteOldOrders(cutoffDate: Date): Promise<number> {
        const result = await db.query(
            'DELETE FROM orders WHERE created_at < ?',
            [cutoffDate]
        );
        return (result as any).affectedRows;
    }
}