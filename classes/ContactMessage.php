<?php

namespace NeoVector;

use mysqli;
use Exception;

class ContactMessage extends API
{
    /**
     * @return void
     */
    protected static function createTable(): void
    {
        $sql = "CREATE TABLE IF NOT EXISTS `contact_messages` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `email` varchar(255) NOT NULL,
            `message` text NOT NULL,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        Database::db()->query($sql);
    }

    /**
     * @param string $email
     * @param string $message
     * @return void
     * @throws Exception
     */
    public static function create(string $email, string $message, string $name = ''): void
    {
        self::createTable();

        $email   = trim($email);
        $message = trim($message);

        try {
            $stmt = Database::db()->prepare('INSERT INTO contact_messages (name, email, message, created_at) VALUES (?, ?, ?, NOW())');
            $stmt->bind_param('sss', $name, $email, $message);
            $stmt->execute();
            $stmt->close();
        } catch (Exception $e) {
            Log::error('Message error:', $e->getMessage());
        }
    }

    /**
     * Contact form handler (name/email/message) that sends an HTML email.
     * @return void
     */
    public static function sendUserMail(): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            Service::sendError(405, 'Method not allowed');
        }

        $data = $_POST;

        if (empty($data)) {
            $input = file_get_contents('php://input');
            if (is_string($input) && $input !== '') {
                $decoded = json_decode($input, true);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            }
        }

        $name    = isset($data['name'])    ? trim((string) $data['name'])    : '';
        $email   = isset($data['email'])   ? trim((string) $data['email'])   : '';
        $message = isset($data['message']) ? trim((string) $data['message']) : '';

        if ($name === '') {
            Service::sendError(400, 'Имя обязательно для заполнения');
        }

        if ($email === '') {
            Service::sendError(400, 'Email обязателен для заполнения');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Service::sendError(400, 'Некорректный email адрес');
        }

        if ($message === '') {
            Service::sendError(400, 'Сообщение обязательно для заполнения');
        }

        $to = Config::get('EMAIL');
        if (empty($to) && !empty($GLOBALS['_NV']['EMAIL'])) {
            $to = $GLOBALS['_NV']['EMAIL'];
        }
        if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            Log::error('Contact form: EMAIL not configured or invalid in .env / config');
            Service::sendError(500, 'На сервере не настроен адрес для приёма заявок.');
        }

        $subject = "Новое сообщение с формы обратной связи от {$name}";

        $safeName  = str_replace(["\r", "\n"], '', $name);
        $safeEmail = str_replace(["\r", "\n"], '', $email);

        $emailMessageHtml = "
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>" . htmlspecialchars($subject) . "</title>
        </head>
        <body>
            <h3>Новое сообщение с формы обратной связи</h3>
            <p><strong>Имя:</strong> " . htmlspecialchars($name) . "</p>
            <p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>
            <p><strong>Сообщение:</strong></p>
            <p>" . nl2br(htmlspecialchars($message)) . "</p>
        </body>
        </html>
        ";

        $siteName = Config::get('MAIL_FROM_NAME', 'Aeternum');
        $headers  = "From: \"{$siteName}\" <{$to}>\r\n";
        $headers .= "Reply-To: " . ($safeName ? "\"{$safeName}\" " : '') . "<{$safeEmail}>\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();

        $mailSent = @mail($to, $subject, $emailMessageHtml, $headers);

        try {
            self::create($email, $message, $name);
        } catch (Exception $e) {
            Log::error('Message save error:', $e->getMessage());
        }

        if ($mailSent) {
            Service::sendJson(['success' => true, 'message' => 'Сообщение успешно отправлено!']);
        }

        Service::sendError(500, 'Ошибка при отправке письма. Попробуйте позже.');
    }

    public static function getMailList(): void
    {
        $result = Database::getList('contact_messages', [], ['created_at' => 'DESC']);
        Service::sendJson(['success' => true, 'data' => $result]);
    }

    /**
     * Delete a contact message by ID (admin only).
     * @return void
     */
    public static function deleteMessage(): void
    {
        Auth::requireAuth();
        $id = (int) ($_POST['id'] ?? $_REQUEST['id'] ?? 0);

        if ($id <= 0) {
            Service::sendError(400, 'ID сообщения обязателен');
        }

        $db = Database::db();
        $stmt = $db->prepare('DELETE FROM contact_messages WHERE id = ?');
        $stmt->bind_param('i', $id);

        if (!$stmt->execute()) {
            $stmt->close();
            Service::sendError(500, 'Ошибка при удалении сообщения');
        }
        $stmt->close();
        Service::sendJson(['success' => true, 'deleted_id' => $id]);
    }
}