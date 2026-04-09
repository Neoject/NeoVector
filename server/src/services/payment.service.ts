import { env } from '../config/env';

export class PaymentService {
    static getConfig() {
        return {
            shopId: env.payment.shopId,
            secretKey: env.payment.secretKey,
        };
    }

    static async createCheckout(data: {
        amount: number;
        description: string;
        returnUrl: string;
        notificationUrl: string;
        customerEmail: string;
    }): Promise<any> {
        const { shopId, secretKey } = this.getConfig();

        const checkoutData = {
            checkout: {
                test: false,
                transaction_type: 'payment',
                attempts: 3,
                settings: {
                    return_url: data.returnUrl,
                    success_url: data.returnUrl,
                    decline_url: data.returnUrl,
                    fail_url: data.returnUrl,
                    cancel_url: data.returnUrl,
                    notification_url: data.notificationUrl,
                    button_next_text: 'Вернуться в магазин',
                    language: 'ru',
                    customer_fields: {
                        visible: ['first_name', 'last_name'],
                        read_only: ['email'],
                    },
                },
                order: {
                    currency: 'BYN',
                    amount: data.amount,
                    description: data.description,
                },
                customer: {
                    email: data.customerEmail,
                },
            },
        };

        const response = await fetch('https://checkout.bepaid.by/ctp/api/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Version': '2',
                'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
            },
            body: JSON.stringify(checkoutData),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Payment API error: ${response.status} - ${error}`);
        }

        return response.json();
    }
}