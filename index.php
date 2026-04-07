<?php

use NeoVector\ApiController;
use NeoVector\Database;
use NeoVector\Log;
use NeoVector\PageBlock;
use NeoVector\Params;
use NeoVector\Router;
use NeoVector\Service;
use NeoVector\VisitTracker;

require_once __DIR__ . '/config.php';

global $_DESCRIPTION;

$title = Params::getTitle();
Database::getInstance();
Service::setTitle($title);
Router::start();
VisitTracker::track();

//todo
$heroImage = PageBlock::getHeroImage();
$data = Params::get();
$ogDesc = $_DESCRIPTION ?? '';
$ogUrl = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

function e(string $s = ''): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
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
    <meta property="og:title" content="<?= e($title) ?>">
    <meta property="og:url" content="<?= e($ogUrl) ?>">
    <meta property="og:type" content="product">
    <meta property="og:image" content="/images/og-default.jpg">
    <script type="text/javascript" src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js" integrity="sha512-A7AYk1fGKX6S2SsHywmPkrnzTZHrgiVT7GcQkLGDe2ev0aWb8zejytzS8wjo7PGEXKqJOrjQ4oORtnimIRZBtw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
    <script type="text/javascript" src="https://js.bepaid.by/widget/be_gateway.js"></script>
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" integrity="sha512-1cK78a1o+ht2JcaW6g8OXYwqpev9+6GqOkz9xmBN9iUUhIndKtxwILGWYOSibOKjLsEdjyjZvYDq/cZwNeak0w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
    <link rel="stylesheet" href="style.css">
    <title><?=$title?></title>
</head>
<body>
    <script id="data" type="application/json">
    <?= json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>
    </script>
    <div id="app"></div>
    <div class="neoject">
        Сайт разработан
         <a class="btn btn-outline" style="border:none" href="https://neoject.by" target="_blank">neoject.by</a>
    </div>
</body>
<script src="app.bundle.js"></script>
</html>