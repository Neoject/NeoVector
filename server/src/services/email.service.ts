import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: {
        user: env.email.user,
        pass: env.email.pass,
    },
});

export class EmailService {
    static async sendOrderConfirmation(order: any): Promise<boolean> {
        if (!order.customer_email) return false;

        const itemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${this.escapeHtml(item.name)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price * item.quantity} руб.</td>
      </tr>
    `).join('');

        const deliveryInfo = order.delivery_type === 'delivery'
            ? `<p><strong>Адрес доставки:</strong> ${this.escapeHtml(order.delivery_address)}</p>`
            : '<p>Вы сможете забрать заказ в нашем магазине.</p>';

        const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Спасибо за ваш заказ!</h2>
        <p>Здравствуйте, ${this.escapeHtml(order.customer_name)}!</p>
        <p>Ваш заказ №${order.id} успешно оформлен.</p>
        
        <h3>Детали заказа</h3>
        <p><strong>Способ доставки:</strong> ${order.delivery_type === 'delivery' ? 'Доставка' : 'Самовывоз'}</p>
        ${deliveryInfo}
        <p><strong>Способ оплаты:</strong> ${order.payment_type === 'online' ? 'Онлайн оплата' : 'Наличными при получении'}</p>
        
        <h3>Состав заказа</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; text-align: left;">Товар</th>
              <th style="padding: 10px; text-align: center;">Кол-во</th>
              <th style="padding: 10px; text-align: right;">Сумма</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Итого:</td>
              <td style="padding: 15px 10px; text-align: right; font-weight: bold;">${order.total_amount} руб.</td>
            </tr>
          </tfoot>
        </table>
        
        <p>Мы свяжемся с вами в ближайшее время для подтверждения заказа.</p>
      </body>
      </html>
    `;

        try {
            await transporter.sendMail({
                from: `"${env.email.user}" <${env.email.from}>`,
                to: order.customer_email,
                subject: `Подтверждение заказа №${order.id}`,
                html,
            });
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    static async sendOrderNotification(order: any): Promise<boolean> {
        const sellerEmail = env.email.user;
        if (!sellerEmail) return false;

        const itemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${this.escapeHtml(item.name)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price * item.quantity} руб.</td>
      </tr>
    `).join('');

        const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ff9800; padding: 20px; border-radius: 8px;">
          <h2 style="color: #fff;">Новый заказ!</h2>
          <p style="color: #fff; font-size: 18px;">Заказ №${order.id}</p>
        </div>
        
        <h3>Информация о клиенте</h3>
        <p><strong>Имя:</strong> ${this.escapeHtml(order.customer_name)}</p>
        <p><strong>Телефон:</strong> ${this.escapeHtml(order.customer_phone)}</p>
        ${order.customer_email ? `<p><strong>Email:</strong> ${this.escapeHtml(order.customer_email)}</p>` : ''}
        
        <h3>Состав заказа</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; text-align: left;">Товар</th>
              <th style="padding: 10px; text-align: center;">Кол-во</th>
              <th style="padding: 10px; text-align: right;">Сумма</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Итого:</td>
              <td style="padding: 15px 10px; text-align: right; font-weight: bold;">${order.total_amount} руб.</td>
            </tr>
          </tfoot>
        </table>
        
        <p>Пожалуйста, обработайте заказ в административной панели.</p>
      </body>
      </html>
    `;

        try {
            await transporter.sendMail({
                from: `"${env.email.user}" <${env.email.from}>`,
                to: sellerEmail,
                subject: `Новый заказ №${order.id}`,
                html,
            });
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    static async sendContactFormReply(to: string, subject: string, message: string): Promise<boolean> {
        const html = `
      <html>
      <head><meta charset="UTF-8"></head>
      <body>
        <p>${this.escapeHtml(message).replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color: #888; font-size: 12px;">Это ответ на ваше сообщение.</p>
      </body>
      </html>
    `;

        try {
            await transporter.sendMail({
                from: `"Администратор" <${env.email.from}>`,
                to,
                subject,
                html,
            });
            return true;
        } catch (error) {
            console.error('Reply sending failed:', error);
            return false;
        }
    }

    static async sendContactNotification(name: string, email: string, message: string): Promise<boolean> {
        const sellerEmail = env.email.user;
        if (!sellerEmail) return false;

        const html = `
      <html>
      <head><meta charset="UTF-8"></head>
      <body>
        <h3>Новое сообщение с формы обратной связи</h3>
        <p><strong>Имя:</strong> ${this.escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${this.escapeHtml(email)}</p>
        <p><strong>Сообщение:</strong></p>
        <p>${this.escapeHtml(message).replace(/\n/g, '<br>')}</p>
      </body>
      </html>
    `;

        try {
            await transporter.sendMail({
                from: `"${env.email.user}" <${env.email.from}>`,
                to: sellerEmail,
                subject: `Новое сообщение от ${name}`,
                html,
            });
            return true;
        } catch (error) {
            console.error('Notification sending failed:', error);
            return false;
        }
    }

    private static escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}