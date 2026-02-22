<?php

namespace NeoVision;

use mysqli;

class ProductOption
{
    private mysqli $db;

    public function __construct(mysqli $db)
    {
        $this->db = $db;
        $this->createTables();
    }

    /**
     * @return void
     */
    private function createTables(): void
    {
        $sql1 = "CREATE TABLE IF NOT EXISTS `product_option_types` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `slug` varchar(255) NOT NULL,
            `sort_order` int(11) DEFAULT 0,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `slug_unique` (`slug`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        $sql2 = "CREATE TABLE IF NOT EXISTS `product_option_values` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `type_id` int(11) NOT NULL,
            `value` varchar(255) NOT NULL,
            `sort_order` int(11) DEFAULT 0,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `type_value_unique` (`type_id`, `value`),
            CONSTRAINT `product_option_values_type_fk` FOREIGN KEY (`type_id`) REFERENCES `product_option_types`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        $this->db->query($sql1);
        $this->db->query($sql2);
    }

    /**
     * @return array
     */
    public function getAll(): array {
        $types = [];
        $query = "SELECT 
                    t.id as type_id,
                    t.name as type_name,
                    t.slug as type_slug,
                    t.sort_order as type_sort,
                    v.id as value_id,
                    v.value as option_value,
                    v.sort_order as value_sort
                  FROM product_option_types t
                  LEFT JOIN product_option_values v ON v.type_id = t.id
                  ORDER BY t.sort_order, t.id, v.sort_order, v.id";

        if ($result = $this->db->query($query)) {
            while ($row = $result->fetch_assoc()) {
                $typeId = (int)$row['type_id'];

                if (!isset($types[$typeId])) {
                    $types[$typeId] = [
                        'id' => $typeId,
                        'name' => $row['type_name'],
                        'slug' => $row['type_slug'],
                        'sort_order' => (int)$row['type_sort'],
                        'values' => []
                    ];
                }

                if (!empty($row['option_value'])) {
                    $types[$typeId]['values'][] = $row['option_value'];
                }
            }
            $result->free();
        }

        usort($types, static function ($a, $b) {
            return $a['sort_order'] <=> $b['sort_order'];
        });

        return array_values($types);
    }

    /**
     * @param array $optionTypes
     * @return bool
     */
    public function save(array $optionTypes): bool
    {
        $this->db->query('DELETE FROM product_option_values');
        $this->db->query('DELETE FROM product_option_types');

        if (empty($optionTypes)) {
            return true;
        }

        $insertType = $this->db->prepare('INSERT INTO product_option_types (name, slug, sort_order) VALUES (?, ?, ?)');
        $insertValue = $this->db->prepare('INSERT INTO product_option_values (type_id, value, sort_order) VALUES (?, ?, ?)');

        $usedSlugs = [];

        foreach ($optionTypes as $index => $type) {
            $name = isset($type['name']) ? trim((string)$type['name']) : '';
            $values = isset($type['values']) && is_array($type['values']) ? $type['values'] : [];
            $values = array_values(array_filter(array_map(function($v) {
                return trim((string)$v);
            }, $values)));

            if ($name === '' || empty($values)) {
                continue;
            }

            $slugBase = $this->slugify($name);
            $slug = $slugBase;
            $counter = 1;

            while ($slug === '' || isset($usedSlugs[$slug])) {
                $slug = $slugBase . '-' . $counter;
                $counter++;
            }
            $usedSlugs[$slug] = true;

            $sortOrder = $index;
            $insertType->bind_param('ssi', $name, $slug, $sortOrder);
            $insertType->execute();
            $typeId = $this->db->insert_id;

            foreach ($values as $valueIndex => $value) {
                $valueSort = $valueIndex;
                $insertValue->bind_param('isi', $typeId, $value, $valueSort);
                $insertValue->execute();
            }
        }

        $insertType->close();
        $insertValue->close();

        return true;
    }

    /**
     * @param string $name
     * @return string
     */
    private function slugify(string $name): string
    {
        $name = trim($name);

        if ($name === '') return '';

        $transliterated = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);

        if ($transliterated !== false) {
            $name = $transliterated;
        }

        $name = preg_replace('/[^A-Za-z0-9]+/', '-', $name);
        $name = trim($name, '-');
        $name = strtolower($name);

        return $name ?: 'option-type';
    }
}