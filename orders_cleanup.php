<?php
/**
 * Скрипт для автоматического удаления заказов старше 30 дней
 *
 * Использование:
 * 1. Через cron job (рекомендуется):
 *    0 2 * * * /usr/bin/php /path/to/orders_cleanup.php
 *    (запуск каждый день в 2:00 ночи)
 *
 * 2. Через браузер:
 *    http://yourdomain.com/cleanup_old_orders.php?secret_key=your_secret_key
 *
 * 3. Через командную строку:
 *    php orders_cleanup.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

$envPath = __DIR__ . '/.env';
if (file_exists($envPath) && is_readable($envPath)) {
    $envLines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($envLines !== false) {
        foreach ($envLines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') {
                continue;
            }
            if (strpos($line, '=') === false) {
                continue;
            }
            [$name, $value] = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value, " \t\n\r\0\x0B\"'");
            if ($name === '') {
                continue;
            }
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

function env_value(string $key, $default = null) {
    $value = getenv($key);
    if ($value !== false) {
        return $value;
    }
    if (isset($_ENV[$key])) {
        return $_ENV[$key];
    }
    if (isset($_SERVER[$key])) {
        return $_SERVER[$key];
    }
    return $default;
}

$isCli = php_sapi_name() === 'cli';
$secretKey = $isCli ? '' : ($_GET['secret_key'] ?? '');
$expectedKey = env_value('CLEANUP_SECRET_KEY', 'default_secret_key_change_me');

if (!$isCli && $secretKey !== $expectedKey) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Unauthorized: Invalid secret key']);
    exit();
}

$dbHost = env_value('DB_HOST', '127.0.0.1');
$dbUser = env_value('DB_USER', 'admin');
$dbPass = env_value('DB_PASS', 'hohol1488');
$dbName = env_value('DB_NAME', 'aeternum');

$mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($mysqli->connect_errno) {
    $error = "DB connection failed: " . $mysqli->connect_error;
    if ($isCli) {
        echo $error . "\n";
    } else {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => $error]);
    }
    exit(1);
}
$mysqli->set_charset('utf8mb4');

$daysToKeep = 60;
$cutoffDate = date('Y-m-d H:i:s', strtotime("-{$daysToKeep} days"));
$countStmt = $mysqli->prepare('SELECT COUNT(*) as count FROM orders WHERE created_at < ?');
$countStmt->bind_param('s', $cutoffDate);
$countStmt->execute();
$countResult = $countStmt->get_result();
$countRow = $countResult->fetch_assoc();
$ordersToDelete = $countRow['count'];
$countStmt->close();
$deleteStmt = $mysqli->prepare('DELETE FROM orders WHERE created_at < ?');
$deleteStmt->bind_param('s', $cutoffDate);
$success = false;
$deletedCount = 0;

if ($deleteStmt->execute()) {
    $deletedCount = $deleteStmt->affected_rows;
    $success = true;
} else {
    $error = $deleteStmt->error ?: 'Unknown error';
}

$deleteStmt->close();
$mysqli->close();

$result = [
    'success' => $success,
    'message' => $success 
        ? "Успешно удалено заказов: {$deletedCount}" 
        : "Ошибка при удалении: {$error}",
    'deleted_count' => $deletedCount,
    'orders_found' => $ordersToDelete,
    'cutoff_date' => $cutoffDate,
    'execution_time' => date('Y-m-d H:i:s')
];

if ($isCli) {
    echo "=== Автоматическая очистка старых заказов ===\n";
    echo "Дата отсечки: {$cutoffDate}\n";
    echo "Найдено заказов для удаления: {$ordersToDelete}\n";
    echo "Удалено заказов: {$deletedCount}\n";
    echo "Статус: " . ($success ? "Успешно" : "Ошибка") . "\n";
    echo "Время выполнения: {$result['execution_time']}\n";
    exit($success ? 0 : 1);
} else {
    header('Content-Type: application/json');
    if ($success) {
        echo json_encode($result);
    } else {
        http_response_code(500);
        echo json_encode($result);
    }
    exit();
}

