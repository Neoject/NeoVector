import dotenv from 'dotenv';

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
    port: parseNumber(process.env.PORT, 3000),
    dbHost: process.env.DB_HOST || 'localhost',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'neo_vector',
    sessionSecret: process.env.SESSION_SECRET || 'default_session_secret',
    jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
    email: {
        host: process.env.EMAIL_HOST || 'smtp.yandex.ru',
        port: parseNumber(process.env.EMAIL_PORT, 465),
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
        from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    },
    payment: {
        shopId: process.env.SHOP_ID || '',
        secretKey: process.env.SECRET_BEPAID_KEY || '',
    },
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    cleanupSecretKey: process.env.CLEANUP_SECRET_KEY || '',
};