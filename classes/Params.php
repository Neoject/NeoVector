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
    public static function uploadLogo(): void
    {
        Service::sendJson(['success' => true, 'url' => self::uploadImage('logo')]);
    }

    /**
     * @return void
     */
    public static function uploadBackground(): void
    {
        Service::sendJson(['success' => true, 'url' => self::uploadImage('background')]);
    }

    /**
     * @param string $dir
     * @return string
     */
    private static function uploadImage(string $dir): string
    {
        Auth::requireAuth();

        $file = self::validateUploadedFile('image', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

        $uploadDir = dirname(__DIR__) . '/assets/' . $dir . '/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = uniqid() . '.' . $extension;

        if (!move_uploaded_file($file['tmp_name'], $uploadDir . $fileName)) {
            Service::sendError(500, 'Failed to upload image');
        }

        $relativePath = '/assets/' . $dir .'/' . $fileName;

        Database::execute(
            'INSERT INTO params (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
            [$dir, $relativePath]
        );

        return $relativePath;
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