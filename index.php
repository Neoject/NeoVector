<?php

use NeoVector\ApiController;
use NeoVector\Config;
use NeoVector\Database;
use NeoVector\Log;
use NeoVector\PageBlock;
use NeoVector\Params;
use NeoVector\Router;

require_once __DIR__ . '/header.php';

global $HOME_URL, $_DESCRIPTION;

try {
    $router = new Router();
} catch (Exception $e) {
    Log::error('Router initialization error', $e->getMessage());
    http_response_code(500);
    die('Internal Server Error');
}

$router->add('GET', '/api/page', function () {
    try {
        $controller = new ApiController();
        return $controller->getPage('home');
    } catch (Exception $e) {
        Log::error('API controller error', $e->getMessage());
        http_response_code(500);
        return json_encode(['error' => 'Internal Server Error'], JSON_UNESCAPED_UNICODE);
    }
});

$router->add('GET', '/api/page/{slug}', function ($slug) {
    try {
        $controller = new ApiController();
        return $controller->getPage($slug);
    } catch (Exception $e) {
        Log::error('API controller error', $e->getMessage());
        http_response_code(500);
        return json_encode(['error' => 'Internal Server Error'], JSON_UNESCAPED_UNICODE);
    }
});

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $excludedPaths = ['/admin', '/product', '/assets', '/api.php', '/favicon.ico'];
    $isExcluded = false;

    foreach ($excludedPaths as $excluded) {
        if (str_starts_with($uri, $excluded)) {
            $isExcluded = true;
            break;
        }
    }

    if (str_starts_with($uri, '/api/')) {
        $result = $router->dispatch($method, $uri);
        echo $result;
        exit;
    }
} catch (Exception $e) {
    Log::error('Request handling error', $e->getMessage());
    Log::error('Stack trace', $e->getTraceAsString());
    http_response_code(500);
    die('Internal Server Error');
}

$heroImage = '';

try {
    $dbConnection = Database::getInstance()->getConnection();
    $pageBlock = new PageBlock($dbConnection);
    $heroImage = $pageBlock->getHeroImage();

    if ($heroImage && !preg_match('/^https?:\/\//i', $heroImage)) {
        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $baseDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
        $heroImage = $protocol . '://' . $host . $baseDir . '/' . ltrim($heroImage, '/');
    }
} catch (Exception $e) {
    Log::error('Hero image retrieval error', $e->getMessage());
}
?>
<div id="app">
    <?php include ROOT_PATH . '/NV/main/page/navbar.php'; ?>
    <component
            v-if="!currentVirtualPage && !virtualPageError"
            v-for="(block, blockIndex) in filteredBlocks"
            :key="block?.id ?? 'block-' + blockIndex"
            :is="blockComponents[block.type]"
            v-bind="getBlockProps(block)"
    ></component>
    <!-- Order Modal -->
    <order :class="{ 'active': orderModalOpen }" @close="closeOrderModal"></order>
    <!-- Cart Selector Modal -->
    <cart :class="{ 'active': cartOpen }"></cart>
    <!-- WishList Selector Modal -->
    <div class="favorites-modal" :class="{ 'active': favoritesOpen }" @touchstart="handleFavoritesTouchStart"
         @touchmove="handleFavoritesTouchMove" @touchend="handleFavoritesTouchEnd">
        <div class="favorites-content-wrapper" @click.stop>
            <div class="favorites-header">
                <div class="favorites-header-left">
                    <h3>Избранные товары</h3>
                </div>
                <button class="close-icon" @click="closeFavorites">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="favorites-content">
                <div v-if="favoriteProducts.length > 0">
                    <div class="favorites-item" v-for="product in favoriteProducts" :key="product.id">
                        <img v-if="!isVideo(getCurrentProductImage(product))" :src="product.image"
                             :alt="product.name" class="favorites-item-img" loading="lazy" decoding="async">
                        <video v-else :src="getCurrentProductImage(product)" class="cart-item-img"
                               :class="{ 'loading': isImageLoading(product) }" muted loop playsinline autoplay
                               @loadstart="onVideoLoadStart($event, product)"
                               @loadeddata="onVideoLoadedData($event, product)"
                               @error="onVideoError($event, product)"></video>
                        <div class="favorites-item-details">
                            <h4 class="favorites-item-title">{{ product.name }}</h4>
                            <p class="favorites-item-material">{{ product.material }}</p>
                            <p class="favorites-item-price">{{ product.price }} руб.</p>
                            <div class="favorites-item-actions">
                                <button class="add-to-cart-btn fav-cart-btn"
                                        @click="addFromFavoritesToCart(product, $event)">
                                    <i class="fas fa-shopping-cart"></i>
                                    В корзину
                                </button>
                                <button class="remove-from-favorites" @click="toggleWishlist(product.id)">
                                    <i class="fas fa-heart-broken"></i>
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-favorites">
                    <i class="fas fa-heart" style="font-size: 50px; margin-bottom: 20px; color: #ccc;"></i>
                    <p>У вас пока нет избранных товаров</p>
                    <template v-if="cartItems.length">
                        <p>Но есть товары в корзине</p>
                    </template>
                    <button v-if="cartItems.length" class="btn btn-primary"
                            @click="fromWishlistToCart(product.id)">В корзину</button>
                    <a href="#" class="btn btn-primary" @click="navClick($event, 'products')">Перейти к
                        товарам</a>
                </div>
            </div>
        </div>
    </div>
    <!-- Option Selector Modal -->
    <div v-if="showOptionSelector" class="option-selector-modal" @click.self="cancelProductAddToCart">
        <div class="option-selector-content">
            <div class="option-selector-header">
                <h3>Выберите {{ currentOptionType ? currentOptionType.name : 'опцию' }}</h3>
                <button @click="cancelProductAddToCart" class="close-icon">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="option-selector-body">
                <div v-if="currentOptionType && selectingHandProduct" class="option-values">
                    <button v-for="value in currentOptionType.values" :key="value"
                            @click="chooseOptionValue(selectingHandProduct, value)" class="option-value-btn">
                        {{ value }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="overlay"
         :class="{ 'active': cartOpen || favoritesOpen || orderModalOpen || showOptionSelector }"
         :style="userMenuOpen ? { background: 'none' } : {}"
         @click="closeAllModals">
    </div>
</div>
<?php include ROOT_PATH . '/footer.php'; ?>