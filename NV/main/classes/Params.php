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

        Database::execute($sql);
    }

    /**
     * @param $data
     * @return bool
     */
    public static function set($data): bool
    {
        return Database::insert('params', $data);
    }

    /**
     * @param $data
     * @param $id
     * @return bool
     */
    public static function update($data, $id): bool
    {
        return Database::update('params', $data, ['id' => $id]);
    }

    /**
     * @param $id
     * @return bool
     */
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
        return self::get(['title'])['title'] ?? '';
    }

    public static function getLogo(): string
    {
        return self::get(['logo'])['logo'] ?? '';
    }

    public static function getDescription(): string
    {
        return self::get(['description'])['description'] ?? '';
    }

    /**
     * @param $data
     * @return void
     */
    public static function save($data): void
    {
        Auth::requireAuth();

        $fields = [
            'email' => trim((string) ($data['email'] ?? '')),
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
    public static function uploadLogo(): void
    {
        Auth::requireAuth();

        try {
            $file = self::validateUploadedFile('logo', ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);

            $rootPath = \defined('ROOT_PATH') ? \ROOT_PATH : dirname(__DIR__, 3);
            $uploadDir = $rootPath . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'logo' . DIRECTORY_SEPARATOR;

            if (!is_dir($uploadDir)) {
                if (!mkdir($uploadDir, 0755, true)) {
                    Service::sendError(500, 'Не удалось создать директорию для загрузки');
                    return;
                }
            }

            if (!is_writable($uploadDir)) {
                Service::sendError(500, 'Нет прав на запись в директорию: ' . $uploadDir);
                return;
            }

            $extension = pathinfo($file['name'] ?? 'logo', PATHINFO_EXTENSION) ?: 'png';
            $fileName = 'logo_' . uniqid() . '.' . $extension;
            $targetPath = $uploadDir . $fileName;

            if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
                Service::sendError(400, 'Файл не был загружен через HTTP POST');
                return;
            }

            if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                $error = error_get_last();
                Service::sendError(500, 'Не удалось сохранить логотип: ' . ($error['message'] ?? 'неизвестная ошибка'));
                return;
            }

            $relativePath = '/assets/logo/' . $fileName;

            Database::execute(
                'INSERT INTO params (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
                ['logo', $relativePath]
            );

            Service::sendJson(['success' => true, 'url' => $relativePath]);
        } catch (\Throwable $e) {
            Log::error('Logo loading error: ', $e->getMessage());
            Service::sendError(500, 'Ошибка загрузки логотипа');
        }
    }

    /**
     * @return void
     */
    public static function uploadBackground(): void
    {
        Auth::requireAuth();

        $file = self::validateUploadedFile('image', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

        $rootPath = \defined('ROOT_PATH') ? \ROOT_PATH : dirname(__DIR__, 3);
        $uploadDir = $rootPath . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'backgrounds' . DIRECTORY_SEPARATOR;

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $extension = pathinfo($file['name'] ?? 'bg', PATHINFO_EXTENSION);
        $fileName = 'bg_' . uniqid() . '.' . $extension;

        if (!move_uploaded_file($file['tmp_name'], $uploadDir . $fileName)) {
            Service::sendError(500, 'Failed to upload image');
        }

        $relativePath = '/assets/backgrounds/' . $fileName;

        Database::execute(
            'INSERT INTO params (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
            ['background', $relativePath]
        );

        Service::sendJson(['success' => true, 'url' => $relativePath]);
    }

    /**
     * @param string $field
     * @param array $allowedTypes
     * @param int $maxSize
     * @return array
     */
    private static function validateUploadedFile(string $field, array $allowedTypes, int $maxSize = 5 * 1024 * 1024): array
    {
        if (!isset($_FILES[$field]) || ($_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Service::sendError(400, 'Файл не загружен');
        }

        $file = $_FILES[$field];

        if (!in_array($file['type'] ?? '', $allowedTypes, true)) {
            Service::sendError(400, 'Недопустимый тип файла: ' . implode(', ', $allowedTypes));
        }

        if ((int) ($file['size'] ?? 0) > $maxSize) {
            Service::sendError(400, 'Слишком большой файл. Максимум ' . ($maxSize / 1024 / 1024) . ' МБ.');
        }

        return $file;
    }
}