<?php

use NeoVector\Params;

?>
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
               @click.prevent="currentProduct ? closeProductPage() : goHome()">
                <img :src="'<?=Params::getLogo()?>'" alt="<?=Params::getTitle()?>" style="max-height: 64px; max-width: 100%" />
            </a>
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
                   @click="navClick($event, button.target)">
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
            <template v-if="auth.role === 'admin' || auth.role !== 'admin'">
                <div class="user-menu" @click="toggleUserMenu">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <span class="user-name">{{ auth.username || 'Профиль' }}</span>
                    <i class="fas fa-chevron-down" :class="{ 'rotated': userMenuOpen }"></i>
                    <div v-if="userMenuOpen" class="user-menu-popup" @click.stop>
                        <template v-if="auth.authenticated">
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
                        </template>
                        <template v-else>
                            <a href="#" @click.prevent="openLogin" class="user-menu-item">
                                <i class="fas fa-sign-in-alt"></i>
                                <span>Войти</span>
                            </a>
                            <a href="#" @click.prevent="openRegister" class="user-menu-item">
                                <i class="fas fa-user-plus"></i>
                                <span>Регистрация</span>
                            </a>
                        </template>
                    </div>
                    <template v-if="!auth.authenticated">
                        <login ref="authLogin" @close="closeLogin"></login>
                        <register ref="authRegister" @close="closeRegister"></register>
                    </template>
                </div>
            </template>
        </nav>
    </div>
    <div class="header-bottom"></div>
</header>