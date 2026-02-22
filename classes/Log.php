<?php

namespace NeoVision;

class Log
{
    public static function write($text, $arFields): void
    {
        $logDir = $_SERVER['DOCUMENT_ROOT'] . '/logs/';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0777, true);
        }
        $file = fopen($logDir . 'log_' . date("d.m.Y_H.i") . '.php', 'a');
        if ($file) {
            fwrite($file, '<?php' . PHP_EOL . $text . ' = ' . var_export($arFields, true) . ';' . PHP_EOL . '?>' . PHP_EOL);
            fclose($file);
        }
    }

    public static function error($text, $arFields): void
    {
        $logDir = $_SERVER['DOCUMENT_ROOT'] . '/logs/';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0777, true);
        }
        $file = fopen($logDir . 'error_' . date("d.m.Y_H.i") . '.php', 'a');
        if ($file) {
            fwrite($file, '<?php' . PHP_EOL . $text . ' = ' . var_export($arFields, true) . ';' . PHP_EOL . '?>' . PHP_EOL);
            fclose($file);
        }
    }
}