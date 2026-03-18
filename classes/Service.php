<?php

namespace NeoVector;

class Service
{
    /**
     * @param $data
     * @return void
     */
    public static function sendJson($data): void
    {
        if (ob_get_level() > 0) {
            ob_end_clean();
        }

        echo json_encode($data);

        exit();
    }

    /**
     * @param $data
     * @return void
     */
    public static function sendSuccess($data): void
    {
        self::sendJson($data);
    }


    /**
     * @param int $code
     * @param string $message
     * @param string $value
     * @return void
     */
    public static function sendError(int $code, string $message, string $value = ''): void
    {
        if (ob_get_level() > 0) {
            ob_end_clean();
        }

        http_response_code($code);

        Log::error($message, $value);

        echo json_encode(['error' => $message]);

        exit();
    }

    public static function cleanupOldOrders($key): void
    {
        $expectedKey = (string) Config::get('CLEANUP_SECRET_KEY');

        if ($key !== $expectedKey) {
            Auth::requireAuth();
        }

        $daysToKeep = 60;
        $cutoffDate = date('Y-m-d H:i:s', strtotime("-{$daysToKeep} days"));
        $stmt = Database::db()->prepare('DELETE FROM orders WHERE created_at < ?');
        $stmt->bind_param('s', $cutoffDate);

        if ($stmt->execute()) {
            $deletedCount = $stmt->affected_rows;
            $stmt->close();
            Service::sendJson([
                'success' => true,
                'message' => "Удалено заказов: {$deletedCount}",
                'deleted_count' => $deletedCount,
                'cutoff_date' => $cutoffDate
            ]);
        }

        $err = $stmt->error;
        $stmt->close();
        Log::error('Database error occurred:', $err);
        Service::sendError(500, $err ?: 'Database error occurred');
    }

    public static function formatNumber($number): int
    {
        $value = preg_replace('/[^0-9]/', '', $number);
        return (int) $value;
    }

    public static function setTitle($title = ''): void
    {
        if ($title) {
            echo '<title>' . $title . '</title>';
        } else {
            echo '<title>' . Params::getTitle() . '</title>';
        }
    }

    public static function addJS(mixed $data): void
    {
        global $HOME_URL;

        if (!is_array($data)) {
            echo '<script src="' . $HOME_URL . 'src/scripts/local/' . $data . '.js"></script>';


        } else {
            foreach ($data as $script) {
                echo '<script src="' . $HOME_URL . 'src/scripts/local/' . $script . '.js"></script>';
            }
        }
    }

    public static function addCSS(mixed $data): void
    {
        global $HOME_URL;

        if (!is_array($data)) {
            echo '<link rel="stylesheet" href="' . $HOME_URL . 'src/css/local/' . $data . '.css">';

        } else {
            foreach ($data as $style) {
                echo '<link rel="stylesheet" href="' . $HOME_URL . 'src/css/local/' . $style . '.css">';
            }
        }
    }

    public static function adminJS(mixed $data): void
    {
        global $HOME_URL;

        if (!is_array($data)) {
            echo '<script src="' . $HOME_URL . 'src/scripts/admin/' . $data . '.js"></script>';
        } else {
            foreach ($data as $script) {
                echo '<script src="' . $HOME_URL . 'src/scripts/admin/' . $script . '.js"></script>';
            }
        }
    }
}