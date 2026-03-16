<?php

namespace NeoVector;

use Exception;
use NeoVector\Product\Product;
use NeoVector\Product\ProductOption;
use NeoVector\Product\ProductType;

ob_start();

class API
{
    public static function init(): void
    {
        self::setupErrorHandling();
        self::setupHeaders();
        self::setupSession();

        Config::load();

        ContactMessage::createTable();

        $dir = 'logs';

        if (!file_exists($dir)) {
            mkdir($dir);
        }

        try {
            Database::getInstance();
        } catch (Exception $e) {
            Service::sendError(500, 'Database connection failed', $e->getMessage());
        }
    }


    /**
     * @return void
     */
    private static function setupErrorHandling(): void
    {
        set_error_handler([self::class, 'handleError']);
        register_shutdown_function([self::class, 'handleFatalError']);
    }

    /**
     * @return void
     */
    private static function setupHeaders(): void
    {
        header('Content-Type: application/json');

        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $sameHost = isset($_SERVER['HTTP_HOST']) && $requestOrigin && (parse_url($requestOrigin, PHP_URL_HOST) === $_SERVER['HTTP_HOST']);

        if ($requestOrigin && $sameHost) {
            header('Access-Control-Allow-Origin: ' . $requestOrigin);
            header('Vary: Origin');
        } else {
            header('Access-Control-Allow-Origin: http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        }

        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }

    /**
     * @return void
     */
    private static function setupSession(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            $isSecure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
            if (PHP_VERSION_ID >= 70300) {
                session_set_cookie_params([
                    'lifetime' => 30 * 24 * 60 * 60,
                    'path' => '/',
                    'secure' => $isSecure,
                    'httponly' => true,
                    'samesite' => 'Lax'
                ]);
            } else {
                session_set_cookie_params(30 * 24 * 60 * 60, '/');
            }

            session_start();
        }
    }

    /**
     * @param $errno
     * @param $errstr
     * @return false|void
     */
    public static function handleError($errno, $errstr)
    {
        if (!(error_reporting() & $errno)) {
            return false;
        }

        ob_clean();
        Service::sendError(500, 'PHP Error', $errstr);
    }

    /**
     * @return void
     */
    public static function handleFatalError(): void
    {
        $error = error_get_last();
        if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            ob_clean();
            Log::error('Fatal error:', $error['message']);
            Service::sendError(500, 'Fatal Error: ' . $error['message']);
        }
    }

    /**
     * @return void
     */
    public static function handleRequest(): void
    {
        self::init();
        $action = $_REQUEST['action'] ?? '';

        try {
            switch ($action) {
                case 'login':
                    User::login();
                    break;
                case 'register':
                    User::register();
                    break;
                case 'logout':
                    User::logout();
                    break;
                case 'me':
                case 'user':
                    User::me($action);
                    break;
                case 'page':
                    Page::get();
                    break;
                case 'pages':
                    Page::getAll();
                    break;
                case 'add_page':
                    Page::addPage();
                    break;
                case 'update_page':
                    Page::updatePage();
                    break;
                case 'delete_page':
                    Page::deletePage();
                    break;
                case 'page_navigation':
                    Page::navigation();
                    break;
                case 'products':
                    Product::getProducts();
                    break;
                case 'categories':
                    Service::sendJson(Category::getAll());
                    break;
                case 'add_category':
                    Service::sendJson(['success' => true, 'id' => Category::create($_POST)]);
                    break;
                case 'update_category':
                    Category::update((int) $_POST['id'], $_POST);
                    break;
                case 'delete_category':
                    Category::delete((int) $_POST['id']);
                    break;
                case 'save_categories_order':
                    Category::updateOrder(json_decode($_POST['categories_order'], true));
                    break;
                case 'save_products_order':
                    Product::saveProductsOrder();
                    break;
                case 'add_product':
                    Product::addProduct();
                    break;
                case 'update_product':
                    Product::updateProduct();
                    break;
                case 'delete_product':
                    Product::deleteProduct();
                    break;
                case 'upload_product_media':
                    Product::uploadProductMedia();
                    break;
                case 'add_product_images':
                    Product::addProductImages();
                    break;
                case 'delete_product_image':
                    Product::deleteProductImage();
                    break;
                case 'get_image_id':
                    Product::getImageId();
                    break;
                case 'generate_product_description':
                    Product::generateProductDescription();
                    break;
                case 'home_content':
                case 'public_home_content':
                    Service::sendJson(HomeContent::getAll());
                    break;
                case 'save_home_content':
                    HomeContent::save(json_decode($_POST['content'] ?? '[]', true));
                    break;
                case 'page_blocks':
                    Service::sendJson(PageBlock::getAll());
                    break;
                case 'hero_image':
                    Service::sendJson(['url' => PageBlock::getHeroImage()]);
                    break;
                case 'add_page_block':
                    Service::sendJson(['success' => true, 'id' => PageBlock::create($data)]);
                    break;
                case 'update_page_block':
                    PageBlock::update($_POST['id'], $data = [
                        'type' => $_POST['type'] ?? '',
                        'title' => $_POST['title'] ?? '',
                        'content' => $_POST['content'] ?? '',
                        'settings' => $_POST['settings'] ?? '{}',
                        'sort_order' => (int) ($_POST['sort_order'] ?? 0),
                        'is_active' => isset($_POST['is_active']) ? (int) $_POST['is_active'] : 1,
                    ]);
                    break;
                case 'delete_page_block':
                    PageBlock::delete($_POST['id']);
                    break;
                case 'save_blocks_order':
                    PageBlock::updateOrder(json_decode($_POST['blocks_order'], true));
                    break;
                case 'upload_background_image':
                    Params::handleUploadBackgroundImage();
                    break;
                case 'upload_logo':
                    Params::handleUploadLogo();
                    break;
                case 'create_order':
                    Order::create($_POST);
                    break;
                case 'orders':
                    Service::sendJson(Order::getAll());
                    break;
                case 'update_order_status':
                    Order::updateStatus($_POST['id'], $_POST['status']);
                    break;
                case 'update_payment_status':
                    Order::updatePaymentStatus($_POST['order_id'], $_POST['payment_status']);
                    break;
                case 'delete_order':
                    Order::delete($_POST['order_id']);
                    break;
                case 'cleanup_old_orders':
                    Service::cleanupOldOrders($_POST['secret_key']);
                    break;
                case 'contact_form':
                    ContactMessage::sendUserMail();
                    break;
                case 'messages':
                    ContactMessage::getMailList();
                    break;
                case 'delete_message':
                    ContactMessage::deleteMessage();
                    break;
                case 'send-reply':
                    self::handleSendReply();
                    break;
                case 'message-replies':
                    self::handleGetMessageReplies();
                    break;
                case 'contact_message':
                    self::handleContactMessage();
                    break;
                case 'product_options':
                    ProductOption::getAll();
                    break;
                case 'save_product_options':
                    ProductOption::save();
                    break;
                case 'product_types':
                    ProductType::getAll();
                    break;
                case 'save_product_types':
                    ProductType::save();
                    break;
                case 'analytics':
                    self::handleAnalytics();
                    break;
                case 'get_profile':
                    User::getUser();
                    break;
                case 'update_profile':
                    User::updateProfile();
                    break;
                case 'change_password':
                    User::changePassword();
                    break;
                case 'users':
                    User::getUsers();
                    break;
                case 'payment':
                    Payment::getPaymentToken();
                    break;
                case 'save_params':
                    self::handleSaveParams();
                    break;
                case 'get_params':
                    self::handleGetParams();
                    break;
                case 'visibility':
                    Product::changeVisibility();
                    break;
                default:
                    Service::sendError(404, 'Неправильный запрос');
            }
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, $e->getMessage());
        }
    }

    /**
     * @return void
     */
    private static function handleContactMessage(): void
    {
        $contact = new ContactMessage(Database::db());

        try {
            $email = (string) ($_POST['email'] ?? '');
            $message = (string) ($_POST['message'] ?? '');

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
     * @return void
     */
    private static function handleSendReply(): void
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
            $createRepliesTableSQL = "CREATE TABLE IF NOT EXISTS `message_replies` (
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
            Database::db()->query($createRepliesTableSQL);

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
     * @return void
     */
    private static function handleGetMessageReplies(): void
    {
        Auth::requireAuth();

        $messageId = isset($_GET['message_id']) ? (int) $_GET['message_id'] : 0;

        if ($messageId <= 0) {
            Service::sendError(400, 'ID сообщения обязателен');
        }

        try {
            $createRepliesTableSQL = "CREATE TABLE IF NOT EXISTS `message_replies` (
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
            Database::db()->query($createRepliesTableSQL);

            $db = Database::db();
            $checkColumn = $db->query("SHOW COLUMNS FROM `message_replies` LIKE 'created_by'");

            if ($checkColumn->num_rows === 0) {
                $db->query("ALTER TABLE `message_replies` ADD COLUMN `created_by` int(11) NOT NULL DEFAULT 0 AFTER `to_email`");
            }

            $stmt = $db->prepare('SELECT mr.id, mr.message_id, mr.subject, mr.message, mr.to_email, mr.created_by, mr.created_at, u.username 
                                  FROM message_replies mr 
                                  LEFT JOIN users u ON mr.created_by = u.id 
                                  WHERE mr.message_id = ? 
                                  ORDER BY mr.created_at DESC');
            
            if ($stmt === false) {
                Log::error('Error preparing statement:', $db->error);
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
     * @return void
     */
    private static function handleAnalytics(): void
    {
        Auth::requireAuth();

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
        Database::db()->query($createVisitsTableSQL);

        $periodDays = (int) ($_GET['period'] ?? '7');

        if ($periodDays < 1 || $periodDays > 365) {
            $periodDays = 7;
        }

        $startDate = date('Y-m-d', strtotime("-{$periodDays} days"));
        $db = Database::db();

        $totalStmt = $db->prepare('SELECT COUNT(*) as total FROM visits WHERE visit_date >= ?');
        $totalStmt->bind_param('s', $startDate);
        $totalStmt->execute();
        $total = (int) ($totalStmt->get_result()->fetch_assoc()['total'] ?? 0);
        $totalStmt->close();

        $uniqueStmt = $db->prepare('SELECT COUNT(DISTINCT ip_address) as unique_visitors FROM visits WHERE visit_date >= ?');
        $uniqueStmt->bind_param('s', $startDate);
        $uniqueStmt->execute();
        $unique = (int) ($uniqueStmt->get_result()->fetch_assoc()['unique_visitors'] ?? 0);
        $uniqueStmt->close();

        $dailyStmt = $db->prepare('SELECT visit_date, COUNT(*) as count FROM visits WHERE visit_date >= ? GROUP BY visit_date ORDER BY visit_date ASC');
        $dailyStmt->bind_param('s', $startDate);
        $dailyStmt->execute();
        $dailyRes = $dailyStmt->get_result();
        $daily = [];

        while ($row = $dailyRes->fetch_assoc()) {
            $daily[] = ['date' => $row['visit_date'], 'count' => (int) $row['count']];
        }

        $dailyStmt->close();

        $virtualPagesStmt = $db->query('SELECT slug FROM pages WHERE is_published = 1');
        $virtualPages = [];
        while ($row = $virtualPagesStmt->fetch_assoc()) {
            $virtualPages[] = '/' . $row['slug'];
        }
        $virtualPagesStmt->close();

        $topStmt = $db->prepare('SELECT page_url, COUNT(*) as count FROM visits WHERE visit_date >= ? GROUP BY page_url ORDER BY count DESC LIMIT 20');
        $topStmt->bind_param('s', $startDate);
        $topStmt->execute();
        $topRes = $topStmt->get_result();
        $top = [];
        $topVirtual = [];
        $topPhp = [];

        while ($row = $topRes->fetch_assoc()) {
            $url = $row['page_url'];
            $count = (int) $row['count'];
            $pageData = ['url' => $url, 'count' => $count];
            $isVirtual = in_array($url, $virtualPages) || ($url !== '/' && Page::isVirtualPageUrl($url, $virtualPages));
            $pageData['is_virtual'] = $isVirtual;

            $top[] = $pageData;

            if ($isVirtual) {
                $topVirtual[] = $pageData;
            } else {
                $topPhp[] = $pageData;
            }
        }

        $topStmt->close();

        $hourlyStmt = $db->prepare('SELECT HOUR(visit_time) as hour, COUNT(*) as count FROM visits WHERE visit_date >= ? GROUP BY HOUR(visit_time) ORDER BY hour ASC');
        $hourlyStmt->bind_param('s', $startDate);
        $hourlyStmt->execute();
        $hourlyRes = $hourlyStmt->get_result();
        $hourly = [];

        while ($row = $hourlyRes->fetch_assoc()) {
            $hourly[] = ['hour' => (int) $row['hour'], 'count' => (int) $row['count']];
        }

        $hourlyStmt->close();

        $recentStmt = $db->prepare('SELECT ip_address, page_url, visit_date, visit_time, referer FROM visits WHERE visit_date >= ? ORDER BY created_at DESC LIMIT 50');
        $recentStmt->bind_param('s', $startDate);
        $recentStmt->execute();
        $recentRes = $recentStmt->get_result();
        $recent = [];

        while ($row = $recentRes->fetch_assoc()) {
            $recent[] = [
                'ip' => $row['ip_address'],
                'url' => $row['page_url'],
                'date' => $row['visit_date'],
                'time' => $row['visit_time'],
                'referer' => $row['referer'] ?: 'Прямой заход',
            ];
        }

        $recentStmt->close();

        Service::sendJson([
            'total_visits' => $total,
            'unique_visitors' => $unique,
            'daily_visits' => $daily,
            'top_pages' => $top,
            'top_virtual_pages' => $topVirtual,
            'top_php_pages' => $topPhp,
            'hourly_visits' => $hourly,
            'recent_visits' => $recent,
            'period_days' => $periodDays,
        ]);
    }

    private static function formatNumber($number): int
    {
        $value = preg_replace('/[^0-9]/', '', $number);
        return (int) $value;
    }

    private static function handleSaveParams(): void
    {
        Auth::requireAuth();

        $title = isset($_POST['title']) ? trim((string) $_POST['title']) : '';
        $description = isset($_POST['description']) ? trim((string) $_POST['description']) : '';
        $imageMetaTags = isset($_POST['image_meta_tags']) ? trim((string) $_POST['image_meta_tags']) : '';
        $pickupAddress = isset($_POST['pickup_address']) ? trim((string) $_POST['pickup_address']) : '';
        $workHours = isset($_POST['work_hours']) ? trim((string) $_POST['work_hours']) : '';
        $storePhone = isset($_POST['store_phone']) ? trim((string) $_POST['store_phone']) : '';
        $deliveryBel = isset($_POST['delivery_bel']) ? self::formatNumber(trim((string) $_POST['delivery_bel'])) : '';
        $deliveryRus = isset($_POST['delivery_rus']) ? self::formatNumber(trim((string) $_POST['delivery_rus'])) : '';

        $createParamsTableSQL = "CREATE TABLE IF NOT EXISTS `params` (
            `id` INT AUTO_INCREMENT,
            `title` VARCHAR(255) NOT NULL,
            `image_meta_tags` TEXT NOT NULL,
            `pickup_address` VARCHAR(255) NOT NULL,
            `work_hours` VARCHAR(255) NOT NULL,
            `store_phone` VARCHAR(255) NOT NULL,
            `delivery_belarus` INT(255) NOT NULL,
            `delivery_russia` INT(255) NOT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
        Database::db()->query($createParamsTableSQL);

        $db = Database::db();
        $checkImageMetaTagsStmt = $db->prepare("SELECT id FROM params LIMIT 1");
        $checkImageMetaTagsStmt->execute();
        $imageMetaTagsResult = $checkImageMetaTagsStmt->get_result();
        $checkImageMetaTagsStmt->close();

        if ($imageMetaTagsResult->num_rows > 0) {
            $updateStmt = $db->prepare("UPDATE params 
                SET title = ?, description = ?, image_meta_tags = ?, pickup_address = ?, work_hours = ?, store_phone = ?, delivery_belarus = ?, delivery_russia = ?");
            $updateStmt->bind_param('ssssssii', $title, $description, $imageMetaTags, $pickupAddress, $workHours, $storePhone, $deliveryBel, $deliveryRus);

            if ($updateStmt->execute()) {
                $updateStmt->close();
                Service::sendJson(['success' => true]);
            }

            $err = $updateStmt->error;
            $updateStmt->close();
            Service::sendError(500, $err ?: 'Failed to update params');
        } else {
            $insertStmt = $db->prepare("INSERT INTO params (title, description, image_meta_tags, pickup_address, work_hours, store_phone, delivery_belarus, delivery_russia) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $insertStmt->bind_param('ssssssii', $title, $description, $imageMetaTags, $pickupAddress, $workHours, $storePhone, $deliveryBel, $deliveryRus);

            if ($insertStmt->execute()) {
                $insertStmt->close();
                Service::sendJson(['success' => true]);
            }

            $err = $insertStmt->error;
            $insertStmt->close();
            Service::sendError(500, $err ?: 'Failed to save params');
        }
    }

    private static function handleGetParams(): void
    {
        $createParamsTableSQL = "CREATE TABLE IF NOT EXISTS `params` (
            `id` INT AUTO_INCREMENT,
            `title` VARCHAR(255) NOT NULL,
            `description` TEXT NOT NULL,
            `image_meta_tags` TEXT NOT NULL,
            `pickup_address` VARCHAR(255) NOT NULL,
            `work_hours` VARCHAR(255) NOT NULL,
            `store_phone` VARCHAR(255) NOT NULL,
            `delivery_belarus` INT(255) NOT NULL,
            `delivery_russia` INT(255) NOT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
        Database::db()->query($createParamsTableSQL);

        $stmt = Database::db()->prepare("SELECT * FROM params");
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $stmt->close();

            Service::sendJson([
                'success' => true,
                'title' => $row['title'],
                'description' => $row['description'],
                'image_meta_tags' => $row['image_meta_tags'],
                'pickup_address' => $row['pickup_address'],
                'work_hours' => $row['work_hours'],
                'store_phone' => $row['store_phone'],
                'delivery_bel' => $row['delivery_belarus'],
                'delivery_rus' => $row['delivery_russia'],
            ]);
        } else {
            $stmt->close();

            Service::sendJson([
                'success' => true,
                'title' => '',
                'description' => '',
                'image_meta_tags' => '',
                'pickup_address' => '',
                'work_hours' => '',
                'store_phone' => '',
                'delivery_bel' => '',
                'delivery_rus' => '',
            ]);
        }
    }
}