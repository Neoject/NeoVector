<?php

namespace NeoVector\Product;

use NeoVector\Database;
use NeoVector\Log;
use NeoVector\Service;

class ProductOption extends Product
{
    /**
     * @return void
     */
    private static function createTables(): void
    {
        $db = Database::db();

        $db->query("CREATE TABLE IF NOT EXISTS `product_options` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `group` varchar(255) NOT NULL,
            `value` varchar(255) NOT NULL,
            `sort_order` int(11) DEFAULT 0,
            `product_type_id` int(11) DEFAULT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `group_value_unique` (`group`, `value`)
        )");

        // Добавляем столбец product_type_id, если его ещё нет
        $checkTypeColumn = $db->query("SHOW COLUMNS FROM `product_options` LIKE 'product_type_id'");
        if ($checkTypeColumn && $checkTypeColumn->num_rows === 0) {
            $db->query("ALTER TABLE `product_options` ADD COLUMN `product_type_id` int(11) DEFAULT NULL AFTER `sort_order`");
        }
    }

    /**
     * Получить все опции товаров и вернуть их в формате,
     * который ожидает фронтенд.
     *
     * @return void
     */
    public static function getAll(): void
    {
        self::createTables();

        $db = Database::db();
        $groups = [];

        $typeId = isset($_GET['type_id']) ? (int) $_GET['type_id'] : 0;

        $query = "SELECT `group`, `value`
                  FROM `product_options`";

        if ($typeId > 0) {
            $typeId = (int) $typeId;
            $query .= " WHERE `product_type_id` = {$typeId}";
        }

        $query .= " ORDER BY `group`, `sort_order`, `id`";

        if ($result = $db->query($query)) {
            while ($row = $result->fetch_assoc()) {
                $group = $row['group'];

                if (!isset($groups[$group])) {
                    $groups[$group] = [
                        'name'   => $group,
                        'values' => [],
                    ];
                }

                $groups[$group]['values'][] = $row['value'];
            }
            $result->free();
        }

        Service::sendJson(['options' => array_values($groups),]);
    }

    /**
     * Сохранить типы опций товаров из POST-запроса.
     *
     * Ожидает в запросе JSON-массив в одном из полей:
     * - option_types (новый формат фронта)
     * - product_options (старый формат, для совместимости)
     *
     * Каждый элемент: { name|group: string, values: string[] }
     *
     * @return void
     */
    public static function save(): void
    {
        self::createTables();
        $db = Database::db();

        // Определяем, какой формат данных пришёл:
        // - option_types: новый фронтенд (полный снимок без id)
        // - product_options: старый формат (может содержать id)
        $useNewFormat = isset($_POST['option_types']);
        $raw = $useNewFormat
            ? ($_POST['option_types'] ?? '[]')
            : ($_POST['product_options'] ?? '[]');

        $options = json_decode($raw, true);

        if (!is_array($options)) {
            Service::sendError(400, 'Invalid data format');
        }

        // Если пришёл новый формат с привязкой к типу товара — пересохраняем опции только для одного типа.
        if ($useNewFormat && isset($_POST['type_id'])) {
            $typeId = (int) $_POST['type_id'];

            if ($typeId <= 0) {
                Service::sendError(400, 'Invalid product type id');
            }

            // Если список пустой — просто очищаем опции этого типа
            if (empty($options)) {
                $stmt = $db->prepare('DELETE FROM product_options WHERE product_type_id = ?');
                if ($stmt) {
                    $stmt->bind_param('i', $typeId);
                    $stmt->execute();
                    $stmt->close();
                }
                Service::sendJson(['success' => true]);
            }

            // Полностью пересоздаём опции только для выбранного типа
            $deleteStmt = $db->prepare('DELETE FROM product_options WHERE product_type_id = ?');
            if ($deleteStmt === false) {
                Log::error('ProductOption save delete failed', $db->error);
                Service::sendError(500, 'Database error while clearing options');
            }
            $deleteStmt->bind_param('i', $typeId);
            $deleteStmt->execute();
            $deleteStmt->close();

            $insert = $db->prepare('INSERT INTO product_options (`group`, `value`, `sort_order`, `product_type_id`) VALUES (?, ?, ?, ?)');

            if ($insert === false) {
                Log::error('ProductOption save prepare failed', $db->error);
                Service::sendError(500, 'Database error while preparing option statements');
            }

            foreach ($options as $optionType) {
                $group = isset($optionType['group'])
                    ? trim((string) $optionType['group'])
                    : (isset($optionType['name']) ? trim((string) $optionType['name']) : '');

                $values = isset($optionType['values']) && is_array($optionType['values']) ? $optionType['values'] : [];
                $values = array_values(array_filter(array_map(static fn($v) => trim((string) $v), $values)));
                if ($values) {
                    $values = array_values(array_unique($values));
                }

                if ($group === '' || empty($values)) {
                    continue;
                }

                foreach ($values as $sortOrder => $item) {
                    $value = is_array($item) && isset($item['value'])
                        ? trim((string) $item['value'])
                        : trim((string) $item);

                    if ($value === '') {
                        continue;
                    }

                    $sortOrder = (int) $sortOrder;
                    $insert->bind_param('ssii', $group, $value, $sortOrder, $typeId);
                    $insert->execute();
                }
            }

            $insert->close();

            Service::sendJson(['success' => true]);
        }

        // Старый режим сохранения (без привязки к типу) — оставляем как есть

        if (empty($options)) {
            $db->query('DELETE FROM product_options');
            Service::sendJson(['success' => true]);
        }

        if ($useNewFormat) {
            $db->query('TRUNCATE TABLE product_options');
        }

        $update = $db->prepare('UPDATE product_options SET `group` = ?, `value` = ?, `sort_order` = ? WHERE `id` = ?');
        $insert = $db->prepare('INSERT INTO product_options (`group`, `value`, `sort_order`) VALUES (?, ?, ?)');

        if ($update === false || $insert === false) {
            Log::error('ProductOption save prepare failed', $db->error);
            Service::sendError(500, 'Database error while preparing option statements');
        }

        $touchedIds = [];

        foreach ($options as $optionType) {
            $group = isset($optionType['group'])
                ? trim((string) $optionType['group'])
                : (isset($optionType['name']) ? trim((string) $optionType['name']) : '');

            $values = isset($optionType['values']) && is_array($optionType['values']) ? $optionType['values'] : [];
            $values = array_values(array_filter(array_map(static fn($v) => trim((string) $v), $values)));
            if ($values) {
                $values = array_values(array_unique($values));
            }

            if ($group === '' || empty($values)) {
                continue;
            }

            foreach ($values as $sortOrder => $item) {
                $id = (is_array($item) && isset($item['id'])) ? (int) $item['id'] : 0;
                $value = is_array($item) && isset($item['value'])
                    ? trim((string) $item['value'])
                    : trim((string) $item);

                if ($value === '') {
                    continue;
                }

                $sortOrder = (int) $sortOrder;

                if ($id > 0) {
                    $update->bind_param('ssii', $group, $value, $sortOrder, $id);
                    $update->execute();
                    $touchedIds[] = $id;
                } else {
                    $insert->bind_param('ssi', $group, $value, $sortOrder);
                    $insert->execute();
                    $touchedIds[] = $db->insert_id;
                }
            }
        }

        if (!empty($touchedIds)) {
            $ids = array_map('intval', array_unique($touchedIds));
            if ($ids) {
                $idList = implode(',', $ids);
                $db->query("DELETE FROM product_options WHERE id NOT IN ($idList)");
            }
        }

        $update->close();
        $insert->close();

        Service::sendJson(['success' => true]);
    }
}