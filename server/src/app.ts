import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { UserModel } from './models/User';
import { ProductModel } from './models/Product';
import { OrderModel } from './models/Order';
import { PageModel } from './models/Page';
import { CategoryModel } from './models/Category';
import { VisitTracker } from './models/VisitTracker';
import { ParamsModel } from './models/Params';
import router from './routes';

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

/*app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin.includes(env.dbHost)) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
}));*/

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? false
        : 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
app.use(express.static(path.join(process.cwd(), '')));
app.use(VisitTracker.middleware);
app.use('/api', router);

app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(process.cwd(), '', 'index.html'));
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

async function start() {
    try {
        await UserModel.createTable();
        await ProductModel.createTables();
        await OrderModel.createTable();
        await PageModel.createTable();
        await CategoryModel.createTable();
        await ParamsModel.createTable();
        await VisitTracker.createTable();
        await UserModel.ensureAdmin();

        console.log('Database initialized successfully');

        app.listen(env.port, () => {
            console.log(`Server running on port ${env.port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();