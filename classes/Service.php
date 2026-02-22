<?php

namespace NeoVision;

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
}