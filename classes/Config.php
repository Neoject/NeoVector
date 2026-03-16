<?php

namespace NeoVector;

use Throwable;

class Config
{
    private static bool $loaded = false;

    /**
     * @return void
     */
    public static function load(): void
    {
        if (self::$loaded) return;

        $envPath = dirname(__DIR__) . '/.env';

        if (file_exists($envPath) && is_readable($envPath)) {
            $envLines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

            if ($envLines !== false) {
                foreach ($envLines as $line) {
                    $line = trim($line);

                    if ($line === '' || $line[0] === '#') continue;
                    if (strpos($line, '=') === false) continue;

                    [$name, $value] = explode('=', $line, 2);
                    $name = trim($name);
                    $value = trim($value, " \t\n\r\0\x0B\"'");

                    if ($name === '') continue;

                    putenv($name . '=' . $value);
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
                self::$loaded = true;
            }
        }
    }

    /**
     * @param string $key
     * @param $default
     * @return array|mixed|string|null
     */
    public static function get(string $key, $default = null): mixed
    {
        $value = getenv($key);

        if ($value !== false) return $value;
        if (isset($_ENV[$key])) return $_ENV[$key];
        if (isset($_SERVER[$key])) return $_SERVER[$key];

        return $default;
    }

    /**
     * @param string $path
     * @param string $homeUrl
     * @return string
     */
    public static function normalize_media_url(string $path, string $homeUrl): string
    {
        $path = trim($path);

        if ($path === '') return '';

        if (preg_match('~^https?://~i', $path)) {
            return $path;
        }

        if (substr($path, 0, 3) === '../') {
            $path = substr($path, 3);
        }

        if (substr($path, 0, 1) === '/') {
            $baseWithoutTrailing = $homeUrl === '/' ? '' : rtrim($homeUrl, '/');
            return $baseWithoutTrailing . $path;
        }

        return $homeUrl . $path;
    }

    /**
     * @param string $path
     * @return bool
     */
    public static function is_video_file(string $path): bool
    {
        if (empty($path)) {
            return false;
        }

        $lowerPath = strtolower($path);
        $videoExtensions = ['mp4', 'webm', 'ogg', 'm4v', 'mov', 'avi', 'flv'];

        foreach ($videoExtensions as $ext) {
            if (preg_match('/\.' . preg_quote($ext, '/') . '(\?|#|$)/i', $lowerPath)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param int $productId
     * @return array|null
     */
    public static function getProductData(int $productId): ?array
    {
        $product = null;
        $additionalImages = [];
        $additionalVideos = [];

        if ($productId > 0) {
            try {
                $db = Database::getInstance()->getConnection();

                $stmt = $db->prepare('SELECT id, name, description, peculiarities, material, price, price_sale, category, product_type_id, image FROM products WHERE id = ? LIMIT 1');
                $stmt->bind_param('i', $productId);
                $stmt->execute();
                $res = $stmt->get_result();
                $row = $res->fetch_assoc();
                $stmt->close();

                if ($row) {
                    $imagesStmt = $db->prepare('SELECT image_path, file_type FROM product_images WHERE product_id = ? ORDER BY sort_order');
                    $imagesStmt->bind_param('i', $productId);
                    $imagesStmt->execute();
                    $imagesRes = $imagesStmt->get_result();

                    while ($imgRow = $imagesRes->fetch_assoc()) {
                        $p = (string)($imgRow['image_path'] ?? '');
                        $type = (string)($imgRow['file_type'] ?? 'image');

                        if ($type === 'video') {
                            $additionalVideos[] = $p;
                        } else {
                            $additionalImages[] = $p;
                        }
                    }
                    $imagesStmt->close();

                    $peculiarities = [];
                    if (!empty($row['peculiarities'])) {
                        $decoded = json_decode($row['peculiarities'], true);

                        if (is_array($decoded)) {
                            $peculiarities = $decoded;
                        }
                    }

                    $product = [
                        'id' => (int)$row['id'],
                        'name' => (string)$row['name'],
                        'description' => $row['description'] !== null ? (string)$row['description'] : '',
                        'peculiarities' => $peculiarities,
                        'material' => (string)$row['material'],
                        'price' => (int)$row['price'],
                        'price_sale' => ($row['price_sale'] !== null) ? (int)$row['price_sale'] : null,
                        'category' => (string)$row['category'],
                        'product_type_id' => isset($row['product_type_id']) ? (int)$row['product_type_id'] : null,
                        'image' => (string)$row['image'],
                        'additional_images' => $additionalImages,
                        'additional_videos' => $additionalVideos,
                    ];
                }
            } catch (Throwable $e) {
                Log::error('Product data error: ', $e->getMessage());
            }
        }

        return $product;
    }
}