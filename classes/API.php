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
                    self::handleGetPage();
                    break;
                case 'pages':
                    self::handleGetPages();
                    break;
                case 'add_page':
                    self::handleAddPage();
                    break;
                case 'update_page':
                    self::handleUpdatePage();
                    break;
                case 'delete_page':
                    self::handleDeletePage();
                    break;
                case 'page_navigation':
                    self::handleGetPageNavigation();
                    break;
                case 'products':
                    Product::getProducts();
                    break;
                case 'categories':
                    self::handleGetCategories();
                    break;
                case 'add_category':
                    self::handleAddCategory();
                    break;
                case 'update_category':
                    self::handleUpdateCategory();
                    break;
                case 'delete_category':
                    self::handleDeleteCategory();
                    break;
                case 'save_categories_order':
                    self::handleSaveCategoriesOrder();
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
                    self::handleGetHomeContent();
                    break;
                case 'save_home_content':
                    self::handleSaveHomeContent();
                    break;
                case 'page_blocks':
                    self::handleGetPageBlocks();
                    break;
                case 'hero_image':
                    self::handleGetHeroImage();
                    break;
                case 'add_page_block':
                    self::handleAddPageBlock();
                    break;
                case 'update_page_block':
                    self::handleUpdatePageBlock();
                    break;
                case 'delete_page_block':
                    self::handleDeletePageBlock();
                    break;
                case 'save_blocks_order':
                    self::handleSaveBlocksOrder();
                    break;
                case 'upload_background_image':
                    self::handleUploadBackgroundImage();
                    break;
                case 'upload_logo':
                    self::handleUploadLogo();
                    break;
                case 'create_order':
                    self::handleCreateOrder();
                    break;
                case 'orders':
                    self::handleGetOrders();
                    break;
                case 'update_order_status':
                    self::handleUpdateOrderStatus();
                    break;
                case 'update_payment_status':
                    self::handleUpdatePaymentStatus();
                    break;
                case 'delete_order':
                    self::handleDeleteOrder();
                    break;
                case 'cleanup_old_orders':
                    self::handleCleanupOldOrders();
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
    private static function handleGetPage(): void
    {
        $slug = $_GET['slug'] ?? '';

        if (empty($slug)) {
            Service::sendError(400, 'Slug is required');
        }

        try {
            $virtualPage = new VirtualPage(Database::db());
            $page = $virtualPage->getBySlug($slug);

            if ($page) {
                if (isset($page['navigation_buttons']) && is_string($page['navigation_buttons'])) {
                    $page['navigation_buttons'] = json_decode($page['navigation_buttons'], true);
                }
                Service::sendJson($page);
            } else {
                Service::sendError(404, 'Page not found');
            }
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, 'Error loading page: ' . $e->getMessage());
        }
    }

    /**
     * @return void
     */
    private static function handleGetPages(): void
    {
        Auth::requireAuth();

        try {
            $virtualPage = new VirtualPage(Database::db());
            $pages = $virtualPage->getAll(false);
            foreach ($pages as &$page) {
                if (isset($page['navigation_buttons']) && is_string($page['navigation_buttons'])) {
                    $page['navigation_buttons'] = json_decode($page['navigation_buttons'], true);
                }
            }
            Service::sendJson($pages);
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, 'Error loading pages: ' . $e->getMessage());
        }
    }

    /**
     * @return void
     */
    private static function handleAddPage(): void
    {
        Auth::requireAuth();

        $data = [
            'title' => $_POST['title'] ?? '',
            'slug' => $_POST['slug'] ?? '',
            'content' => $_POST['content'] ?? '',
            'meta_title' => $_POST['meta_title'] ?? '',
            'meta_description' => $_POST['meta_description'] ?? '',
            'is_published' => isset($_POST['is_published']) ? (int) $_POST['is_published'] : 1,
            'is_main_page' => isset($_POST['is_main_page']) ? (int) $_POST['is_main_page'] : 0
        ];

        if (isset($_POST['navigation_buttons'])) {
            $navButtons = $_POST['navigation_buttons'];
            if (is_string($navButtons)) {
                $data['navigation_buttons'] = json_decode($navButtons, true);
            } else {
                $data['navigation_buttons'] = $navButtons;
            }
        }

        if (empty($data['title'])) {
            Service::sendError(400, 'Title is required');
        }

        try {
            $virtualPage = new VirtualPage(Database::db());
            $id = $virtualPage->create($data);
            Service::sendSuccess(['success' => true, 'id' => $id]);
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, 'Failed to create page: ' . $e->getMessage());
        }
    }

    /**
     * @return void
     * @throws Exception
     */
    private static function handleUpdatePage(): void
    {
        Auth::requireAuth();

        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            Service::sendError(400, 'Invalid page ID');
        }

        $data = [];
        if (isset($_POST['title']))
            $data['title'] = $_POST['title'];
        if (isset($_POST['slug']))
            $data['slug'] = $_POST['slug'];
        if (isset($_POST['content']))
            $data['content'] = $_POST['content'];
        if (isset($_POST['meta_title']))
            $data['meta_title'] = $_POST['meta_title'];
        if (isset($_POST['meta_description']))
            $data['meta_description'] = $_POST['meta_description'];
        if (isset($_POST['is_published']))
            $data['is_published'] = (int) $_POST['is_published'];
        if (isset($_POST['is_main_page']))
            $data['is_main_page'] = (int) $_POST['is_main_page'];
        if (isset($_POST['navigation_buttons'])) {
            $navButtons = $_POST['navigation_buttons'];
            if (is_string($navButtons)) {
                $data['navigation_buttons'] = json_decode($navButtons, true);
            } else {
                $data['navigation_buttons'] = $navButtons;
            }
        }

        try {
            $virtualPage = new VirtualPage(Database::db());
            if ($virtualPage->update($id, $data)) {
                Service::sendSuccess(['success' => true]);
            } else {
                Service::sendError(500, 'Failed to update page');
            }
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, 'Failed to update page: ' . $e->getMessage());
        }
    }

    /**
     * @return void
     */
    private static function handleDeletePage(): void
    {
        Auth::requireAuth();

        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            Service::sendError(400, 'Invalid page ID');
        }

        $virtualPage = new VirtualPage(Database::db());
        if ($virtualPage->delete($id)) {
            Service::sendSuccess(['success' => true]);
        } else {
            Service::sendError(500, 'Failed to delete page');
        }
    }

    /**
     * @return void
     */
    private static function handleGetPageNavigation(): void
    {
        $slug = $_GET['slug'] ?? null;

        try {
            $virtualPage = new VirtualPage(Database::db());
            $page = $slug ? $virtualPage->getBySlug($slug) : null;

            $navigation = [];
            if ($page && isset($page['navigation_buttons'])) {
                $navButtons = $page['navigation_buttons'];

                if (is_string($navButtons)) {
                    $navigation = json_decode($navButtons, true) ?: [];
                } else {
                    $navigation = $navButtons ?: [];
                }
            }

            Service::sendJson($navigation);
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(500, 'Error loading navigation: ' . $e->getMessage());
        }
    }



    /**
     * @return void
     */
    private static function handleGetCategories(): void
    {
        $category = new Category(Database::db());
        Service::sendJson($category->getAll());
    }

    /**
     * @return void
     */
    private static function handleAddCategory(): void
    {
        Auth::requireAuth();
        $category = new Category(Database::db());

        try {
            $id = $category->create($_POST);
            Service::sendJson(['success' => true, 'id' => $id]);
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(400, $e->getMessage());
        }
    }

    /**
     * @return void
     */
    private static function handleUpdateCategory(): void
    {
        Auth::requireAuth();
        $id = (int) ($_POST['id'] ?? 0);
        $category = new Category(Database::db());

        try {
            $category->update($id, $_POST);
            Service::sendJson(['success' => true]);
        } catch (Exception $e) {
            Log::error('Error:', $e->getMessage());
            Service::sendError(400, $e->getMessage());
        }
    }

    /**
     * @return void
     */
    private static function handleDeleteCategory(): void
    {
        Auth::requireAuth();
        $id = (int) ($_POST['id'] ?? 0);
        $category = new Category(Database::db());

        if ($id <= 0) {
            Service::sendError(400, 'Invalid category id');
        }

        $category->delete($id);
        Service::sendJson(['success' => true]);
    }

    /**
     * @return void
     */
    private static function handleSaveCategoriesOrder(): void
    {
        Auth::requireAuth();
        $orderJson = $_POST['categories_order'] ?? '[]';
        $order = json_decode($orderJson, true);

        if (!is_array($order)) {
            Service::sendError(400, 'Invalid data format');
        }

        $category = new Category(Database::db());
        $category->updateOrder($order);
        Service::sendJson(['success' => true]);
    }





    /**
     * @return void
     */
    private static function handleGetHomeContent(): void
    {
        $home = new HomeContent(Database::db());
        Service::sendJson($home->getAll());
    }

    /**
     * @return void
     */
    private static function handleSaveHomeContent(): void
    {
        Auth::requireAuth();
        $payload = json_decode($_POST['content'] ?? '[]', true);

        if (!is_array($payload)) {
            Service::sendError(400, 'Invalid data format');
        }

        $home = new HomeContent(Database::db());
        $home->save($payload);
        Service::sendJson(['success' => true]);
    }

    /**
     * @return void
     */
    private static function handleGetPageBlocks(): void
    {
        $blocks = new PageBlock(Database::db());
        Service::sendJson($blocks->getAll());
    }

    /**
     * @return void
     */
    private static function handleGetHeroImage(): void
    {
        $blocks = new PageBlock(Database::db());
        Service::sendJson(['url' => $blocks->getHeroImage()]);
    }

    /**
     * @return void
     */
    private static function handleAddPageBlock(): void
    {
        Auth::requireAuth();
        $blocks = new PageBlock(Database::db());
        $data = [
            'type' => $_POST['type'] ?? '',
            'title' => $_POST['title'] ?? '',
            'content' => $_POST['content'] ?? '',
            'settings' => $_POST['settings'] ?? '{}',
            'sort_order' => (int) ($_POST['sort_order'] ?? 0),
            'is_active' => isset($_POST['is_active']) ? (int) $_POST['is_active'] : 1,
        ];
        $id = $blocks->create($data);
        Service::sendJson(['success' => true, 'id' => $id]);
    }

    /**
     * @return void
     */
    private static function handleUpdatePageBlock(): void
    {
        Auth::requireAuth();
        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            Service::sendError(400, 'Invalid block id');
        }

        $blocks = new PageBlock(Database::db());
        $data = [
            'type' => $_POST['type'] ?? '',
            'title' => $_POST['title'] ?? '',
            'content' => $_POST['content'] ?? '',
            'settings' => $_POST['settings'] ?? '{}',
            'sort_order' => (int) ($_POST['sort_order'] ?? 0),
            'is_active' => isset($_POST['is_active']) ? (int) $_POST['is_active'] : 1,
        ];
        $blocks->update($id, $data);
        Service::sendJson(['success' => true]);
    }

    /**
     * @return void
     */
    private static function handleDeletePageBlock(): void
    {
        Auth::requireAuth();
        $id = (int) ($_POST['id'] ?? 0);

        if ($id <= 0) {
            Service::sendError(400, 'Invalid block id');
        }

        $blocks = new PageBlock(Database::db());
        $blocks->delete($id);
        Service::sendJson(['success' => true]);
    }

    /**
     * @return void
     */
    private static function handleSaveBlocksOrder(): void
    {
        Auth::requireAuth();
        $order = json_decode($_POST['blocks_order'] ?? '[]', true);

        if (!is_array($order)) {
            Service::sendError(400, 'Invalid data format');
        }

        $blocks = new PageBlock(Database::db());
        $blocks->updateOrder($order);
        Service::sendJson(['success' => true]);
    }

    /**
     * @return void
     */
    private static function handleUploadBackgroundImage(): void
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

    private static function handleUploadLogo(): void
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
    private static function handleCreateOrder(): void
    {
        $order = new Order(Database::db());

        try {
            Log::write('post', $_POST);
            $id = $order->create($_POST);
            
            $paymentType = $_POST['payment_type'] ?? 'cash';

            if (!empty($_POST['customer_email'])) {
                try {
                    $order->sendOrderConfirmationEmail($id, $paymentType);
                } catch (Exception $e) {
                    Log::error('Customer email sending error:', $e->getMessage());
                }
            }
            
            try {
                $order->sendOrderNotificationToSeller($id, $paymentType);
            } catch (Exception $e) {
                Log::error('Seller email sending error:', $e->getMessage());
            }
            
            Service::sendJson(['success' => true, 'order_id' => $id]);
        } catch (Exception $e) {
            Service::sendError(400, $e->getMessage());
        }
    }

    /**
     * @return void
     */
    private static function handleGetOrders(): void
    {
        Auth::requireAuth();
        $order = new Order(Database::db());
        Service::sendJson($order->getAll());
    }

    /**
     * @return void
     */
    private static function handleUpdateOrderStatus(): void
    {
        Auth::requireAuth();
        $orderId = (int) ($_POST['order_id'] ?? 0);
        $status = (string) ($_POST['status'] ?? '');
        $order = new Order(Database::db());

        try {
            $order->updateStatus($orderId, $status);
            Service::sendJson(['success' => true]);
        } catch (Exception $e) {
            Service::sendError(400, $e->getMessage());
        }
    }

    /**
     * @return void
     */
    private static function handleUpdatePaymentStatus(): void
    {
        Auth::requireAuth();
        $orderId = (int) ($_POST['order_id'] ?? 0);
        $paymentStatus = (int) ($_POST['payment_status'] ?? 0);
        $order = new Order(Database::db());

        try {
            $order->updatePaymentStatus($orderId, $paymentStatus);
            Service::sendJson(['success' => true]);
        } catch (Exception $e) {
            Service::sendError(400, $e->getMessage());
        }
    }

    /**
     * @return void
     */
    private static function handleDeleteOrder(): void
    {
        Auth::requireAuth();
        $orderId = (int) ($_POST['order_id'] ?? 0);

        if ($orderId <= 0) {
            Service::sendError(400, 'Order ID is required');
        }

        $order = new Order(Database::db());
        $order->delete($orderId);
        Service::sendJson(['success' => true, 'deleted_id' => $orderId]);
    }

    /**
     * @return void
     */
    private static function handleCleanupOldOrders(): void
    {
        $secretKey = (string) ($_POST['secret_key'] ?? '');
        $expectedKey = (string) Config::get('CLEANUP_SECRET_KEY', 'default_secret_key_change_me');

        if ($secretKey !== $expectedKey) {
            Auth::requireAuth();
        }

        $daysToKeep = 60;
        $cutoffDate = date('Y-m-d H:i:s', strtotime("-{$daysToKeep} days"));
        $db = Database::db();
        $stmt = $db->prepare('DELETE FROM orders WHERE created_at < ?');
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
        Service::sendError(500, $err ?: 'Database error occurred');
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

            $sellerEmail = getenv('AETERNUM_CONTACT_EMAIL') ?: 'orders@aeternum.local';

            if (filter_var($sellerEmail, FILTER_VALIDATE_EMAIL)) {
                $subject = 'Aeternum: новое сообщение от клиента';
                $body = "Email клиента: {$email}\n\nСообщение:\n{$message}\n\nОтправлено: " . date('d.m.Y H:i');
                $headers = 'From: no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'aeternum.local');
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
    /**
     * @return void
     */

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

        $name = isset($_POST['name']) ? trim((string) $_POST['name']) : '';
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