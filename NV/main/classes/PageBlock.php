<?php

namespace NeoVector;

use mysqli;

class PageBlock
{
    public function __construct(mysqli $db)
    {
        $this->createTable();
    }

    /**
     * @return void
     */
    private static function createTable(): void
    {
        $sql = "CREATE TABLE IF NOT EXISTS `page_blocks` (
            `id` int(255) NOT NULL AUTO_INCREMENT,
            `type` varchar(50) NOT NULL,
            `title` varchar(255) NOT NULL,
            `content` text NOT NULL,
            `settings` text,
            `sort_order` int(11) DEFAULT 0,
            `is_active` tinyint(1) DEFAULT 1,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `type_sort` (`type`, `sort_order`),
            KEY `active_sort` (`is_active`, `sort_order`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        Database::db()->query($sql);
    }

    /**
     * @return array
     */
    public static function getAll(): array
    {
        $stmt = Database::db()->prepare('SELECT * FROM page_blocks ORDER BY sort_order ASC');
        $stmt->execute();
        $result = $stmt->get_result();

        $blocks = [];
        while ($row = $result->fetch_assoc()) {
            $blocks[] = [
                'id' => (int) $row['id'],
                'type' => $row['type'],
                'title' => $row['title'],
                'content' => $row['content'],
                'settings' => $row['settings'] ? json_decode($row['settings'], true) : [],
                'sort_order' => (int) $row['sort_order'],
                'is_active' => (bool) $row['is_active']
            ];
        }

        $stmt->close();

        return $blocks;
    }

    /**
     * @param array $data
     * @return int
     */
    public static function create(array $data): int
    {
        $type = $data['type'] ?? '';
        $title = $data['title'] ?? '';
        $content = $data['content'] ?? '';
        $settings = $data['settings'] ?? '{}';
        $sortOrder = (int) ($data['sort_order'] ?? 0);
        $isActive = isset($data['is_active']) ? (int) $data['is_active'] : 1;

        $stmt = Database::db()->prepare('INSERT INTO page_blocks (type, title, content, settings, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('ssssii', $type, $title, $content, $settings, $sortOrder, $isActive);
        $stmt->execute();
        $id = Database::db()->insert_id;
        $stmt->close();

        return $id;
    }

    /**
     * @param int $id
     * @param array $data
     * @return bool
     */
    public static function update(int $id, array $data): bool
    {
        $type = $data['type'] ?? '';
        $title = $data['title'] ?? '';
        $content = $data['content'] ?? '';
        $settings = $data['settings'] ?? '{}';
        $sortOrder = (int) ($data['sort_order'] ?? 0);
        $isActive = isset($data['is_active']) ? (int) $data['is_active'] : 1;

        $stmt = Database::db()->prepare('UPDATE page_blocks SET type = ?, title = ?, content = ?, settings = ?, sort_order = ?, is_active = ? WHERE id = ?');
        $stmt->bind_param('ssssiii', $type, $title, $content, $settings, $sortOrder, $isActive, $id);
        $result = $stmt->execute();
        $stmt->close();

        return $result;
    }

    /**
     * @param int $id
     * @return bool
     */
    public static function delete(int $id): bool
    {
        $stmt = Database::db()->prepare('DELETE FROM page_blocks WHERE id = ?');
        $stmt->bind_param('i', $id);
        $result = $stmt->execute();
        $stmt->close();

        return $result;
    }

    /**
     * @param array $blocksOrder
     * @return bool
     */
    public static function updateOrder(array $blocksOrder): bool
    {
        $stmt = Database::db()->prepare('UPDATE page_blocks SET sort_order = ? WHERE id = ?');

        foreach ($blocksOrder as $block) {
            $sortOrder = $block['sort_order'] ?? 0;
            $blockId = $block['id'];
            $stmt->bind_param('ii', $sortOrder, $blockId);
            $stmt->execute();
        }

        $stmt->close();
        return true;
    }

    /**
     * @return string
     */
    public static function getHeroImage(): string
    {
        $stmt = Database::db()->prepare("SELECT settings FROM page_blocks WHERE type = 'hero' AND is_active = 1 ORDER BY sort_order ASC LIMIT 1");
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        if ($row && $row['settings']) {
            $settings = json_decode($row['settings'], true);
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'];
            $baseDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
            return $protocol . '://' . $host . $baseDir . '/' . ltrim($settings['backgroundImage'], '/');
        }

        return '';
    }
}