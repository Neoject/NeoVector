import { Request, Response } from 'express';
import { ContactMessageModel, MessageReplyModel } from '../models/ContactMessage';
import { EmailService } from '../services/email.service';

export class MailController {
    static async send(req: Request, res: Response): Promise<void> {
        const { name, email, message } = req.body;

        if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !message || typeof message !== 'string') {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        if (!this.isValidEmail(email)) {
            res.status(400).json({ error: 'Invalid email address' });
            return;
        }

        await ContactMessageModel.create(name, email, message);
        await EmailService.sendContactNotification(name, email, message);

        res.json({ success: true, message: 'Message sent successfully' });
    }

    static async getMessages(req: Request, res: Response): Promise<void> {
        const messages = await ContactMessageModel.getAll();
        res.json({ success: true, data: messages });
    }

    static async deleteMessage(req: Request, res: Response): Promise<void> {
        const idParam = req.params.id;
        const id = typeof idParam === 'string' ? parseInt(idParam) : NaN;

        if (isNaN(id) || id <= 0) {
            res.status(400).json({ error: 'Invalid message id' });
            return;
        }

        const deleted = await ContactMessageModel.delete(id);

        if (deleted) {
            res.json({ success: true, deleted_id: id });
        } else {
            res.status(500).json({ error: 'Failed to delete message' });
        }
    }

    static async sendReply(req: Request, res: Response): Promise<void> {
        const { messageId, to, subject, message } = req.body;

        if (!to || typeof to !== 'string' || !subject || typeof subject !== 'string' || !message || typeof message !== 'string') {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        if (!this.isValidEmail(to)) {
            res.status(400).json({ error: 'Invalid email address' });
            return;
        }

        const sent = await EmailService.sendContactFormReply(to, subject, message);

        if (sent) {
            await MessageReplyModel.create({
                message_id: typeof messageId === 'number' ? messageId : parseInt(messageId as string) || 0,
                subject,
                message,
                to_email: to,
                created_by: req.userId || 0,
            });
            res.json({ success: true, message: 'Reply sent successfully' });
        } else {
            res.status(500).json({ error: 'Failed to send reply' });
        }
    }

    static async getReplies(req: Request, res: Response): Promise<void> {
        const messageIdParam = req.query.message_id;
        const messageId = typeof messageIdParam === 'string' ? parseInt(messageIdParam) : NaN;

        if (isNaN(messageId) || messageId <= 0) {
            res.status(400).json({ error: 'Message ID is required' });
            return;
        }

        const replies = await MessageReplyModel.getByMessageId(messageId);
        res.json({ success: true, data: replies });
    }

    private static isValidEmail(email: string): boolean {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}