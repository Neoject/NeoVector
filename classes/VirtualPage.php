<?php

namespace NeoVision;

use mysqli;
use Exception;

class VirtualPage
{
    private mysqli $db;
    private string $table = 'pages';

    public function __construct(mysqli $db)
    {
        $this->db = $db;
        $this->ensureTable();
    }

    /**
     * @return void
     */
    private function ensureTable(): void
    {
        $createPagesTableSQL = "CREATE TABLE IF NOT EXISTS `pages` (
            `id` int(255) NOT NULL AUTO_INCREMENT,
            `slug` varchar(255) NOT NULL,
            `title` varchar(255) NOT NULL,
            `content` text NOT NULL,
            `meta_title` varchar(255) DEFAULT NULL,
            `meta_description` text DEFAULT NULL,
            `is_published` tinyint(1) DEFAULT 1,
            `is_main_page` tinyint(1) DEFAULT 0,
            `navigation_buttons` text DEFAULT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug` (`slug`),
            KEY `published` (`is_published`),
            KEY `main_page` (`is_main_page`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        $this->db->query($createPagesTableSQL);

        $checkMain = $this->db->query("SHOW COLUMNS FROM `pages` LIKE 'is_main_page'");

        if ($checkMain && $checkMain->num_rows === 0) {
            $this->db->query("ALTER TABLE `pages` ADD COLUMN `is_main_page` tinyint(1) DEFAULT 0 AFTER `is_published`");
        }

        if ($checkMain) {
            $checkMain->free();
        }

        $checkNav = $this->db->query("SHOW COLUMNS FROM `pages` LIKE 'navigation_buttons'");

        if ($checkNav && $checkNav->num_rows === 0) {
            $this->db->query("ALTER TABLE `pages` ADD COLUMN `navigation_buttons` text DEFAULT NULL AFTER `is_main_page`");
        }

        if ($checkNav) {
            $checkNav->free();
        }
    }

    /**
     * @param string $slug
     * @return array|null
     */
    public function getBySlug(string $slug): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM {$this->table}
            WHERE slug = ? AND is_published = 1
            LIMIT 1
        ");

        $stmt->bind_param('s', $slug);
        $stmt->execute();
        $result = $stmt->get_result();
        $page = $result->fetch_assoc();
        $stmt->close();

        if ($page) {
            if (!empty($page['navigation_buttons'])) {
                $decoded = json_decode($page['navigation_buttons'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $page['navigation_buttons'] = $decoded;
                } else {
                    $page['navigation_buttons'] = [];
                }
            } else {
                $page['navigation_buttons'] = [];
            }

            return $page;
        }

        return null;
    }

    /**
     * @param bool $publishedOnly
     * @return array
     */
    public function getAll(bool $publishedOnly = false): array
    {
        $sql = "SELECT * FROM $this->table";

        if ($publishedOnly) {
            $sql .= " WHERE is_published = 1";
        }

        $sql .= " ORDER BY created_at DESC";

        $result = $this->db->query($sql);
        $pages = [];

        while ($row = $result->fetch_assoc()) {
            if (!empty($row['navigation_buttons'])) {
                $decoded = json_decode($row['navigation_buttons'], true);

                if (json_last_error() === JSON_ERROR_NONE) {
                    $row['navigation_buttons'] = $decoded;
                } else {
                    $row['navigation_buttons'] = [];
                }
            } else {
                $row['navigation_buttons'] = [];
            }

            $pages[] = $row;
        }

        return $pages;
    }

    /**
     * @param array $data
     * @return int
     */
    public function create(array $data): int
    {
        $slug = empty($data['slug'])
            ? $this->generateSlug($data['title'])
            : $this->sanitizeSlug($data['slug']);

        if (!$this->isSlugUnique($slug)) {
            $slug = $this->makeSlugUnique($slug);
        }

        $stmt = $this->db->prepare("
            INSERT INTO {$this->table}
            (slug, title, content, meta_title, meta_description, is_published, is_main_page, navigation_buttons)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $navButtons = null;

        if (isset($data['navigation_buttons'])) {
            if (is_array($data['navigation_buttons'])) {
                $navButtons = json_encode($data['navigation_buttons'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } elseif (is_string($data['navigation_buttons']) && !empty($data['navigation_buttons'])) {
                $decoded = json_decode($data['navigation_buttons'], true);

                if (json_last_error() === JSON_ERROR_NONE) {
                    $navButtons = $data['navigation_buttons'];
                } else {
                    $navButtons = null;
                }
            }
        }

        $metaTitle = $data['meta_title'] ?? $data['title'];
        $metaDescription = $data['meta_description'] ?? $data['description'];
        $isPublished = $data['is_published'] ?? 1;
        $isMainPage = $data['is_main_page'] ?? 0;

        $stmt->bind_param(
            'sssssiss',
            $slug,
            $data['title'],
            $data['content'],
            $metaTitle,
            $metaDescription,
            $isPublished,
            $isMainPage,
            $navButtons
        );

        $stmt->execute();
        $id = $this->db->insert_id;
        $stmt->close();

        return $id;
    }

    /**
     * @param int $id
     * @param array $data
     * @return bool
     * @throws Exception
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $types = '';
        $values = [];

        foreach ([
                     'slug' => 's',
                     'title' => 's',
                     'content' => 's',
                     'meta_title' => 's',
                     'meta_description' => 's',
                     'is_published' => 'i',
                     'is_main_page' => 'i',
                     'navigation_buttons' => 's'
                 ] as $field => $type) {

            if (!array_key_exists($field, $data)) continue;

            if ($field === 'slug') {
                $data[$field] = $this->sanitizeSlug($data[$field]);
                if (!$this->isSlugUnique($data[$field], $id)) {
                    throw new Exception('Slug already exists');
                }
            }

            if ($field === 'navigation_buttons') {
                if (is_array($data[$field])) {
                    $data[$field] = json_encode($data[$field], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                } elseif (is_string($data[$field]) && !empty($data[$field])) {
                    $decoded = json_decode($data[$field], true);

                    if (json_last_error() !== JSON_ERROR_NONE) {
                        $data[$field] = null;
                    }
                } else {
                    $data[$field] = null;
                }
            }

            $fields[] = "$field = ?";
            $types .= $type;
            $values[] = $data[$field];
        }

        if (!$fields) return false;

        $values[] = $id;
        $types .= 'i';

        $sql = "UPDATE $this->table SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$values);

        $result = $stmt->execute();
        $stmt->close();

        return $result;
    }

    /**
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM $this->table WHERE id = ?");
        $stmt->bind_param('i', $id);
        $result = $stmt->execute();
        $stmt->close();

        return $result;
    }

    private function generateSlug(string $title): string {
        return $this->sanitizeSlug($this->transliterate($title));
    }

    private function sanitizeSlug(string $slug): string {
        $slug = mb_strtolower($slug, 'UTF-8');
        $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);

        return trim($slug, '-');
    }

    private function isSlugUnique(string $slug, ?int $excludeId = null): bool {
        $sql = "SELECT COUNT(*) FROM $this->table WHERE slug = ?";
        $params = [$slug];
        $types = 's';

        if ($excludeId !== null) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
            $types .= 'i';
        }

        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();

        $result = $stmt->get_result();
        $count = $result->fetch_row()[0];
        $stmt->close();

        return $count === 0;
    }

    /**
     * @param string $slug
     * @return string
     */
    private function makeSlugUnique(string $slug): string
    {
        $base = $slug;
        $i = 1;

        while (!$this->isSlugUnique($slug)) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }

    /**
     * @param string $text
     * @return string
     */
    private function transliterate(string $text): string
    {
        return strtr($text, [
            'а'=>'a','б'=>'b','в'=>'v','г'=>'g','д'=>'d','е'=>'e','ё'=>'yo',
            'ж'=>'zh','з'=>'z','и'=>'i','й'=>'j','к'=>'k','л'=>'l','м'=>'m',
            'н'=>'n','о'=>'o','п'=>'p','р'=>'r','с'=>'s','т'=>'t','у'=>'u',
            'ф'=>'f','х'=>'h','ц'=>'ts','ч'=>'ch','ш'=>'sh','щ'=>'sch',
            'ы'=>'y','э'=>'e','ю'=>'yu','я'=>'ya','ь'=>'','ъ'=>''
        ]);
    }
}
