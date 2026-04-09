import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
    static async getPaymentToken(req: Request, res: Response): Promise<void> {
        const data = req.body;

        const { shopId, secretKey } = PaymentService.getConfig();

        if (!shopId || !secretKey) {
            res.status(500).json({ error: 'Payment credentials not configured' });
            return;
        }

        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
        const returnUrl = req.query.id ? `${baseUrl}/product?id=${req.query.id}` : baseUrl;

        const { orderForm, cartItems, cartTotal } = data;

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            res.status(400).json({ error: 'Cart is empty' });
            return;
        }

        const amount = Math.round(parseFloat(cartTotal) * 100);
        if (amount <= 0) {
            res.status(400).json({ error: 'Invalid order amount' });
            return;
        }

        const customerEmail = orderForm?.customer_email;
        if (!customerEmail || !this.isValidEmail(customerEmail)) {
            res.status(400).json({ error: 'Valid email is required for online payment' });
            return;
        }

        const result = await PaymentService.createCheckout({
            amount,
            description: `Оплата заказа для ${orderForm?.customer_name || 'клиента'}`,
            returnUrl,
            notificationUrl: `${baseUrl}/api/payment/notification`,
            customerEmail,
        });

        res.json(result);
    }

    static async paymentNotification(req: Request, res: Response): Promise<void> {
        const notification = req.body;
        console.log('Payment notification received:', notification);

        // Process payment notification
        // Update order payment status based on notification

        res.status(200).send('OK');
    }

    private static isValidEmail(email: string): boolean {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}