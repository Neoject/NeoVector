import dotenv from 'dotenv';

dotenv.config();

export const env = {
    port: parseInt(process.env.PORT || '3000'),
    dbHost: process.env.DB_HOST || 'localhost',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'neo_vector',
    sessionSecret: process.env.SESSION_SECRET || 'default_secret',
    jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
    email: {
        host: process.env.EMAIL_HOST || 'smtp.yandex.ru',
        port: parseInt(process.env.EMAIL_PORT || '465'),
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

console.log(env);