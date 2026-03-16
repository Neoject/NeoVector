<?php

namespace NeoVector;

class Page extends Model
{
    protected $table = 'pages';


    /**
     * Проверяет, является ли URL виртуальной страницей
     * @param string $url
     * @param array $virtualPages
     * @return bool
     */
    public static function isVirtualPageUrl(string $url, array $virtualPages): bool
    {
        $url = ltrim($url, '/');

        foreach ($virtualPages as $virtualPage) {
            $virtualSlug = ltrim($virtualPage, '/');
            if ($url === $virtualSlug || strpos($url, $virtualSlug . '/') === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param $slug
     * @return false|array|null
     */
    public function findBySlug($slug)
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE slug = ? AND is_published = 1 LIMIT 1");
        $stmt->bind_param('s', $slug);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        return $row ?: null;
    }

    /**
     * @return array
     */
    public function getPublished(): array
    {
        $result = $this->db->query(
            "SELECT * FROM {$this->table} WHERE is_published = 1 ORDER BY created_at DESC"
        );

        $rows = [];

        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }
            $result->free();
        }

        return $rows;
    }
}