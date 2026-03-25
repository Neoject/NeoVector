<?php

namespace NeoVector;

use Exception;

class VisitTracker
{
    /**
     * @return void
     */
    public static function track(): void
    {
        date_default_timezone_set('Europe/Moscow');

        try {
            $dbInstance = Database::getInstance();
            $mysqli = $dbInstance->getConnection();
        } catch (Exception $e) {
            error_log('VisitTracker: Database connection failed: ' . $e->getMessage());
            return;
        }

        try {
            $createVisitsTableSQL = "CREATE TABLE IF NOT EXISTS `visits` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `ip_address` varchar(45) NOT NULL,
                `user_agent` text,
                `referer` text,
                `page_url` varchar(500) NOT NULL,
                `visit_date` date NOT NULL,
                `visit_time` time NOT NULL,
                `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `visit_date` (`visit_date`),
                KEY `page_url` (`page_url`(255)),
                KEY `ip_address` (`ip_address`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

            $mysqli->query($createVisitsTableSQL);
        } catch (Exception $e) {
            error_log('VisitTracker: Failed to create visits table: ' . $e->getMessage());
            return;
        }

        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        $pageUrl = $_SERVER['REQUEST_URI'] ?? '/';
        $visitDate = date('Y-m-d');
        $visitTime = date('H:i:s');

        if (strpos($pageUrl, '/?') === 0) {
            return;
        }

        $excludedPaths = ['/admin', '/api.php', '/api/', '/assets', '/favicon.ico'];
        foreach ($excludedPaths as $excluded) {
            if (strpos($pageUrl, $excluded) === 0) {
                return;
            }
        }

        if (strpos($pageUrl, '/product') === 0) {
            $hasProductId = isset($_GET['id']) && !empty($_GET['id']) && (int)$_GET['id'] > 0;

            if (!$hasProductId) {
                return;
            }

            $pageUrl = '/product?id=' . (int)$_GET['id'];
        }

        try {
            $stmt = $mysqli->prepare('INSERT INTO visits (ip_address, user_agent, referer, page_url, visit_date, visit_time) VALUES (?, ?, ?, ?, ?, ?)');

            if ($stmt === false) {
                error_log('VisitTracker: Prepare failed: ' . $mysqli->error);
                return;
            }

            $stmt->bind_param('ssssss', $ip, $userAgent, $referer, $pageUrl, $visitDate, $visitTime);
            
            if (!$stmt->execute()) {
                error_log('VisitTracker: Execute failed: ' . $stmt->error);
            }
            
            $stmt->close();
        } catch (Exception $e) {
            error_log('VisitTracker: Failed to insert visit: ' . $e->getMessage());
        }
    }
}
