<?php

use NeoVector\Auth;
use NeoVector\Category;
use NeoVector\Config;
use NeoVector\Database;
use NeoVector\HomeContent;
use NeoVector\Params;

require_once 'autoloader.php';

if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', __DIR__);
}

Config::load();

global $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME;

$DB_HOST = Config::get('DB_HOST');
$DB_USER = Config::get('DB_USER');
$DB_PASS = Config::get('DB_PASS');
$DB_NAME = Config::get('DB_NAME');

if ($DB_USER === '' || $DB_USER === false || $DB_USER === null) {
    throw new RuntimeException(
        'DB credentials not set. Set DB_USER (and DB_HOST, DB_PASS, DB_NAME) in config.php or in a .env file in the project root.'
    );
}

Category::createTable();
HomeContent::createTable();
Params::createTable();

session_start();
Auth::init(Database::db());

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');

if (str_contains($scriptName, '/NV/')) {
    $prefix = substr($scriptName, 0, strpos($scriptName, '/NV/'));
    $HOME_URL = ($prefix === '' || $prefix === '/') ? '/' : $prefix . '/';
} else {
    $dir = dirname($scriptName);
    if ($dir === '/' || $dir === '.' || $dir === '') {
        $HOME_URL = '/';
    } else {
        $HOME_URL = rtrim($dir, '/') . '/';
    }
}

define('ROOT', $HOME_URL === '/' ? '' : rtrim($HOME_URL, '/'));
const NV = ROOT . '/NV';

$_DESCRIPTION = Params::getDescription();