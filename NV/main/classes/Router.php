<?php

namespace NeoVector;

use Exception;

class Router
{
    private static array $routes = [];

    public static function start(): void
    {
        self::setApi();
        self::getPage();
        self::handleRequest();
    }

    /**
     * @param $method
     * @param $path
     * @param $handler
     * @return void
     */
    public static function add($method, $path, $handler): void
    {
        self::$routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }

    public static function setApi(): void
    {
        self::add('GET', '/api/page', function () {
            try {
                $controller = new ApiController();
                return $controller->getPage('home');
            } catch (Exception $e) {
                Log::error('API controller error', $e->getMessage());
                http_response_code(500);
                return json_encode(['error' => 'Internal Server Error'], JSON_UNESCAPED_UNICODE);
            }
        });
    }

    public static function getPage(): void
    {
        self::add('GET', '/api/page/{slug}', function ($slug) {
            try {
                $controller = new ApiController();
                return $controller->getPage($slug);
            } catch (Exception $e) {
                Log::error('API controller error', $e->getMessage());
                http_response_code(500);
                return json_encode(['error' => 'Internal Server Error'], JSON_UNESCAPED_UNICODE);
            }
        });
    }

    public static function handleRequest(): void
    {
        try {
            $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
            $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
            $excludedPaths = ['/admin', '/product', '/assets', '/api.php', '/favicon.ico'];

            foreach ($excludedPaths as $excluded) {
                if (str_starts_with($uri, $excluded)) {
                    break;
                }
            }

            if (str_starts_with($uri, '/api/')) {
                $result = self::dispatch($method, $uri);
                echo $result;
                exit;
            }
        } catch (Exception $e) {
            Log::error('Request handling error', $e->getMessage());
            Log::error('Stack trace', $e->getTraceAsString());
            http_response_code(500);
            die('Internal Server Error');
        }
    }

    /**
     * @param $method
     * @param $uri
     * @return mixed|string
     */
    public static function dispatch($method, $uri): mixed
    {
        foreach (self::$routes as $route) {
            if ($route['method'] !== $method) continue;

            $pattern = preg_replace('/\{([a-zA-Z0-9_]+)}/', '(?P<$1>[^/]+)', $route['path']);
            $pattern = '#^' . $pattern . '$#';

            if (preg_match($pattern, $uri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                return call_user_func_array($route['handler'], $params);
            }
        }

        http_response_code(404);

        ob_start();
        require ROOT . '404.php';
        return ob_get_clean();
    }
}