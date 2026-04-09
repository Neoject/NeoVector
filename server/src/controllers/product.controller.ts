import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ProductModel } from '../models/Product';
import { CategoryModel } from '../models/Category';
import { AiService } from '../services/ai.service';

export class ProductController {
    static async getProducts(req: Request, res: Response): Promise<void> {
        const products = await ProductModel.getAll();

        const productsWithMedia = await Promise.all(
            products.map(async (product) => {
                const fullProduct = await ProductModel.getProductWithMedia(product.id);
                return fullProduct;
            })
        );

        res.json(productsWithMedia);
    }

    static async getProduct(req: Request, res: Response): Promise<void> {
        const idParam = req.params.id;
        const id = typeof idParam === 'string' ? parseInt(idParam) : NaN;

        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid product id' });
            return;
        }

        const product = await ProductModel.getProductWithMedia(id);
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json(product);
    }

    static async addProduct(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const {
            name, description, peculiarities, material, price, price_sale,
            category, product_type_id, image, image_description,
        } = req.body;

        if (!name || typeof name !== 'string' || !price || !category || typeof category !== 'string') {
            res.status(400).json({ error: 'Required fields missing' });
            return;
        }

        let peculiaritiesArray: any[] = [];
        if (peculiarities) {
            if (typeof peculiarities === 'string') {
                peculiaritiesArray = JSON.parse(peculiarities);
            } else if (Array.isArray(peculiarities)) {
                peculiaritiesArray = peculiarities;
            }
        }

        const productId = await ProductModel.create(
            {
                name,
                description: typeof description === 'string' ? description : '',
                peculiarities: peculiaritiesArray,
                material: typeof material === 'string' ? material : '',
                price: typeof price === 'string' ? parseFloat(price) : (typeof price === 'number' ? price : 0),
                price_sale: price_sale ? (typeof price_sale === 'string' ? parseFloat(price_sale) : (typeof price_sale === 'number' ? price_sale : null)) : null,
                category,
                product_type_id: product_type_id ? (typeof product_type_id === 'string' ? parseInt(product_type_id) : (typeof product_type_id === 'number' ? product_type_id : null)) : null,
                image: typeof image === 'string' ? image : '',
                image_description: typeof image_description === 'string' ? image_description : '',
            },
            req.userId
        );

        res.json({ success: true, id: productId, image: typeof image === 'string' ? image : '' });
    }

    static async updateProduct(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const idParam = req.params.id;
        const id = typeof idParam === 'string' ? parseInt(idParam) : NaN;

        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid product id' });
            return;
        }

        const {
            name, description, peculiarities, material, price, price_sale,
            category, product_type_id, image, image_description,
        } = req.body;

        let peculiaritiesArray: any[] = [];
        if (peculiarities) {
            if (typeof peculiarities === 'string') {
                peculiaritiesArray = JSON.parse(peculiarities);
            } else if (Array.isArray(peculiarities)) {
                peculiaritiesArray = peculiarities;
            }
        }

        const updated = await ProductModel.update(
            id,
            {
                name: typeof name === 'string' ? name : '',
                description: typeof description === 'string' ? description : '',
                peculiarities: peculiaritiesArray,
                material: typeof material === 'string' ? material : '',
                price: typeof price === 'string' ? parseFloat(price) : (typeof price === 'number' ? price : 0),
                price_sale: price_sale ? (typeof price_sale === 'string' ? parseFloat(price_sale) : (typeof price_sale === 'number' ? price_sale : null)) : null,
                category: typeof category === 'string' ? category : '',
                product_type_id: product_type_id ? (typeof product_type_id === 'string' ? parseInt(product_type_id) : (typeof product_type_id === 'number' ? product_type_id : null)) : null,
                image: typeof image === 'string' ? image : '',
                image_description: typeof image_description === 'string' ? image_description : '',
            },
            req.userId
        );

        if (updated) {
            res.json({ success: true, image: typeof image === 'string' ? image : '' });
        } else {
            res.status(500).json({ error: 'Failed to update product' });
        }
    }

    static async deleteProduct(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const idParam = req.params.id;
        const id = typeof idParam === 'string' ? parseInt(idParam) : NaN;

        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid product id' });
            return;
        }

        const deleted = await ProductModel.delete(id);
        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to delete product' });
        }
    }

    static async saveProductsOrder(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { products_order } = req.body;

        let order: any[] = [];
        if (typeof products_order === 'string') {
            order = JSON.parse(products_order);
        } else if (Array.isArray(products_order)) {
            order = products_order;
        }

        if (!Array.isArray(order)) {
            res.status(400).json({ error: 'Invalid data format' });
            return;
        }

        const orderData = order.map((id, index) => ({
            id: typeof id === 'string' ? parseInt(id) : (typeof id === 'number' ? id : 0),
            sort_order: index
        }));

        await ProductModel.updateSortOrder(orderData, req.userId);
        res.json({ success: true });
    }

    static async uploadMedia(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const url = `/assets/${req.file.filename}`;
        const isVideo = req.file.mimetype.startsWith('video/');
        res.json({ success: true, url, isVideo });
    }

    static async addProductImages(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const productIdParam = req.body.product_id;
        const productId = typeof productIdParam === 'string' ? parseInt(productIdParam) : (typeof productIdParam === 'number' ? productIdParam : NaN);

        if (isNaN(productId) || productId <= 0) {
            res.status(400).json({ error: 'Invalid product id' });
            return;
        }

        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }

        const uploadedImages: string[] = [];
        const uploadedVideos: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const url = `/assets/${file.filename}`;
            const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';

            await ProductModel.addImage(productId, url, fileType, req.userId, i);

            if (fileType === 'video') {
                uploadedVideos.push(url);
            } else {
                uploadedImages.push(url);
            }
        }

        res.json({
            success: true,
            uploaded_images: uploadedImages,
            uploaded_videos: uploadedVideos,
        });
    }

    static async deleteProductImage(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const imageIdParam = req.body.image_id;
        const imageId = typeof imageIdParam === 'string' ? parseInt(imageIdParam) : (typeof imageIdParam === 'number' ? imageIdParam : NaN);

        if (isNaN(imageId) || imageId <= 0) {
            res.status(400).json({ error: 'Invalid image id' });
            return;
        }

        const imagePath = await ProductModel.deleteImage(imageId);
        if (imagePath) {
            const fullPath = path.join(process.cwd(), imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    }

    static async generateDescription(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: 'Product name is required' });
            return;
        }

        const description = await AiService.generateProductDescription(name);
        res.json({ description });
    }

    static async changeVisibility(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const idParam = req.body.id;
        const visibilityParam = req.body.visibility;

        const id = typeof idParam === 'string' ? parseInt(idParam) : (typeof idParam === 'number' ? idParam : NaN);
        const visibility = typeof visibilityParam === 'string' ? parseInt(visibilityParam) : (typeof visibilityParam === 'number' ? visibilityParam : NaN);

        if (isNaN(id) || id <= 0) {
            res.status(400).json({ error: 'Invalid product id' });
            return;
        }

        if (visibility !== 0 && visibility !== 1) {
            res.status(400).json({ error: 'Invalid visibility value' });
            return;
        }

        const updated = await ProductModel.updateVisibility(id, visibility, req.userId);
        if (updated) {
            res.json({ success: true, visibility });
        } else {
            res.status(500).json({ error: 'Failed to update visibility' });
        }
    }

    static async getOptions(req: Request, res: Response): Promise<void> {
        const typeIdParam = req.query.type_id;
        const typeId = typeof typeIdParam === 'string' ? parseInt(typeIdParam) : NaN;

        const options = await ProductModel.getOptions(isNaN(typeId) ? 0 : typeId);
        res.json({ options });
    }

    static async saveOptions(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let options: any[] = [];
        const optionTypes = req.body.option_types || req.body.product_options;

        if (typeof optionTypes === 'string') {
            options = JSON.parse(optionTypes);
        } else if (Array.isArray(optionTypes)) {
            options = optionTypes;
        }

        const typeIdParam = req.body.type_id;
        const typeId = typeof typeIdParam === 'string' ? parseInt(typeIdParam) : (typeof typeIdParam === 'number' ? typeIdParam : 0);

        await ProductModel.saveOptions(options, typeId);
        res.json({ success: true });
    }

    static async getTypes(req: Request, res: Response): Promise<void> {
        const types = await ProductModel.getTypes();
        res.json({ types });
    }

    static async saveTypes(req: Request, res: Response): Promise<void> {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let types: any[] = [];
        const typesData = req.body.types;

        if (typeof typesData === 'string') {
            types = JSON.parse(typesData);
        } else if (Array.isArray(typesData)) {
            types = typesData;
        }

        await ProductModel.saveTypes(types);
        res.json({ success: true });
    }
}