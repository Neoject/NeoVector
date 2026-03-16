<?php

use NeoVector\Auth;
use NeoVector\Config;
use NeoVector\Database;

require_once 'autoloader.php';

Config::load();

global $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME;

$DB_HOST = Config::get('DB_HOST');
$DB_USER = Config::get('DB_USER');
$DB_PASS = Config::get('DB_PASS');
$DB_NAME = Config::get('DB_NAME');

if ($DB_USER === '' || $DB_USER === false) {
    throw new RuntimeException(
        'DB credentials not set. Set DB_USER (and DB_HOST, DB_PASS, DB_NAME) in config.php or in a .env file in the project root.'
    );
}

session_start();
Auth::init(Database::db());

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
$basePath = dirname($scriptName);

$projectBasePath = dirname($basePath);

if ($projectBasePath === '/' || $projectBasePath === '\\' || $projectBasePath === '.' || $projectBasePath === '') {
    $HOME_URL = '/';
} else {
    $HOME_URL = rtrim($projectBasePath, "/\\\\") . '/';
}

$_DESCRIPTION = 'Aeternum (Этернум) — бренд аксессуаров, построенный на философии вечности, ручного мастерства и натуральных материалов. Каждый ремень создаётся вручную с уважением к традициям кожевенного дела и продуманной функциональности, объединяя винтажную эстетику и современные технологии.
Это не массовый продукт, а аксессуар с характером — надёжный, эстетичный и с душой. Ремни Aeternum в стиле handmade cuff превращают любые часы в выразительный акцент образа и полноценный statement piece.';