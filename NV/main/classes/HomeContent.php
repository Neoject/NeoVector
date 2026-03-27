<?php

namespace NeoVector;

use mysqli;

class HomeContent
{

    public function __construct()
    {
        $this->createTable();
    }

    /**
     * @return void
     */
    public static function createTable(): void
    {
        $sql = "CREATE TABLE IF NOT EXISTS `home_content` (
            `id` int(255) NOT NULL AUTO_INCREMENT,
            `section` varchar(50) NOT NULL,
            `title` varchar(255) NOT NULL,
            `content` text NOT NULL,
            `sort_order` int(11) DEFAULT 0,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `section_sort` (`section`, `sort_order`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        Database::db()->query($sql);
    }

    /**
     * @return array
     */
    public static function getAll(): array {
        $stmt = Database::db()->prepare('SELECT * FROM home_content ORDER BY section, sort_order ASC');
        $stmt->execute();
        $result = $stmt->get_result();

        $content = [];
        while ($row = $result->fetch_assoc()) {
            $content[] = [
                'id' => (int)$row['id'],
                'section' => $row['section'],
                'title' => $row['title'],
                'content' => $row['content'],
                'sort_order' => (int)$row['sort_order']
            ];
        }

        $stmt->close();
        return $content;
    }

    /**
     * @param array $contentData
     * @return bool
     */
    public static function save(array $contentData): bool {
        Database::db()->query('DELETE FROM home_content');

        $stmt = Database::db()->prepare('INSERT INTO home_content (section, title, content, sort_order) VALUES (?, ?, ?, ?)');

        foreach ($contentData as $item) {
            $section = $item['section'] ?? '';
            $title = $item['title'] ?? '';
            $content = $item['content'] ?? '';
            $sortOrder = (int)($item['sort_order'] ?? 0);

            $stmt->bind_param('sssi', $section, $title, $content, $sortOrder);
            $stmt->execute();
        }

        $stmt->close();
        return true;
    }
}