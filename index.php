<?php

use NeoVector\ApiController;
use NeoVector\Database;
use NeoVector\PageBlock;
use NeoVector\Router;

$TITLE = 'Aeternum - Премиальные ремни для часов';

require_once __DIR__ . '/header.php';

global $HOME_URL, $_DESCRIPTION;

try {
    $router = new Router();
} catch (Exception $e) {
    error_log('Router initialization error: ' . $e->getMessage());
    http_response_code(500);
    die('Internal Server Error');
}

$router->add('GET', '/api/page', function () {
    try {
        $controller = new ApiController();
        return $controller->getPage('home');
    } catch (Exception $e) {
        error_log('API Controller error: ' . $e->getMessage());
        http_response_code(500);
        return json_encode(['error' => 'Internal Server Error'], JSON_UNESCAPED_UNICODE);
    }
});

$router->add('GET', '/api/page/{slug}', function ($slug) {
    try {
        $controller = new ApiController();
        return $controller->getPage($slug);
    } catch (Exception $e) {
        error_log('API Controller error: ' . $e->getMessage());
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
        if (strpos($uri, $excluded) === 0) {
            $isExcluded = true;
            break;
        }
    }

    if (strpos($uri, '/api/') === 0) {
        $result = $router->dispatch($method, $uri);
        echo $result;
        exit;
    }
} catch (Exception $e) {
    error_log('Request handling error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
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
    error_log('Hero image retrieval error: ' . $e->getMessage());
}
?>

<body>
    <div id="app">
        <header class="scrolled">
            <div class="container nav-container">
                <div class="nav-left">
                    <button v-if="currentProduct" class="mobile-menu-btn" @click="closeProductPage"
                        style="margin-right: 10px;">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button v-else class="mobile-menu-btn" @click="toggleMobileMenu">
                        <i class="fas fa-bars"></i>
                    </button>
                    <a class="logo" href="#"
                        @click.prevent="currentProduct ? closeProductPage() : goHome()">Aeternum</a>
                    <div class="mobile-cart-icon" @click="toggleCart">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-count" v-if="cartItems.length > 0">{{ getCartItemsCount() }}</span>
                    </div>
                    <div class="mobile-favorites-icon" @click="toggleFavorites()">
                        <i class="fas fa-heart"></i>
                        <span class="cart-count" v-if="wishlist.length > 0">{{ getWishlistCount() }}</span>
                    </div>
                </div>
                <nav class="nav-links" :key="'nav-' + (currentVirtualPage ? currentVirtualPage.slug : 'main')">
                    <template v-if="isMainPage">
                        <a v-for="(button, index) in navigationButtons" :key="'nav-' + index" href="#"
                            @click="handleNavigationClick($event, button.target)">
                            {{ button.label }}
                        </a>
                    </template>
                    <template v-else>
                        <a href="#" class="btn btn-outline" style="width:auto;" @click.prevent="goHome({ updateHistory: true, scrollToTop: true })">На главную</a>
                    </template>
                    <div class="cart-icon" @click="toggleCart">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-count" v-if="cartItems.length > 0">{{ getCartItemsCount() }}</span>
                    </div>
                    <div class="favorites-icon" @click="toggleFavorites()">
                        <i class="fas fa-heart"></i>
                        <span class="cart-count" v-if="wishlist.length > 0">{{ getWishlistCount() }}</span>
                    </div>
                    <template v-if="auth.role === 'admin'">
                        <a v-if="!auth.authenticated" href="#" @click.prevent="openLogin">Войти</a>
                        <div v-else class="user-menu" @click="toggleUserMenu">
                            <div class="user-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <span class="user-name">{{ auth.username }}</span>
                            <i class="fas fa-chevron-down" :class="{ 'rotated': userMenuOpen }"></i>
                            <div v-if="userMenuOpen" class="user-menu-popup" @click.stop>
                                <div class="user-menu-header">
                                    <div class="user-info">
                                        <div class="user-avatar-large">
                                            <i class="fas fa-user"></i>
                                        </div>
                                        <div class="user-details">
                                            <div class="user-name-large">{{ auth.username }}</div>
                                            <div class="user-role">{{ auth.role === 'admin' ? 'Администратор' : 'Клиент'
                                                }}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="user-menu-items">
                                    <a v-if="auth.role === 'admin'" href="admin/?page=admin"
                                        class="user-menu-item admin-item">
                                        <i class="fas fa-cog"></i>
                                        <span>Администрирование</span>
                                    </a>
                                    <a href="#" @click.prevent="logout" class="user-menu-item logout-item">
                                        <i class="fas fa-sign-out-alt"></i>
                                        <span>Выйти</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </template>
                </nav>
            </div>
            <div class="header-bottom"></div>
        </header>
        <div class="mobile-side-menu" :class="{ 'active': mobileMenuOpen }" @touchstart="handleTouchStart"
            @touchmove="handleTouchMove" @touchend="handleTouchEnd">
            <button class="mobile-menu-close" @click="closeMobileMenu">
                <i class="fas fa-times"></i>
            </button>
            <nav class="nav-links" :key="'mobile-nav-' + (currentVirtualPage ? currentVirtualPage.slug : 'main')">
                <template v-if="isMainPage">
                    <a v-for="(button, index) in navigationButtons" :key="'mobile-nav-' + index" href="#"
                        @click="handleNavigationClick($event, button.target)">
                        {{ button.label }}
                    </a>
                </template>
                <template v-else>
                    <a href="#" class="btn btn-outline" style="width:auto;" @click.prevent="goHome({ updateHistory: true, scrollToTop: true })">На главную</a>
                </template>
                <div class="mobile-auth-section">
                    <div v-if="auth.authenticated" class="mobile-user-section">
                        <div class="mobile-user-info" @click="toggleUserMenu">
                            <i class="fas fa-user"></i>
                            <span>{{ auth.username }}</span>
                            <i class="fas fa-chevron-down" :class="{ 'rotated': userMenuOpen }"></i>
                        </div>
                        <div v-if="userMenuOpen" class="mobile-user-dropdown">
                            <a v-if="auth.role === 'admin'" href="admin/?page=admin/"
                                class="mobile-user-dropdown-item admin-item">
                                <i class="fas fa-cog"></i>
                                <span>Администрирование</span>
                            </a>
                            <a href="#" @click.prevent="logout" class="mobile-user-dropdown-item logout-item">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Выйти</span>
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
        <template v-if="!currentVirtualPage && !currentProduct && !virtualPageError">
            <template v-for="(block, blockIndex) in (sortedPageBlocks || []).filter(b => b)" :key="block ? block.id : 'block-' + blockIndex">
                <template v-if="block">
                <?php
                $homeSections = ['hero', 'features', 'history', 'stats', 'actual', 'text', 'buttons', 'products', 'info_buttons', 'footer', 'contact'];
                foreach ($homeSections as $section) include __DIR__ . '/src/home/sections/' . $section . '.html';
                ?>
                </template>
            </template>
        </template>
        <section v-if="currentVirtualPage && !currentProduct" class="virtual-page">
            <div class="container">
                <article class="page-content">
                    <h1 class="page-title">{{ currentVirtualPage.title }}</h1>
                    <div class="page-body" v-html="formattedPageContent"></div>
                </article>
            </div>
        </section>
        <section v-if="currentProduct" class="product-detail-container">
            <div class="container">
                <div class="product-detail">
                    <div class="product-images">
                        <div class="main-image">
                            <transition :name="productSlideDirection === 'next' ? 'slide-fade-next' : 'slide-fade-prev'"
                                mode="out-in">
                                <img v-if="!isVideo(currentProductImage) && currentProductImage"
                                    :key="'img-' + currentProductImageIndex" class="product-main-img"
                                    :src="currentProductImage" :alt="currentProduct.name" @click="openProductViewModal">
                                <video v-else-if="isVideo(currentProductImage) && currentProductImage"
                                    :key="'video-' + currentProductImageIndex" class="product-main-video"
                                    :src="currentProductImage" @click.prevent="openProductViewModal" controls muted loop
                                    playsinline></video>
                            </transition>
                            <div
                                v-if="currentProduct.additional_images.length || currentProduct.additional_videos.length">
                                <button @click="previousProductImage" class="gallery-nav-btn prev-btn"
                                    :disabled="currentProductImageIndex === 0">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <button @click="nextProductDetailImage" class="gallery-nav-btn next-btn"
                                    :disabled="currentProductImageIndex === allProductMedia.length - 1">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                        <div class="image-gallery" v-if="allProductMedia.length > 1">
                            <div class="gallery-thumbnails">
                                <div v-for="(item, index) in allProductMedia" :key="index" class="thumbnail-item"
                                    :class="{ 'active': currentProductImageIndex === index }"
                                    @click="setCurrentProductImage(index)">
                                    <img v-if="!isVideoItem(item)" :src="item" :alt="currentProduct.name"
                                        class="thumbnail-img">
                                    <div v-else class="thumbnail-video-wrapper">
                                        <video :src="item" class="thumbnail-img thumbnail-video" preload="metadata"
                                            muted playsinline>
                                        </video>
                                        <i class="fas fa-play thumbnail-play-icon"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="gallery-navigation" v-if="allProductMedia.length > 1">
                                <span class="gallery-counter">{{ currentProductImageIndex + 1 }} / {{
                                    allProductMedia.length }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="product-info">
                        <div class="product-header">
                            <h1 class="product-page title">{{ currentProduct.name }}</h1>
                            <div class="product-price">
                                <span v-if="currentProduct.price_sale" class="price-old">{{ currentProduct.price }}
                                    руб.</span>
                                <span v-if="currentProduct.price_sale" class="price-sale">{{ currentProduct.price_sale
                                    }} руб.</span>
                                <span v-else class="price-current">{{ currentProduct.price }} руб.</span>
                            </div>
                        </div>

                        <div class="product-meta">
                            <div class="product-material">
                                <i class="fas fa-gem"></i>
                                <span>{{ currentProduct.material }}</span>
                            </div>
                        </div>
                        <div class="product-description" v-if="currentProduct.description">
                            <h3>Описание</h3>
                            <p>{{ currentProduct.description }}</p>
                        </div>
                        <table>
                            <tbody>
                                <tr>
                                    <td class="product-buy-quantity"><label>Количество:</label></td>
                                </tr>
                                <tr>
                                    <td class="quantity-cell">
                                        <div class="quantity-selector">
                                            <div class="quantity-controls">
                                                <button @click="productQuantity > 1 ? productQuantity-- : null"
                                                    :disabled="productQuantity <= 1" class="quantity-btn">-</button>
                                                <span class="quantity-display">{{ productQuantity }}</span>
                                                <button @click="productQuantity++" class="quantity-btn">+</button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="actions-cell" colspan="2">
                                        <div class="action-buttons">
                                            <div class="product-options" v-if="showOptionSelector && currentOptionType">
                                                <span class="option-selector-question">
                                                    Выберите {{ (currentOptionType.name || 'опцию').toLowerCase() }}:
                                                </span>
                                                <div class="option-selector">
                                                    <button v-for="(valueOption, optIndex) in currentOptionType.values"
                                                        :key="`option-${optIndex}-${valueOption}`"
                                                        @click.prevent="chooseProductOptionValue(valueOption)"
                                                        class="btn btn-outline add-to-cart-btn-option">
                                                        {{ valueOption }}
                                                    </button>
                                                </div>
                                                <button class="btn btn-outline" style="width: auto"
                                                    @click="cancelProductAddToCart()">Отмена</button>
                                            </div>
                                            <button v-if="!showOptionSelector"
                                                @click="startProductHandSelection('buyNow', $event)"
                                                class="btn btn-outline add-to-cart-btn">
                                                <i class="fas fa-shopping-bag"></i>
                                                Купить сейчас
                                            </button>
                                            <template v-if="isCurrentProductInCart">
                                                <button @click="toggleCart" class="btn btn-outline add-to-cart-btn">
                                                    <i class="fas fa-shopping-cart"></i>
                                                    В корзине
                                                </button>
                                                <button @click="startProductHandSelection('addToCart', $event)"
                                                    class="btn btn-outline add-to-cart-btn">
                                                    + в корзину
                                                </button>
                                            </template>
                                            <button @click="startProductHandSelection('addToCart', $event)"
                                                class="btn btn-outline add-to-cart-btn">
                                                <i class="fas fa-shopping-cart"></i>
                                                Добавить в корзину
                                            </button>
                                            <button @click="toggleCurrentProductWishlist"
                                                class="btn btn-outline wishlist-btn"
                                                :class="{ 'active': isCurrentProductInWishlist }">
                                                <i class="fas fa-heart"></i>
                                                {{ isCurrentProductInWishlist ? 'В избранном' : 'В избранное' }}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="product-actions">
                            <div class="product-actions-left">
                            </div>
                            <div class="product-actions-right">
                            </div>
                        </div>

                        <div class="product-features"
                            v-if="currentProduct.peculiarities && currentProduct.peculiarities.length > 0">
                            <h3>Особенности</h3>
                            <ul>
                                <li v-for="(peculiarity, index) in currentProduct.peculiarities" :key="index">
                                    <i class="fas fa-check"></i> {{ peculiarity }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <div v-if="contentView && currentProduct" class="content-view container" @click="closeProductViewModal">
            <div class="content-view content" @click.stop>
                <button class="gallery-nav-btn btn-close-view" @click="closeProductViewModal">
                    <i class="fas fa-times"></i>
                </button>
                <img v-if="!isVideo(currentProductImage) && currentProductImage"
                    :key="'img-view-' + currentProductImageIndex" class="content-view image" :src="currentProductImage"
                    :alt="currentProduct.name">
                <video v-else-if="isVideo(currentProductImage) && currentProductImage"
                    :key="'video-view-' + currentProductImageIndex" class="content-view video"
                    :src="currentProductImage" @click.prevent controls muted loop autoplay playsinline></video>
                <button @click="previousProductImage" class="content-view gallery-nav-btn prev-btn"
                    :disabled="currentProductImageIndex === 0">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button @click="nextProductDetailImage" class="content-view gallery-nav-btn next-btn"
                    :disabled="currentProductImageIndex === allProductMedia.length - 1">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
        <section v-if="sortedPageBlocks.length === 0 && !currentVirtualPage && !currentProduct && !virtualPageError" class="empty-state">
            <div class="container">
                <div class="empty-content">
                    <h2>Добро пожаловать в Aeternum</h2>
                    <p>Сайт находится в разработке. Скоро здесь появится контент.</p>
                </div>
            </div>
        </section>
        <section v-if="virtualPageError && !currentVirtualPage && !isMainPage && !currentProduct" class="error-state">
            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 40px;">
                <div>
                    <h1 style="font-size: 32px; margin-bottom: 16px;">Страница не найдена</h1>
                    <p style="margin-bottom: 24px;">К сожалению, запрошенная страница не существует или была удалена.</p>
                    <a href="/" class="btn btn-primary">На главную</a>
                </div>
            </div>
        </section>

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

        <!-- Overlay -->
        <div class="overlay" :class="{ 'active': cartOpen || favoritesOpen || orderModalOpen || showOptionSelector }"
            @click="closeAllModals"></div>

        <?php
        $hasAutocomplete = true;
        include __DIR__ . '/order_modal.php';
        ?>
    </div>
    <script src="src/scripts/main.js"></script>
</body>

</html>