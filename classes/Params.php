<?php

namespace NeoVector;

class Params
{
    public static function handleUploadLogo(): void
    {
        Auth::requireAuth();

        if (!isset($_FILES['logo']) || ($_FILES['logo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Service::sendError(400, 'Логотип не загружен');
        }

        $file = $_FILES['logo'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        $fileType = $file['type'] ?? '';

        if (!in_array($fileType, $allowedTypes, true)) {
            Service::sendError(400, 'Недопустимый тип файла. Разрешены JPEG, PNG, GIF, WebP и SVG.');
        }

        $fileSize = (int) ($file['size'] ?? 0);

        if ($fileSize > 5 * 1024 * 1024) {
            Service::sendError(400, 'Слишком большой файл. Максимум 5 МБ.');
        }

        $uploadDir = dirname(__DIR__) . '/assets/logo/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $extension = pathinfo($file['name'] ?? 'logo', PATHINFO_EXTENSION) ?: 'png';
        $fileName = 'site_logo.' . $extension;
        $filePath = $uploadDir . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            Service::sendError(500, 'Не удалось сохранить логотип');
        }

        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
        $baseUrl = '';

        if (isset($_SERVER['HTTP_HOST'])) {
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
            $baseUrl = $protocol . '://' . $_SERVER['HTTP_HOST'] . $scriptDir;
        }

        $url = $baseUrl . '/assets/logo/' . $fileName;
        Service::sendJson(['success' => true, 'url' => $url]);
    }


    /**
     * @return void
     */
    public static function handleUploadBackgroundImage(): void
    {
        Auth::requireAuth();

        if (!isset($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Service::sendError(400, 'No image uploaded');
        }

        $file = $_FILES['image'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $fileType = $file['type'] ?? '';

        if (!in_array($fileType, $allowedTypes, true)) {
            Service::sendError(400, 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
        }

        $fileSize = (int) ($file['size'] ?? 0);

        if ($fileSize > 5 * 1024 * 1024) {
            Service::sendError(400, 'File size too large. Maximum 5MB allowed.');
        }

        $uploadDir = dirname(__DIR__) . '/assets/backgrounds/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $extension = pathinfo($file['name'] ?? 'bg', PATHINFO_EXTENSION);
        $fileName = 'bg_' . uniqid() . '.' . $extension;
        $filePath = $uploadDir . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            Service::sendError(500, 'Failed to upload image');
        }

        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
        $baseUrl = '';

        if (isset($_SERVER['HTTP_HOST'])) {
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
            $baseUrl = $protocol . '://' . $_SERVER['HTTP_HOST'] . $scriptDir;
        }

        $url = $baseUrl . '/assets/backgrounds/' . $fileName;
        Service::sendJson(['success' => true, 'url' => $url]);
    }
}