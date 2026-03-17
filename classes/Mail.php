<?php

namespace NeoVector;

use mysqli;
use Exception;

class Mail extends API
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

        $replySql = "CREATE TABLE IF NOT EXISTS `message_replies` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `message_id` int(11) NOT NULL,
                `subject` varchar(255) NOT NULL,
                `message` text NOT NULL,
                `to_email` varchar(255) NOT NULL,
                `created_by` int(11) NOT NULL,
                `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `message_id` (`message_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        Database::db()->query($replySql);
    }

    public static function new($data): void
    {
        $contact = new Mail();

        try {
            $email = (string) ($data['email'] ?? '');
            $message = (string) ($data['message'] ?? '');

            $contact->create($email, $message);

            $sellerEmail = getenv('EMAIL');

            if (filter_var($sellerEmail, FILTER_VALIDATE_EMAIL)) {
                $subject = 'Новое сообщение от клиента';
                $body = "Email клиента: {$email}\n\nСообщение:\n{$message}\n\nОтправлено: " . date('d.m.Y H:i');
                $headers = 'From: no-reply@' . ($_SERVER['HTTP_HOST']);
                @mail($sellerEmail, $subject, $body, $headers);
            }

            Service::sendJson(['success' => true]);
        } catch (Exception $e) {
            Service::sendError(400, $e->getMessage());
        }
    }

    /**
     * @param string $email
     * @param string $message
     * @param string $name
     * @return void
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

    public static function reply(): void
    {
        Auth::requireAuth();

        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (!is_array($data)) {
            Service::sendError(400, 'Invalid request data');
        }

        $messageId = isset($data['messageId']) ? (int) $data['messageId'] : 0;
        $to = isset($data['to']) ? trim((string) $data['to']) : '';
        $subject = isset($data['subject']) ? trim((string) $data['subject']) : '';
        $message = isset($data['message']) ? trim((string) $data['message']) : '';

        if (empty($to)) {
            Service::sendError(400, 'Email получателя обязателен');
        }

        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            Service::sendError(400, 'Некорректный email адрес получателя');
        }

        if (empty($subject)) {
            Service::sendError(400, 'Тема письма обязательна');
        }

        if (empty($message)) {
            Service::sendError(400, 'Текст ответа обязателен');
        }

        try {
            $adminEmail = Config::get('EMAIL') ?: 'admin@' . ($_SERVER['HTTP_HOST'] ?? 'aeternum.local');
            $adminName = 'Администратор Aeternum';

            $emailMessageHtml = "
            <html>
            <head>
                <meta charset='UTF-8'>
                <title>" . htmlspecialchars($subject) . "</title>
            </head>
            <body>
                <p>" . nl2br(htmlspecialchars($message)) . "</p>
                <hr>
                <p style='color: #888; font-size: 12px;'>Это ответ на ваше сообщение, отправленное через форму обратной связи на сайте Aeternum.</p>
            </body>
            </html>
            ";

            $headers = "From: {$adminName} <{$adminEmail}>\r\n";
            $headers .= "Reply-To: {$adminEmail}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion();

            $mailSent = @mail($to, $subject, $emailMessageHtml, $headers);

            if ($mailSent) {
                $db = Database::db();

                $checkColumn = $db->query("SHOW COLUMNS FROM `message_replies` LIKE 'created_by'");

                if ($checkColumn->num_rows === 0) {
                    $db->query("ALTER TABLE `message_replies` ADD COLUMN `created_by` int(11) NOT NULL DEFAULT 0 AFTER `to_email`");
                }

                $userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;
                $stmt = $db->prepare('INSERT INTO message_replies (message_id, subject, message, to_email, created_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())');

                if ($stmt === false) {
                    Log::error('Error preparing statement:', $db->error);
                    Service::sendError(500, 'Ошибка при подготовке запроса: ' . $db->error);
                }

                $stmt->bind_param('isssi', $messageId, $subject, $message, $to, $userId);
                $stmt->execute();
                $stmt->close();

                Service::sendJson(['success' => true, 'message' => 'Ответ успешно отправлен']);
            } else {
                Service::sendError(500, 'Ошибка при отправке письма. Попробуйте позже.');
            }
        } catch (Exception $e) {
            Log::error('Reply sending error:', $e->getMessage());
            Service::sendError(500, 'Ошибка при отправке ответа: ' . $e->getMessage());
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

    public static function getReplies()
    {
        Auth::requireAuth();

        $messageId = isset($_GET['message_id']) ? (int) $_GET['message_id'] : 0;

        if ($messageId <= 0) {
            Service::sendError(400, 'ID сообщения обязателен');
        }

        try {
            $checkColumn = Database::db()->query("SHOW COLUMNS FROM `message_replies` LIKE 'created_by'");

            if ($checkColumn->num_rows === 0) {
                Database::db()->query("ALTER TABLE `message_replies` ADD COLUMN `created_by` int(11) NOT NULL DEFAULT 0 AFTER `to_email`");
            }

            $stmt = Database::db()->prepare('SELECT mr.id, mr.message_id, mr.subject, mr.message, mr.to_email, mr.created_by, mr.created_at, u.username 
                                  FROM message_replies mr 
                                  LEFT JOIN users u ON mr.created_by = u.id 
                                  WHERE mr.message_id = ? 
                                  ORDER BY mr.created_at DESC');

            if ($stmt === false) {
                Log::error('Error preparing statement:', Database::db()->error);
                Service::sendError(500, 'Ошибка при подготовке запроса');
            }

            $stmt->bind_param('i', $messageId);
            $stmt->execute();
            $result = $stmt->get_result();

            $replies = [];
            while ($row = $result->fetch_assoc()) {
                $replies[] = [
                    'id' => $row['id'],
                    'message_id' => $row['message_id'],
                    'subject' => $row['subject'],
                    'message' => $row['message'],
                    'to_email' => $row['to_email'],
                    'created_by' => $row['created_by'],
                    'created_at' => $row['created_at'],
                    'username' => $row['username'] ?: 'Неизвестный пользователь'
                ];
            }
            $stmt->close();

            Service::sendJson(['success' => true, 'data' => $replies]);
        } catch (Exception $e) {
            Log::error('Error getting message replies:', $e->getMessage());
            Service::sendError(500, 'Ошибка при получении ответов: ' . $e->getMessage());
        }
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