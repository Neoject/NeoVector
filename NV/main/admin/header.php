<?php
global $HOME_URL;

use NeoVector\Order;
use NeoVector\Params;

require_once ROOT_PATH . '/config.php';

Order::createTable();

$scripts = ['analytics', 'block-modal', 'messages', 'message-detail', 'message-reply', 'options', 'orders', 'product-modal', 'users', 'profile'];
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
    <meta name="msapplication-tap-highlight" content="no">
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="<?=ROOT?>/main/js/nv_object.js"></script>
    <script src="<?=ROOT?>/main/js/admin/pages/admin-dashboard.js"></script>
    <?php foreach ($scripts as $script): ?>
        <script src="<?=ROOT?>/main/js/admin/pages/<?=$script?>.js"></script>
    <?php endforeach; ?>
    <link rel="icon" href="<?=ROOT?>/../favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="<?=ROOT?>/main/styles/admin.css">
    <title>Админ панель - <?= Params::getTitle() ?></title>
</head>