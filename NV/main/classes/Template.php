<?php

namespace NeoVector;

use Exception;

class Template
{
    private string $templateDir = 'templates/';
    private string $cacheDir = 'cache/';
    private array $data = [];

    /**
     * @param $key
     * @param $value
     * @return void
     */
    public function assign($key, $value): void
    {
        $this->data[$key] = $value;
    }

    /**
     * @param $template
     * @return false|string
     * @throws Exception
     */
    public function render($template): false|string
    {
        $templatePath = $this->templateDir . $template . '.php';

        if (!file_exists($templatePath)) {
            throw new Exception("Шаблон {$template} не найден");
        }

        extract($this->data);

        ob_start();

        include $templatePath;

        return ob_get_clean();
    }

    /**
     * @param $template
     * @param $cacheKey
     * @param int $ttl
     * @return false|string
     * @throws Exception
     */
    public function renderCached($template, $cacheKey, int $ttl = 3600): false|string
    {
        $cacheFile = $this->cacheDir . md5($cacheKey) . '.html';

        if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $ttl) {
            return file_get_contents($cacheFile);
        }

        $content = $this->render($template);
        file_put_contents($cacheFile, $content);

        return $content;
    }
}