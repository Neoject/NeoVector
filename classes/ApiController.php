<?php

namespace NeoVision;

class ApiController
{
    private Page $pageModel;

    public function __construct()
    {
        $this->pageModel = new Page();
    }

    /**
     * @param $slug
     * @return false|string
     */
    public function getPage($slug): false|string
    {
        header('Content-Type: application/json; charset=utf-8');

        if (empty($slug)) {
            $page = $this->pageModel->findBySlug('home');
        } else {
            $page = $this->pageModel->findBySlug($slug);
        }

        if (!$page) {
            http_response_code(404);
            return json_encode([
                'success' => false,
                'error' => 'Страница не найдена'
            ], JSON_UNESCAPED_UNICODE);
        }

        return json_encode([
            'success' => true,
            'page' => [
                'id' => $page['id'],
                'title' => $page['title'],
                'slug' => $page['slug'],
                'content' => $page['content'],
                'meta_description' => $page['meta_description'] ?? '',
                'created_at' => $page['created_at']
            ]
        ], JSON_UNESCAPED_UNICODE);
    }
}