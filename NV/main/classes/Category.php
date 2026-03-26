<?php

namespace NeoVector;

use mysqli;
use Exception;

class Category
{
    /**
     * @param mysqli $db
     */
    public function __construct()
    {
        $this->createTable();
    }

    /**
     * @return void
     */
    private static function createTable(): void
    {
        $sql = "CREATE TABLE IF NOT EXISTS `categories` (
            `id` int(255) NOT NULL AUTO_INCREMENT,
            `slug` varchar(64) NOT NULL UNIQUE,
            `name` varchar(255) NOT NULL,
            `sort_order` int(11) DEFAULT 0,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        Database::db()->query($sql);
    }

    /**
     * @return array
     */
    public static function getAll(): array
    {
        $stmt = Database::db()->prepare('SELECT id, slug, name, sort_order FROM categories ORDER BY sort_order ASC, name ASC');
        $stmt->execute();
        $result = $stmt->get_result();

        $categories = [];

        while ($row = $result->fetch_assoc()) {
            $categories[] = [
                'id' => (int)$row['id'],
                'slug' => $row['name'],
                'name' => $row['name'],
                'sort_order' => (int)$row['sort_order']
            ];
        }

        $stmt->close();

        return $categories;
    }

    /**
     * @param array $data
     * @return int
     * @throws Exception
     */
    public static function create(array $data): int
    {
        $name = trim($data['name'] ?? '');
        $slug = trim($data['slug'] ?? '');
        $sortOrder = (int)($data['sort_order'] ?? 0);

        if ($name === '') {
            throw new Exception('Название категории обязательно');
        }

        if ($slug === '') {
            $slug = preg_replace('/[^a-z0-9\-_]+/i', '-', strtolower($name));
            $slug = trim($slug, '-_');
        }

        $stmt = Database::db()->prepare('INSERT INTO categories (slug, name, sort_order) VALUES (?, ?, ?)');
        $stmt->bind_param('ssi', $slug, $name, $sortOrder);
        $stmt->execute();
        $id = Database::db()->insert_id;
        $stmt->close();

        return $id;
    }

    /**
     * @param int $id
     * @param array $data
     * @return bool
     * @throws Exception
     */
    public static function update(int $id, array $data): bool
    {
        $name = trim($data['name'] ?? '');
        $slug = trim($data['slug'] ?? '');
        $sortOrder = (int)($data['sort_order'] ?? 0);

        if ($id <= 0 || $name === '') {
            throw new Exception('Неверные данные категории');
        }

        if ($slug === '') {
            $slug = preg_replace('/[^a-z0-9\-_]+/i', '-', strtolower($name));
            $slug = trim($slug, '-_');
        }

        $stmt = Database::db()->prepare('UPDATE categories SET slug = ?, name = ?, sort_order = ? WHERE id = ?');
        $stmt->bind_param('ssii', $slug, $name, $sortOrder, $id);
        $result = $stmt->execute();
        $stmt->close();

        return $result;
    }

    /**
     * @param int $id
     * @return bool
     */
    public static function delete(int $id): bool {
        $stmt = Database::db()->prepare('DELETE FROM categories WHERE id = ?');
        $stmt->bind_param('i', $id);
        $result = $stmt->execute();
        $stmt->close();

        return $result;
    }

    /**
     * @param array $order
     * @return bool
     */
    public static function updateOrder(array $order): bool {
        $stmt = Database::db()->prepare('UPDATE categories SET sort_order = ? WHERE id = ?');

        foreach ($order as $index => $id) {
            $idx = (int)$index;
            $cid = (int)$id;
            $stmt->bind_param('ii', $idx, $cid);
            $stmt->execute();
        }

        $stmt->close();

        return true;
    }
}