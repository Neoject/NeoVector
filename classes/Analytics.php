<?php

namespace NeoVector;

class Analytics
{
    public static function get(): void
    {
        Auth::requireAuth();
        self::createTable();

        $periodDays = self::getValidPeriod();
        $startDate = date('Y-m-d', strtotime("-{$periodDays} days"));

        Service::sendJson([
            'total_visits'       => self::getTotalVisits($startDate),
            'unique_visitors'    => self::getUniqueVisitors($startDate),
            'daily_visits'       => self::getDailyVisits($startDate),
            'top_pages'          => self::getTopPages($startDate)['all'],
            'top_virtual_pages'  => self::getTopPages($startDate)['virtual'],
            'top_php_pages'      => self::getTopPages($startDate)['php'],
            'hourly_visits'      => self::getHourlyVisits($startDate),
            'recent_visits'      => self::getRecentVisits($startDate),
            'period_days'        => $periodDays,
        ]);
    }

    private static function createTable(): void
    {
        Database::db()->query("CREATE TABLE IF NOT EXISTS `visits` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    }

    private static function getValidPeriod(): int
    {
        $periodDays = (int) ($_GET['period'] ?? '7');

        return ($periodDays < 1 || $periodDays > 365) ? 7 : $periodDays;
    }

    private static function getTotalVisits(string $startDate): int
    {
        $stmt = Database::db()->prepare('SELECT COUNT(*) as total FROM visits WHERE visit_date >= ?');
        $stmt->bind_param('s', $startDate);
        $stmt->execute();
        $total = (int) ($stmt->get_result()->fetch_assoc()['total'] ?? 0);
        $stmt->close();

        return $total;
    }

    private static function getUniqueVisitors(string $startDate): int
    {
        $stmt = Database::db()->prepare('SELECT COUNT(DISTINCT ip_address) as unique_visitors FROM visits WHERE visit_date >= ?');
        $stmt->bind_param('s', $startDate);
        $stmt->execute();
        $unique = (int) ($stmt->get_result()->fetch_assoc()['unique_visitors'] ?? 0);
        $stmt->close();

        return $unique;
    }

    private static function getDailyVisits(string $startDate): array
    {
        $stmt = Database::db()->prepare('SELECT visit_date, COUNT(*) as count FROM visits WHERE visit_date >= ? GROUP BY visit_date ORDER BY visit_date ASC');
        $stmt->bind_param('s', $startDate);
        $stmt->execute();
        $result = $stmt->get_result();
        $daily = [];

        while ($row = $result->fetch_assoc()) {
            $daily[] = ['date' => $row['visit_date'], 'count' => (int) $row['count']];
        }

        $stmt->close();

        return $daily;
    }

    private static function getVirtualPages(): array
    {
        $stmt = Database::db()->query('SELECT slug FROM pages WHERE is_published = 1');
        $virtualPages = [];

        while ($row = $stmt->fetch_assoc()) {
            $virtualPages[] = '/' . $row['slug'];
        }

        $stmt->close();

        return $virtualPages;
    }

    private static function getTopPages(string $startDate): array
    {
        $virtualPages = self::getVirtualPages();

        $stmt = Database::db()->prepare('SELECT page_url, COUNT(*) as count FROM visits WHERE visit_date >= ? GROUP BY page_url ORDER BY count DESC LIMIT 20');
        $stmt->bind_param('s', $startDate);
        $stmt->execute();
        $result = $stmt->get_result();

        $all = $virtual = $php = [];

        while ($row = $result->fetch_assoc()) {
            $url = $row['page_url'];
            $count = (int) $row['count'];
            $isVirtual = in_array($url, $virtualPages) || ($url !== '/' && Page::isVirtualPageUrl($url, $virtualPages));
            $pageData = ['url' => $url, 'count' => $count, 'is_virtual' => $isVirtual];

            $all[] = $pageData;
            $isVirtual ? $virtual[] = $pageData : $php[] = $pageData;
        }

        $stmt->close();

        return ['all' => $all, 'virtual' => $virtual, 'php' => $php];
    }

    private static function getHourlyVisits(string $startDate): array
    {
        $stmt = Database::db()->prepare('SELECT HOUR(visit_time) as hour, COUNT(*) as count FROM visits WHERE visit_date >= ? GROUP BY HOUR(visit_time) ORDER BY hour ASC');
        $stmt->bind_param('s', $startDate);
        $stmt->execute();
        $result = $stmt->get_result();
        $hourly = [];

        while ($row = $result->fetch_assoc()) {
            $hourly[] = ['hour' => (int) $row['hour'], 'count' => (int) $row['count']];
        }

        $stmt->close();

        return $hourly;
    }

    private static function getRecentVisits(string $startDate): array
    {
        $stmt = Database::db()->prepare('SELECT ip_address, page_url, visit_date, visit_time, referer FROM visits WHERE visit_date >= ? ORDER BY created_at DESC LIMIT 50');
        $stmt->bind_param('s', $startDate);
        $stmt->execute();
        $result = $stmt->get_result();
        $recent = [];

        while ($row = $result->fetch_assoc()) {
            $recent[] = [
                'ip'      => $row['ip_address'],
                'url'     => $row['page_url'],
                'date'    => $row['visit_date'],
                'time'    => $row['visit_time'],
                'referer' => $row['referer'] ?: 'Прямой заход',
            ];
        }

        $stmt->close();

        return $recent;
    }
}