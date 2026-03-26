NV.ready(() => {
    const { createApp } = Vue;

    NV.admin = Vue.createApp({
        mixins: [Modal, Auth, Category, Mail, Service, Settings],
        components: {
            Service,
            Settings
        },
        data() {
            return {
                origin: window.location.origin,
                page: 'admin',
                mobileMenuOpen: false,
                showAddUser: false,
                showAddProduct: false,
                editingProduct: null,
                win: null,
                productForm: {
                    name: '',
                    description: '',
                    peculiarities: [],
                    material: '',
                    price: '',
                    price_sale: '',
                    category: '',
                    product_type_id: null,
                    image: '',
                    image_description: '',
                    additionalImages: [],
                    additionalVideos: []
                },
                aiGeneratingDescription: false,
                aiGenerationError: '',
                newPeculiarity: '',
                selectedFile: null,
                selectOpen: false,
                draggingProductId: null,
                productDragScrollInterval: null,
                products: [],
                contextMenuVisible: false,
                contextMenuPosition: { x: 0, y: 0 },
                contextMenuProduct: null,
                contextMenuHideHandler: null,
                contextMenuEscapeHandler: null,
                initTextareaResize: null,
                showContentModal: false,
                featuresContent: [],
                historyContent: [],
                contentLoading: false,
                contentError: '',
                contentSuccess: '',
                showAddBlockModal: false,
                editingBlock: null,
                pageBlocks: [],
                blockForm: {
                    type: '',
                    title: '',
                    content: '',
                    settings: {},
                    sort_order: 0,
                    is_active: true
                },
                blockLoading: false,
                blockError: '',
                blockSuccess: '',
                showIconPicker: false,
                iconSearchQuery: '',
                selectedIconCategory: 'all',
                selectedIconClass: '',
                currentIconTarget: null,
                filteredIcons: [],
                draggingBlockId: null,
                draggedOverBlockId: null,
                hasUnsavedChanges: false,
                originalBlocksOrder: [],
                orders: [],
                ordersLoading: false,
                ordersError: '',
                users: [],
                usersLoading: false,
                usersError: '',
                editingOrderStatus: null,
                productOptions: [],
                newOptionTypeName: '',
                optionsLoading: false,
                optionsError: '',
                optionsSuccess: '',
                productTypes: [],
                newProductTypeName: '',
                selectedProductTypeId: null,
                typesLoading: false,
                typesError: '',
                typesSuccess: '',
                isUploading: false,
                uploadProgress: 0,
                uploadSuccess: false,
                uploadError: false,
                uploadErrorMessage: '',
                uploadXhr: null,
                pages: [],
                showAddPageModal: false,
                editingPage: null,
                pageForm: {
                    slug: '',
                    title: '',
                    content: '',
                    meta_title: '',
                    meta_description: '',
                    is_published: true,
                    is_main_page: false,
                    navigation_buttons: []
                },
                pageLoading: false,
                pageError: '',
                pageSuccess: '',
                viewMode: 'visual',
                pageElements: [],
                selectedElement: null,
                draggingElement: null,
                availableElements: [
                    { type: 'heading', label: 'Заголовок', icon: 'fas fa-heading', defaultContent: 'Новый заголовок' },
                    { type: 'paragraph', label: 'Абзац', icon: 'fas fa-paragraph', defaultContent: 'Новый абзац текста' },
                    { type: 'image', label: 'Изображение', icon: 'fas fa-photo-film', defaultContent: '' },
                    { type: 'list', label: 'Список', icon: 'fas fa-list', defaultContent: '<ul><li>Элемент списка 1</li><li>Элемент списка 2</li></ul>' },
                    { type: 'button', label: 'Кнопка', icon: 'fas fa-hand-pointer', defaultContent: 'Кнопка' },
                    { type: 'divider', label: 'Разделитель', icon: 'fas fa-minus', defaultContent: '<hr>' }
                ],
                iconCategories: [
                    { name: 'all', label: 'Все', icon: 'fas fa-th' },
                    { name: 'business', label: 'Бизнес', icon: 'fas fa-briefcase' },
                    { name: 'technology', label: 'Технологии', icon: 'fas fa-laptop' },
                    { name: 'shopping', label: 'Покупки', icon: 'fas fa-shopping-cart' },
                    { name: 'communication', label: 'Общение', icon: 'fas fa-comments' },
                    { name: 'media', label: 'Медиа', icon: 'fas fa-play' },
                    { name: 'travel', label: 'Путешествия', icon: 'fas fa-plane' },
                    { name: 'health', label: 'Здоровье', icon: 'fas fa-heart' },
                    { name: 'education', label: 'Образование', icon: 'fas fa-graduation-cap' },
                    { name: 'food', label: 'Еда', icon: 'fas fa-utensils' },
                    { name: 'sports', label: 'Спорт', icon: 'fas fa-football-ball' },
                    { name: 'weather', label: 'Погода', icon: 'fas fa-sun' }
                ],
                orderStatuses: {
                    pending: 'Ожидает',
                    confirmed: 'Подтвержден',
                    processing: 'В обработке',
                    shipped: 'Отправлен',
                    delivered: 'Доставлен',
                    cancelled: 'Отменен'
                },
                analyticsData: null,
                analyticsLoading: false,
                analyticsError: '',
                analyticsPeriod: '7',
                analyticsFilters: {
                    ip: '',
                    url: '',
                    referer: '',
                    date: '',
                    topPagesSearch: ''
                },
                productTableColumns: {
                    id: true,
                    image: true,
                    name: true,
                    description: true,
                    peculiarities: true,
                    material: true,
                    price: true,
                    price_sale: true,
                    category: true,
                    user: true,
                    created: true,
                    updated_by: true,
                    updated_at: true
                },
                showColumnSelector: false,
                showProductsActionsSidebar: false,
                badIps: [],
                dailyChart: null,
                hourlyChart: null,
                headerNavigation: {
                    main: [],
                    other: []
                },
                showNavigationModal: false,
                navigationLoading: false,
                navigationError: '',
                navigationSuccess: '',
                editingNavigationType: 'other',
                availableIcons: [
                    { class: 'fas fa-briefcase', name: 'Портфель', category: 'business' },
                    { class: 'fas fa-chart-line', name: 'График роста', category: 'business' },
                    { class: 'fas fa-handshake', name: 'Рукопожатие', category: 'business' },
                    { class: 'fas fa-users', name: 'Команда', category: 'business' },
                    { class: 'fas fa-building', name: 'Здание', category: 'business' },
                    { class: 'fas fa-coins', name: 'Монеты', category: 'business' },
                    { class: 'fas fa-trophy', name: 'Трофей', category: 'business' },
                    { class: 'fas fa-medal', name: 'Медаль', category: 'business' },
                    { class: 'fas fa-star', name: 'Звезда', category: 'business' },
                    { class: 'fas fa-crown', name: 'Корона', category: 'business' },
                    { class: 'fas fa-laptop', name: 'Ноутбук', category: 'technology' },
                    { class: 'fas fa-mobile-alt', name: 'Телефон', category: 'technology' },
                    { class: 'fas fa-tablet-alt', name: 'Планшет', category: 'technology' },
                    { class: 'fas fa-desktop', name: 'Компьютер', category: 'technology' },
                    { class: 'fas fa-microchip', name: 'Микросхема', category: 'technology' },
                    { class: 'fas fa-robot', name: 'Робот', category: 'technology' },
                    { class: 'fas fa-wifi', name: 'WiFi', category: 'technology' },
                    { class: 'fas fa-bluetooth', name: 'Bluetooth', category: 'technology' },
                    { class: 'fas fa-satellite', name: 'Спутник', category: 'technology' },
                    { class: 'fas fa-rocket', name: 'Ракета', category: 'technology' },
                    { class: 'fas fa-shopping-cart', name: 'Корзина', category: 'shopping' },
                    { class: 'fas fa-shopping-bag', name: 'Сумка', category: 'shopping' },
                    { class: 'fas fa-credit-card', name: 'Кредитная карта', category: 'shopping' },
                    { class: 'fas fa-wallet', name: 'Кошелек', category: 'shopping' },
                    { class: 'fas fa-gift', name: 'Подарок', category: 'shopping' },
                    { class: 'fas fa-tags', name: 'Теги', category: 'shopping' },
                    { class: 'fas fa-percent', name: 'Процент', category: 'shopping' },
                    { class: 'fas fa-receipt', name: 'Чек', category: 'shopping' },
                    { class: 'fas fa-box', name: 'Коробка', category: 'shopping' },
                    { class: 'fas fa-shipping-fast', name: 'Быстрая доставка', category: 'shopping' },
                    { class: 'fas fa-comments', name: 'Комментарии', category: 'communication' },
                    { class: 'fas fa-envelope', name: 'Письмо', category: 'communication' },
                    { class: 'fas fa-phone', name: 'Телефон', category: 'communication' },
                    { class: 'fas fa-video', name: 'Видео', category: 'communication' },
                    { class: 'fas fa-microphone', name: 'Микрофон', category: 'communication' },
                    { class: 'fas fa-headset', name: 'Гарнитура', category: 'communication' },
                    { class: 'fas fa-bullhorn', name: 'Мегафон', category: 'communication' },
                    { class: 'fas fa-share-alt', name: 'Поделиться', category: 'communication' },
                    { class: 'fas fa-link', name: 'Ссылка', category: 'communication' },
                    { class: 'fas fa-at', name: 'Email', category: 'communication' },
                    { class: 'fas fa-play', name: 'Воспроизведение', category: 'media' },
                    { class: 'fas fa-pause', name: 'Пауза', category: 'media' },
                    { class: 'fas fa-stop', name: 'Стоп', category: 'media' },
                    { class: 'fas fa-volume-up', name: 'Громкость', category: 'media' },
                    { class: 'fas fa-music', name: 'Музыка', category: 'media' },
                    { class: 'fas fa-film', name: 'Фильм', category: 'media' },
                    { class: 'fas fa-camera', name: 'Камера', category: 'media' },
                    { class: 'fas fa-image', name: 'Изображение', category: 'media' },
                    { class: 'fas fa-video', name: 'Видео', category: 'media' },
                    { class: 'fas fa-photo-video', name: 'Фото/Видео', category: 'media' },
                    { class: 'fas fa-plane', name: 'Самолет', category: 'travel' },
                    { class: 'fas fa-car', name: 'Автомобиль', category: 'travel' },
                    { class: 'fas fa-train', name: 'Поезд', category: 'travel' },
                    { class: 'fas fa-ship', name: 'Корабль', category: 'travel' },
                    { class: 'fas fa-bicycle', name: 'Велосипед', category: 'travel' },
                    { class: 'fas fa-motorcycle', name: 'Мотоцикл', category: 'travel' },
                    { class: 'fas fa-bus', name: 'Автобус', category: 'travel' },
                    { class: 'fas fa-taxi', name: 'Такси', category: 'travel' },
                    { class: 'fas fa-map-marker-alt', name: 'Метка на карте', category: 'travel' },
                    { class: 'fas fa-globe', name: 'Глобус', category: 'travel' },
                    { class: 'fas fa-heart', name: 'Сердце', category: 'health' },
                    { class: 'fas fa-heartbeat', name: 'Пульс', category: 'health' },
                    { class: 'fas fa-stethoscope', name: 'Стетоскоп', category: 'health' },
                    { class: 'fas fa-pills', name: 'Таблетки', category: 'health' },
                    { class: 'fas fa-ambulance', name: 'Скорая помощь', category: 'health' },
                    { class: 'fas fa-hospital', name: 'Больница', category: 'health' },
                    { class: 'fas fa-user-md', name: 'Врач', category: 'health' },
                    { class: 'fas fa-band-aid', name: 'Пластырь', category: 'health' },
                    { class: 'fas fa-thermometer-half', name: 'Термометр', category: 'health' },
                    { class: 'fas fa-weight', name: 'Вес', category: 'health' },
                    { class: 'fas fa-graduation-cap', name: 'Выпускная шапка', category: 'education' },
                    { class: 'fas fa-book', name: 'Книга', category: 'education' },
                    { class: 'fas fa-book-open', name: 'Открытая книга', category: 'education' },
                    { class: 'fas fa-pencil-alt', name: 'Карандаш', category: 'education' },
                    { class: 'fas fa-pen', name: 'Ручка', category: 'education' },
                    { class: 'fas fa-highlighter', name: 'Маркер', category: 'education' },
                    { class: 'fas fa-calculator', name: 'Калькулятор', category: 'education' },
                    { class: 'fas fa-microscope', name: 'Микроскоп', category: 'education' },
                    { class: 'fas fa-flask', name: 'Колба', category: 'education' },
                    { class: 'fas fa-chalkboard-teacher', name: 'Учитель', category: 'education' },
                    { class: 'fas fa-utensils', name: 'Столовые приборы', category: 'food' },
                    { class: 'fas fa-hamburger', name: 'Гамбургер', category: 'food' },
                    { class: 'fas fa-pizza-slice', name: 'Пицца', category: 'food' },
                    { class: 'fas fa-coffee', name: 'Кофе', category: 'food' },
                    { class: 'fas fa-wine-glass', name: 'Бокал вина', category: 'food' },
                    { class: 'fas fa-beer', name: 'Пиво', category: 'food' },
                    { class: 'fas fa-cookie-bite', name: 'Печенье', category: 'food' },
                    { class: 'fas fa-ice-cream', name: 'Мороженое', category: 'food' },
                    { class: 'fas fa-apple-alt', name: 'Яблоко', category: 'food' },
                    { class: 'fas fa-lemon', name: 'Лимон', category: 'food' },
                    { class: 'fas fa-football-ball', name: 'Футбольный мяч', category: 'sports' },
                    { class: 'fas fa-basketball-ball', name: 'Баскетбольный мяч', category: 'sports' },
                    { class: 'fas fa-baseball-ball', name: 'Бейсбольный мяч', category: 'sports' },
                    { class: 'fas fa-volleyball-ball', name: 'Волейбольный мяч', category: 'sports' },
                    { class: 'fas fa-dumbbell', name: 'Гантель', category: 'sports' },
                    { class: 'fas fa-running', name: 'Бег', category: 'sports' },
                    { class: 'fas fa-swimmer', name: 'Плавание', category: 'sports' },
                    { class: 'fas fa-bicycle', name: 'Велоспорт', category: 'sports' },
                    { class: 'fas fa-skiing', name: 'Лыжи', category: 'sports' },
                    { class: 'fas fa-skating', name: 'Коньки', category: 'sports' },
                    { class: 'fas fa-sun', name: 'Солнце', category: 'weather' },
                    { class: 'fas fa-moon', name: 'Луна', category: 'weather' },
                    { class: 'fas fa-cloud', name: 'Облако', category: 'weather' },
                    { class: 'fas fa-cloud-rain', name: 'Дождь', category: 'weather' },
                    { class: 'fas fa-snowflake', name: 'Снежинка', category: 'weather' },
                    { class: 'fas fa-bolt', name: 'Молния', category: 'weather' },
                    { class: 'fas fa-umbrella', name: 'Зонт', category: 'weather' },
                    { class: 'fas fa-tree', name: 'Дерево', category: 'weather' },
                    { class: 'fas fa-leaf', name: 'Лист', category: 'weather' },
                    { class: 'fas fa-seedling', name: 'Росток', category: 'weather' },
                    { class: 'fas fa-gem', name: 'Драгоценный камень', category: 'all' },
                    { class: 'fas fa-tools', name: 'Инструменты', category: 'all' },
                    { class: 'fas fa-award', name: 'Награда', category: 'all' },
                    { class: 'fas fa-shield-alt', name: 'Щит', category: 'all' },
                    { class: 'fas fa-lock', name: 'Замок', category: 'all' },
                    { class: 'fas fa-key', name: 'Ключ', category: 'all' },
                    { class: 'fas fa-home', name: 'Дом', category: 'all' },
                    { class: 'fas fa-user', name: 'Пользователь', category: 'all' },
                    { class: 'fas fa-users', name: 'Пользователи', category: 'all' },
                    { class: 'fas fa-cog', name: 'Настройки', category: 'all' },
                    { class: 'fas fa-search', name: 'Поиск', category: 'all' },
                    { class: 'fas fa-plus', name: 'Плюс', category: 'all' },
                    { class: 'fas fa-minus', name: 'Минус', category: 'all' },
                    { class: 'fas fa-check', name: 'Галочка', category: 'all' },
                    { class: 'fas fa-times', name: 'Крестик', category: 'all' },
                    { class: 'fas fa-arrow-right', name: 'Стрелка вправо', category: 'all' },
                    { class: 'fas fa-arrow-left', name: 'Стрелка влево', category: 'all' },
                    { class: 'fas fa-arrow-up', name: 'Стрелка вверх', category: 'all' },
                    { class: 'fas fa-arrow-down', name: 'Стрелка вниз', category: 'all' },
                    { class: 'fas fa-thumbs-up', name: 'Большой палец вверх', category: 'all' },
                    { class: 'fas fa-thumbs-down', name: 'Большой палец вниз', category: 'all' }
                ],
                logo: '',
                title: '',
                description: '',
                imageMetaTags: '',
                pickupAddress: '',
                workHours: '',
                storePhone: '',
                deliveryBel: 0,
                deliveryRus: 0,
                selectedProducts: [],
            }
        },
        watch: {
            selectedIconCategory() {
                this.updateFilteredIcons();
            },
            iconSearchQuery() {
                this.updateFilteredIcons();
            },
            selectedProductTypeId(newVal) {
                if (newVal) {
                    this.loadProductOptions().then(() => null);
                } else {
                    this.productOptions = [];
                }
            }
        },
        mounted() {
            this.cleanupOldOrders().then(() => null);
            this.getAllProducts().then(() => null);
            this.loadCategories().then(() => null);
            this.loadPageBlocks().then(() => null);
            this.loadOrders().then(() => null);
            this.loadUsers().then(() => null);
            this.loadPages().then(() => null);
            this.loadProductTypes().then(() => null);
            this.loadParams().then(() => null);
            this.loadColumnSettings();
            this.loadModalSizes();

            window.addEventListener('resize', () => {
                this.checkAllModalsBounds();
            });

            document.addEventListener('click', (e) => {
                if (this.showColumnSelector) {
                    const dropdown = e.target.closest('.column-selector-dropdown');
                    const button = e.target.closest('.column-selector-btn');
                    const container = e.target.closest('.products-management-content > div');
                    if (!dropdown && !button && !container) {
                        this.showColumnSelector = false;
                    }
                }
            });

            this.init();
        },
        created() {
            this.win = window;

            try {
                const search = this.win && this.win.location ? this.win.location.search : '';
                if (search) {
                    const params = new URLSearchParams(search);
                    const pageParam = params.get('page');
                    const messageId = params.get('id');
                    
                    if ((pageParam === 'message' || pageParam === 'message-reply') && messageId) {
                        this.getMessages().then(() => {
                            const message = this.messages.find(m => m.id == messageId);
                            if (message) {
                                this.selectedMessage = message;
                            }
                            this.changePage(pageParam);
                        });
                    } else if (pageParam) {
                        this.changePage(pageParam);
                    }
                }
            } catch (e) {
                console.error('Error reading page from URL params', e);
            }
        },
        computed: {
            canCreateUser() {
                const u = (this.registerData.username || '').trim();
                const p = (this.registerData.password || '').trim();

                return u.length > 0 && p.length > 0 && u.length <= 50;
            },
            filteredRecentVisits() {
                if (!this.analyticsData || !this.analyticsData.recent_visits) {
                    return [];
                }

                let filtered = this.analyticsData.recent_visits.filter(visit => {
                    return !visit.url || !visit.url.startsWith('/?');
                });

                if (Array.isArray(this.badIps) && this.badIps.length > 0) {
                    filtered = filtered.filter(visit => {
                        const ip = visit.ip ? String(visit.ip).trim().toLowerCase() : '';
                        if (!ip) {
                            return true;
                        }

                        return !this.badIps.some(blockedIp =>
                            blockedIp &&
                            String(blockedIp).trim().toLowerCase() === ip
                        );
                    });
                }

                if (this.analyticsFilters.ip) {
                    const ipFilter = this.analyticsFilters.ip.toLowerCase().trim();

                    filtered = filtered.filter(visit => {
                        if (!visit.ip) {
                            return false;
                        }
                        return visit.ip.toLowerCase().includes(ipFilter);
                    });
                }

                const currentHost = (this.win && this.win.location && this.win.location.host) || '';
                filtered = filtered.filter(visit => {
                    if (!visit.referer) {
                        return false;
                    }

                    try {
                        const url = new URL(visit.referer, this.win ? this.win.location.origin : undefined);
                        return !currentHost || url.host !== currentHost;
                    } catch (e) {
                        return false;
                    }
                });

                if (this.analyticsFilters.url) {
                    const urlFilter = this.analyticsFilters.url.toLowerCase().trim();

                    filtered = filtered.filter(visit => {
                        const url = visit.url === '/' ? 'домашняя' : visit.url.toLowerCase();
                        return url.includes(urlFilter);
                    });
                }

                if (this.analyticsFilters.referer) {
                    const refererFilter = this.analyticsFilters.referer.toLowerCase().trim();

                    filtered = filtered.filter(visit =>
                        visit.referer && visit.referer.toLowerCase().includes(refererFilter)
                    );
                }

                if (this.analyticsFilters.date) {
                    filtered = filtered.filter(visit => visit.date === this.analyticsFilters.date);
                }

                return filtered;
            },
            filteredTopPages() {
                if (!this.analyticsData || !this.analyticsData.top_pages) {
                    return [];
                }

                let filtered = this.analyticsData.top_pages.filter(page => {
                    return !page.url || !page.url.startsWith('/?');
                });

                if (!this.analyticsFilters.topPagesSearch) {
                    return filtered;
                }

                const searchFilter = this.analyticsFilters.topPagesSearch.toLowerCase().trim();

                return filtered.filter(page => {
                    const url = page.url === '/' ? 'домашняя' : page.url.toLowerCase();
                    return url.includes(searchFilter);
                });
            },
            filteredTopVirtualPages() {
                if (!this.analyticsData || !this.analyticsData.top_virtual_pages) {
                    return [];
                }

                return this.analyticsData.top_virtual_pages.filter(page => {
                    return !page.url || !page.url.startsWith('/?');
                });
            },
            filteredTopPhpPages() {
                if (!this.analyticsData || !this.analyticsData.top_php_pages) {
                    return [];
                }

                return this.analyticsData.top_php_pages.filter(page => {
                    return !page.url || !page.url.startsWith('/?');
                });
            },
            truncatedProducts() {
                return this.products.map(product => ({
                    ...product,
                    truncatedName: this.truncateText(product.name, 30),
                    truncatedDescription: this.truncateText(product.description, 80)
                }));
            }
        },
        methods: {
            init() {
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.closeAllMenus();
                    }
                });

                this.initColumnResize();
            },
            isMobileDevice() {
                return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            },
            closeMinimizedModal(modalId) {

                if (this.minimizedModals[modalId]) {
                    delete this.minimizedModals[modalId];
                }

                if (this.maximizedModals[modalId]) {
                    delete this.maximizedModals[modalId];
                }

                switch (modalId) {
                    case 'addUserModal':
                        this.showAddUser = false;
                        this.registerData = { username: '', password: '', role: 'user' };
                        this.registerLoading = false;
                        this.registerError = '';
                        this.registerSuccess = '';
                        break;
                    case 'productModal':
                        this.showAddProduct = false;
                        this.editingProduct = null;
                        this.selectedFile = null;
                        this.productForm = {
                            name: '',
                            description: '',
                            peculiarities: [],
                            material: '',
                            price: '',
                            price_sale: '',
                            category: '',
                            product_type_id: null,
                            image: '',
                            additionalImages: [],
                            additionalVideos: []
                        };
                        this.newPeculiarity = '';
                        if (this.$refs.fileInput) {
                            this.$refs.fileInput.value = '';
                        }
                        if (this.$refs.additionalImagesInput) {
                            this.$refs.additionalImagesInput.value = '';
                        }
                        break;
                    case 'contentModal':
                        this.showContentModal = false;
                        this.contentError = '';
                        this.contentSuccess = '';
                        break;
                    case 'blockModal':
                        this.showAddBlockModal = false;
                        this.editingBlock = null;
                        this.blockError = '';
                        this.blockSuccess = '';
                        this.blockForm = {
                            type: '',
                            title: '',
                            content: '',
                            settings: {},
                            sort_order: 0,
                            is_active: true
                        };
                        break;
                    case 'iconPickerModal':
                        this.showIconPicker = false;
                        this.currentIconTarget = null;
                        this.selectedIconClass = '';
                        this.iconSearchQuery = '';
                        this.selectedIconCategory = 'all';
                        break;
                    case 'pageModal':
                        this.showAddPageModal = false;
                        this.editingPage = null;
                        this.pageForm = {
                            slug: '',
                            title: '',
                            content: '',
                            meta_title: '',
                            meta_description: '',
                            is_published: true,
                            is_main_page: false
                        };
                        this.pageElements = [];
                        this.selectedElement = null;
                        this.draggingElement = null;
                        this.pageError = '';
                        this.pageSuccess = '';
                        break;
                }

                this.$forceUpdate();
            },
            startDragProduct(product, event) {
                this.draggingProductId = product.id;
                event.dataTransfer.effectAllowed = 'move';
                this.handleProductDragOverBound = (e) => this.handleProductDragOver(e);
                this.handleProductDragEndBound = () => this.handleProductDragEnd();
                document.addEventListener('dragover', this.handleProductDragOverBound);
                document.addEventListener('dragend', this.handleProductDragEndBound);
            },
            endDragProduct() {
                this.cleanupProductDrag();
            },
            handleProductDragEnd() {
                this.cleanupProductDrag();
            },
            cleanupProductDrag() {
                this.draggingProductId = null;

                if (this.handleProductDragOverBound) {
                    document.removeEventListener('dragover', this.handleProductDragOverBound);
                    this.handleProductDragOverBound = null;
                }

                if (this.handleProductDragEndBound) {
                    document.removeEventListener('dragend', this.handleProductDragEndBound);
                    this.handleProductDragEndBound = null;
                }

                this.stopProductDragScroll();
            },
            handleProductDragOver(event) {
                if (!this.draggingProductId) return;

                const scrollThreshold = 100;
                const scrollSpeed = 10;
                const windowHeight = window.innerHeight;
                const scrollY = window.scrollY || window.pageYOffset;
                const mouseY = event.clientY;

                if (mouseY < scrollThreshold && scrollY > 0) {
                    this.startProductDragScroll('up', scrollSpeed);
                }
                else if (mouseY > windowHeight - scrollThreshold) {
                    const maxScroll = document.documentElement.scrollHeight - windowHeight;

                    if (scrollY < maxScroll) {
                        this.startProductDragScroll('down', scrollSpeed);
                    } else {
                        this.stopProductDragScroll();
                    }
                } else {
                    this.stopProductDragScroll();
                }
            },
            startProductDragScroll(direction, speed) {
                if (this.productDragScrollInterval) {
                    this.stopProductDragScroll();
                }

                this.productDragScrollInterval = setInterval(() => {
                    if (direction === 'up') {
                        window.scrollBy(0, -speed);
                    } else {
                        window.scrollBy(0, speed);
                    }
                }, 16);
            },
            stopProductDragScroll() {
                if (this.productDragScrollInterval) {
                    clearInterval(this.productDragScrollInterval);
                    this.productDragScrollInterval = null;
                }
            },
            dropProduct(targetProduct, event) {
                event.preventDefault();
                if (this.draggingProductId === targetProduct.id) {
                    this.cleanupProductDrag();
                    return;
                }

                const draggedIndex = this.products.findIndex(p => p.id === this.draggingProductId);
                const targetIndex = this.products.findIndex(p => p.id === targetProduct.id);

                if (draggedIndex === -1 || targetIndex === -1) {
                    this.cleanupProductDrag();
                    return;
                }

                const [dragged] = this.products.splice(draggedIndex, 1);
                this.products.splice(targetIndex, 0, dragged);
                this.saveProductsOrder().then(r => null);
            },
            async saveProductsOrder() {
                try {
                    const order = this.products.map(p => p.id);
                    const formData = new FormData();
                    formData.append('action', 'save_products_order');
                    formData.append('products_order', JSON.stringify(order));
                    const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' });
                    const result = await response.json();
                    if (!response.ok || result.error) {
                        throw new Error(result.error || 'Ошибка сохранения порядка');
                    }
                } catch (e) {
                    console.error('Ошибка сохранения порядка товаров:', e);
                }
            },
            toggleMobileMenu() {
                this.mobileMenuOpen = !this.mobileMenuOpen;
            },
            closeMobileMenu() {
                this.mobileMenuOpen = false;
            },
            editProduct(product) {
                this.editingProduct = product;

                this.productForm = {
                    name: product.name,
                    description: product.description || '',
                    peculiarities: product.peculiarities ? [...product.peculiarities] : [],
                    material: product.material,
                    price: product.price,
                    price_sale: product.price_sale || '',
                    category: product.category,
                    product_type_id: product.product_type_id || null,
                    image: product.image,
                    additionalImages: product.additional_images ? [...product.additional_images] : [],
                    additionalVideos: product.additional_videos ? [...product.additional_videos] : []
                };

                if (!this.isMobileDevice()) {
                    if (this.minimizedModals['productModal']) {
                        this.restoreModal('productModal');

                    }
                    this.turnTextareaResize();

                    this.$nextTick(() => {
                        this.applyModalSize('productModal');
                    });
                } else {
                    this.changePage('product');
                    window.scrollTo(0, 0);
                }
            },
            async deleteProduct(productId, multiple = false) {
                const deleteAction = async (productId) => {
                    try {
                        const formData = new FormData();
                        formData.append('action', 'delete_product');
                        formData.append('id', productId);

                        const response = await fetch('../api.php', {
                            method: 'POST',
                            body: formData,
                            credentials: 'same-origin'
                        });

                        if (response.ok) {
                            this.products = this.products.filter(p => p.id !== productId);
                        } else {
                            const errorData = await response.json();
                            console.error('Failed to delete product:', errorData.error || 'Unknown error');
                            alert('Ошибка при удалении товара');
                        }
                    } catch (error) {
                        console.error('Error deleting product:', error);
                        alert('Ошибка при удалении товара');
                    }
                }

                if (multiple) {
                    await deleteAction(productId);
                } else {
                    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
                        await deleteAction(productId);
                    }
                }
            },
            async saveProduct() {
                try {
                    const formData = new FormData();

                    if (this.editingProduct) {
                        formData.append('action', 'update_product');
                        formData.append('id', this.editingProduct.id);
                        formData.append('name', this.productForm.name);
                        formData.append('description', this.productForm.description);
                        formData.append('peculiarities', JSON.stringify(this.productForm.peculiarities));
                        formData.append('material', this.productForm.material);
                        formData.append('price', this.productForm.price);
                        formData.append('price_sale', this.productForm.price_sale || '');
                        formData.append('category', this.productForm.category);
                        formData.append('product_type_id', this.productForm.product_type_id || '');
                        formData.append('image', this.productForm.image);
                        formData.append('image_description', this.productForm.image_description)

                        if (this.selectedFile) {
                            formData.append('product_image', this.selectedFile);
                        }

                        const response = await fetch('../api.php', {
                            method: 'POST',
                            body: formData,
                            credentials: 'same-origin'
                        });

                        if (response.ok) {
                            const payload = await response.json();
                            const index = this.products.findIndex(p => p.id === this.editingProduct.id);

                            if (index !== -1) {
                                this.products[index] = {
                                    ...this.products[index],
                                    name: this.productForm.name,
                                    description: this.productForm.description,
                                    peculiarities: this.productForm.peculiarities,
                                    material: this.productForm.material,
                                    price: parseInt(this.productForm.price),
                                    price_sale: parseInt(this.productForm.price_sale),
                                    category: this.productForm.category,
                                    product_type_id: this.productForm.product_type_id ? parseInt(this.productForm.product_type_id) : null,
                                    image: (payload && payload.image) ? payload.image : this.products[index].image
                                };
                            }

                            this.update();
                        } else {
                            const errorData = await response.json();

                            console.error('Failed to update product:', errorData.error || 'Unknown error');
                            alert('Ошибка при обновлении товара');

                            return;
                        }
                    } else {
                        formData.append('action', 'add_product');
                        formData.append('name', this.productForm.name);
                        formData.append('description', this.productForm.description);
                        formData.append('peculiarities', JSON.stringify(this.productForm.peculiarities));
                        formData.append('material', this.productForm.material);
                        formData.append('price', this.productForm.price);
                        formData.append('price_sale', this.productForm.price_sale || '');
                        formData.append('category', this.productForm.category);
                        formData.append('product_type_id', this.productForm.product_type_id || '');
                        formData.append('image', this.productForm.image || '');
                        formData.append('image_description', this.productForm.image_description || '');

                        if (this.selectedFile) {
                            formData.append('product_image', this.selectedFile);
                        }

                        const response = await fetch('../api.php', {
                            method: 'POST',
                            body: formData,
                            credentials: 'same-origin'
                        });

                        if (response.ok) {
                            const result = await response.json();

                            this.products.push({
                                id: result.id,
                                name: this.productForm.name,
                                description: this.productForm.description,
                                peculiarities: this.productForm.peculiarities,
                                material: this.productForm.material,
                                price: parseInt(this.productForm.price),
                                price_sale: parseInt(this.productForm.price_sale),
                                category: this.productForm.category,
                                product_type_id: this.productForm.product_type_id ? parseInt(this.productForm.product_type_id) : null,
                                image: result && result.image ? result.image : ''
                            });
                        } else {
                            const errorData = await response.json();

                            console.error('Failed to add product:', errorData.error || 'Unknown error');
                            alert('Ошибка при добавлении товара');

                            return;
                        }
                    }

                    if (this.selectedFile) {
                        this.selectedFile = null;
                        this.$refs.fileInput.value = '';
                    }

                    this.changePage('admin');
                    this.closeModal();
                } catch (error) {
                    console.error('Error saving product:', error);
                    alert('Ошибка при сохранении товара');
                }
            },
            async refreshProducts() {
                await this.getAllProducts();
                await Category.methods.loadCategories();

                let productsLoader = document.querySelector('.products-table-loader');
                let categoriesLoader = document.querySelector('.categories-loader');

                if (productsLoader) {
                    productsLoader.style.display = 'block';
                }

                if (categoriesLoader) {
                    categoriesLoader.style.display = 'block';
                }

                setTimeout(() => {
                    if (productsLoader) productsLoader.style.display = 'none';
                    if (categoriesLoader) categoriesLoader.style.display = 'none';
                }, 500);
            },
            async generateDescriptionWithAI() {
                if (this.aiGeneratingDescription) {
                    return;
                }

                if (!this.productForm.name || !this.productForm.name.trim()) {
                    this.aiGenerationError = 'Сначала введите название товара.';
                    return;
                }

                this.aiGenerationError = '';
                this.aiGeneratingDescription = true;

                try {
                    const formData = new FormData();
                    formData.append('action', 'generate_product_description');
                    formData.append('name', this.productForm.name.trim());

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    const data = await response.json().catch(() => ({}));

                    if (!response.ok || !data.description) {
                        throw new Error(data.error || 'Не удалось получить описание');
                    }

                    this.productForm.description = data.description.trim();
                } catch (error) {
                    console.error('AI generation error:', error);
                    this.aiGenerationError = error.message || 'Ошибка генерации описания';
                } finally {
                    this.aiGeneratingDescription = false;
                }
            },
            closeModal(event) {
                this._closeModalGeneric('productModal', event, {
                    showProperty: 'showAddProduct',
                    mobilePage: 'admin',
                    beforeClose: () => {
                        if (this.editingProduct !== undefined) {
                            this.editingProduct = null;
                        }
                        if (this.selectedFile !== undefined) {
                            this.selectedFile = null;
                        }
                        if (this.productForm) {
                            this.productForm = {
                                name: '',
                                description: '',
                                peculiarities: [],
                                material: '',
                                price: '',
                                price_sale: '',
                                category: '',
                                image: '',
                                additionalImages: [],
                                additionalVideos: []
                            };
                        }
                        if (this.aiGeneratingDescription !== undefined) {
                            this.aiGeneratingDescription = false;
                        }
                        if (this.aiGenerationError !== undefined) {
                            this.aiGenerationError = '';
                        }
                        if (this.newPeculiarity !== undefined) {
                            this.newPeculiarity = '';
                        }
                        if (this.$refs && this.$refs.fileInput) {
                            this.$refs.fileInput.value = '';
                        }
                        if (this.$refs && this.$refs.additionalImagesInput) {
                            this.$refs.additionalImagesInput.value = '';
                        }
                    }
                });
            },
            addPeculiarity() {
                if (this.newPeculiarity.trim()) {
                    this.productForm.peculiarities.push(this.newPeculiarity.trim());
                    this.newPeculiarity = '';
                }
            },
            removePeculiarity(index) {
                this.productForm.peculiarities.splice(index, 1);
            },
            async getAllProducts() {
                try {
                    const response = await fetch('../api.php?action=products', { credentials: 'same-origin' });

                    if (response.ok) {
                        const data = await response.json();
                        this.products = data;
                        this.$nextTick(() => {
                            this.initColumnResize();
                        });
                    } else {
                        console.error('Failed to load products:', response.status, response.statusText);
                    }
                } catch (error) {
                    console.error('Error loading products:', error);
                }
            },
            getProductsObject() {
                let products = {};

                this.products.forEach(product => {
                    products[product['id']] = this.getObject(product);
                });

                return products;
            },
            triggerFileUpload() {
                this.$refs.fileInput.click();
            },
            async handleFileSelect(event) {
                const file = event.target.files[0];
                if (!file) return;

                const isVideo = file.type.startsWith('video/');
                const maxSize = isVideo ? (256 * 1024 * 1024) : (64 * 1024 * 1024);
                const sizeLimit = isVideo ? '256MB' : '64MB';

                if (file.size > maxSize) {
                    alert(`Размер файла не должен превышать ${sizeLimit}`);
                    event.target.value = '';
                    return;
                }

                this.selectedFile = file;
                const objectURL = URL.createObjectURL(file);
                this.productForm.image = objectURL;
                this.isUploading = true;
                this.uploadProgress = 0;
                this.uploadSuccess = false;
                this.uploadError = false;
                this.uploadErrorMessage = '';

                try {
                    await this.uploadMainFile(file);
                    URL.revokeObjectURL(objectURL);
                    this.uploadSuccess = true;
                    this.isUploading = false;
                    setTimeout(() => { this.uploadSuccess = false; }, 2000);
                } catch (e) {
                    console.error('Upload error:', e);
                    URL.revokeObjectURL(objectURL);
                    this.uploadError = true;
                    this.uploadErrorMessage = e.message || 'Ошибка загрузки';
                    this.isUploading = false;
                    alert('Ошибка загрузки файла: ' + this.uploadErrorMessage);
                }
            },
            uploadMainFile(file) {
                return new Promise((resolve, reject) => {
                    try {
                        const fd = new FormData();

                        fd.append('action', 'upload_product_media');
                        fd.append('file', file);

                        const xhr = new XMLHttpRequest();
                        this.uploadXhr = xhr;

                        xhr.open('POST', '../api.php', true);
                        xhr.withCredentials = true;

                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable) {
                                this.uploadProgress = Math.round((e.loaded / e.total) * 100);
                            }
                        };

                        xhr.onload = () => {
                            this.uploadXhr = null;

                            try {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    let res;

                                    try {
                                        res = JSON.parse(xhr.responseText || '{}');
                                    } catch (parseError) {
                                        console.error('JSON parse error:', parseError);
                                        reject(new Error('Ошибка парсинга ответа сервера'));
                                        return;
                                    }

                                    if (res && res.success) {
                                        if (res.url) {
                                            this.productForm.image = res.url;
                                        }

                                        this.selectedFile = null;

                                        resolve(res);
                                    } else {
                                        const errorMsg = res.error || 'Неизвестная ошибка';
                                        reject(new Error(errorMsg));
                                    }
                                } else {
                                    let errorMsg = 'Ошибка загрузки';

                                    try {
                                        const errorRes = JSON.parse(xhr.responseText || '{}');
                                        if (errorRes.error) {
                                            errorMsg = errorRes.error;
                                        }
                                    } catch (_) {
                                        errorMsg = `Ошибка сервера (${xhr.status}): ${xhr.statusText}`;
                                    }
                                    reject(new Error(errorMsg));
                                }
                            } catch (error) {
                                console.error('Error in xhr.onload:', error);
                                reject(new Error('Ошибка обработки ответа: ' + error.message));
                            }
                        };

                        xhr.onerror = () => {
                            this.uploadXhr = null;
                            reject(new Error('Ошибка сети при загрузке файла'));
                        };

                        xhr.onabort = () => {
                            this.uploadXhr = null;
                            reject(new Error('Загрузка отменена'));
                        };

                        xhr.ontimeout = () => {
                            this.uploadXhr = null;
                            reject(new Error('Превышено время ожидания загрузки'));
                        };

                        xhr.timeout = 300000;
                        xhr.send(fd);
                    } catch (error) {
                        this.uploadXhr = null;
                        reject(new Error('Ошибка создания запроса: ' + error.message));
                    }
                });
            },
            cancelUpload() {
                if (this.uploadXhr) {
                    this.uploadXhr.abort();
                }
                this.isUploading = false;
                this.uploadProgress = 0;
                this.uploadError = false;
                this.uploadSuccess = false;
            },
            resetUploadStatus() {
                this.uploadSuccess = false;
                this.uploadError = false;
                this.uploadErrorMessage = '';
            },
            removeImage() {
                this.selectedFile = null;
                this.productForm.image = '';
            },
            getImageUrl() {
                if (this.selectedFile) {
                    return this.productForm.image;
                } else if (this.productForm.image) {
                    return '../' + this.productForm.image;
                }
                return '';
            },
            isVideoPreview(url) {
                if (!url || typeof url !== 'string') {
                    return false;
                }
                return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('video');
            },
            isVideo(url) {
                if (!url || typeof url !== 'string') {
                    return false;
                }
                return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('video');
            },
            onSelectFocus() {
                this.selectOpen = true;
            },
            onSelectBlur() {
                setTimeout(() => {
                    this.selectOpen = false;
                }, 200);
            },
            onSelectChange() {
                this.selectOpen = false;
            },
            onSelectClick() {
                this.selectOpen = !this.selectOpen;
            },
            onSelectMouseDown() {
                this.selectOpen = true;
            },
            turnTextareaResize() {
                this.$nextTick(() => {
                    const wrapper = document.querySelector('.textarea-wrapper');
                    const textarea = wrapper ? wrapper.querySelector('.textarea') : null;
                    const handle = wrapper ? wrapper.querySelector('.vertical-resize') : null;
                    if (!textarea || !handle) return;

                    const autoGrow = () => {
                        textarea.style.height = 'auto';
                        textarea.style.height = textarea.scrollHeight + 'px';
                    };
                    textarea.removeEventListener('input', autoGrow);
                    textarea.addEventListener('input', autoGrow);
                    autoGrow();

                    const onMouseMove = (e) => {
                        const rect = textarea.getBoundingClientRect();
                        const newHeight = Math.max(80, Math.min(600, e.clientY - rect.top));
                        textarea.style.height = newHeight + 'px';
                    };
                    const onMouseUp = () => {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                    };
                    this.initTextareaResize = (e) => {
                        e.preventDefault();
                        window.addEventListener('mousemove', onMouseMove);
                        window.addEventListener('mouseup', onMouseUp);
                    };
                });
            },
            truncateText(text, charsPerLine = 30, maxLines = 4) {
                if (!text || !text.trim()) return '';

                const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
                if (!cleanText) return '';

                const lines = [];
                let currentIndex = 0;

                while (currentIndex < cleanText.length && lines.length < maxLines) {
                    const remainingText = cleanText.substring(currentIndex);

                    if (remainingText.length <= charsPerLine) {
                        lines.push(remainingText);
                        break;
                    }

                    let breakIndex = charsPerLine;
                    for (let i = charsPerLine; i >= 0; i--) {
                        if (remainingText[i] === ' ') {
                            breakIndex = i;
                            break;
                        }
                    }

                    const line = remainingText.substring(0, breakIndex).trim();
                    lines.push(line);
                    currentIndex += breakIndex + 1;

                    if (lines.length === maxLines && currentIndex < cleanText.length) {
                        const lastLine = lines[maxLines - 1];
                        if (lastLine.length <= charsPerLine - 3) {
                            lines[maxLines - 1] = lastLine + '...';
                        } else {
                            lines[maxLines - 1] = lastLine.substring(0, charsPerLine - 3) + '...';
                        }
                        break;
                    }
                }

                return lines.join('\n');
            },
            initColumnResize() {
                this.$nextTick(() => {
                    const table = document.querySelector('.products-table table');
                    if (!table) return;

                    this.loadColumnWidths();

                    const resizeHandles = table.querySelectorAll('.column-resize-handle');
                    resizeHandles.forEach(handle => {
                        const newHandle = handle.cloneNode(true);
                        handle.parentNode.replaceChild(newHandle, handle);
                        this.setupColumnResize(newHandle);
                    });
                });
            },
            setupColumnResize(handle) {
                let isResizing = false;
                let startX = 0;
                let startWidth = 0;
                let column = null;
                let indicator = null;

                const startResize = (e) => {
                    if (window.innerWidth <= 768) return;
                    if (e.detail && e.detail > 1) return;

                    e.preventDefault();
                    e.stopPropagation();

                    isResizing = true;
                    startX = e.clientX;
                    column = handle.parentElement;
                    startWidth = column.offsetWidth;

                    indicator = document.createElement('div');
                    indicator.className = 'resize-indicator';
                    document.body.appendChild(indicator);

                    const updateIndicator = (e) => {
                        const rect = column.getBoundingClientRect();
                        indicator.style.left = (rect.right + (e.clientX - startX)) + 'px';
                        indicator.classList.add('active');
                    };

                    const handleMouseMove = (e) => {
                        if (!isResizing) return;
                        e.preventDefault();
                        updateIndicator(e);
                    };

                    const stopResize = (e) => {
                        if (!isResizing) return;

                        const newWidth = Math.max(50, startWidth + (e.clientX - startX));
                        const widthPx = newWidth + 'px';

                        column.style.width = widthPx;
                        column.style.minWidth = widthPx;

                        const table = column.closest('table');
                        if (table) {
                            const headerRow = table.querySelector('thead tr');
                            if (headerRow) {
                                const columnIndex = Array.from(headerRow.children).indexOf(column);

                                if (columnIndex !== -1) {
                                    const rows = table.querySelectorAll('tbody tr');
                                    rows.forEach(row => {
                                        const cells = row.querySelectorAll('td');
                                        if (cells[columnIndex]) {
                                            cells[columnIndex].style.width = widthPx;
                                            cells[columnIndex].style.minWidth = widthPx;
                                        }
                                    });
                                }
                            }
                        }

                        this.saveColumnWidth(column.dataset.column, newWidth);

                        isResizing = false;
                        handle.classList.remove('active');
                        if (indicator) {
                            indicator.classList.remove('active');
                            setTimeout(() => {
                                if (indicator && indicator.parentNode) {
                                    indicator.parentNode.removeChild(indicator);
                                }
                            }, 200);
                        }

                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', stopResize);
                    };

                    handle.classList.add('active');
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', stopResize);
                };

                handle.addEventListener('mousedown', startResize);
                    handle.addEventListener('dblclick', (e) => {
                        if (window.innerWidth <= 768) return;
                        e.preventDefault();
                        e.stopPropagation();

                        const col = handle.parentElement;
                        if (!col) return;

                        const columnName = col.dataset.column;
                        if (!columnName) return;

                        const table = col.closest('table');
                        if (!table) return;

                        const headerRow = table.querySelector('thead tr');
                        if (!headerRow) return;

                        const columnIndex = Array.from(headerRow.children).indexOf(col);
                        if (columnIndex === -1) return;

                        const originalLayout = table.style.tableLayout;
                        table.style.tableLayout = 'auto';

                        col.style.width = '';
                        col.style.minWidth = '';
                        const rowsForMeasure = table.querySelectorAll('tbody tr');
                        rowsForMeasure.forEach(row => {
                            const cells = row.querySelectorAll('td');
                            if (cells[columnIndex]) {
                                cells[columnIndex].style.width = '';
                                cells[columnIndex].style.minWidth = '';
                            }
                        });

                        table.offsetWidth;
                        const naturalWidth = col.offsetWidth;
                        const widthPx = naturalWidth + 'px';

                        table.style.tableLayout = originalLayout || 'fixed';

                        col.style.width = widthPx;
                        col.style.minWidth = widthPx;

                        const rows = table.querySelectorAll('tbody tr');
                        rows.forEach(row => {
                            const cells = row.querySelectorAll('td');
                            if (cells[columnIndex]) {
                                cells[columnIndex].style.width = widthPx;
                                cells[columnIndex].style.minWidth = widthPx;
                            }
                        });

                        this.saveColumnWidth(columnName, naturalWidth);
                    });
            },
            saveColumnWidth(columnName, width) {
                const savedWidths = JSON.parse(localStorage.getItem('admin_column_widths') || '{}');
                savedWidths[columnName] = width;
                localStorage.setItem('admin_column_widths', JSON.stringify(savedWidths));
            },
            loadColumnWidths() {
                const savedWidths = JSON.parse(localStorage.getItem('admin_column_widths') || '{}');
                const table = document.querySelector('.products-table table');
                if (!table) return;

                Object.keys(savedWidths).forEach(columnName => {
                    const column = table.querySelector(`th[data-column="${columnName}"]`);
                    if (column) {
                        const widthPx = savedWidths[columnName] + 'px';
                        column.style.width = widthPx;
                        column.style.minWidth = widthPx;

                        const headerRow = table.querySelector('thead tr');
                        if (!headerRow) return;

                        const columnIndex = Array.from(headerRow.children).indexOf(column);
                        if (columnIndex === -1) return;

                        const rows = table.querySelectorAll('tbody tr');
                        rows.forEach(row => {
                            const cells = row.querySelectorAll('td');
                            if (cells[columnIndex]) {
                                cells[columnIndex].style.width = widthPx;
                                cells[columnIndex].style.minWidth = widthPx;
                            }
                        });
                    }
                });
            },
            triggerAdditionalImagesUpload() {
                this.$refs.additionalImagesInput.click();
            },
            async handleAdditionalImagesSelect(event) {
                const files = Array.from(event.target.files);
                if (files.length === 0) return;

                for (const file of files) {
                    const isVideo = file.type.startsWith('video/');
                    const maxSize = isVideo ? (256 * 1024 * 1024) : (64 * 1024 * 1024);
                    const sizeLimit = isVideo ? '256MB' : '64MB';

                    if (file.size > maxSize) {
                        alert(`Файл "${file.name}" слишком большой. Максимальный размер: ${sizeLimit}`);
                        event.target.value = '';
                        return;
                    }
                }

                try {
                    const formData = new FormData();
                    formData.append('action', 'add_product_images');
                    formData.append('product_id', this.editingProduct.id);

                    files.forEach((file, index) => {
                        formData.append('additional_images[]', file);
                    });

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            if (result.uploaded_images) {
                                this.productForm.additionalImages.push(...result.uploaded_images);
                            }
                            if (result.uploaded_videos) {
                                if (!this.productForm.additionalVideos) {
                                    this.productForm.additionalVideos = [];
                                }
                                this.productForm.additionalVideos.push(...result.uploaded_videos);
                            }

                            const productIndex = this.products.findIndex(p => p.id === this.editingProduct.id);
                            if (productIndex !== -1) {
                                if (result.uploaded_images) {
                                    this.products[productIndex].additional_images = this.products[productIndex].additional_images ? [...this.products[productIndex].additional_images, ...result.uploaded_images] : result.uploaded_images;
                                }
                                if (result.uploaded_videos) {
                                    this.products[productIndex].additional_videos = this.products[productIndex].additional_videos ? [...this.products[productIndex].additional_videos, ...result.uploaded_videos] : result.uploaded_videos;
                                }
                            }

                            console.log('Additional images and videos uploaded successfully');
                        } else {
                            alert('Ошибка загрузки: ' + (result.error || 'Неизвестная ошибка'));
                        }
                    } else {
                        const errorData = await response.json();
                        alert('Ошибка загрузки: ' + (errorData.error || 'Неизвестная ошибка'));
                    }
                } catch (error) {
                    console.error('Error uploading additional images:', error);
                    alert('Ошибка при загрузке изображений');
                }

                this.$refs.additionalImagesInput.value = '';
            },
            async removeAdditionalImage(index) {
                if (confirm('Вы уверены, что хотите удалить это изображение?')) {
                    const imagePath = this.productForm.additionalImages[index];

                    try {
                        const response = await fetch(`../api.php?action=get_image_id&product_id=${this.editingProduct.id}&image_path=${encodeURIComponent(imagePath)}`, { credentials: 'same-origin' });
                        if (response.ok) {
                            const result = await response.json();
                            if (result.image_id) {
                                const formData = new FormData();
                                formData.append('action', 'delete_product_image');
                                formData.append('image_id', result.image_id);

                                const deleteResponse = await fetch('../api.php', {
                                    method: 'POST',
                                    body: formData,
                                    credentials: 'same-origin'
                                });

                                if (deleteResponse.ok) {
                                    this.productForm.additionalImages.splice(index, 1);

                                    const productIndex = this.products.findIndex(p => p.id === this.editingProduct.id);
                                    if (productIndex !== -1) {
                                        this.products[productIndex].additional_images = [...this.productForm.additionalImages];
                                    }

                                    console.log('Additional image deleted successfully');
                                } else {
                                    alert('Ошибка удаления изображения');
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error deleting additional image:', error);
                        alert('Ошибка при удалении изображения');
                    }
                }
            },
            async removeAdditionalVideo(index) {
                if (confirm('Вы уверены, что хотите удалить это видео?')) {
                    const videoPath = this.productForm.additionalVideos[index];

                    try {
                        const response = await fetch(`../api.php?action=get_image_id&product_id=${this.editingProduct.id}&image_path=${encodeURIComponent(videoPath)}`, { credentials: 'same-origin' });
                        if (response.ok) {
                            const result = await response.json();
                            if (result.image_id) {
                                const formData = new FormData();
                                formData.append('action', 'delete_product_image');
                                formData.append('image_id', result.image_id);

                                const deleteResponse = await fetch('../api.php', {
                                    method: 'POST',
                                    body: formData,
                                    credentials: 'same-origin'
                                });

                                if (deleteResponse.ok) {
                                    this.productForm.additionalVideos.splice(index, 1);

                                    const productIndex = this.products.findIndex(p => p.id === this.editingProduct.id);
                                    if (productIndex !== -1) {
                                        this.products[productIndex].additional_videos = [...this.productForm.additionalVideos];
                                    }

                                    console.log('Additional video deleted successfully');
                                } else {
                                    alert('Ошибка удаления видео');
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error deleting additional video:', error);
                        alert('Ошибка при удалении видео');
                    }
                }
            },
            addContentItem(section) {
                if (section === 'features') {
                    this.featuresContent.push({
                        title: '',
                        content: '',
                        sort_order: this.featuresContent.length
                    });
                } else if (section === 'history') {
                    this.historyContent.push({
                        year: '',
                        title: '',
                        content: '',
                        sort_order: this.historyContent.length
                    });
                }
            },
            removeContentItem(section, index) {
                if (section === 'features') {
                    this.featuresContent.splice(index, 1);
                    this.featuresContent.forEach((item, i) => {
                        item.sort_order = i;
                    });
                } else if (section === 'history') {
                    this.historyContent.splice(index, 1);
                    this.historyContent.forEach((item, i) => {
                        item.sort_order = i;
                    });
                }
            },
            async saveContent() {
                this.contentLoading = true;
                this.contentError = '';
                this.contentSuccess = '';

                try {
                    const contentData = [];
                    this.featuresContent.forEach((item, index) => {
                        contentData.push({
                            section: 'features',
                            title: item.title,
                            content: item.content,
                            sort_order: index
                        });
                    });

                    this.historyContent.forEach((item, index) => {
                        contentData.push({
                            section: 'history',
                            title: item.year,
                            content: `${item.title}\n${item.content}`,
                            sort_order: index
                        });
                    });

                    const formData = new FormData();
                    formData.append('action', 'save_home_content');
                    formData.append('content', JSON.stringify(contentData));

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        this.contentSuccess = 'Контент успешно сохранен';
                        setTimeout(() => {
                            this.closeContentModal();
                        }, 1500);
                    } else {
                        const errorData = await response.json();
                        this.contentError = errorData.error || 'Ошибка сохранения контента';
                    }
                } catch (error) {
                    console.error('Error saving content:', error);
                    this.contentError = 'Ошибка сохранения контента';
                }

                this.contentLoading = false;
            },
            async loadPageBlocks() {
                try {
                    const response = await fetch('../api.php?action=page_blocks', { credentials: 'same-origin' });
                    if (response.ok) {
                        const blocks = await response.json();
                        const regularBlocks = blocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                        const infoButtonsBlocks = blocks.filter(b => b.type === 'info_buttons');
                        const footerBlocks = blocks.filter(b => b.type === 'footer');

                        let sorted = [...regularBlocks];

                        if (infoButtonsBlocks.length > 0) {
                            const infoButtons = infoButtonsBlocks.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
                            infoButtons.sort_order = regularBlocks.length;
                            sorted.push(infoButtons);
                        }

                        if (footerBlocks.length > 0) {
                            const footer = footerBlocks.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
                            footer.sort_order = sorted.length;
                            sorted.push(footer);
                        }

                        this.pageBlocks = sorted;
                        await this.ensureInfoButtonsBlock();
                        await this.ensureFooterBlock();
                        this.originalBlocksOrder = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons').map(block => block.id);
                        this.hasUnsavedChanges = false;
                    } else {
                        this.pageBlocks = [];
                        await this.ensureInfoButtonsBlock();
                        await this.ensureFooterBlock();
                        this.originalBlocksOrder = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons').map(block => block.id);
                        this.hasUnsavedChanges = false;
                    }
                } catch (error) {
                    console.error('Error loading page blocks:', error);
                    this.pageBlocks = [];
                    await this.ensureInfoButtonsBlock();
                    await this.ensureFooterBlock();
                    this.originalBlocksOrder = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons').map(block => block.id);
                    this.hasUnsavedChanges = false;
                }
            },
            async ensureFooterBlock() {
                const footerBlock = this.pageBlocks.find(b => b.type === 'footer');

                if (!footerBlock) {
                    try {
                        const formData = new FormData();
                        formData.append('action', 'add_page_block');
                        formData.append('type', 'footer');
                        formData.append('title', 'Футер');
                        formData.append('content', '');
                        formData.append('settings', JSON.stringify({}));

                        const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer');
                        formData.append('sort_order', regularBlocks.length);
                        formData.append('is_active', '1');

                        const response = await fetch('../api.php', {
                            method: 'POST',
                            body: formData,
                            credentials: 'same-origin'
                        });

                        if (response.ok) {
                            const result = await response.json();
                            const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');
                            const infoButtonsBlock = this.pageBlocks.find(b => b.type === 'info_buttons');
                            this.pageBlocks.push({
                                id: result.id,
                                type: 'footer',
                                title: 'Футер',
                                content: '',
                                settings: {},
                                sort_order: regularBlocks.length + (infoButtonsBlock ? 1 : 0),
                                is_active: true
                            });
                        }
                    } catch (error) {
                        console.error('Error creating footer block:', error);
                    }
                } else {

                    const footerIndex = this.pageBlocks.findIndex(b => b.type === 'footer');
                    const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');
                    const infoButtonsBlock = this.pageBlocks.find(b => b.type === 'info_buttons');
                    if (footerIndex !== -1 && footerIndex !== this.pageBlocks.length - 1) {
                        const footer = this.pageBlocks.splice(footerIndex, 1)[0];
                        footer.sort_order = regularBlocks.length + (infoButtonsBlock ? 1 : 0);
                        this.pageBlocks.push(footer);
                    } else if (footerIndex !== -1) {
                        const footer = this.pageBlocks[footerIndex];
                        footer.sort_order = regularBlocks.length + (infoButtonsBlock ? 1 : 0);
                    }
                }
            },
            async ensureInfoButtonsBlock() {
                const infoButtonsBlock = this.pageBlocks.find(b => b.type === 'info_buttons');

                if (!infoButtonsBlock) {
                    try {
                        const formData = new FormData();
                        formData.append('action', 'add_page_block');
                        formData.append('type', 'info_buttons');
                        formData.append('title', 'Информационные кнопки');
                        formData.append('content', '');
                        formData.append('settings', JSON.stringify({
                            sectionTitle: '',
                            buttons: [
                                { text: '', linkType: 'page', link: '', style: 'primary' }
                            ]
                        }));

                        const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');
                        const footerBlock = this.pageBlocks.find(b => b.type === 'footer');
                        const sortOrder = footerBlock ? this.pageBlocks.length - 1 : regularBlocks.length;
                        formData.append('sort_order', sortOrder);
                        formData.append('is_active', '1');

                        const response = await fetch('../api.php', {
                            method: 'POST',
                            body: formData,
                            credentials: 'same-origin'
                        });

                        if (response.ok) {
                            const result = await response.json();
                            const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');
                            const footerBlock = this.pageBlocks.find(b => b.type === 'footer');
                            const sortOrder = footerBlock ? this.pageBlocks.length - 1 : regularBlocks.length;
                            const newBlock = {
                                id: result.id,
                                type: 'info_buttons',
                                title: 'Информационные кнопки',
                                content: '',
                                settings: {
                                    sectionTitle: '',
                                    buttons: [
                                        { text: '', linkType: 'page', link: '', style: 'primary' }
                                    ]
                                },
                                sort_order: sortOrder,
                                is_active: true
                            };

                            if (footerBlock) {
                                const footerIndex = this.pageBlocks.findIndex(b => b.type === 'footer');
                                this.pageBlocks.splice(footerIndex, 0, newBlock);
                            } else {
                                this.pageBlocks.push(newBlock);
                            }
                        }
                    } catch (error) {
                        console.error('Error creating info buttons block:', error);
                    }
                } else {
                    const infoButtonsIndex = this.pageBlocks.findIndex(b => b.type === 'info_buttons');
                    const footerIndex = this.pageBlocks.findIndex(b => b.type === 'footer');
                    const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');

                    if (footerIndex !== -1 && infoButtonsIndex !== footerIndex - 1) {
                        const infoButtons = this.pageBlocks.splice(infoButtonsIndex, 1)[0];
                        const newIndex = footerIndex !== -1 ? footerIndex : this.pageBlocks.length;
                        this.pageBlocks.splice(newIndex, 0, infoButtons);
                        infoButtons.sort_order = regularBlocks.length;
                    } else if (infoButtonsIndex !== -1) {
                        const infoButtons = this.pageBlocks[infoButtonsIndex];
                        const footerIndex = this.pageBlocks.findIndex(b => b.type === 'footer');
                        infoButtons.sort_order = footerIndex !== -1 ? footerIndex - 1 : regularBlocks.length;
                    }
                }
            },
            isFooterBlock(block) {
                return block.type === 'footer';
            },
            isInfoButtonsBlock(block) {
                return block.type === 'info_buttons';
            },
            editBlock(block) {
                if (this.minimizedModals['blockModal']) {
                    this.restoreModal('blockModal');
                }
                this.editingBlock = block;
                this.blockForm = {
                    type: block.type,
                    title: block.title,
                    content: block.content,
                    settings: { ...block.settings },
                    sort_order: block.sort_order,
                    is_active: block.is_active
                };
                this.$nextTick(() => {
                    this.applyModalSize('blockModal');
                });

                if ((block.type === 'buttons' || block.type === 'info_buttons') && (!this.blockForm.settings.buttons || !Array.isArray(this.blockForm.settings.buttons))) {
                    this.blockForm.settings.buttons = [{ text: '', linkType: 'page', link: '', style: 'primary' }];
                }

                if (block.type === 'actual' && (!this.blockForm.settings.promotions || !Array.isArray(this.blockForm.settings.promotions))) {
                    this.blockForm.settings.promotions = [{ title: '', description: '', image: '', links: [], linkType: 'url', link: '', linkText: '' }];
                }
                if (block.type === 'actual' && this.blockForm.settings.promotions) {
                    this.blockForm.settings.promotions.forEach(p => {
                        if (!Array.isArray(p.links)) {
                            p.links = (p.links && typeof p.links === 'object') ? Object.values(p.links) : [];
                        }
                    });
                }

                if (block.type === 'contact' && (!this.blockForm.settings.socialLinks || typeof this.blockForm.settings.socialLinks !== 'object')) {
                    this.blockForm.settings.socialLinks = {
                        telegram: '',
                        instagram: '',
                        tiktok: ''
                    };
                }

                if ((block.type === 'buttons' || block.type === 'info_buttons' || block.type === 'actual') && this.pages.length === 0) {
                    this.loadPages().then(() => null);
                }
            },
            onBlockTypeChange() {
                this.blockForm.settings = {};

                switch (this.blockForm.type) {
                    case 'hero':
                        this.blockForm.settings = {
                            sectionTitle: '',
                            mainTitle: '',
                            subtitle: '',
                            description: '',
                            backgroundImage: '',
                            backgroundPosition: 'center',
                            backgroundSize: 'cover'
                        };
                        break;
                    case 'features':
                        this.blockForm.settings = {
                            sectionTitle: '',
                            features: [
                                { icon: 'fas fa-gem', title: '', description: '' }
                            ]
                        };
                        break;
                    case 'history':
                        this.blockForm.settings = {
                            sectionTitle: '',
                            events: [
                                { year: '', title: '', description: '' }
                            ]
                        };
                        break;
                    case 'stats':
                        this.blockForm.settings = {
                            sectionTitle: '',
                            stats: [
                                { number: '', label: '' }
                            ]
                        };
                        break;
                    case 'products':
                        this.blockForm.settings = {
                            sectionTitle: 'Наша коллекция'
                        };
                        break;
                    case 'buttons':
                        this.blockForm.settings = {
                            sectionTitle: '',
                            buttons: [
                                { text: '', linkType: 'page', link: '', style: 'primary' }
                            ]
                        };
                        break;
                    case 'actual':
                        this.blockForm.settings = {
                            sectionTitle: 'Акции и спецпредложения',
                            promotions: [
                                { title: '', description: '', image: '', links: [{ name: '', link: '', title: '', description: '' }] }
                            ]
                        };
                        break;
                    case 'contact':
                        this.blockForm.settings = {
                            sectionTitle: 'Свяжитесь с нами',
                            email: '',
                            phone: '',
                            address: '',
                            socialLinks: {
                                telegram: '',
                                instagram: '',
                                tiktok: ''
                            }
                        };
                        break;
                    case 'info_buttons':
                        this.blockForm.settings = {
                            sectionTitle: '',
                            buttons: [
                                { text: '', linkType: 'page', link: '', style: 'primary' }
                            ]
                        };
                        break;
                    case 'footer':
                        this.blockForm.settings = {};
                        if (!this.blockForm.content) {
                            this.blockForm.content = '©';
                        }
                        break;
                    default:
                        this.blockForm.settings = { sectionTitle: '' };
                }
            },
            addFeature() {
                this.blockForm.settings.features.push({
                    icon: 'fas fa-check',
                    title: '',
                    description: ''
                });
            },
            removeFeature(index) {
                this.blockForm.settings.features.splice(index, 1);
            },
            addHistoryEvent() {
                this.blockForm.settings.events.push({
                    year: '',
                    title: '',
                    description: ''
                });
            },
            removeHistoryEvent(index) {
                this.blockForm.settings.events.splice(index, 1);
            },
            addStat() {
                this.blockForm.settings.stats.push({
                    number: '',
                    label: ''
                });
            },
            removeStat(index) {
                this.blockForm.settings.stats.splice(index, 1);
            },
            addButton() {
                if (!this.blockForm.settings.buttons) {
                    this.blockForm.settings.buttons = [];
                }
                this.blockForm.settings.buttons.push({
                    text: '',
                    linkType: 'page',
                    link: '',
                    style: 'primary'
                });
            },
            removeButton(index) {
                this.blockForm.settings.buttons.splice(index, 1);
            },
            addPromotion() {
                if (!this.blockForm.settings.promotions) {
                    this.blockForm.settings.promotions = [];
                }
                this.blockForm.settings.promotions.push({
                    title: '',
                    description: '',
                    image: '',
                    links: [],
                    linkType: 'url',
                    link: '',
                    linkText: ''
                });
            },
            removePromotion(index) {
                this.blockForm.settings.promotions.splice(index, 1);
            },
            prepareBlockSettingsForSave(type, settings) {
                const s = JSON.parse(JSON.stringify(settings || {}));
                if (type === 'actual' && Array.isArray(s.promotions)) {
                    s.promotions.forEach(p => {
                        const links = Array.isArray(p.links) ? p.links : (p.links && typeof p.links === 'object' ? Object.values(p.links) : []);
                        p.links = links.map(link => ({
                            ...link,
                            name: link.name || '',
                            link: link.link || '',
                            title: link.title || '',
                            description: link.description ?? ''
                        }));
                    });
                }
                return s;
            },
            async saveBlock() {
                this.blockLoading = true;
                this.blockError = '';
                this.blockSuccess = '';

                try {

                    if (!this.editingBlock && this.blockForm.type !== 'footer' && this.blockForm.type !== 'info_buttons') {
                        const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');
                        this.blockForm.sort_order = regularBlocks.length;
                    }

                    if (this.blockForm.type === 'footer') {
                        const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');
                        const infoButtonsBlock = this.pageBlocks.find(b => b.type === 'info_buttons');
                        this.blockForm.sort_order = infoButtonsBlock ? regularBlocks.length + 1 : regularBlocks.length;
                    }

                    if (this.blockForm.type === 'info_buttons') {
                        const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');
                        this.blockForm.sort_order = regularBlocks.length;
                    }

                    const formData = new FormData();

                    if (this.editingBlock) {
                        formData.append('action', 'update_page_block');
                        formData.append('id', this.editingBlock.id);
                    } else {
                        formData.append('action', 'add_page_block');
                    }

                    formData.append('type', this.blockForm.type);
                    formData.append('title', this.blockForm.title);
                    formData.append('content', this.blockForm.content);
                    const settingsToSave = this.prepareBlockSettingsForSave(this.blockForm.type, this.blockForm.settings);
                    formData.append('settings', JSON.stringify(settingsToSave));
                    formData.append('sort_order', this.blockForm.sort_order);
                    formData.append('is_active', this.blockForm.is_active ? '1' : '0');

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        if (this.editingBlock) {
                            const index = this.pageBlocks.findIndex(b => b.id === this.editingBlock.id);

                            if (index !== -1) {
                                this.pageBlocks[index] = {
                                    ...this.pageBlocks[index],
                                    type: this.blockForm.type,
                                    title: this.blockForm.title,
                                    content: this.blockForm.content,
                                    settings: settingsToSave,
                                    sort_order: this.blockForm.sort_order,
                                    is_active: this.blockForm.is_active
                                };
                            }
                        } else {
                            const result = await response.json();
                            const newBlock = {
                                id: result.id,
                                type: this.blockForm.type,
                                title: this.blockForm.title,
                                content: this.blockForm.content,
                                settings: settingsToSave,
                                sort_order: this.blockForm.sort_order,
                                is_active: this.blockForm.is_active
                            };

                            if (this.blockForm.type === 'footer') {
                                this.pageBlocks.push(newBlock);
                            } else if (this.blockForm.type === 'info_buttons') {
                                const footerIndex = this.pageBlocks.findIndex(b => b.type === 'footer');
                                if (footerIndex !== -1) {
                                    this.pageBlocks.splice(footerIndex, 0, newBlock);
                                    this.pageBlocks[footerIndex + 1].sort_order = this.pageBlocks.length - 1;
                                } else {
                                    this.pageBlocks.push(newBlock);
                                }
                            } else {
                                const footerIndex = this.pageBlocks.findIndex(b => b.type === 'footer');
                                const infoButtonsIndex = this.pageBlocks.findIndex(b => b.type === 'info_buttons');
                                const insertIndex = footerIndex !== -1 ? (infoButtonsIndex !== -1 && infoButtonsIndex < footerIndex ? infoButtonsIndex : footerIndex) : (infoButtonsIndex !== -1 ? infoButtonsIndex : this.pageBlocks.length);

                                if (insertIndex !== this.pageBlocks.length) {
                                    this.pageBlocks.splice(insertIndex, 0, newBlock);
                                    if (footerIndex !== -1 && insertIndex <= footerIndex) {
                                        this.pageBlocks[footerIndex + 1].sort_order = this.pageBlocks.length - 1;
                                    }
                                } else {
                                    this.pageBlocks.push(newBlock);
                                }
                            }
                        }

                        await this.ensureInfoButtonsBlock();
                        await this.ensureFooterBlock();

                        const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');
                        const infoButtonsBlock = this.pageBlocks.find(b => b.type === 'info_buttons');
                        const footerBlock = this.pageBlocks.find(b => b.type === 'footer');
                        this.pageBlocks = [...regularBlocks];

                        if (infoButtonsBlock) {
                            infoButtonsBlock.sort_order = regularBlocks.length;
                            this.pageBlocks.push(infoButtonsBlock);
                        }

                        if (footerBlock) {
                            footerBlock.sort_order = this.pageBlocks.length;
                            this.pageBlocks.push(footerBlock);
                        }

                        this.blockSuccess = 'Блок успешно сохранен';
                        setTimeout(() => {
                            this.closeBlockModal();
                        }, 1500);
                    } else {
                        const errorData = await response.json();
                        this.blockError = errorData.error || 'Ошибка сохранения блока';
                    }
                } catch (error) {
                    console.error('Error saving block:', error);
                    this.blockError = 'Ошибка сохранения блока';
                }

                this.blockLoading = false;
            },
            async deleteBlock(blockId) {
                const block = this.pageBlocks.find(b => b.id === blockId);
                if (block && block.type === 'footer') {
                    alert('Блок "Футер" нельзя удалить');
                    return;
                }
                if (block && block.type === 'info_buttons') {
                    alert('Блок "Информационные кнопки" нельзя удалить');
                    return;
                }

                if (confirm('Вы уверены, что хотите удалить этот блок?')) {
                    try {
                        const formData = new FormData();
                        formData.append('action', 'delete_page_block');
                        formData.append('id', blockId);

                        const response = await fetch('../api.php', {
                            method: 'POST',
                            body: formData,
                            credentials: 'same-origin'
                        });

                        if (response.ok) {
                            this.pageBlocks = this.pageBlocks.filter(b => b.id !== blockId);
                            await this.ensureInfoButtonsBlock();
                            await this.ensureFooterBlock();
                        } else {
                            const errorData = await response.json();
                            console.error('Failed to delete block:', errorData.error || 'Unknown error');
                            alert('Ошибка при удалении блока');
                        }
                    } catch (error) {
                        console.error('Error deleting block:', error);
                        alert('Ошибка при удалении блока');
                    }
                }
            },
            async toggleBlockActive(block) {
                try {
                    const formData = new FormData();
                    formData.append('action', 'update_page_block');
                    formData.append('id', block.id);
                    formData.append('type', block.type);
                    formData.append('title', block.title);
                    formData.append('content', block.content);
                    formData.append('settings', JSON.stringify(block.settings));
                    formData.append('sort_order', block.sort_order);
                    formData.append('is_active', block.is_active ? '0' : '1');

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        block.is_active = !block.is_active;
                    } else {
                        alert('Ошибка при изменении статуса блока');
                    }
                } catch (error) {
                    console.error('Error toggling block active:', error);
                    alert('Ошибка при изменении статуса блока');
                }
            },
            getBlockTypeName(type) {
                const typeNames = {
                    'hero': 'Hero секция',
                    'features': 'Преимущества',
                    'products': 'Товары',
                    'history': 'История',
                    'stats': 'Статистика',
                    'testimonials': 'Отзывы',
                    'contact': 'Контакты',
                    'text': 'Текстовый блок',
                    'buttons': 'Кнопки со ссылками',
                    'actual': 'Актуальное / Акции',
                    'image': 'Изображение',
                    'footer': 'Футер',
                    'info_buttons': 'Информационные кнопки'
                };
                return typeNames[type] || type;
            },
            getBlockPreview(block) {
                switch (block.type) {
                    case 'hero':
                        return `<div class="preview-hero">
                        <h3>${block.settings.mainTitle || 'Заголовок'}</h3>
                        <p>${block.settings.subtitle || 'Подзаголовок'}</p>
                    </div>`;
                    case 'features':
                        const featuresCount = block.settings.features ? block.settings.features.length : 0;
                        return `<div class="preview-features">
                        <h4>${block.settings.sectionTitle || 'Преимущества'}</h4>
                        <p>${featuresCount} преимуществ</p>
                    </div>`;
                    case 'history':
                        const eventsCount = block.settings.events ? block.settings.events.length : 0;
                        return `<div class="preview-history">
                        <h4>${block.settings.sectionTitle || 'История'}</h4>
                        <p>${eventsCount} событий</p>
                    </div>`;
                    case 'stats':
                        const statsCount = block.settings.stats ? block.settings.stats.length : 0;
                        return `<div class="preview-stats">
                        <h4>${block.settings.sectionTitle || 'Статистика'}</h4>
                        <p>${statsCount} показателей</p>
                    </div>`;
                    case 'text':
                        return `<div class="preview-text">
                        <h4>Текстовый блок</h4>
                        <p>${block.content.substring(0, 100)}${block.content.length > 100 ? '...' : ''}</p>
                    </div>`;
                    case 'footer':
                        return `<div class="preview-footer">
                        <h4>Футер</h4>
                        <p>${block.content.substring(0, 100)}${block.content.length > 100 ? '...' : ''}</p>
                    </div>`;
                    case 'info_buttons':
                        const infoButtonsCount = block.settings && block.settings.buttons ? block.settings.buttons.length : 0;
                        return `<div class="preview-info-buttons">
                        <h4>${block.settings && block.settings.sectionTitle ? block.settings.sectionTitle : 'Информационные кнопки'}</h4>
                        <p>${infoButtonsCount} кнопок</p>
                    </div>`;
                    case 'products':
                        return `<div class="preview-products">
                        <h4>Секция товаров</h4>
                        <p>${block.settings.sectionTitle || 'Наша коллекция'}</p>
                        <p>Отображает все товары из базы данных</p>
                    </div>`;
                    case 'contact':
                        return `<div class="preview-contact">
                        <h4>Контакты</h4>
                        <p>${block.settings.sectionTitle || 'Свяжитесь с нами'}</p>
                        <p>Email: ${block.settings.email || 'Не указан'}</p>
                        <p>Телефон: ${block.settings.phone || 'Не указан'}</p>
                    </div>`;
                    case 'buttons':
                        const buttonsCount = block.settings.buttons ? block.settings.buttons.length : 0;
                        return `<div class="preview-buttons">
                        <h4>Кнопки со ссылками</h4>
                        <p>${block.settings.sectionTitle || 'Блок кнопок'}</p>
                        <p>Количество кнопок: ${buttonsCount}</p>
                    </div>`;
                    case 'actual':
                        const promotionsCount = block.settings.promotions ? block.settings.promotions.length : 0;
                        return `<div class="preview-actual">
                        <h4>${block.settings.sectionTitle || 'Акции и спецпредложения'}</h4>
                        <p>Акций: ${promotionsCount}</p>
                    </div>`;
                    default:
                        return `<div class="preview-default">
                        <h4>${this.getBlockTypeName(block.type)}</h4>
                        <p>${block.title || 'Без названия'}</p>
                    </div>`;
                }
            },
            selectIcon(icon) {
                this.selectedIconClass = icon.class;
            },
            confirmIconSelection() {
                if (this.currentIconTarget && this.selectedIconClass) {
                    this.currentIconTarget.target[this.currentIconTarget.property] = this.selectedIconClass;
                }
                this.closeIconPicker();
            },
            updateFilteredIcons() {
                if (!this.availableIcons) {
                    this.filteredIcons = [];
                    return;
                }

                let icons = this.availableIcons;

                if (this.selectedIconCategory !== 'all') {
                    icons = icons.filter(icon => icon.category === this.selectedIconCategory);
                }

                if (this.iconSearchQuery) {
                    const query = this.iconSearchQuery.toLowerCase();
                    icons = icons.filter(icon =>
                        icon.name.toLowerCase().includes(query) ||
                        icon.class.toLowerCase().includes(query)
                    );
                }

                this.filteredIcons = icons;
            },
            async handleBackgroundImageUpload(event) {
                const file = event.target.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    alert('Размер файла не должен превышать 5MB');
                    return;
                }

                const formData = new FormData();
                formData.append('image', file);
                formData.append('action', 'upload_background_image');

                try {
                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        this.blockForm.settings.backgroundImage = result.url;
                    } else {
                        const errorData = await response.json();
                        alert('Ошибка загрузки изображения: ' + (errorData.error || 'Неизвестная ошибка'));
                    }
                } catch (error) {
                    console.error('Error uploading background image:', error);
                    alert('Ошибка загрузки изображения');
                }
            },
            removeBackgroundImage() {
                this.blockForm.settings.backgroundImage = '';
            },
            async handlePromotionImageUpload(event, index) {
                const file = event.target.files[0];
                if (!file || index === undefined || index === null) return;

                if (file.size > 5 * 1024 * 1024) {
                    alert('Размер файла не должен превышать 5MB');
                    return;
                }

                const formData = new FormData();
                formData.append('image', file);
                formData.append('action', 'upload_background_image');

                try {
                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (this.blockForm.settings.promotions && this.blockForm.settings.promotions[index]) {
                            this.blockForm.settings.promotions[index].image = result.url;
                        }
                    } else {
                        const errorData = await response.json();
                        alert('Ошибка загрузки изображения: ' + (errorData.error || 'Неизвестная ошибка'));
                    }
                } catch (error) {
                    console.error('Error uploading promotion image:', error);
                    alert('Ошибка загрузки изображения');
                }
                event.target.value = '';
            },
            removePromotionImage(index) {
                if (this.blockForm.settings.promotions && this.blockForm.settings.promotions[index]) {
                    this.blockForm.settings.promotions[index].image = '';
                }
            },
            addLink(promoIndex) {
                if (!this.blockForm.settings.promotions?.[promoIndex]) return;
                const promo = this.blockForm.settings.promotions[promoIndex];
                if (!Array.isArray(promo.links)) {
                    promo.links = (promo.links && typeof promo.links === 'object') ? Object.values(promo.links) : [];
                }
                promo.links.push({
                    name: '',
                    link: '',
                    title: '',
                    description: ''
                });
            },
            getPromoLinkProductId(link) {
                if (!link) return '';
                if (link.data?.id) return link.data.id;
                const m = String(link.link || '').match(/[?&]id=(\d+)/);
                return m ? m[1] : '';
            },
            onPromoLinkProductChange(event, promoIndex, linkIndex) {
                const productId = event.target.value;
                const products = this.getProductsObject();
                const product = products[productId];
                if (!this.blockForm.settings.promotions?.[promoIndex]?.links) return;
                const link = this.blockForm.settings.promotions[promoIndex].links[linkIndex];
                const keepTitle = link?.title || '';
                const keepDescription = link?.description || '';
                if (product) {
                    this.blockForm.settings.promotions[promoIndex].links[linkIndex] = {
                        name: product.name,
                        link: this.origin + '/product/?id=' + product.id,
                        title: keepTitle,
                        description: keepDescription,
                        data: product
                    };
                } else {
                    this.blockForm.settings.promotions[promoIndex].links[linkIndex] = {
                        name: '',
                        link: '',
                        title: keepTitle,
                        description: keepDescription
                    };
                }
            },
            removeLink(promoIndex, linkIndex) {
                if (!this.blockForm.settings.promotions?.[promoIndex]?.links) return;
                this.blockForm.settings.promotions[promoIndex].links.splice(linkIndex, 1);
            },
            startDrag(block, event) {
                this.draggingBlockId = block.id;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/html', event.target.outerHTML);
            },
            endDrag() {
                this.draggingBlockId = null;
                this.draggedOverBlockId = null;
            },
            dropBlock(targetBlock, event) {
                event.preventDefault();

                if (this.draggingBlockId === targetBlock.id) {
                    return;
                }

                const draggedBlock = this.pageBlocks.find(b => b.id === this.draggingBlockId);
                const targetBlockObj = this.pageBlocks.find(b => b.id === targetBlock.id);

                if (!draggedBlock || !targetBlockObj) {
                    return;
                }

                if (draggedBlock.type === 'footer' || draggedBlock.type === 'info_buttons') {
                    return;
                }

                if (targetBlockObj.type === 'footer' || targetBlockObj.type === 'info_buttons') {
                    return;
                }

                const targetIndex = this.pageBlocks.findIndex(b => b.id === targetBlock.id);
                const draggedIndex = this.pageBlocks.findIndex(b => b.id === this.draggingBlockId);

                if (targetIndex === -1 || draggedIndex === -1) {
                    return;
                }

                const footerIndex = this.pageBlocks.findIndex(b => b.type === 'footer');
                const infoButtonsIndex = this.pageBlocks.findIndex(b => b.type === 'info_buttons');
                const lastFixedIndex = Math.max(footerIndex !== -1 ? footerIndex : -1, infoButtonsIndex !== -1 ? infoButtonsIndex : -1);

                if (lastFixedIndex !== -1 && targetIndex >= lastFixedIndex) {
                    return;
                }

                const targetBlockId = targetBlock.id;
                const [removedBlock] = this.pageBlocks.splice(draggedIndex, 1);
                const newTargetIndex = this.pageBlocks.findIndex(b => b.id === targetBlockId);

                if (newTargetIndex === -1) {
                    const footerIndex = this.pageBlocks.findIndex(b => b.type === 'footer');
                    const infoButtonsIndex = this.pageBlocks.findIndex(b => b.type === 'info_buttons');
                    const insertIndex = footerIndex !== -1 ? (infoButtonsIndex !== -1 && infoButtonsIndex < footerIndex ? infoButtonsIndex : footerIndex) : (infoButtonsIndex !== -1 ? infoButtonsIndex : this.pageBlocks.length);
                    this.pageBlocks.splice(insertIndex, 0, removedBlock);
                } else {
                    this.pageBlocks.splice(newTargetIndex, 0, removedBlock);
                }

                const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');
                regularBlocks.forEach((block, index) => {
                    block.sort_order = index;
                });

                this.ensureInfoButtonsBlock().then(() => {
                    this.ensureFooterBlock().then(() => {
                        this.checkForChanges();
                    });
                });
            },
            checkForChanges() {
                const currentOrder = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons').map(block => block.id);
                const originalOrder = this.originalBlocksOrder || [];
                this.hasUnsavedChanges = JSON.stringify(currentOrder) !== JSON.stringify(originalOrder);
            },
            async saveBlocksOrder() {
                if (!this.hasUnsavedChanges) {
                    return;
                }

                await this.ensureInfoButtonsBlock();
                await this.ensureFooterBlock();

                const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons');
                const infoButtonsBlock = this.pageBlocks.find(b => b.type === 'info_buttons');
                const footerBlock = this.pageBlocks.find(b => b.type === 'footer');

                const blocksOrder = regularBlocks.map((block, index) => ({
                    id: block.id,
                    sort_order: index
                }));

                if (infoButtonsBlock) {
                    blocksOrder.push({
                        id: infoButtonsBlock.id,
                        sort_order: regularBlocks.length
                    });
                }

                if (footerBlock) {
                    blocksOrder.push({
                        id: footerBlock.id,
                        sort_order: regularBlocks.length + (infoButtonsBlock ? 1 : 0)
                    });
                }

                try {
                    const formData = new FormData();
                    formData.append('action', 'save_blocks_order');
                    formData.append('blocks_order', JSON.stringify(blocksOrder));

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        regularBlocks.forEach((block, index) => {
                            block.sort_order = index;
                        });
                        if (infoButtonsBlock) {
                            infoButtonsBlock.sort_order = regularBlocks.length;
                        }
                        if (footerBlock) {
                            footerBlock.sort_order = regularBlocks.length + (infoButtonsBlock ? 1 : 0);
                        }
                        this.originalBlocksOrder = this.pageBlocks.map(block => block.id);
                        this.hasUnsavedChanges = false;
                        this.blockSuccess = 'Порядок блоков сохранен!';
                        setTimeout(() => {
                            this.blockSuccess = '';
                        }, 3000);
                    } else {
                        console.error('Failed to update blocks order');
                        this.blockError = 'Ошибка при сохранении порядка блоков';
                        setTimeout(() => {
                            this.blockError = '';
                        }, 3000);
                    }
                } catch (error) {
                    console.error('Error updating blocks order:', error);
                    this.blockError = 'Ошибка при сохранении порядка блоков';
                    setTimeout(() => {
                        this.blockError = '';
                    }, 3000);
                }
            },
            async loadOrders() {
                this.ordersLoading = true;
                this.ordersError = '';

                try {
                    const response = await fetch('../api.php?action=orders', { credentials: 'same-origin' });
                    if (response.ok) {
                        this.orders = await response.json();
                    } else {
                        this.ordersError = 'Ошибка загрузки заказов';
                    }
                } catch (error) {
                    console.error('Error loading orders:', error);
                    this.ordersError = 'Ошибка загрузки заказов';
                }

                this.ordersLoading = false;
            },
            async loadUsers() {
                this.usersLoading = true;
                this.usersError = '';

                try {
                    const response = await fetch('../api.php?action=users', { credentials: 'same-origin' });
                    if (response.ok) {
                        this.users = await response.json();
                    } else {
                        this.usersError = 'Ошибка загрузки пользователей';
                    }
                } catch (error) {
                    console.error('Error loading users:', error);
                    this.usersError = 'Ошибка загрузки пользователей';
                }

                this.usersLoading = false;
            },
            async updateOrderStatus(orderId, newStatus) {
                try {
                    const formData = new FormData();
                    formData.append('action', 'update_order_status');
                    formData.append('order_id', orderId);
                    formData.append('status', newStatus);

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {

                            const order = this.orders.find(o => o.id === orderId);
                            if (order) {
                                order.status = newStatus;
                            }
                        } else {
                            alert('Ошибка обновления статуса: ' + (result.error || 'Неизвестная ошибка'));
                        }
                    } else {
                        alert('Ошибка обновления статуса');
                    }
                } catch (error) {
                    console.error('Error updating order status:', error);
                    alert('Ошибка обновления статуса');
                }
            },
            async updatePaymentStatus(orderId, paymentStatus) {
                try {
                    const formData = new FormData();
                    formData.append('action', 'update_payment_status');
                    formData.append('order_id', orderId);
                    formData.append('payment_status', paymentStatus);

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            const order = this.orders.find(o => o.id === orderId);
                            if (order) {
                                order.payment_status = paymentStatus;
                            }
                        } else {
                            alert('Ошибка обновления статуса оплаты: ' + (result.error || 'Неизвестная ошибка'));
                        }
                    } else {
                        alert('Ошибка обновления статуса оплаты');
                    }
                } catch (error) {
                    console.error('Error updating payment status:', error);
                    alert('Ошибка обновления статуса оплаты');
                }
            },
            getStatusClass(status) {
                const statusClasses = {
                    'pending': 'status-pending',
                    'confirmed': 'status-confirmed',
                    'processing': 'status-processing',
                    'shipped': 'status-shipped',
                    'delivered': 'status-delivered',
                    'cancelled': 'status-cancelled'
                };
                return statusClasses[status] || '';
            },
            getDeliveryTypeLabel(type) {
                return type === 'pickup' ? 'Самовывоз' : 'Доставка';
            },
            formatDate(dateString) {
                if (!dateString) return '-';
                const date = new Date(dateString);
                return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            },
            getUserName(userId) {
                if (!userId) return '-';
                const user = this.users.find(u => u.id === userId);
                return user ? user.username : `ID: ${userId}`;
            },
            isColumnVisible(columnName) {
                return this.productTableColumns[columnName] !== false;
            },
            toggleColumn(columnName) {
                this.productTableColumns[columnName] = !this.productTableColumns[columnName];
                this.saveColumnSettings();
            },
            saveColumnSettings() {
                try {
                    localStorage.setItem('productTableColumns', JSON.stringify(this.productTableColumns));
                } catch (e) {
                    console.error('Failed to save column settings:', e);
                }
            },
            loadColumnSettings() {
                try {
                    const saved = localStorage.getItem('productTableColumns');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        this.productTableColumns = { ...this.productTableColumns, ...parsed };
                    }
                } catch (e) {
                    console.error('Failed to load column settings:', e);
                }
            },
            toggleColumnSelector() {
                this.showColumnSelector = !this.showColumnSelector;
            },
            toggleProductsActionsSidebar() {
                this.showProductsActionsSidebar = !this.showProductsActionsSidebar;
            },
            closeProductsActionsSidebar() {
                this.showProductsActionsSidebar = false;
            },
            getVisibleColumnsCount() {
                return Object.values(this.productTableColumns).filter(v => v !== false).length + 2; // +2 for checkbox and actions
            },
            getColumnLabel(column) {
                const labels = {
                    id: 'ID',
                    image: 'Изображение',
                    name: 'Название',
                    description: 'Описание',
                    peculiarities: 'Особенности',
                    material: 'Материал',
                    price: 'Цена',
                    price_sale: 'Цена по скидке',
                    category: 'Категория',
                    user: 'Создал',
                    created: 'Дата добавления',
                    updated_by: 'Обновил',
                    updated_at: 'Последнее обновление'
                };
                return labels[column] || column;
            },
            formatPrice(price) {
                return new Intl.NumberFormat('ru-RU').format(price) + ' руб.';
            },
            closeAllMenus() {
                if (this.showContentModal) {
                    this.closeContentModal();
                } else if (this.showIconPicker) {
                    this.closeIconPicker();
                } else if (this.showAddProduct || this.editingProduct) {
                    this.closeModal();
                } else if (this.showAddBlockModal || this.editingBlock) {
                    this.closeBlockModal();
                } else if (this.showAddUser) {
                    this.closeUserModal();
                } else if (this.showAddPageModal || this.editingPage) {
                    this.closePageModal();
                }
            },
            changePage(page) {
                this.page = page;
                this.closeMobileMenu();

                const loader = document.getElementById('block_loader');
                if (loader) loader.style.display = 'flex';

                if (page === 'analytics') {
                    this.$nextTick(() => {
                        const analyticsComponent = this.$refs.analyticsView;
                        if (analyticsComponent && typeof analyticsComponent.loadAnalytics === 'function') {
                            analyticsComponent.loadAnalytics().then(() => null);
                        }
                    });
                }

                if (page === 'orders') {
                    this.$nextTick(() => {
                        const ordersComponent = this.$refs.ordersList;
                        if (ordersComponent && typeof ordersComponent.loadOrders === 'function') {
                            ordersComponent.loadOrders().then(() => null);
                        }
                    });
                }

                if (page === 'users') {
                    this.$nextTick(() => {
                        const usersComponent = this.$refs['users-list'];
                        if (usersComponent && typeof usersComponent.loadUsers === 'function') {
                            usersComponent.loadUsers().then(() => null);
                        } else {
                            this.loadUsers().then(() => null);
                        }
                    });
                }

                if (page === 'messages') {
                    this.selectedMessage = null;
                    const url = new URL(window.location.href);
                    url.searchParams.delete('id');
                    history.pushState({}, '', url.toString());
                    this.getMessages().then(r => null);
                }

                if (page === 'message') {
                    const urlParams = new URLSearchParams(window.location.search);
                    const messageId = urlParams.get('id');
                    if (messageId) {
                        if (this.messages && this.messages.length > 0) {
                            const message = this.messages.find(m => m.id == messageId);
                            if (message) {
                                this.selectedMessage = message;
                            }
                        } else {
                            this.getMessages().then(() => {
                                const message = this.messages.find(m => m.id == messageId);
                                if (message) {
                                    this.selectedMessage = message;
                                }
                            });
                        }
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', 'message');
                        url.searchParams.set('id', messageId);
                        history.pushState({}, '', url.toString());
                    } else if (this.selectedMessage) {
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', 'message');
                        url.searchParams.set('id', this.selectedMessage.id);
                        history.pushState({}, '', url.toString());
                    }
                }

                if (page === 'message-reply') {
                    const urlParams = new URLSearchParams(window.location.search);
                    const messageId = urlParams.get('id');
                    if (messageId) {
                        if (this.messages && this.messages.length > 0) {
                            const message = this.messages.find(m => m.id == messageId);
                            if (message) {
                                this.selectedMessage = message;
                            }
                        } else {
                            this.getMessages().then(() => {
                                const message = this.messages.find(m => m.id == messageId);
                                if (message) {
                                    this.selectedMessage = message;
                                }
                            });
                        }
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', 'message-reply');
                        url.searchParams.set('id', messageId);
                        history.pushState({}, '', url.toString());
                    } else if (this.selectedMessage) {
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', 'message-reply');
                        url.searchParams.set('id', this.selectedMessage.id);
                        history.pushState({}, '', url.toString());
                    }
                }

                const url = new URL(window.location.href);
                url.searchParams.set('page', page);
                if (page !== 'message' || !url.searchParams.get('id')) {
                    url.searchParams.delete('id');
                }
                history.pushState({}, '', url.toString());

                window.scrollTo(0, 0);
                document.body.style.overflow = 'hidden'

                setTimeout(() => {
                    const loader = document.getElementById('block_loader');

                    if (loader) {
                        document.body.style.overflow = 'auto'
                        loader.style.display = 'none';
                    }
                }, 800);
            },
            update() {
                this.getAllProducts().then(r => null);
            },
            async loadPages() {
                try {
                    const apiUrl = window.location.origin + '/api.php?action=pages';
                    const response = await fetch(apiUrl, { credentials: 'same-origin' });
                    if (response.ok) {
                        const pages = await response.json();
                        this.pages = pages.map(page => {
                            if (page.navigation_buttons && typeof page.navigation_buttons === 'string') {
                                try {
                                    page.navigation_buttons = JSON.parse(page.navigation_buttons);
                                } catch (e) {
                                    page.navigation_buttons = [];
                                }
                            } else if (!page.navigation_buttons) {
                                page.navigation_buttons = [];
                            }
                            return page;
                        });
                    } else {
                        this.pages = [];
                    }
                } catch (error) {
                    console.error('Error loading pages:', error);
                    this.pages = [];
                }
            },
            editPage(page) {
                if (!this.isMobileDevice()) {
                    if (this.minimizedModals['pageModal']) {
                        this.restoreModal('pageModal');
                    }
                    this.showAddPageModal = true;
                }

                this.editingPage = page;

                let navigationButtons = [];
                if (page.navigation_buttons) {
                    if (typeof page.navigation_buttons === 'string') {
                        try {
                            navigationButtons = JSON.parse(page.navigation_buttons);
                        } catch (e) {
                            navigationButtons = [];
                        }
                    } else if (Array.isArray(page.navigation_buttons)) {
                        navigationButtons = page.navigation_buttons;
                    }
                }

                this.pageForm = {
                    slug: page.slug || '',
                    title: page.title || '',
                    content: page.content || '',
                    meta_title: page.meta_title || '',
                    meta_description: page.meta_description || '',
                    is_published: page.is_published ? true : false,
                    is_main_page: page.is_main_page ? true : false,
                    navigation_buttons: navigationButtons
                };
                this.$nextTick(() => {
                    this.applyModalSize('pageModal');
                });
                this.viewMode = 'visual';
                this.selectedElement = null;
                this.draggingElement = null;

                this.pageElements = this.parseHTMLToElements(page.content || '');
                this.pageError = '';
                this.pageSuccess = '';
            },
            toggleViewMode() {
                if (this.viewMode === 'visual') {

                    this.pageForm.content = this.elementsToHTML();
                    this.viewMode = 'html';
                } else {

                    this.pageElements = this.parseHTMLToElements(this.pageForm.content || '');
                    this.selectedElement = null;
                    this.viewMode = 'visual';
                }
            },
            async savePage() {

                if (this.viewMode === 'visual') {
                    this.pageForm.content = this.elementsToHTML();
                }

                this.pageLoading = true;
                this.pageError = '';
                this.pageSuccess = '';

                try {
                    const formData = new FormData();

                    if (this.editingPage) {
                        formData.append('action', 'update_page');
                        formData.append('id', this.editingPage.id);
                    } else {
                        formData.append('action', 'add_page');
                    }

                    formData.append('slug', this.pageForm.slug.trim());
                    formData.append('title', this.pageForm.title.trim());
                    formData.append('content', this.pageForm.content);
                    formData.append('meta_title', this.pageForm.meta_title.trim());
                    formData.append('meta_description', this.pageForm.meta_description.trim());
                    formData.append('is_published', this.pageForm.is_published ? '1' : '0');
                    formData.append('is_main_page', this.pageForm.is_main_page ? '1' : '0');
                    formData.append('navigation_buttons', JSON.stringify(this.pageForm.navigation_buttons || []));

                    const apiUrl = window.location.origin + '/api.php';
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.error) {
                            this.pageError = result.error;
                        } else {
                            this.pageSuccess = 'Страница успешно сохранена';
                            await this.loadPages();
                            setTimeout(() => {
                                this.closePageModal();
                            }, 1500);
                        }
                    } else {
                        let errorMessage = 'Ошибка сохранения страницы';
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.error || errorMessage;
                        } catch (e) {
                            errorMessage = `Ошибка сервера (код ${response.status}): ${response.statusText}`;
                        }
                        this.pageError = errorMessage;
                    }
                } catch (error) {
                    console.error('Error saving page:', error);
                    if (error.message && error.message.includes('fetch')) {
                        this.pageError = 'Ошибка подключения к серверу. Убедитесь, что сервер запущен и доступен.';
                    } else {
                        this.pageError = 'Ошибка сохранения страницы: ' + (error.message || 'Неизвестная ошибка');
                    }
                }

                this.pageLoading = false;
            },
            async deletePage(pageId) {
                if (!confirm('Вы уверены, что хотите удалить эту страницу?')) {
                    return;
                }

                try {
                    const formData = new FormData();
                    formData.append('action', 'delete_page');
                    formData.append('id', pageId);

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        body: formData,
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        await this.loadPages();
                    } else {
                        const errorData = await response.json();
                        alert('Ошибка удаления страницы: ' + (errorData.error || 'Неизвестная ошибка'));
                    }
                } catch (error) {
                    console.error('Error deleting page:', error);
                    if (error.message && error.message.includes('fetch')) {
                        alert('Ошибка подключения к серверу. Убедитесь, что сервер запущен и доступен.');
                    } else {
                        alert('Ошибка удаления страницы: ' + (error.message || 'Неизвестная ошибка'));
                    }
                }
            },
            startDragElement(element, event) {
                this.draggingElement = { ...element, isNew: true };
                event.dataTransfer.effectAllowed = 'copy';
                event.dataTransfer.setData('text/plain', element.type);
            },
            startDragPageElement(element, event) {
                const elementIndex = this.pageElements.findIndex(e => e.id === element.id);
                this.draggingElement = { ...element, isNew: false, index: elementIndex };
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', 'page-element');
            },
            onPreviewDragOver(event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
            },
            onPreviewDragLeave(event) {

                if (!event.currentTarget.contains(event.relatedTarget)) {
                    this.draggingElement = null;
                }
            },
            onPreviewDrop(event) {
                event.preventDefault();
                if (this.draggingElement && this.draggingElement.isNew) {
                    this.addElementToPage(this.draggingElement);
                }
                this.draggingElement = null;
            },
            onElementDragOver(index, event) {
                event.preventDefault();
                event.stopPropagation();
                if (!this.draggingElement) return;

                event.dataTransfer.dropEffect = this.draggingElement.isNew ? 'copy' : 'move';
                const element = event.currentTarget;
                const rect = element.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;

                document.querySelectorAll('.page-element').forEach(el => {
                    el.classList.remove('drag-over-top', 'drag-over-bottom');
                });

                if (event.clientY < midpoint) {
                    element.classList.add('drag-over-top');
                } else {
                    element.classList.add('drag-over-bottom');
                }
            },
            onElementDrop(index, event) {
                event.preventDefault();
                event.stopPropagation();

                document.querySelectorAll('.page-element').forEach(el => {
                    el.classList.remove('drag-over-top', 'drag-over-bottom');
                });

                if (this.draggingElement) {
                    const element = event.currentTarget;
                    const rect = element.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    const insertAfter = event.clientY >= midpoint;
                    const targetIndex = insertAfter ? index + 1 : index;

                    if (this.draggingElement.isNew) {
                        this.insertElementAt(targetIndex, this.draggingElement);
                    } else {

                        const oldIndex = this.draggingElement.index;
                        let newIndex = targetIndex;

                        if (oldIndex < targetIndex) {
                            newIndex = targetIndex - 1;
                        }

                        if (oldIndex !== newIndex && newIndex >= 0 && newIndex < this.pageElements.length) {
                            this.moveElementToPosition(oldIndex, newIndex);
                        }
                    }
                }
                this.draggingElement = null;
            },
            addElementToPage(elementTemplate) {
                const newElement = {
                    id: Date.now() + Math.random(),
                    type: elementTemplate.type,
                    content: elementTemplate.defaultContent || '',
                    level: elementTemplate.type === 'heading' ? 2 : null,
                    link: elementTemplate.type === 'button' ? '' : null,
                    style: elementTemplate.type === 'button' ? 'primary' : null
                };
                this.pageElements.push(newElement);
                this.selectedElement = newElement;
            },
            insertElementAt(index, elementTemplate) {
                const newElement = {
                    id: Date.now() + Math.random(),
                    type: elementTemplate.type,
                    content: elementTemplate.defaultContent || '',
                    level: elementTemplate.type === 'heading' ? 2 : null,
                    link: elementTemplate.type === 'button' ? '' : null,
                    style: elementTemplate.type === 'button' ? 'primary' : null
                };
                this.pageElements.splice(index, 0, newElement);
                this.selectedElement = newElement;
            },
            moveElementToPosition(fromIndex, toIndex) {
                const element = this.pageElements[fromIndex];
                this.pageElements.splice(fromIndex, 1);
                this.pageElements.splice(toIndex, 0, element);

                if (this.draggingElement && !this.draggingElement.isNew) {
                    this.draggingElement.index = toIndex;
                }
            },
            selectElement(element) {
                this.selectedElement = element;
            },
            removeElement(index) {
                if (confirm('Удалить этот элемент?')) {
                    if (this.selectedElement && this.selectedElement.id === this.pageElements[index].id) {
                        this.selectedElement = null;
                    }

                    this.pageElements.splice(index, 1);
                }
            },
            moveElementUp(index) {
                if (index > 0) {
                    const element = this.pageElements[index];

                    this.pageElements.splice(index, 1);
                    this.pageElements.splice(index - 1, 0, element);
                }
            },
            moveElementDown(index) {
                if (index < this.pageElements.length - 1) {
                    const element = this.pageElements[index];

                    this.pageElements.splice(index, 1);
                    this.pageElements.splice(index + 1, 0, element);
                }
            },
            updateElementContent() {

                if (this.selectedElement) {
                    const index = this.pageElements.findIndex(e => e.id === this.selectedElement.id);

                    if (index !== -1) {
                        this.pageElements[index] = { ...this.selectedElement };
                        this.selectedElement = this.pageElements[index];
                    }
                }
            },
            renderElement(element) {
                switch (element.type) {
                    case 'heading':
                        const level = element.level || 2;

                        return `<h${level}>${element.content || 'Заголовок'}</h${level}>`;
                    case 'paragraph':
                        return `<p>${element.content || 'Абзац'}</p>`;
                    case 'image':
                        if (element.content) {
                            return `<img src="${element.content}" alt="Изображение" style="max-width: 100%; height: auto; border-radius: 8px;">`;
                        }

                        return '<div style="padding: 40px; text-align: center; background: rgba(255,255,255,0.05); border-radius: 8px; border: 2px dashed rgba(255,255,255,0.2);"><i class="fas fa-image" style="font-size: 48px; opacity: 0.5;"></i><p style="margin-top: 10px; opacity: 0.7;">Добавьте изображение</p></div>';
                    case 'list':
                        return element.content || '<ul><li>Элемент списка</li></ul>';
                    case 'button':
                        const buttonStyle = element.style || 'primary';
                        const buttonClass = `btn btn-${buttonStyle}`;
                        const buttonLink = element.link || '#';

                        return `<a href="${buttonLink}" class="${buttonClass}">${element.content || 'Кнопка'}</a>`;
                    case 'divider':
                        return '<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 20px 0;">';
                    default:
                        return element.content || '';
                }
            },
            getElementTypeLabel(type) {
                const element = this.availableElements.find(e => e.type === type);
                return element ? element.label : type;
            },
            elementsToHTML() {
                if (this.pageElements.length === 0) {
                    return '';
                }
                return this.pageElements.map(element => {
                    switch (element.type) {
                        case 'heading':
                            const level = element.level || 2;

                            return `<h${level}>${this.escapeHtml(element.content || '')}</h${level}>`;
                        case 'paragraph':
                            return `<p>${this.escapeHtml(element.content || '')}</p>`;
                        case 'image':
                            if (element.content) {
                                return `<img src="${this.escapeHtml(element.content)}" alt="Изображение" style="max-width: 100%; height: auto; border-radius: 8px;">`;
                            }

                            return '';
                        case 'list':
                            return element.content || '';
                        case 'button':
                            const buttonStyle = element.style || 'primary';
                            const buttonClass = `btn btn-${buttonStyle}`;
                            const buttonLink = element.link || '#';

                            return `<a href="${this.escapeHtml(buttonLink)}" class="${buttonClass}">${this.escapeHtml(element.content || '')}</a>`;
                        case 'divider':
                            return '<hr>';
                        default:
                            return this.escapeHtml(element.content || '');
                    }
                }).join('\n');
            },
            parseHTMLToElements(html) {
                if (!html || !html.trim()) {
                    return [];
                }

                const elements = [];
                const tempDiv = document.createElement('div');

                tempDiv.innerHTML = html.trim();

                let elementId = Date.now();

                const processNode = (node, skipChildren = false) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const text = node.textContent.trim();

                        if (text && !skipChildren) {
                            elements.push({
                                id: elementId++,
                                type: 'paragraph',
                                content: text
                            });
                        }

                        return;
                    }

                    if (node.nodeType !== Node.ELEMENT_NODE) {
                        return;
                    }

                    const tagName = node.tagName.toLowerCase();

                    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
                        const level = parseInt(tagName.charAt(1));

                        elements.push({
                            id: elementId++,
                            type: 'heading',
                            content: node.textContent.trim(),
                            level: level
                        })
                    } else if (tagName === 'p') {
                        const text = node.textContent.trim();

                        if (text) {
                            elements.push({
                                id: elementId++,
                                type: 'paragraph',
                                content: text
                            });
                        }
                    } else if (tagName === 'img') {
                        elements.push({
                            id: elementId++,
                            type: 'image',
                            content: node.getAttribute('src') || ''
                        });
                    } else if (tagName === 'ul' || tagName === 'ol') {
                        elements.push({
                            id: elementId++,
                            type: 'list',
                            content: node.outerHTML
                        });
                    } else if (tagName === 'a' && node.classList.contains('btn')) {
                        const style = node.classList.contains('btn-primary') ? 'primary' :
                            node.classList.contains('btn-secondary') ? 'secondary' :
                                node.classList.contains('btn-outline') ? 'outline' : 'primary';
                        elements.push({
                            id: elementId++,
                            type: 'button',
                            content: node.textContent.trim(),
                            link: node.getAttribute('href') || '#',
                            style: style
                        });
                    } else if (tagName === 'hr') {
                        elements.push({
                            id: elementId++,
                            type: 'divider',
                            content: '<hr>'
                        });
                    } else {

                        const hasBlockElements = Array.from(node.children).some(child => {
                            const childTag = child.tagName.toLowerCase();
                            return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'ul', 'ol', 'img', 'hr'].includes(childTag);
                        });

                        if (hasBlockElements) {

                            Array.from(node.childNodes).forEach(child => {
                                if (child.nodeType === Node.ELEMENT_NODE) {
                                    processNode(child);
                                }
                            });
                        } else {

                            const text = node.textContent.trim();
                            if (text) {
                                elements.push({
                                    id: elementId++,
                                    type: 'paragraph',
                                    content: text
                                });
                            }
                        }
                    }
                };

                Array.from(tempDiv.childNodes).forEach(node => processNode(node));

                return elements;
            },
            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            },
            async handleImageUpload(event) {
                const file = event.target.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    alert('Размер файла не должен превышать 5MB');
                    return;
                }

                const formData = new FormData();
                formData.append('image', file);
                formData.append('action', 'upload_background_image');

                try {
                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (this.selectedElement) {
                            this.selectedElement.content = result.url;
                            this.updateElementContent();
                        }
                    } else {
                        const errorData = await response.json();
                        alert('Ошибка загрузки изображения: ' + (errorData.error || 'Неизвестная ошибка'));
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('Ошибка загрузки изображения');
                }
            },
            async loadProductOptions() {
                try {
                    const params = new URLSearchParams();
                    params.set('action', 'product_options');

                    if (this.selectedProductTypeId) {
                        params.set('type_id', this.selectedProductTypeId);
                    }

                    const response = await fetch('../api.php?' + params.toString(), { credentials: 'same-origin' });

                    if (response.ok) {
                        const data = await response.json();

                        this.productOptions = data.options.map((type) => ({
                            id: type.id || null,
                            name: type.name || '',
                            values: Array.isArray(type.values) && type.values.length ? [...type.values] : ['']
                        }));
                    } else {
                        console.error('Failed to load options', response.error);
                    }

                    this.newOptionTypeName = '';
                } catch (error) {
                    alert(`Error loading product options: ${error}`);
                    this.newOptionTypeName = '';
                }
            },
            async loadProductTypes() {
                try {
                    const response = await fetch('../api.php?action=product_types', { credentials: 'same-origin' });

                    if (response.ok) {
                        const data = await response.json();

                        this.productTypes = Array.isArray(data.types)
                            ? data.types.map((type) => ({
                                id: type.id || null,
                                name: type.name || '',
                            }))
                            : [];

                        if (!this.selectedProductTypeId && this.productTypes.length) {
                            this.selectedProductTypeId = this.productTypes[0].id || null;
                        }
                    } else {
                        console.error('Failed to load product types', response.error);
                    }

                    this.newProductTypeName = '';
                } catch (error) {
                    alert(`Error loading product types: ${error}`);
                    this.newProductTypeName = '';
                }
            },
            async saveProductOptions() {
                this.optionsLoading = true;
                this.optionsError = '';
                this.optionsSuccess = '';

                try {
                    const currentTypeId = this.selectedProductTypeId ? parseInt(this.selectedProductTypeId, 10) : 0;

                    if (!currentTypeId) {
                        this.optionsError = 'Сначала выберите тип товара';
                        this.optionsLoading = false;
                        return;
                    }

                    const preparedOptions = this.productOptions.map(type => {
                        const name = type.name ? type.name.trim() : '';
                        const values = Array.isArray(type.values)
                            ? type.values
                                .map(value => value && value.trim())
                                .filter(Boolean)
                            : [];
                        return {
                            name,
                            values
                        };
                    }).filter(type => type.name && type.values.length);

                    const formData = new FormData();
                    formData.append('action', 'save_product_options');
                    formData.append('option_types', JSON.stringify(preparedOptions));
                    formData.append('type_id', String(currentTypeId));

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            this.optionsSuccess = 'Опции успешно сохранены';
                            setTimeout(() => {
                                this.optionsSuccess = '';
                            }, 3000);
                        } else {
                            this.optionsError = result.error || 'Ошибка сохранения';
                        }
                    } else {
                        const errorData = await response.json();
                        this.optionsError = errorData.error || 'Ошибка сохранения';
                    }
                } catch (error) {
                    console.error('Error saving product options:', error);
                    this.optionsError = 'Ошибка сохранения опций';
                }

                this.optionsLoading = false;
            },
            async saveProductTypes() {
                this.typesLoading = true;
                this.typesError = '';
                this.typesSuccess = '';

                try {
                    const preparedTypes = this.productTypes
                        .map(type => {
                            const name = type.name ? type.name.trim() : '';
                            return { name };
                        })
                        .filter(type => type.name);

                    if (!preparedTypes.length) {
                        this.typesError = 'Добавьте хотя бы один тип товара';
                        this.typesLoading = false;
                        return;
                    }

                    const formData = new FormData();
                    formData.append('action', 'save_product_types');
                    formData.append('types', JSON.stringify(preparedTypes));

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            this.typesSuccess = 'Типы товаров успешно сохранены';
                            setTimeout(() => {
                                this.typesSuccess = '';
                            }, 3000);
                        } else {
                            this.typesError = result.error || 'Ошибка сохранения';
                        }
                    } else {
                        const errorData = await response.json();
                        this.typesError = errorData.error || 'Ошибка сохранения';
                    }
                } catch (error) {
                    console.error('Error saving product types:', error);
                    this.typesError = 'Ошибка сохранения типов товаров';
                }

                this.typesLoading = false;
            },
            addOptionType() {
                const name = this.newOptionTypeName.trim();
                if (!name) {
                    this.optionsError = 'Введите название типа опций';
                    return;
                }
                this.productOptions.push({
                    id: null,
                    name,
                    values: ['']
                });
                this.newOptionTypeName = '';
                this.optionsError = '';
            },
            addProductType() {
                const name = (this.newProductTypeName || '').trim();
                if (!name) {
                    this.typesError = 'Введите название типа товара';
                    return;
                }

                this.productTypes.push({
                    id: null,
                    name,
                });

                this.newProductTypeName = '';
                this.typesError = '';
            },
            removeOptionType(index) {
                if (confirm('Вы действительно хотите удалить этот список опций?')) {
                    this.productOptions.splice(index, 1);
                }
            },
            removeProductType(index) {
                if (!this.productTypes[index]) {
                    return;
                }

                if (confirm('Вы действительно хотите удалить этот тип товара?')) {
                    this.productTypes.splice(index, 1);
                }
            },
            moveOptionTypeUp(typeIndex) {
                if (typeIndex <= 0 || typeIndex >= this.productOptions.length) {
                    return;
                }
                const temp = this.productOptions[typeIndex];
                this.productOptions[typeIndex] = this.productOptions[typeIndex - 1];
                this.productOptions[typeIndex - 1] = temp;
            },
            moveProductTypeUp(index) {
                if (index <= 0 || index >= this.productTypes.length) {
                    return;
                }

                const temp = this.productTypes[index];
                this.productTypes[index] = this.productTypes[index - 1];
                this.productTypes[index - 1] = temp;
            },
            moveOptionTypeDown(typeIndex) {
                if (typeIndex < 0 || typeIndex >= this.productOptions.length - 1) {
                    return;
                }
                const temp = this.productOptions[typeIndex];
                this.productOptions[typeIndex] = this.productOptions[typeIndex + 1];
                this.productOptions[typeIndex + 1] = temp;
            },
            moveProductTypeDown(index) {
                if (index < 0 || index >= this.productTypes.length - 1) {
                    return;
                }

                const temp = this.productTypes[index];
                this.productTypes[index] = this.productTypes[index + 1];
                this.productTypes[index + 1] = temp;
            },
            addOptionValue(typeIndex) {
                if (!this.productOptions[typeIndex]) {
                    return;
                }
                this.productOptions[typeIndex].values.push('');
            },
            removeOptionValue(typeIndex, valueIndex) {
                const optionType = this.productOptions[typeIndex];
                optionType.values.splice(valueIndex, 1);
            },
            async deleteOrder(orderId) {
                if (!orderId) {
                    alert('ID заказа не указан');
                    return false;
                }

                if (!confirm('Вы действительно хотите удалить этот заказ? Это действие необратимо')) {
                    return false;
                }

                try {
                    const formData = new FormData();
                    formData.append('action', 'delete_order');
                    formData.append('order_id', orderId);

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();

                        if (data.error) {
                            throw new Error(data.error);
                        }

                        alert('Заказ успешно удален');
                        await this.loadOrders();
                        return true;
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                    }
                } catch (error) {
                    console.error('Error deleting order:', error);
                    alert(`Произошла ошибка: ${error.message || 'Неизвестная ошибка'}`);
                    return false;
                }
            },
            async cleanupOldOrders() {
                try {
                    const formData = new FormData();
                    formData.append('action', 'cleanup_old_orders');

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();

                        if (data.success && data.deleted_count > 0) {
                            console.log(`Автоматически удалено заказов: ${data.deleted_count}`);
                            await this.loadOrders();
                        }
                    }
                } catch (error) {
                    console.error('Error during automatic cleanup:', error);
                }
            },
            getProductName(url) {
                if (url === '/') {
                    return 'Домашняя'
                } else {
                    const id = url.split('id=')[1];
                    let products = this.getObject(this.products);
                    let name = '';

                    for (let product in products) {
                        if (products[product].id === Number(id)) {
                            name = products[product].name;
                        }
                    }

                    if (name) {
                        return name;
                    } else {
                        return url;
                    }
                }
            },
            openProductPage(id) {
                const product = this.products.find(p => p.id === id);

                if (product && product.name) {
                    //temp TODO
                    window.location.href = window.location.origin + '/product/?id=' + id;
                    // const slug = this.generateProductSlug(product.name);
                    // window.location.href = 'https://aeternum.by/product/' + encodeURIComponent(slug);
                } else {
                    window.location.href = window.location.origin + '/product/?id=' + id;
                }
            },
            /*async loadParams() {
                try {
                    const response = await fetch('../api.php?action=get_params', { credentials: 'same-origin' });

                    if (response.ok) {
                        const data = await response.json();

                        if (data && typeof data === 'object') {
                            this.logoUrl = data.logo ?? this.logoUrl;
                            this.title = data.title ?? this.title;
                            this.description = data.description ?? this.description;
                            this.imageMetaTags = data.image_meta_tags ?? this.imageMetaTags;
                            this.pickupAddress = data.pickup_address ?? this.pickupAddress;
                            this.workHours = data.work_hours ?? this.workHours;
                            this.storePhone = data.store_phone ?? this.storePhone;
                            this.deliveryBel = data.delivery_bel ?? this.deliveryBel;
                            this.deliveryRus = data.delivery_rus ?? this.deliveryRus;
                        }
                    }
                } catch (error) {
                    console.error('Error loading params:', error);
                }
            },*/
            /*async uploadLogo(e) {
                const result = await this.uploadImage(this.logo ?? e, 'logo', { maxSizeMb: 5, fieldName: 'logo' });

                if (result?.url) {
                    alert('Логотип успешно загружен');

                    this.logoUrl = result.url;
                    this.logo = null;
                }
            },*/
            /*async saveParams() {
                try {
                    const formData = new FormData();

                    formData.append('action', 'save_params');
                    formData.append('title', this.title);
                    formData.append('description', this.description);
                    formData.append('image_meta_tags', this.imageMetaTags);
                    formData.append('pickup_address', this.pickupAddress);
                    formData.append('work_hours', this.workHours);
                    formData.append('store_phone', this.storePhone);
                    formData.append('delivery_bel', this.deliveryBel);
                    formData.append('delivery_rus', this.deliveryRus);

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        alert('Параметры успешно сохранены');
                    } else {
                        alert(`Ошибка при сохранении параметров: ${data.error || 'Неизвестная ошибка'}`);
                    }
                } catch (error) {
                    alert(`Произошла ошибка при сохранении параметров: ${error}`);
                }
            },*/
            showContextMenu(event, product = null) {
                console.log('showContextMenu called', { product, event });
                event.preventDefault();
                event.stopPropagation();

                if (!product) {
                    console.warn('No product provided to context menu');
                    return;
                }

                this.contextMenuProduct = product;

                const menuWidth = 200;
                const menuHeight = 200;
                let x = event.clientX;
                let y = event.clientY;

                if (x + menuWidth > window.innerWidth) {
                    x = window.innerWidth - menuWidth - 10;
                }
                if (y + menuHeight > window.innerHeight) {
                    y = window.innerHeight - menuHeight - 10;
                }

                this.contextMenuPosition = { x, y };
                this.contextMenuVisible = true;

                console.log('Context menu state:', {
                    visible: this.contextMenuVisible,
                    product: this.contextMenuProduct,
                    position: this.contextMenuPosition
                });

                const hideMenu = (e) => {
                    if (!e.target.closest('.context-menu')) {
                        this.hideContextMenu();
                    }
                };

                const hideMenuOnEscape = (e) => {
                    if (e.key === 'Escape') {
                        this.hideContextMenu();
                    }
                };

                setTimeout(() => {
                    document.addEventListener('click', hideMenu);
                    document.addEventListener('keydown', hideMenuOnEscape);
                    this.contextMenuHideHandler = hideMenu;
                    this.contextMenuEscapeHandler = hideMenuOnEscape;
                }, 0);
            },
            hideContextMenu() {
                this.contextMenuVisible = false;
                this.contextMenuProduct = null;
                if (this.contextMenuHideHandler) {
                    document.removeEventListener('click', this.contextMenuHideHandler);
                    this.contextMenuHideHandler = null;
                }
                if (this.contextMenuEscapeHandler) {
                    document.removeEventListener('keydown', this.contextMenuEscapeHandler);
                    this.contextMenuEscapeHandler = null;
                }
            },
            handleContextMenuAction(action) {
                if (!this.contextMenuProduct) return;

                const product = this.contextMenuProduct;

                switch(action) {
                    case 'edit':
                        this.editProduct(product);
                        break;
                    case 'delete':
                        this.deleteProduct(product.id);
                        break;
                    case 'open':
                        this.openProductPage(product.id);
                        break;
                    case 'duplicate':
                        this.duplicateProduct(product);
                        break;
                }

                this.hideContextMenu();
            },
            duplicateProduct(product) {
                const duplicatedProduct = {
                    ...product,
                    id: null,
                    name: product.name + ' (копия)'
                };

                this.editProduct(duplicatedProduct);
            },
            selectProductFromMenu() {
                if (!this.contextMenuProduct) return;
                this.toggleProductSelection(this.contextMenuProduct.id);
                this.hideContextMenu();
            },
            toggleProductSelection(productId) {
                const index = this.selectedProducts.indexOf(productId);

                if (index > -1) {
                    this.selectedProducts.splice(index, 1);
                } else {
                    this.selectedProducts.push(productId);
                }
            },
            isProductSelected(productId) {
                return this.selectedProducts.includes(productId);
            },
            toggleSelectAll(event) {
                if (event.target.checked) {
                    this.selectedProducts = this.products.map(p => p.id);
                } else {
                    this.selectedProducts = [];
                }
            },
            clearSelection() {
                this.selectedProducts = [];
            },
            deleteSelectedProducts() {
                if (this.selectedProducts.length === 0) return;

                const count = this.selectedProducts.length;

                if (confirm(`Вы уверены, что хотите удалить ${count} ${count === 1 ? 'товар' : count < 5 ? 'товара' : 'товаров'}?`)) {
                    const idsToDelete = [...this.selectedProducts];

                    idsToDelete.forEach(id => {
                        this.deleteProduct(id, true);
                    });

                    setTimeout(() => {
                        this.clearSelection();
                    }, 500);
                }
            },
            confirmLogout() {
                if (confirm('Вы уверены, что хотите выйти?')) {
                    window.location.href = 'index.php?action=logout'
                }
            },
            //TODO
            generateProductSlug() {

            },
            getObject(e) {
                return JSON.parse(JSON.stringify(e));
            },
            async hideProduct(id) {
                try {
                    const product = this.products.find(p => p.id === id);

                    if (!product) {
                        alert('Товар не найден');
                        return;
                    }

                    const newVisibility = product.visibility === 0 ? 1 : 0;

                    const formData = new FormData();
                    formData.append('action', 'visibility');
                    formData.append('id', id);
                    formData.append('visibility', String(newVisibility));

                    const response = await fetch('../api.php', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json().catch(() => null);

                        if (data && data.success) {
                            product.visibility = newVisibility;
                        } else {
                            alert(`Ошибка при изменении видимости товара`);
                        }
                    } else {
                        alert(`Ошибка при изменении видимости товара`);
                    }
                } catch (error) {
                    alert(`Ошибка при изменении видимости товара: ${error}`);
                }
            }
        }
    });

    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        NV.admin.mount('#app');
    }, 500);
    setTimeout(() => {
        let loader =  document.querySelector('#load_box');
        document.body.style.overflow = 'auto';
        if (loader) loader.style.display = 'none';
    }, 1500);
})