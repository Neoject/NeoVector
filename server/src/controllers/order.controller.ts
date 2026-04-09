import { Request, Response } from 'express';
import { OrderModel } from '../models/Order';
import { EmailService } from '../services/email.service';
import { PaymentService } from '../services/payment.service';

export class OrderController {
    static async createOrder(req: Request, res: Response): Promise<void> {
        const {
            customer_name, customer_phone, customer_email, delivery_type,
            delivery_address, delivery_date, delivery_time, payment_type,
            order_items, total_amount, notes,
        } = req.body;

        if (!customer_name || !customer_phone || !delivery_type || !order_items) {
            res.status(400).json({ error: 'Required fields missing' });
            return;
        }

        if (delivery_type === 'delivery' && !delivery_address) {
            res.status(400).json({ error: 'Delivery address is required' });
            return;
        }

        const orderId = await OrderModel.create({
            customer_name,
            customer_phone,
            customer_email,
            delivery_type,
            delivery_address,
            delivery_date,
            delivery_time,
            payment_type,
            order_items: typeof order_items === 'string' ? order_items : JSON.stringify(order_items),
            total_amount,
            notes,
        });

        const order = await OrderModel.getById(orderId);

        if (customer_email) {
            await EmailService.sendOrderConfirmation(order);
        }
        await EmailService.sendOrderNotification(order);

        res.json({ success: true, id: orderId });
    }

    static async getOrders(req: Request, res: Response): Promise<void> {
        const orders = await OrderModel.getAll();
        res.json(orders);
    }

    static async updateOrderStatus(req: Request, res: Response): Promise<void> {
        const { id, status } = req.body;

        if (!id || !status) {
            res.status(400).json({ error: 'Order id and status are required' });
            return;
        }

        const updated = await OrderModel.updateStatus(id, status);
        if (updated) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to update order status' });
        }
    }

    static async updatePaymentStatus(req: Request, res: Response): Promise<void> {
        const { order_id, payment_status } = req.body;

        if (!order_id || payment_status === undefined) {
            res.status(400).json({ error: 'Order id and payment status are required' });
            return;
        }

        const updated = await OrderModel.updatePaymentStatus(order_id, payment_status);
        if (updated) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to update payment status' });
        }
    }

    static async deleteOrder(req: Request, res: Response): Promise<void> {
        const { order_id } = req.body;

        if (!order_id) {
            res.status(400).json({ error: 'Order id is required' });
            return;
        }

        const deleted = await OrderModel.delete(order_id);
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to delete order' });
        }
    }

    static async cleanupOldOrders(req: Request, res: Response): Promise<void> {
        const { secret_key } = req.query;

        if (secret_key !== process.env.CLEANUP_SECRET_KEY) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 60);

        const deletedCount = await OrderModel.deleteOldOrders(cutoffDate);
        res.json({
            success: true,
            message: `Deleted ${deletedCount} orders`,
            deleted_count: deletedCount,
            cutoff_date: cutoffDate.toISOString(),
        });
    }
}