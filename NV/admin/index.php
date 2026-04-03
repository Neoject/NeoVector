<?php
require_once dirname(__DIR__, 2) . '/config.php';

global $scripts;

use NeoVector\API;
use NeoVector\Auth;
use NeoVector\Database;
use NeoVector\Order;
use NeoVector\Params;

API::setupSession();

Order::createTable();

$db = Database::getInstance()->getConnection();
$auth = new Auth();
$loginError = '';
$adminPublicPath = rtrim(ROOT, '/') . '/admin';

if (isset($_REQUEST['action']) && $_REQUEST['action'] === 'logout') {
    $auth->logout();
    header('Location: ' . ROOT);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $remember = isset($_POST['remember']) && $_POST['remember'] === '1';

    $result = [];

    try {
        $result = $auth->login($username, $password, $remember);
    } catch (Exception $e) {
        error_log($e->getMessage());
        $result = ['success' => false, 'error' => 'Ошибка сервера'];
    }

    if (!empty($result['success']) && ($result['role'] ?? '') === 'admin') {
        header('Location: ' . $adminPublicPath);
        exit;
    }

    if (!empty($result['success']) && ($result['role'] ?? '') !== 'admin') {
        $auth->logout();
        $loginError = 'Недостаточно прав';
    } else {
        $loginError = $result['error'] ?? 'Неверные учетные данные';
    }
}

$credits = [
    'admin' => $auth->isAdmin(),
    'admin_user' => $auth->getCurrentUser(),
    'logo' => Params::getLogo(),
    'auth' => [
            'action' => $adminPublicPath,
            'login' => $_POST['username'] ?? '',
            'remember' => isset($_POST['remember']) && $_POST['remember'] === '1',
            'error' => $loginError
    ]
];
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
    <script type="text/javascript" src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js" integrity="sha512-A7AYk1fGKX6S2SsHywmPkrnzTZHrgiVT7GcQkLGDe2ev0aWb8zejytzS8wjo7PGEXKqJOrjQ4oORtnimIRZBtw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
    <script type="text/javascript" src="https://js.bepaid.by/widget/be_gateway.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="icon" href="<?=NV?>/../favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="<?=NV?>/main/styles/admin.css">
    <link rel="stylesheet" href="index-CzmG9flJ.css">
    <title>Админ панель - <?= Params::getTitle() ?></title>
</head>
<body>
    <script id="credits-data" type="application/json">
    <?= json_encode($credits, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>
    </script>
    <div class="admin-loading-container" id="load_box">
        <div class="admin-loader"></div>
    </div>
    <div id="admin"></div>
    <script src="<?=NV?>/admin/admin.bundle.js"></script>
</body>
</html>