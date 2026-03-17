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
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_key` (`key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        Database::db()->query($sql);
    }

    /**
     * @return array
     */
    public static function getDescription(): array
    {
        self::createTable();
        return Database::getList('params');
    }

    public static function set($data): bool
    {
        return Database::insert('params', $data);
    }

    public static function update($data, $id): bool
    {
        return Database::update('params', $data, ['id' => $id]);
    }

    public static function delete($id): bool
    {
        return Database::delete('params', $id);
    }

    /**
     * @param array $keys
     * @return array
     */
    public static function get(array $keys = []): array
    {
        $all = array_column(Database::getList('params'), 'value', 'key');

        if (empty($keys)) {
            return $all;
        }

        return array_intersect_key($all, array_flip($keys));
    }

    /**
     * @return string
     */
    public static function getTitle(): string
    {
        return self::get(['title'])['title'] ?? 'error';
    }

    /**
     * @param $data
     * @return void
     */
    public static function save($data): void
    {
        Auth::requireAuth();

        $fields = [
            'logo' => trim($data['logo'] ?? ''),
            'title' => trim((string) ($data['title'] ?? '')),
            'description' => trim((string) ($data['description'] ?? '')),
            'image_meta_tags' => trim((string) ($data['image_meta_tags'] ?? '')),
            'pickup_address' => trim((string) ($data['pickup_address'] ?? '')),
            'work_hours' => trim((string) ($data['work_hours'] ?? '')),
            'store_phone' => trim((string) ($data['store_phone'] ?? '')),
            'delivery_bel' => Service::formatNumber(trim((string) ($data['delivery_bel'] ?? ''))),
            'delivery_rus' => Service::formatNumber(trim((string) ($data['delivery_rus'] ?? ''))),
        ];

        $placeholders = implode(', ', array_fill(0, count($fields), '(?, ?)'));
        $sql = 'INSERT INTO params (`key`, `value`) VALUES ' . $placeholders . '
            ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)';

        $bindings = [];

        foreach ($fields as $key => $value) {
            $bindings[] = $key;
            $bindings[] = $value;
        }

        Database::execute($sql, $bindings);

        Service::sendJson(['success' => true]);
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
}