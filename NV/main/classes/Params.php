<?php

namespace NeoVector;

use Exception;

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
            'show_cart' => $data['show_cart'] === 'true',
            'show_wish_list' => $data['show_wish_list'] === 'true',
            'admin_only' => $data['admin_only'] === 'true',
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

    public static function deleteLogo(): void
    {
        self::delete(['logo']);
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

    /**
     * Абсолютный путь к пользовательской теме (NV/main/styles/theme.css).
     */
    public static function getThemeCssPath(): string
    {
        return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'styles' . DIRECTORY_SEPARATOR . 'theme.css';
    }

    /**
     * Содержимое theme.css (пустая строка, если файла нет).
     */
    public static function getThemeCss(): string
    {
        $path = self::getThemeCssPath();
        if (!is_readable($path)) {
            return '';
        }

        return (string) file_get_contents($path);
    }

    /**
     * Парсит CSS и возвращает карту переменных --name => value.
     *
     * @return array<string, string>
     */
    public static function getThemeColors(): array
    {
        $css = self::getThemeCss();
        if ($css === '') {
            return [];
        }

        preg_match_all('/(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/u', $css, $matches, PREG_SET_ORDER);
        $out = [];
        foreach ($matches as $m) {
            $out[$m[1]] = trim($m[2]);
        }

        return $out;
    }

    /**
     * Полная замена содержимого theme.css (только для авторизованных).
     */
    public static function saveThemeCss(string $css): void
    {
        Auth::requireAuth();

        $css = (string) $css;
        if ($css === '') {
            Service::sendError(400, 'Пустой CSS');
        }

        if (strlen($css) > 1024 * 1024) {
            Service::sendError(400, 'CSS слишком большой');
        }

        $path = self::getThemeCssPath();
        $dir = dirname($path);
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            Service::sendError(500, 'Не удалось создать каталог для темы');
        }

        if (file_put_contents($path, $css) === false) {
            Service::sendError(500, 'Не удалось записать theme.css');
        }

        Service::sendJson(['success' => true]);
    }

    /**
     * Обновляет значения переменных в theme.css по карте --var => value.
     *
     * @param array<string, string> $colors
     */
    public static function saveThemeColors(array $colors): void
    {
        Auth::requireAuth();

        $path = self::getThemeCssPath();
        if (!is_readable($path)) {
            Service::sendError(500, 'Файл theme.css не найден или недоступен для чтения');
        }

        $css = (string) file_get_contents($path);
        $toAppend = [];

        foreach ($colors as $name => $value) {
            if (!is_string($name) || !preg_match('/^--[a-zA-Z0-9_-]+$/', $name)) {
                continue;
            }
            $value = trim((string) $value);
            if ($value === '') {
                continue;
            }
            if (self::isUnsafeCssValue($value)) {
                continue;
            }

            $pattern = '/' . preg_quote($name, '/') . '\s*:\s*[^;]+;/u';
            $replacement = $name . ': ' . $value . ';';
            if (preg_match($pattern, $css)) {
                $css = preg_replace($pattern, $replacement, $css, 1);
            } else {
                $toAppend[] = $replacement;
            }
        }

        if ($toAppend !== []) {
            $css = self::appendCssDeclarationsBeforeLastBrace($css, $toAppend);
        }

        if (file_put_contents($path, $css) === false) {
            Service::sendError(500, 'Не удалось записать theme.css');
        }

        Service::sendJson(['success' => true]);
    }

    /**
     * Восстанавливает theme.css из theme.default.css (резервная копия по умолчанию).
     */
    public static function resetThemeCss(): void
    {
        Auth::requireAuth();

        $defaultPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'styles' . DIRECTORY_SEPARATOR . 'theme.default.css';
        $target = self::getThemeCssPath();

        if (!is_readable($defaultPath)) {
            Service::sendError(500, 'Файл theme.default.css не найден');
        }

        $content = (string) file_get_contents($defaultPath);
        if (file_put_contents($target, $content) === false) {
            Service::sendError(500, 'Не удалось восстановить theme.css');
        }

        Service::sendJson(['success' => true]);
    }

    private static function isUnsafeCssValue(string $value): bool
    {
        $lower = strtolower($value);
        if (strpos($lower, 'expression(') !== false || strpos($lower, 'javascript:') !== false || strpos($value, '<') !== false) {
            return true;
        }

        return false;
    }

    /**
     * @param list<string> $declarations
     */
    private static function appendCssDeclarationsBeforeLastBrace(string $css, array $declarations): string
    {
        $last = strrpos($css, '}');
        if ($last === false) {
            return $css;
        }

        $block = "\n    " . implode("\n    ", $declarations);

        return substr($css, 0, $last) . $block . "\n" . substr($css, $last);
    }
}