<?php

use NeoVision\Database;
use NeoVision\VisitTracker;

require_once __DIR__ . '/config.php';

global $HOME_URL;

if (!isset($TITLE)) {
    $TITLE = '';
}
$vars = [];

try {
    if (class_exists(VisitTracker::class)) {
        VisitTracker::track();
    } else {
        error_log('VisitTracker missing: class NeoVision\\VisitTracker not found');
    }
} catch (\Throwable $e) {
    error_log('VisitTracker error: ' . $e->getMessage());
}

try {
    if (class_exists(Database::class)) {
        Database::getInstance();
    } else {
        error_log('Database missing: class NeoVision\\Database not found');
    }
} catch (\Throwable $e) {
    error_log('Database connection error: ' . $e->getMessage());
}


if (isset($_GET['id'])) {
    $product = NeoVision\Config::getProductData($productId = (int) $_GET['id']);

    $TITLE = $product ? ($product['name'] . ' - Aeternum') : 'Товар не найден - Aeternum';

    $mainImageUrl = '';
    if ($product && !empty($product['image'])) {
        $mainImageUrl = NeoVision\Config::normalize_media_url($product['image'], $HOME_URL);
    }

    $allMedia = [];

    if ($mainImageUrl !== '') {
        $mainMediaType = NeoVision\Config::is_video_file($product['image']) ? 'video' : 'image';
        $allMedia[] = ['type' => $mainMediaType, 'url' => $mainImageUrl];

        if ($product['image']) {
            $vars['og_image'] = $mainImageUrl;
        }
    }

    if ($product) {
        foreach ($product['additional_images'] as $img) {
            $u = NeoVision\Config::normalize_media_url((string) $img, $HOME_URL);
            if ($u !== '')
                $allMedia[] = ['type' => 'image', 'url' => $u];
        }

        foreach ($product['additional_videos'] as $vid) {
            $u = NeoVision\Config::normalize_media_url((string) $vid, $HOME_URL);
            if ($u !== '')
                $allMedia[] = ['type' => 'video', 'url' => $u];
        }
    }
}

function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$ogDesc = $_DESCRIPTION ?? '';
$ogUrl = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
$ogImage = $vars['og_image'] ?? '/images/og-default.jpg';

if (!preg_match('~^https?://~i', $ogImage)) {
    $ogImage = 'https://' . $_SERVER['HTTP_HOST'] . $ogImage;
}
?>
<!doctype html>
<html lang="ru" xmlns="http://www.w3.org/1999/html" xmlns="http://www.w3.org/1999/html">

<head>
    <meta charset="UTF-8">
    <meta name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="format-detection" content="telephone=no">
    <meta name="description" content="<?= e($ogDesc) ?>">
    <meta property="og:description" content="<?= e($ogDesc) ?>">
    <meta property="og:title" content="<?= e($TITLE) ?>">
    <meta property="og:url" content="<?= e($ogUrl) ?>">
    <meta property="og:type" content="product">
    <meta property="og:image" content="<?= e($ogImage) ?>">

    <link rel="canonical" href="https://neoject.ru">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

    <!-- Основное описание для SEO -->
    <meta name="description" content="Создание и поддержка сайтов, фронтенд и бэкенд решения, UX/UI дизайн, оптимизация под пользователей.">
    <meta name="keywords" content="Neoject, веб-разработка, сайты, PHP, Node.js, Vue.js, React, Electron, fullstack, UX, UI, frontend, backend, responsive, portfolio">
    <meta name="author" content="Alexander Yakubovsky">

    <!-- Социальные сети - Open Graph (Facebook, LinkedIn и др.) -->
    <meta property="og:title" content="Neoject - разработка сайтов">
    <meta property="og:description" content="Создание и поддержка сайтов, UX/UI, frontend и backend.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://neoject.ru">
    <meta property="og:image" content="https://neoject.ru/og_image_ru.jpg">
    <meta property="og:locale" content="ru_RU">
    <meta property="og:site_name" content="Neoject">

    <!-- Социальные сети - Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Neoject - разработка сайтов">
    <meta name="twitter:description" content="Создание и поддержка сайтов, UX/UI, frontend и backend.">
    <meta name="twitter:image" content="https://neoject.ru/og_image_ru.png">
    <meta name="twitter:site" content="@Neoject">
    <meta name="twitter:creator" content="@Neoject">

    <!-- Дополнительные -->
    <meta name="robots" content="index, follow">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="theme-color" content="#6366f1">

    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script type="text/javascript" src="https://js.bepaid.by/widget/be_gateway.js"></script>
    <script src="<?= $HOME_URL ?>script.js"></script>
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="<?= $HOME_URL ?>style.css">
    <title><?= e($TITLE) ?></title>
</head>
<body>
    <header class="header" id="header">
        <div class="header-wrapper">
            <nav class="nav container">
                <div class="logo">
                    <a href="<?= $basePath ?>/index.php">Neoject</a>
                </div>
                <ul class="nav-menu" id="nav-menu">
                    <li><a href="<?= $basePath ?>/index.php#home">Главная</a></li>
                    <li><a href="<?= $basePath ?>/index.php#about">Обо мне</a></li>
                    <li><a href="<?= $basePath ?>/index.php#projects">Проекты</a></li>
                    <li><a href="<?= $basePath ?>/index.php#contact">Контакты</a></li>
                </ul>
                <div class="nav-actions">
                    <button class="theme-toggle" id="theme-toggle">
                        <span id="theme-icon">🌙</span>
                    </button>
                    <button class="menu-toggle" id="menu-toggle">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </nav>
        </div>
    </header>

    <!-- site code  -->