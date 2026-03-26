<?php

namespace NeoVector\Product;

use Exception;
use NeoVector\Auth;
use NeoVector\Config;
use NeoVector\Database;
use NeoVector\Log;
use NeoVector\Service;

class Product
{
    /**
     * @return void
     */
    private static function createTables(): void
    {
        $db = Database::db();

        $sql = "CREATE TABLE IF NOT EXISTS `products` (
            `id` int(255) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `description` text DEFAULT NULL,
            `peculiarities` varchar(255) NOT NULL,
            `material` varchar(255) NOT NULL,
            `price` int(255) NOT NULL,
            `price_sale` int(255) NULL,
            `category` varchar(64) NOT NULL,
            `product_type_id` int(11) DEFAULT NULL,
            `image` varchar(255) NOT NULL,
            `image_description` text NOT NULL,
            `visibility` int(255) NOT NULL DEFAULT '1',
            `sort_order` int(11) DEFAULT 0,
            `created_by` int(255) NOT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `last_changed_by` int(255) NOT NULL,
            `last_changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        if (!$db->query($sql)) {
            Log::error('Failed to create products table', $db->error);
        }

        $sqlImages = "CREATE TABLE IF NOT EXISTS `product_images` (
            `id` int(255) NOT NULL AUTO_INCREMENT,
            `product_id` int(255) NOT NULL,
            `image_path` varchar(255) NOT NULL,
            `file_type` enum('image','video') DEFAULT 'image',
            `sort_order` int(11) DEFAULT 0,
            `uploaded_by` int(255) NOT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        if (!$db->query($sqlImages)) {
            Log::error('Failed to create product_images table', $db->error);
        }
    }

    /**
     * @return array
     */
    private static function getAll(): array
    {
        $db = Database::db();
        $stmt = $db->prepare('SELECT * FROM products ORDER BY sort_order, id');

        if (!$stmt) {
            Log::error('Failed to prepare statement in getAll', $db->error);
            return [];
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $products = [];

        while ($row = $result->fetch_assoc()) {
            $imagesStmt = $db->prepare('SELECT image_path, file_type FROM product_images WHERE product_id = ? ORDER BY sort_order');

            if (!$imagesStmt) {
                Log::error('Failed to prepare images statement', $db->error);
                $imagesResult = null;
            } else {
                $imagesStmt->bind_param('i', $row['id']);
                $imagesStmt->execute();
                $imagesResult = $imagesStmt->get_result();
            }

            $additionalImages = [];
            $additionalVideos = [];

            if ($imagesResult) {
                while ($imageRow = $imagesResult->fetch_assoc()) {
                    if ($imageRow['file_type'] === 'video') {
                        $additionalVideos[] = $imageRow['image_path'];
                    } else {
                        $additionalImages[] = $imageRow['image_path'];
                    }
                }
            }

            if ($imagesStmt) {
                $imagesStmt->close();
            }

            $price = isset($row['price']) ? (float) $row['price'] / 100 : 0.0;
            $priceSale = (isset($row['price_sale']) && $row['price_sale'] !== null)
                ? (float) $row['price_sale'] / 100
                : null;

            $products[] = [
                'id' => (int) $row['id'],
                'name' => $row['name'],
                'description' => $row['description'],
                'peculiarities' => $row['peculiarities'] ? json_decode($row['peculiarities'], true) : [],
                'material' => $row['material'],
                'price' => $price,
                'price_sale' => $priceSale,
                'category' => $row['category'],
                'product_type_id' => isset($row['product_type_id']) ? (int) $row['product_type_id'] : null,
                'image' => $row['image'],
                'image_description' => $row['image_description'],
                'additional_images' => $additionalImages,
                'additional_videos' => $additionalVideos,
                'visibility' => $row['visibility'],
                'sort_order' => $row['sort_order'],
                'created_by' => $row['created_by'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['last_changed_at'],
                'updated_by' => $row['last_changed_by'],
            ];
        }

        $stmt->close();

        return $products;
    }

    /**
     * @param array $order
     * @return bool
     */
    private static function updateOrder(array $order): bool
    {
        $db = Database::db();
        $stmt = $db->prepare('UPDATE products SET sort_order = ?, last_changed_at = CURRENT_TIMESTAMP, last_changed_by = ? WHERE id = ?');

        if (!$stmt) {
            Log::error('Update statement failed', '');
            return false;
        }

        $userId = (int) $_SESSION['user_id'];

        foreach ($order as $index => $id) {
            $sortOrder = (int) $index;
            $productId = (int) $id;
            $stmt->bind_param('iii', $sortOrder, $userId, $productId);
            $stmt->execute();
        }

        $stmt->close();

        return true;
    }

    /**
     * @param $raw
     * @return int
     */
    private static function normalizePrice($raw): int
    {
        $value = is_numeric($raw) ? (string) $raw : trim((string) $raw);

        if ($value === '') {
            return 0;
        }

        $value = str_replace(',', '.', $value);

        if (!is_numeric($value)) {
            return 0;
        }

        $cents = (int) round(((float) $value) * 100);

        if ($cents < 0) {
            $cents = 0;
        }

        return $cents;
    }

    /**
     * @param array $file
     * @return string
     * @throws Exception
     */
    private static function storeUploadedMedia(array $file): string
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            $messages = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize.',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE.',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded.',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder.',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
                UPLOAD_ERR_EXTENSION => 'A server extension stopped the upload.',
            ];

            throw new Exception($messages[$error] ?? 'Upload error code ' . $error);
        }

        $tmpName = $file['tmp_name'] ?? '';

        if (!is_string($tmpName) || $tmpName === '' || !is_uploaded_file($tmpName)) {
            throw new Exception('Invalid or missing uploaded file.');
        }

        $assetsDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR;

        if (!is_dir($assetsDir)) {
            if (!mkdir($assetsDir, 0755, true)) {
                throw new Exception('Could not create assets directory.');
            }
        }

        $fileType = (string) ($file['type'] ?? '');
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg', 'video/m4v', 'video/avi', 'video/flv'];
        $isVideo = strpos($fileType, 'video/') !== false;
        $maxSize = $isVideo ? (256 * 1024 * 1024) : (64 * 1024 * 1024);

        if (!in_array($fileType, $allowedTypes, true)) {
            throw new Exception('Invalid file type. Only images and videos are allowed.');
        }

        if ((int) ($file['size'] ?? 0) > $maxSize) {
            $sizeLimit = $isVideo ? '256MB' : '64MB';
            throw new Exception('File too large. Maximum size is ' . $sizeLimit . '.');
        }

        $fileName = (string) ($file['name'] ?? 'upload');
        $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
        $newFileName = uniqid() . '_' . time() . ($fileExtension ? ('.' . $fileExtension) : '');
        $uploadPath = $assetsDir . $newFileName;

        if (!move_uploaded_file($tmpName, $uploadPath)) {
            throw new Exception('Failed to save uploaded file.');
        }

        return 'assets/' . $newFileName;
    }

    /**
     * @return void
     */
    public static function getProducts(): void
    {
        self::createTables();
        $products = self::getAll();
        Service::sendJson($products);
    }

    /**
     * @return void
     */
    public static function saveProductsOrder(): void
    {
        Auth::requireAuth();
        $orderJson = $_POST['products_order'] ?? '[]';
        $order = json_decode($orderJson, true);

        if (!is_array($order)) {
            Service::sendError(400, 'Invalid data format');
        }

        self::updateOrder($order);
        Service::sendJson(['success' => true]);
    }

    /**
     * @return void
     * @throws Exception
     */
    public static function addProduct(): void
    {
        Auth::requireAuth();

        $name = $_POST['name'] ?? '';
        $description = $_POST['description'] ?? '';
        $peculiarities = $_POST['peculiarities'] ?? '[]';
        $material = $_POST['material'] ?? '';
        $priceRaw = $_POST['price'] ?? 0;
        $priceSaleRaw = $_POST['price_sale'] ?? 0;

        $price = self::normalizePrice($priceRaw);
        $priceSale = self::normalizePrice($priceSaleRaw);

        $category = $_POST['category'] ?? '';
        $productTypeId = (int) ($_POST['product_type_id'] ?? 0);
        $image = $_POST['image'] ?? '';
        $imageDescription = $_POST['image_description'] ?? '';

        if (isset($_FILES['product_image']) && $_FILES['product_image']['error'] === UPLOAD_ERR_OK) {
            $image = self::storeUploadedMedia($_FILES['product_image']);
        }

        $db = Database::db();
        $userId = (int) $_SESSION['user_id'];
        $stmt = $db->prepare('INSERT INTO products (name, description, peculiarities, material, price, price_sale, category, product_type_id, image, image_description, created_by, last_changed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('ssssiisissii', $name, $description, $peculiarities, $material, $price, $priceSale, $category, $productTypeId, $image, $imageDescription, $userId, $userId);

        if ($stmt->execute()) {
            $id = $db->insert_id;
            $stmt->close();
            Service::sendJson(['success' => true, 'id' => $id, 'image' => $image]);
        }

        $err = $stmt->error;
        $stmt->close();
        Service::sendError(500, $err ?: 'Failed to add product');
    }

    /**
     * @return void
     * @throws Exception
     */
    public static function updateProduct(): void
    {
        Auth::requireAuth();

        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            Service::sendError(400, 'Invalid product id');
        }

        $name = $_POST['name'] ?? '';
        $description = $_POST['description'] ?? '';
        $peculiarities = $_POST['peculiarities'] ?? '[]';
        $material = $_POST['material'] ?? '';
        $priceRaw = $_POST['price'] ?? 0;
        $priceSaleRaw = $_POST['price_sale'] ?? 0;

        $price = self::normalizePrice($priceRaw);
        $priceSale = self::normalizePrice($priceSaleRaw);

        $category = $_POST['category'] ?? '';
        $productTypeId = (int) ($_POST['product_type_id'] ?? 0);
        $image = $_POST['image'] ?? '';
        $imageDescription = $_POST['image_description'] ?? '';

        if (isset($_FILES['product_image']) && $_FILES['product_image']['error'] === UPLOAD_ERR_OK) {
            $image = self::storeUploadedMedia($_FILES['product_image']);
        }

        $db = Database::db();
        $userId = (int) $_SESSION['user_id'];
        $stmt = $db->prepare('UPDATE products SET name = ?, description = ?, peculiarities = ?, material = ?, price = ?, price_sale = ?, category = ?, product_type_id = ?, image = ?, image_description = ?, last_changed_by = ?, last_changed_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->bind_param('ssssiisissii', $name, $description, $peculiarities, $material, $price, $priceSale, $category, $productTypeId, $image, $imageDescription, $userId, $id);

        if ($stmt->execute()) {
            $stmt->close();
            Service::sendJson(['success' => true, 'image' => $image]);
        }

        $err = $stmt->error;
        $stmt->close();
        Service::sendError(500, $err ?: 'Failed to update product');
    }

    /**
     * @return void
     */
    public static function deleteProduct(): void
    {
        Auth::requireAuth();
        $id = (int) ($_POST['id'] ?? 0);
        if ($id <= 0) {
            Service::sendError(400, 'Invalid product id');
        }
        $db = Database::db();

        if ($db->query('DELETE FROM products WHERE id = ' . $id)) {
            Service::sendJson(['success' => true]);
        }

        Service::sendError(500, $db->error ?: 'Failed to delete product');
    }

    /**
     * @return void
     * @throws Exception
     */
    public static function uploadProductMedia(): void
    {
        Auth::requireAuth();

        if (!isset($_FILES['file'])) {
            Service::sendError(400, 'No file uploaded');
        }

        $url = self::storeUploadedMedia($_FILES['file']);
        $fileType = $_FILES['file']['type'] ?? '';
        $isVideo = strpos($fileType, 'video/') !== false;
        Service::sendJson(['success' => true, 'url' => $url, 'isVideo' => $isVideo]);
    }

    /**
     * @return void
     */
    public static function addProductImages(): void
    {
        Auth::requireAuth();

        $productId = (int) ($_POST['product_id'] ?? 0);

        if ($productId <= 0) {
            Service::sendError(400, 'Invalid product id');
        }

        if (!isset($_FILES['additional_images']) || !is_array($_FILES['additional_images']['name'])) {
            Service::sendError(400, 'No images provided');
        }

        $uploadedImages = [];
        $uploadedVideos = [];
        $errors = [];

        $db = Database::db();
        $count = count($_FILES['additional_images']['name']);

        for ($i = 0; $i < $count; $i++) {
            if (($_FILES['additional_images']['error'][$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                continue;
            }

            $file = [
                'name' => $_FILES['additional_images']['name'][$i],
                'type' => $_FILES['additional_images']['type'][$i],
                'tmp_name' => $_FILES['additional_images']['tmp_name'][$i],
                'error' => $_FILES['additional_images']['error'][$i],
                'size' => $_FILES['additional_images']['size'][$i],
            ];

            try {
                $relative = self::storeUploadedMedia($file);
                $fileTypeInDB = strpos(($file['type'] ?? ''), 'video/') !== false ? 'video' : 'image';

                $userId = (int) $_SESSION['user_id'];
                $stmt = $db->prepare('INSERT INTO product_images (product_id, image_path, file_type, sort_order, uploaded_by) VALUES (?, ?, ?, ?, ?)');
                $sortOrder = $i;
                $stmt->bind_param('issii', $productId, $relative, $fileTypeInDB, $sortOrder, $userId);

                if ($stmt->execute()) {
                    if ($fileTypeInDB === 'video') {
                        $uploadedVideos[] = $relative;
                    } else {
                        $uploadedImages[] = $relative;
                    }
                } else {
                    $errors[] = 'DB error for ' . ($file['name'] ?? 'file');
                }

                $stmt->close();
            } catch (Exception $e) {
                $errors[] = $e->getMessage();
            }
        }

        if ($uploadedImages || $uploadedVideos) {
            $resp = ['success' => true, 'errors' => $errors];

            if ($uploadedImages)
                $resp['uploaded_images'] = $uploadedImages;
            if ($uploadedVideos)
                $resp['uploaded_videos'] = $uploadedVideos;

            Service::sendJson($resp);
        }

        http_response_code(400);

        Log::error('Error uploading product images', $errors);
        Service::sendJson(['error' => 'No files uploaded', 'errors' => $errors]);
    }

    /**
     * @return void
     */
    public static function getImageId(): void
    {
        Auth::requireAuth();
        $productId = (int) ($_GET['product_id'] ?? 0);
        $imagePath = (string) ($_GET['image_path'] ?? '');

        if ($productId <= 0 || $imagePath === '') {
            Service::sendError(400, 'Invalid parameters');
        }

        $db = Database::db();
        $stmt = $db->prepare('SELECT id FROM product_images WHERE product_id = ? AND image_path = ?');
        $stmt->bind_param('is', $productId, $imagePath);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($row = $res->fetch_assoc()) {
            $stmt->close();
            Service::sendJson(['image_id' => (int) $row['id']]);
        }

        $stmt->close();
        http_response_code(404);
        Service::sendJson(['error' => 'Image not found']);
    }

    /**
     * @return void
     */
    public static function deleteProductImage(): void
    {
        Auth::requireAuth();
        $imageId = (int) ($_POST['image_id'] ?? 0);

        if ($imageId <= 0) {
            Service::sendError(400, 'Invalid image id');
        }

        $db = Database::db();
        $stmt = $db->prepare('SELECT image_path FROM product_images WHERE id = ?');
        $stmt->bind_param('i', $imageId);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();
        $stmt->close();

        if (!$row) {
            http_response_code(404);
            Service::sendJson(['error' => 'Image not found']);
        }

        $imagePath = (string) $row['image_path'];
        $del = $db->prepare('DELETE FROM product_images WHERE id = ?');
        $del->bind_param('i', $imageId);

        if ($del->execute()) {
            $del->close();
            $fullPath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, ltrim($imagePath, '/\\'));

            if (is_file($fullPath)) {
                @unlink($fullPath);
            }

            Service::sendJson(['success' => true]);
        }

        $err = $del->error;
        $del->close();
        Service::sendError(500, $err ?: 'Failed to delete image');
    }

    /**
     * @return void
     */
    public static function generateProductDescription(): void
    {
        Auth::requireAuth();

        $productName = trim((string) ($_POST['name'] ?? ''));

        if ($productName === '') {
            Service::sendError(400, 'Необходимо указать название товара');
        }

        $apiKey = Config::get('DEEPSEEK_API_KEY');

        if (!$apiKey) {
            Service::sendError(500, 'DeepSeek API key is not configured');
        }

        $payload = [
            'model' => 'deepseek-chat',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'Ты креативный маркетолог премиального бренда аксессуаров для часов. Создавай ёмкие описания (до 3 предложений) с акцентом на материалы, тактильные ощущения и ценность товара.'
                ],
                [
                    'role' => 'user',
                    'content' => "Сгенерируй продающее описание ремня для часов под названием «{$productName}». Сделай текст живым, передай атмосферу роскоши и подчеркни выгоды для владельца."
                ]
            ],
            'temperature' => 0.85,
            'max_tokens' => 320
        ];

        $ch = curl_init('https://api.deepseek.com/chat/completions');

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: ' . 'Bearer ' . $apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

        $result = curl_exec($ch);
        $curlError = curl_error($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($result === false) {
            Service::sendError(500, 'Не удалось связаться с DeepSeek: ' . $curlError);
        }

        $responseData = json_decode($result, true);

        if ($status >= 400 || !$responseData || empty($responseData['choices'][0]['message']['content'])) {
            $apiError = $responseData['error']['message'] ?? 'Неизвестная ошибка DeepSeek';
            Service::sendError(500, 'AI error: ' . $apiError);
        }

        $description = trim($responseData['choices'][0]['message']['content']);
        Service::sendJson(['description' => $description]);
    }

    public static function changeVisibility(): void
    {
        Auth::requireAuth();

        $id = (int) ($_POST['id'] ?? 0);
        $visibility = $_POST['visibility'] ?? null;

        if ($id <= 0) {
            Service::sendError(400, 'Invalid product id');
        }

        if ($visibility === null || !in_array((int) $visibility, [0, 1], true)) {
            Service::sendError(400, 'Invalid visibility value');
        }

        $visibility = (int) $visibility;

        $db = Database::db();
        $userId = (int) $_SESSION['user_id'];

        $stmt = $db->prepare('UPDATE products SET visibility = ?, last_changed_by = ?, last_changed_at = CURRENT_TIMESTAMP WHERE id = ?');

        if (!$stmt) {
            Service::sendError(500, $db->error ?: 'Failed to prepare visibility update');
        }

        $stmt->bind_param('iii', $visibility, $userId, $id);

        if ($stmt->execute()) {
            $stmt->close();
            Service::sendJson(['success' => true, 'visibility' => $visibility]);
        }

        $err = $stmt->error;
        $stmt->close();
        Service::sendError(500, $err ?: 'Failed to update visibility');
    }
}