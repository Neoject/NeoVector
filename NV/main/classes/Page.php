<?php

namespace NeoVector;

use Exception;

class Page extends Model
{

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
            if ($url === $virtualSlug || str_starts_with($url, $virtualSlug . '/')) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param $slug
     * @return false|array|null
     */
    public static function findBySlug($slug)
    {
        $stmt = Database::db()->prepare("SELECT * FROM `pages` WHERE slug = ? AND is_published = 1 LIMIT 1");
        $stmt->bind_param('s', $slug);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        return $row ?: null;
    }

    /**
     * @return void
     */
    public static function get(): void
    {
        $slug = $_GET['slug'] ?? '';

        if (empty($slug)) {
            Service::sendError(400, 'Slug is required');
        }

        try {
            $virtualPage = new VirtualPage(Database::db());
            $page = $virtualPage->getBySlug($slug);

            if ($page) {
                if (isset($page['navigation_buttons']) && is_string($page['navigation_buttons'])) {
                    $page['navigation_buttons'] = json_decode($page['navigation_buttons'], true);
                }
                Service::sendJson($page);
            } else {
                Service::sendError(404, 'Page not found');
            }
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, 'Error loading page: ' . $e->getMessage());
        }
    }

    /**
     * @return void
     */
    public static function getAll(): void
    {
        Auth::requireAuth();

        try {
            $virtualPage = new VirtualPage(Database::db());
            $pages = $virtualPage->getAll(false);
            foreach ($pages as &$page) {
                if (isset($page['navigation_buttons']) && is_string($page['navigation_buttons'])) {
                    $page['navigation_buttons'] = json_decode($page['navigation_buttons'], true);
                }
            }
            Service::sendJson($pages);
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, 'Error loading pages: ' . $e->getMessage());
        }
    }

    /**
     * @return void
     */
    public static function addPage(): void
    {
        Auth::requireAuth();

        $data = [
            'title' => $_POST['title'] ?? '',
            'slug' => $_POST['slug'] ?? '',
            'content' => $_POST['content'] ?? '',
            'meta_title' => $_POST['meta_title'] ?? '',
            'meta_description' => $_POST['meta_description'] ?? '',
            'is_published' => isset($_POST['is_published']) ? (int) $_POST['is_published'] : 1,
            'is_main_page' => isset($_POST['is_main_page']) ? (int) $_POST['is_main_page'] : 0
        ];

        if (isset($_POST['navigation_buttons'])) {
            $navButtons = $_POST['navigation_buttons'];
            if (is_string($navButtons)) {
                $data['navigation_buttons'] = json_decode($navButtons, true);
            } else {
                $data['navigation_buttons'] = $navButtons;
            }
        }

        if (empty($data['title'])) {
            Service::sendError(400, 'Title is required');
        }

        try {
            $virtualPage = new VirtualPage(Database::db());
            $id = $virtualPage->create($data);
            Service::sendSuccess(['success' => true, 'id' => $id]);
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, 'Failed to create page: ' . $e->getMessage());
        }
    }

    /**
     * @return void
     */
    public static function updatePage(): void
    {
        Auth::requireAuth();

        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            Service::sendError(400, 'Invalid page ID');
        }

        $data = [];
        if (isset($_POST['title']))
            $data['title'] = $_POST['title'];
        if (isset($_POST['slug']))
            $data['slug'] = $_POST['slug'];
        if (isset($_POST['content']))
            $data['content'] = $_POST['content'];
        if (isset($_POST['meta_title']))
            $data['meta_title'] = $_POST['meta_title'];
        if (isset($_POST['meta_description']))
            $data['meta_description'] = $_POST['meta_description'];
        if (isset($_POST['is_published']))
            $data['is_published'] = (int) $_POST['is_published'];
        if (isset($_POST['is_main_page']))
            $data['is_main_page'] = (int) $_POST['is_main_page'];
        if (isset($_POST['navigation_buttons'])) {
            $navButtons = $_POST['navigation_buttons'];
            if (is_string($navButtons)) {
                $data['navigation_buttons'] = json_decode($navButtons, true);
            } else {
                $data['navigation_buttons'] = $navButtons;
            }
        }

        try {
            $virtualPage = new VirtualPage(Database::db());
            if ($virtualPage->update($id, $data)) {
                Service::sendSuccess(['success' => true]);
            } else {
                Service::sendError(500, 'Failed to update page');
            }
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, 'Failed to update page: ' . $e->getMessage());
        }
    }

    /**
     * @return void
     */
    public static function deletePage(): void
    {
        Auth::requireAuth();

        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            Service::sendError(400, 'Invalid page ID');
        }

        $virtualPage = new VirtualPage(Database::db());
        if ($virtualPage->delete($id)) {
            Service::sendSuccess(['success' => true]);
        } else {
            Service::sendError(500, 'Failed to delete page');
        }
    }

    /**
     * @return void
     */
    public static function navigation(): void
    {
        $slug = $_GET['slug'] ?? null;

        try {
            $virtualPage = new VirtualPage(Database::db());
            $page = $slug ? $virtualPage->getBySlug($slug) : null;

            $navigation = [];
            if ($page && isset($page['navigation_buttons'])) {
                $navButtons = $page['navigation_buttons'];

                if (is_string($navButtons)) {
                    $navigation = json_decode($navButtons, true) ?: [];
                } else {
                    $navigation = $navButtons ?: [];
                }
            }

            Service::sendJson($navigation);
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, 'Error loading navigation: ' . $e->getMessage());
        }
    }

    /**
     * @return array
     */
    public function getPublished(): array
    {
        $result = $this->db->query(
            "SELECT * FROM `pages` WHERE is_published = 1 ORDER BY created_at DESC"
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