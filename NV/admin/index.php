<?php
require_once \dirname(__DIR__, 2) . '/config.php';

global $HOME_URL, $scripts;

use NeoVector\API;
use NeoVector\Auth;
use NeoVector\Database;
use NeoVector\Params;
use NeoVector\Service;

API::setupSession();

$db = Database::getInstance()->getConnection();
$auth = new Auth();
$loginError = '';
$adminPublicPath = rtrim($HOME_URL, '/') . '/admin';

if (isset($_REQUEST['action']) && $_REQUEST['action'] === 'logout') {
    $auth->logout();
    header('Location: ' . $HOME_URL);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $remember = isset($_POST['remember']) && $_POST['remember'] === '1';

    $result = [];

    try {
        $result = $auth->login($username, $password, $remember);
    } catch (Exception $e) {
        error_log($e->getMessage());
        $result = ['success' => false, 'error' => 'Ошибка сервера'];
    }

    if (!empty($result['success']) && ($result['role'] ?? '') === 'admin') {
        header('Location: ' . $adminPublicPath);
        exit;
    }

    if (!empty($result['success']) && ($result['role'] ?? '') !== 'admin') {
        $auth->logout();
        $loginError = 'Недостаточно прав';
    } else {
        $loginError = $result['error'] ?? 'Неверные учетные данные';
    }
}

require_once ROOT_PATH . '/NV/main/admin/header.php';

if (!$auth->isAdmin()): ?>
    <body>
        <div class="login-container">
            <div class="login-form" style="text-align:center;">
                <h2>Вход в админ-панель</h2>
                <p style="margin-top:10px;">Только для администраторов.</p>
                <form method="post" action="<?= htmlspecialchars($adminPublicPath, ENT_QUOTES, 'UTF-8') ?>" style="max-width:320px; margin:20px auto 0; text-align:left;">
                    <input type="hidden" name="action" value="login">
                    <div class="form-group">
                        <label>Имя пользователя</label>
                        <input type="text" name="username" required autocomplete="username"
                            value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>">
                    </div>
                    <div class="form-group">
                        <label>Пароль</label>
                        <input type="password" name="password" required autocomplete="current-password">
                    </div>
                    <div class="form-group" style="display:flex; align-items:center; gap:10px;">
                        <input type="checkbox" id="rememberMe" name="remember" value="1" <?php echo (isset($_POST['remember']) && $_POST['remember'] === '1') ? 'checked' : ''; ?>
                            style="width:16px; height:16px;">
                        <label for="rememberMe" style="margin:0;">Запомнить меня</label>
                    </div>
                    <?php if ($loginError !== '') {
                        echo '<div class="error-message">' . htmlspecialchars($loginError) . '</div>';
                    } ?>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Войти</button>
                        <a class="btn btn-secondary" href="../.." style="margin-left:10px;">На главную</a>
                    </div>
                </form>
            </div>
        </div>
<?php
    else:
$adminUser = $auth->getCurrentUser();
?>
<body>
    <div class="admin-loading-container" id="load_box">
        <div class="admin-loader"></div>
    </div>
    <div id="app">
        <div class="admin">
            <template v-if="isAuthenticated">
                <header class="header scrolled">
                    <div class="admin-header container">
                        <div class="admin-header-content">
                            <div class="admin-header-left">
                                <button class="mobile-menu-btn" @click="toggleMobileMenu">
                                    <i class="fas fa-bars"></i>
                                </button>
                                <a class="logo logo-admin" href="/">
                                    <img :src="'<?=Params::getLogo()?>'" alt="Логотип" style="max-height: 64px; background: src('/assets/logo/logo_69bbe34818bc2.png')" />
                                </a>
                            </div>
                            <div class="admin-actions">
                                <button @click="changePage('admin')" class="btn btn-secondary" title="Управление">
                                    <i class="fa-solid fa-house"></i>
                                </button>
                                <button @click="changePage('users')" class="btn btn-secondary"
                                    title="Управление пользователями">
                                    <i class="fa-solid fa-users"></i>
                                </button>
                                <button @click="changePage('orders')" class="btn btn-secondary" title="Заказы">
                                    <i class="fa-solid fa-indent"></i>
                                </button>
                                <button @click="changePage('analytics')" class="btn btn-secondary" title="Аналитика">
                                    <i class="fas fa-chart-line"></i>
                                </button>
                                <button @click="changePage('options')" class="btn btn-secondary" title="Опции товаров">
                                    <i class="fa-solid fa-sliders"></i>
                                </button>
                                <button @click="changePage('messages')" class="btn btn-secondary" title="Сообщения">
                                    <i class="fa-solid fa-envelope-open"></i>
                                </button>
                                <button @click="changePage('profile')" class="btn btn-secondary" title="Профиль">
                                    <i class="fas fa-user"></i>
                                </button>
                                <button @click="changePage('settings')" class="btn btn-secondary"
                                    title="Дополнительные параметры">
                                    <i class="fa-solid fa-cog"></i>
                                </button>
                                <a href="<?= htmlspecialchars($adminPublicPath . '?action=logout', ENT_QUOTES, 'UTF-8') ?>" @click.prevent="confirmLogout"
                                   class="btn btn-secondary" title="Выйти">
                                    <i class="fas fa-sign-out-alt"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="header-bottom"></div>
                </header>
                <div class="admin-block-loading-container" id="block_loader">
                    <div class="admin-block-loader"></div>
                </div>
                <div class="mobile-admin-menu" :class="{ 'active': mobileMenuOpen }">
                    <div class="mobile-menu-btn-header" @click="changePage('admin')">
                        <?= Params::getTitle() ?>
                    </div>
                    <button class="mobile-menu-close" @click="closeMobileMenu">
                        <i class="fas fa-times"></i>
                    </button>
                    <nav class="mobile-nav-links">
                        <button @click="changePage('admin')" class="mobile-nav-btn">
                            <i class="fas fa-cog"></i>
                            <span>Управление</span>
                        </button>
                        <button @click="openAddProductModal" class="mobile-nav-btn">
                            <i class="fas fa-plus"></i>
                            <span>Добавить товар</span>
                        </button>
                        <button @click="openAddUserModal" class="mobile-nav-btn">
                            <i class="fas fa-user-plus"></i>
                            <span>Создать пользователя</span>
                        </button>
                        <button @click="changePage('options')" class="mobile-nav-btn">
                            <i class="fas fa-list"></i>
                            <span>Опции товаров</span>
                        </button>
                        <button @click="changePage('orders')" class="mobile-nav-btn">
                            <i class="fas fa-briefcase"></i>
                            <span>Заказы</span>
                        </button>
                        <button @click="changePage('analytics')" class="mobile-nav-btn">
                            <i class="fas fa-chart-line"></i>
                            <span>Аналитика</span>
                        </button>
                        <button @click="changePage('profile')" class="mobile-nav-btn">
                            <i class="fas fa-user"></i>
                            <span>Профиль</span>
                        </button>
                        <a href="<?= htmlspecialchars($adminPublicPath . '?action=logout', ENT_QUOTES, 'UTF-8') ?>" class="mobile-nav-btn logout-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Выйти</span>
                        </a>
                    </nav>
                </div>
                <div class="overlay" :class="{ 'active': mobileMenuOpen }" @click="closeMobileMenu"></div>
                <template v-if="page === 'admin'">
                    <admin-dashboard-view v-if="isAuthenticated"></admin-dashboard-view>
                </template>
                <template v-if="page === 'users'">
                    <users-list ref="users-list"></users-list>
                </template>
                <template v-if="page === 'analytics'">
                    <analytics-view ref="analyticsView"></analytics-view>
                </template>
                <template v-if="page === 'orders'">
                    <orders-list ref="ordersList"></orders-list>
                </template>
                <template v-if="page === 'options'">
                    <options-view v-if="isAuthenticated"></options-view>
                </template>
                <template v-if="page === 'user'">
                    <div class="modal-header">
                        <span class="fas fa-backward-step" style="font-size: 24px" @click="changePage('admin')"></span>
                        <h3>Создать пользователя</h3>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="register">
                            <div class="form-group">
                                <label>Имя пользователя</label>
                                <input type="text" v-model="registerData.username" required autocomplete="off"
                                    autocapitalize="none" spellcheck="false">
                            </div>
                            <div class="form-group">
                                <label>Пароль</label>
                                <input type="password" v-model="registerData.password" required
                                    autocomplete="new-password">
                            </div>
                            <div class="form-group">
                                <label>Роль</label>
                                <select v-model="registerData.role">
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>
                            <div v-if="registerError" class="error-message">{{ registerError }}</div>
                            <div v-if="registerSuccess" style="color:#2ecc71; margin-top:10px; font-size:14px;">{{
                                registerSuccess }}</div>
                            <div class="form-actions mobile">
                                <button type="submit" class="btn btn-primary"
                                    :disabled="!canCreateUser || registerLoading">{{ registerLoading ? 'Создание...' :
                                    'Создать' }}</button>
                                <button type="button" class="btn btn-secondary" @click="closeUserModal">Отмена</button>
                            </div>
                        </form>
                    </div>
                </template>
                <template v-if="page === 'product'">
                    <product-modal-view></product-modal-view>
                </template>
                <template v-if="page === 'block'">
                    <block-modal-view></block-modal-view>
                </template>
                <template v-if="page === 'settings'">
                    <Settings/>
<!--                    <settings-view v-if="isAuthenticated"></settings-view>-->
                </template>
                <template v-if="page === 'messages'">
                    <messages-view v-if="isAuthenticated"></messages-view>
                </template>
                <template v-if="page === 'message' && selectedMessage">
                    <message-detail-view v-if="isAuthenticated"></message-detail-view>
                </template>
                <template v-if="page === 'message-reply' && selectedMessage">
                    <message-reply-view v-if="isAuthenticated"></message-reply-view>
                </template>
                <template v-if="page === 'profile'">
                    <profile-params v-if="isAuthenticated"></profile-params>
                </template>
            </template>

            <!-- модалка создания пользователя -->
            <template v-if="showAddUser">
                <teleport to="body">
                    <div class="modal" data-modal-id="addUserModal"
                        @click.stop="bringModalToFront('addUserModal')">
                        <div class="modal-toolbar"
                            @mousedown="startDragModal('addUserModal', $event)"
                            style="cursor: move;">
                            <div class="control-btns">
                                <button @click.stop="toggleMinimize('addUserModal')"
                                    class="action-btn"
                                    :title="isModalMinimized('addUserModal') ? 'Восстановить' : 'Свернуть'">
                                    <i
                                        :class="isModalMinimized('addUserModal') ? 'fas fa-window-restore' : 'fas fa-minus'"></i>
                                </button>
                                <button @click.stop="toggleMaximize('addUserModal')"
                                    class="action-btn"
                                    :title="isModalMaximized('addUserModal') ? 'Восстановить размер' : 'Развернуть'">
                                    <i
                                        :class="isModalMaximized('addUserModal') ? 'fas fa-window-restore' : 'fas fa-window-maximize'"></i>
                                </button>
                                <button @click="closeUserModal" class="action-btn">
                                    <i @click="closeUserModal" class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="modal-header">
                            <h3>Создать пользователя</h3>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="register">
                                <div class="form-group">
                                    <label>Имя пользователя</label>
                                    <input type="text" v-model="registerData.username" required
                                        autocomplete="off" autocapitalize="none" spellcheck="false">
                                </div>
                                <div class="form-group">
                                    <label>Пароль</label>
                                    <input type="password" v-model="registerData.password" required
                                        autocomplete="new-password">
                                </div>
                                <div class="form-group">
                                    <label>Роль</label>
                                    <select v-model="registerData.role">
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </div>
                                <div v-if="registerError" class="error-message">{{ registerError }}
                                </div>
                                <div v-if="registerSuccess"
                                    style="color:#2ecc71; margin-top:10px; font-size:14px;">{{
                                    registerSuccess }}</div>
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary"
                                        :disabled="!canCreateUser || registerLoading">{{
                                        registerLoading ? 'Создание...' : 'Создать' }}</button>
                                    <button type="button" class="btn btn-secondary"
                                        @click="closeUserModal">Отмена</button>
                                </div>
                            </form>
                        </div>
                        <div class="modal-resize-handle nw"
                            @mousedown="startResize($event, 'addUserModal', 'nw')"></div>
                        <div class="modal-resize-handle ne"
                            @mousedown="startResize($event, 'addUserModal', 'ne')"></div>
                        <div class="modal-resize-handle sw"
                            @mousedown="startResize($event, 'addUserModal', 'sw')"></div>
                        <div class="modal-resize-handle se"
                            @mousedown="startResize($event, 'addUserModal', 'se')"></div>
                        <div class="modal-resize-handle n"
                            @mousedown="startResize($event, 'addUserModal', 'n')"
                            @dblclick="handleResizeDoubleClick('addUserModal', 'n', $event)"></div>
                        <div class="modal-resize-handle s"
                            @mousedown="startResize($event, 'addUserModal', 's')"
                            @dblclick="handleResizeDoubleClick('addUserModal', 's', $event)"></div>
                        <div class="modal-resize-handle e"
                            @mousedown="startResize($event, 'addUserModal', 'e')"
                            @dblclick="handleResizeDoubleClick('addUserModal', 'e', $event)"></div>
                        <div class="modal-resize-handle w"
                            @mousedown="startResize($event, 'addUserModal', 'w')"
                            @dblclick="handleResizeDoubleClick('addUserModal', 'w', $event)"></div>
                    </div>
                </teleport>
            </template>

            <!-- Контекстное меню для строк таблицы -->
            <div v-if="contextMenuVisible && contextMenuProduct" class="context-menu"
                :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px', display: 'block' }"
                @click.stop>
                <div class="context-menu-item" @click="selectProductFromMenu">
                    <i class="fas fa-check-square"></i>
                    <span>{{ isProductSelected(contextMenuProduct.id) ? 'Снять выбор' : 'Выбрать' }}</span>
                </div>
                <div class="context-menu-divider"></div>
                <div class="context-menu-item" @click="handleContextMenuAction('open')">
                    <i class="fas fa-external-link-alt"></i>
                    <span>Открыть на сайте</span>
                </div>
                <div class="context-menu-item" @click="handleContextMenuAction('edit')">
                    <i class="fas fa-edit"></i>
                    <span>Редактировать</span>
                </div>
                <div class="context-menu-item" @click="handleContextMenuAction('duplicate')">
                    <i class="fas fa-copy"></i>
                    <span>Дублировать</span>
                </div>
                <div class="context-menu-divider"></div>
                <div class="context-menu-item context-menu-item-danger" @click="handleContextMenuAction('delete')">
                    <i class="fas fa-trash"></i>
                    <span>Удалить</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        window.__ADMIN_AUTH__ = <?= json_encode($adminUser ?? ['authenticated' => false]); ?>;
    </script>

    <script src="<?=NV?>/main/js/admin/modal.js"></script>
    <script src="<?=NV?>/main/js/admin/auth.js"></script>
    <script src="<?=NV?>/main/js/admin/category.js"></script>
    <script src="<?=NV?>/main/js/admin/mail.js"></script>
    <script src="<?=NV?>/main/js/admin/admin.js"></script>

    <?php foreach ($scripts as $script) {
        echo '<script src="'.NV.'/main/js/admin/pages/'.$script.'.js"></script>';
    } ?>

    <script type="text/x-template" id="admin-dashboard-template">
        <?php include __DIR__ . '/pages/admin-dashboard.php'; ?>
    </script>
    <?php foreach ($scripts as $script): ?>
    <script type="text/x-template" id="<?=$script?>-template">
        <?php include __DIR__ . '/pages/' .$script.'.html'; ?>
    </script>
<?php
endforeach;
endif;
Service::adminJS('components/service');

require_once ROOT_PATH . '/NV/main/admin/footer.php';

$pages = ['settings'];

foreach ($pages as $page) {
    Service::adminJS('pages/'.$page);
}
?>