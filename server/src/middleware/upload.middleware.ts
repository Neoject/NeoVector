import multer from 'multer';
import path from 'path';
import fs from 'fs';

const assetsDir = path.join(process.cwd(), 'assets');

if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, assetsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    },
});

const fileFilter = (_req: any, file: any, cb: any) => {
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'image/svg+xml', 'image/avif',
        'video/mp4', 'video/webm', 'video/ogg', 'video/m4v', 'video/avi', 'video/flv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 256 * 1024 * 1024, // 256MB for videos
    },
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount);