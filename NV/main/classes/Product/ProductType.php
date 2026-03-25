<?php

namespace NeoVector\Product;

use NeoVector\Database;
use NeoVector\Log;
use NeoVector\Service;

class ProductType
{
    /**
     * Создаёт таблицу типов товаров при необходимости.
     *
     * @return void
     */
    private static function createTables(): void
    {
        $db = Database::db();

        $db->query("CREATE TABLE IF NOT EXISTS `product_types` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `sort_order` int(11) DEFAULT 0,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `name_unique` (`name`)
        )");
    }

    /**
     * Получить список типов товаров.
     *
     * Формат ответа:
     * { types: [ { id: int, name: string } ] }
     *
     * @return void
     */
    public static function getAll(): void
    {
        self::createTables();

        $db = Database::db();
        $types = [];

        $query = "SELECT `id`, `name`
                  FROM `product_types`
                  ORDER BY `sort_order`, `id`";

        if ($result = $db->query($query)) {
            while ($row = $result->fetch_assoc()) {
                $types[] = [
                    'id'   => (int) $row['id'],
                    'name' => (string) $row['name'],
                ];
            }
            $result->free();
        }

        Service::sendJson(['types' => $types]);
    }

    /**
     * Сохранить список типов товаров из POST-запроса.
     *
     * Ожидает JSON-массив в поле:
     * - types: [{ name: string }] или [string]
     *
     * @return void
     */
    public static function save(): void
    {
        self::createTables();
        $db = Database::db();

        $raw = $_POST['types'] ?? '[]';
        $types = json_decode($raw, true);

        if (!is_array($types)) {
            Service::sendError(400, 'Invalid data format');
        }

        // Полное пересохранение списка
        $db->query('TRUNCATE TABLE product_types');

        $insert = $db->prepare('INSERT INTO product_types (`name`, `sort_order`) VALUES (?, ?)');

        if ($insert === false) {
            Log::error('ProductType save prepare failed', $db->error);
            Service::sendError(500, 'Database error while preparing type statements');
        }

        foreach ($types as $index => $item) {
            $name = is_array($item) && isset($item['name'])
                ? trim((string) $item['name'])
                : trim((string) $item);

            if ($name === '') {
                continue;
            }

            $sortOrder = (int) $index;

            $insert->bind_param('si', $name, $sortOrder);
            $insert->execute();
        }

        $insert->close();

        Service::sendJson(['success' => true]);
    }
}