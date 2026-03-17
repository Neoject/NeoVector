<?php

use NeoVector\Database;
use NeoVector\Params;
use NeoVector\Service;
use NeoVector\VisitTracker;

require_once __DIR__ . '/config.php';

global $HOME_URL, $TITLE;

if (!$TITLE) $TITLE = Params::getTitle();

Service::setTitle($TITLE);

$vars = [];

try {
    if (class_exists(VisitTracker::class)) {
        VisitTracker::track();
    } else {
        error_log('VisitTracker missing: class NeoVector\\VisitTracker not found');
    }
} catch (\Throwable $e) {
    error_log('VisitTracker error: ' . $e->getMessage());
}

try {
    if (class_exists(Database::class)) {
        Database::getInstance();
    } else {
        error_log('Database missing: class NeoVector\\Database not found');
    }
} catch (\Throwable $e) {
    error_log('Database connection error: ' . $e->getMessage());
}


if (isset($_GET['id'])) {
    $product = NeoVector\Config::getProductData($productId = (int) $_GET['id']);

    $TITLE = $product ? ($product['name'] . ' - ' . Params::getTitle()) : 'Товар не найден';

    $mainImageUrl = '';
    if ($product && !empty($product['image'])) {
        $mainImageUrl = NeoVector\Config::normalize_media_url($product['image'], $HOME_URL);
    }

    $allMedia = [];

    if ($mainImageUrl !== '') {
        $mainMediaType = NeoVector\Config::is_video_file($product['image']) ? 'video' : 'image';
        $allMedia[] = ['type' => $mainMediaType, 'url' => $mainImageUrl];

        if ($product['image']) {
            $vars['og_image'] = $mainImageUrl;
        }
    }

    if ($product) {
        foreach ($product['additional_images'] as $img) {
            $u = NeoVector\Config::normalize_media_url((string) $img, $HOME_URL);
            if ($u !== '')
                $allMedia[] = ['type' => 'image', 'url' => $u];
        }

        foreach ($product['additional_videos'] as $vid) {
            $u = NeoVector\Config::normalize_media_url((string) $vid, $HOME_URL);
            if ($u !== '')
                $allMedia[] = ['type' => 'video', 'url' => $u];
        }
    }
}

function e(string $s = ''): string
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
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script type="text/javascript" src="https://js.bepaid.by/widget/be_gateway.js"></script>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
    <script src="<?= $HOME_URL ?>src/scripts/script.js"></script>
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
    <link rel="stylesheet" href="<?= $HOME_URL ?>src/css/style.css">
</head>