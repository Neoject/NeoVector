<?php

use NeoVector\ApiController;
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
    <template
            v-if="!currentVirtualPage && !virtualPageError"
            v-for="(block, blockIndex) in (sortedPageBlocks || []).filter(b => b)"
            :key="block && (block.id ?? null) !== null ? block.id : 'block-' + blockIndex"
    >
        <hero
                v-if="block.type === 'hero'"
                :block="block"
                :is-in-view="isInView"
                :nav-click="navClick"
        ></hero>
        <actual
                v-if="block.type === 'actual'"
                :block="block"
                :is-in-view="isInView"
        ></actual>
        <products
                v-if="block.type === 'products'"
                :block="block"
                :products="products"
                :element-states="elementStates"
                :cart-items="cartItems"
                :wishlist="wishlist"
                :is-in-view="isInView"
                :is-video="isVideo"
                :get-current-product-image="getCurrentProductImage"
                :get-base-path="getBasePath"
                @update:cart-items="cartItems = $event"
                @update:wishlist="wishlist = $event"
                @open-cart="closeFavorites(); cartOpen = true"
                @open-favorites="closeCart(); favoritesOpen = true"
                @close-favorites="favoritesOpen = false"
                @open-order="openOrderModal()"
                @start-option-selection="handleProductsOptionSelection($event)"
        ></products>
        <features
                v-if="block.type === 'features'"
                :block="block"
                :is-in-view="isInView"
        ></features>
        <buttons
                v-if="block.type === 'buttons'"
                :block="block"
                :is-in-view="isInView"
                :open-virtual-page="openVirtualPage"
                :get-base-path="getBasePath"
        ></buttons>
        <history
                v-if="block.type === 'history'"
                :block="block"
                :is-in-view="isInView"
        ></history>
        <text-block
                v-if="block.type === 'text'"
                :block="block"
                :is-in-view="isInView"
        ></text-block>
        <stats
                v-if="block.type === 'stats'"
                :block="block"
                :is-in-view="isInView"
        ></stats>
        <contact
                v-if="block.type === 'contact'"
                :block="block"
                :is-in-view="isInView"
        ></contact>
        <info-buttons
                v-if="block.type === 'info_buttons'"
                :block="block"
                :is-in-view="isInView"
        ></info-buttons>
    </template>
    <!-- Cart Selector Modal -->
    <div class="cart-modal" :class="{ 'active': cartOpen }">
        <div class="cart-content" @click.stop>
            <div class="cart-header">
                <h3>Ваша корзина</h3>
                <button class="close-icon" @click="closeCart">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div v-if="cartItems.length > 0">
                <div class="cart-item" v-for="(item, cartIndex) in cartItems"
                     :key="`${item.id}-${item.optionKey || cartIndex}`">
                    <img v-if="!isVideo(getCurrentProductImage(item))" :src="item.image" :alt="item.name"
                         class="cart-item-img" loading="lazy" decoding="async">
                    <video v-else :src="getCurrentProductImage(item)" class="cart-item-img"
                           :class="{ 'loading': isImageLoading(item) }" muted loop playsinline autoplay
                           @loadstart="onVideoLoadStart($event, item)" @loadeddata="onVideoLoadedData($event, item)"
                           @error="onVideoError($event, item)"></video>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">{{ item.name }}</h4>
                        <template v-if="item.options && item.options.length">
                            <p class="cart-item-attr" v-for="option in item.options"
                               :key="`${item.id}-${option.slug}`">
                                {{ option.name }}: {{ option.value }}
                            </p>
                        </template>
                        <p class="cart-item-price">{{ item.price }} руб.</p>
                        <div class="cart-item-actions">
                            <button class="quantity-btn" @click="decreaseQuantity(item)">-</button>
                            <span class="quantity">{{ item.quantity }}</span>
                            <button class="quantity-btn" @click="increaseQuantity(item)">+</button>
                            <button class="remove-item" @click="removeFromCart(item)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="cart-total">
                    <span>Итого:</span>
                    <span>{{ cartTotal }} руб.</span>
                </div>

                <button class="checkout-btn" @click="openOrderModal">Оформить заказ</button>
            </div>
            <div v-else class="empty-cart">
                <i class="fas fa-shopping-cart" style="font-size: 50px; margin-bottom: 20px;"></i>
                <p>Ваша корзина пуста</p>
                <a href="#" class="btn btn-primary" @click="handleNavigationClick($event, 'products')">Перейти к
                    товарам</a>
            </div>
        </div>
    </div>
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
                    <a href="#" class="btn btn-primary" @click="handleNavigationClick($event, 'products')">Перейти к
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
         :class="{ 'active': cartOpen || userMenuOpen || favoritesOpen || orderModalOpen || showOptionSelector }"
         :style="userMenuOpen ? { background: 'none' } : {}"
         @click="closeAllModals">
    </div>
</div>
<?php include ROOT_PATH . '/footer.php'; ?>