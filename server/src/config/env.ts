import dotenv from 'dotenv';

dotenv.config();

export const env = {
    port: process.env.PORT,
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
    sessionSecret: process.env.SESSION_SECRET,
    jwtSecret: process.env.JWT_SECRET,
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM,
    },
    payment: {
        shopId: process.env.SHOP_ID || '',
        secretKey: process.env.SECRET_BEPAID_KEY || '',
    },
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    cleanupSecretKey: process.env.CLEANUP_SECRET_KEY || '',
};