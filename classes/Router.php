<?php

namespace NeoVision;

class Router
{
    private array $routes = [];

    /**
     * @param $method
     * @param $path
     * @param $handler
     * @return void
     */
    public function add($method, $path, $handler): void
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }

    /**
     * @param $method
     * @param $uri
     * @return mixed|string
     */
    public function dispatch($method, $uri)
    {
        global $HOME_URL;

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) continue;

            $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $route['path']);
            $pattern = '#^' . $pattern . '$#';

            if (preg_match($pattern, $uri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                return call_user_func_array($route['handler'], $params);
            }
        }

        http_response_code(404);

        ob_start();
        require $HOME_URL . '404.php';
        return ob_get_clean();
    }
}