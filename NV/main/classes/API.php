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
        Mail::createTable();

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
    public static function setupSession(): void
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
                    Category::delete((int) ($_POST['id'] ?? 0));
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
                    Service::sendJson(['success' => true, 'id' => PageBlock::create($_POST)]);
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
                    Params::uploadBackground();
                    break;
                case 'upload_logo':
                    Params::uploadLogo();
                    break;
                case 'delete_logo':
                    Params::deleteLogo();
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
                    Service::cleanupOldOrders($_GET['secret_key'] ?? Config::get('CLEANUP_SECRET_KEY'));
                    break;
                case 'contact_form':
                    Mail::sendUserMail();
                    break;
                case 'messages':
                    Mail::getMailList();
                    break;
                case 'delete_message':
                    Mail::deleteMessage();
                    break;
                case 'send-reply':
                    Mail::reply();
                    break;
                case 'message-replies':
                    Mail::getReplies();
                    break;
                case 'contact_message':
                    Mail::new($_POST);
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
                    Analytics::get();
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
                    Params::save($_POST);
                    break;
                case 'get_params':
                    Service::sendJson(Params::get());
                    break;
                case 'get_colors':
                    Auth::requireAuth();
                    Service::sendJson(Params::getThemeColors());
                    break;
                case 'save_colors':
                    Params::saveThemeColors(json_decode($_POST['colors'] ?? '[]', true) ?: []);
                    break;
                case 'reset_colors':
                    Params::resetThemeCss();
                    break;
                case 'get_theme_css':
                    Auth::requireAuth();
                    Service::sendJson(['css' => Params::getThemeCss()]);
                    break;
                case 'save_theme_css':
                    Params::saveThemeCss($_POST['css'] ?? '');
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
}