<?php

namespace NeoVector;

class Params
{
    public function __construct()
    {
        self::createTable();
    }

    /**
     * @return void
     */
    public static function createTable(): void
    {
        $sql = "CREATE TABLE IF NOT EXISTS `params` (
            `id` int(255) NOT NULL AUTO_INCREMENT,
            `key` varchar(50) NOT NULL,
            `value` varchar(255) NOT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        Database::db()->query($sql);
    }

    /**
     * @return array
     */
    public static function getDescription(): array
    {
        return Database::getList('params');
    }

    public static function setParam()
    {

    }

    public static function getParams(array $filter = []): array
    {
        return Database::getList('params', $filter);
    }

    /**
     * @return void
     */
    public static function handleUploadLogo(): void
    {
        Auth::requireAuth();

        if (!isset($_FILES['logo']) || ($_FILES['logo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Service::sendError(400, 'Логотип не загружен');
        }

        $file = $_FILES['logo'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        $fileType = $file['type'] ?? '';

        if (!in_array($fileType, $allowedTypes, true)) {
            Service::sendError(400, 'Недопустимый тип файла. Разрешены JPEG, PNG, GIF, WebP и SVG.');
        }

        $fileSize = (int) ($file['size'] ?? 0);

        if ($fileSize > 5 * 1024 * 1024) {
            Service::sendError(400, 'Слишком большой файл. Максимум 5 МБ.');
        }

        $uploadDir = dirname(__DIR__) . '/assets/logo/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $extension = pathinfo($file['name'] ?? 'logo', PATHINFO_EXTENSION) ?: 'png';
        $fileName = 'site_logo.' . $extension;
        $filePath = $uploadDir . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            Service::sendError(500, 'Не удалось сохранить логотип');
        }

        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
        $baseUrl = '';

        if (isset($_SERVER['HTTP_HOST'])) {
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
            $baseUrl = $protocol . '://' . $_SERVER['HTTP_HOST'] . $scriptDir;
        }

        $url = $baseUrl . '/assets/logo/' . $fileName;
        Service::sendJson(['success' => true, 'url' => $url]);
    }

    /**
     * @return void
     */
    public static function handleUploadBackgroundImage(): void
    {
        Auth::requireAuth();

        if (!isset($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Service::sendError(400, 'No image uploaded');
        }

        $file = $_FILES['image'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $fileType = $file['type'] ?? '';

        if (!in_array($fileType, $allowedTypes, true)) {
            Service::sendError(400, 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
        }

        $fileSize = (int) ($file['size'] ?? 0);

        if ($fileSize > 5 * 1024 * 1024) {
            Service::sendError(400, 'File size too large. Maximum 5MB allowed.');
        }

        $uploadDir = dirname(__DIR__) . '/assets/backgrounds/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $extension = pathinfo($file['name'] ?? 'bg', PATHINFO_EXTENSION);
        $fileName = 'bg_' . uniqid() . '.' . $extension;
        $filePath = $uploadDir . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            Service::sendError(500, 'Failed to upload image');
        }

        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
        $baseUrl = '';

        if (isset($_SERVER['HTTP_HOST'])) {
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
            $baseUrl = $protocol . '://' . $_SERVER['HTTP_HOST'] . $scriptDir;
        }

        $url = $baseUrl . '/assets/backgrounds/' . $fileName;
        Service::sendJson(['success' => true, 'url' => $url]);
    }

    private static function handleGetParams(): void
    {
        /*$createParamsTableSQL = "CREATE TABLE IF NOT EXISTS `params` (
            `id` INT AUTO_INCREMENT,
            `title` VARCHAR(255) NOT NULL,
            `description` TEXT NOT NULL,
            `image_meta_tags` TEXT NOT NULL,
            `pickup_address` VARCHAR(255) NOT NULL,
            `work_hours` VARCHAR(255) NOT NULL,
            `store_phone` VARCHAR(255) NOT NULL,
            `delivery_belarus` INT(255) NOT NULL,
            `delivery_russia` INT(255) NOT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";

        Database::db()->query($createParamsTableSQL);*/

        $stmt = Database::db()->prepare("SELECT * FROM params");
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $stmt->close();

            Service::sendJson([
                'success' => true,
                'title' => $row['title'],
                'description' => $row['description'],
                'image_meta_tags' => $row['image_meta_tags'],
                'pickup_address' => $row['pickup_address'],
                'work_hours' => $row['work_hours'],
                'store_phone' => $row['store_phone'],
                'delivery_bel' => $row['delivery_belarus'],
                'delivery_rus' => $row['delivery_russia'],
            ]);
        } else {
            $stmt->close();

            Service::sendJson([
                'success' => true,
                'title' => '',
                'description' => '',
                'image_meta_tags' => '',
                'pickup_address' => '',
                'work_hours' => '',
                'store_phone' => '',
                'delivery_bel' => '',
                'delivery_rus' => '',
            ]);
        }
    }
}