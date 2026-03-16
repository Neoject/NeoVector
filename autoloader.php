<?php

spl_autoload_register(static function ($class) {
    $prefixes = [
        'NeoVector\\' => __DIR__ . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR,
    ];

    foreach ($prefixes as $prefix => $baseDir) {
        if (strpos($class, $prefix) === 0) {
            $relativeClass = substr($class, strlen($prefix));
            $relativePath = str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass) . '.php';
            $path = $baseDir . $relativePath;

            if (is_file($path)) {
                require_once $path;
            }

            return;
        }
    }
});

?>