import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { env } from '../config/env';

export class AuthController {
    static async login(req: Request, res: Response): Promise<void> {
        const { username, password, remember } = req.body;

        if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }

        const user = await UserModel.validatePassword(username, password);
        if (!user) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            env.jwtSecret,
            { expiresIn: remember ? '30d' : '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
        });

        res.json({ success: true, role: user.role });
    }

    static async register(req: Request, res: Response): Promise<void> {
        const { username, password } = req.body;

        if (!username || typeof username !== 'string' ||
            !password || typeof password !== 'string') {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters long' });
            return;
        }

        const existing = await UserModel.findByUsername(username);
        if (existing) {
            res.status(409).json({ error: 'Username already taken' });
            return;
        }

        const user = await UserModel.create(username, password, 'user');
        if (!user) {
            res.status(500).json({ error: 'Failed to create user' });
            return;
        }

        res.status(201).json({ success: true });
    }

    static async logout(req: Request, res: Response): Promise<void> {
        res.clearCookie('token');
        res.json({ success: true });
    }

    static async me(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.json({ authenticated: false });
            return;
        }

        const user = await UserModel.findById(req.userId);
        if (!user) {
            res.json({ authenticated: false });
            return;
        }

        res.json({
            authenticated: true,
            id: user.id,
            username: user.username,
            role: user.role,
        });
    }

    static async getProfile(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const user = await UserModel.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ success: true, user });
    }

    static async updateProfile(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const { username } = req.body;
        if (!username || typeof username !== 'string') {
            res.status(400).json({ error: 'Username is required' });
            return;
        }

        const updated = await UserModel.updateUsername(req.userId, username);
        if (updated) {
            res.json({ success: true, message: 'Profile updated successfully' });
        } else {
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    static async changePassword(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const { current_password, new_password, confirm_password } = req.body;

        if (!current_password || typeof current_password !== 'string' ||
            !new_password || typeof new_password !== 'string' ||
            !confirm_password || typeof confirm_password !== 'string') {
            res.status(400).json({ error: 'All password fields are required' });
            return;
        }

        if (new_password !== confirm_password) {
            res.status(400).json({ error: 'New password and confirmation do not match' });
            return;
        }

        if (new_password.length < 6) {
            res.status(400).json({ error: 'New password must be at least 6 characters long' });
            return;
        }

        const user = await UserModel.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const isValid = await UserModel.validatePassword(user.username, current_password);
        if (!isValid) {
            res.status(401).json({ error: 'Current password is incorrect' });
            return;
        }

        const updated = await UserModel.updatePassword(req.userId, new_password);
        if (updated) {
            res.json({ success: true, message: 'Password changed successfully' });
        } else {
            res.status(500).json({ error: 'Failed to change password' });
        }
    }

    static async getUsers(req: Request, res: Response): Promise<void> {
        if (req.userRole !== 'admin') {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }

        const users = await UserModel.getAll();
        res.json(users);
    }
}