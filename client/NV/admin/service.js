import {api} from "../../../server/api";

export async function uploadImage(e, file_name, { maxSizeMb = 8, fieldName = 'image' } = {}) {
    const file =
        (e && typeof e === 'object' && 'size' in e && 'name' in e)
            ? e
            : e?.target?.files?.[0];

    if (!file) return;

    const maxBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxBytes) {
        alert(`Размер файла не должен превышать ${maxSizeMb}MB`);
        return;
    }

    const formData = new FormData();

    formData.append(fieldName, file);
    formData.append('action', 'upload_' + file_name);

    try {
        const response = await api.uploadMedia(formData);

        if (response.ok) {
            return await response.json();
        } else {
            const errorData = await response.json();
            alert('Ошибка загрузки изображения: ' + (errorData.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Ошибка загрузки изображения');
    }
}

export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export const Values = {
    data() {
        return {
            uploadSuccess: false,
            uploadError: false,
            uploadErrorMessage: '',
            uploadXhr: null,
        };
    },
    /*computed: {
        messages: {
            get() {
                return this.$root?._messages ?? [];
            },
            set(val) {
                if (this.$root) this.$root._messages = val;
            }
        },
        selectedMessage: {
            get() {
                return this.$root?._selectedMessage ?? null;
            },
            set(val) {
                if (this.$root) this.$root._selectedMessage = val;
            }
        }
    },*/
    methods: {
        async getMessages() {
            try {
                const response = api.getMessages();
                if (!response.ok) return;

                const res = await response.json();

                if (res?.success && res.data) {
                    this.messages = res.data;
                } else if (Array.isArray(res)) {
                    this.messages = res;
                } else {
                    this.messages = [];
                }
            } catch (e) {
                console.error('Error loading messages:', e);
                this.messages = [];
            }
        },
        async changePage(page) {
            if (!this.$root) return;

            this.$root.page = page;
            this.closeMobileMenu();
            this._showLoader();

            this._updateUrl(page);

            await this.$nextTick();

            try {
                if (page === 'analytics') {
                    await this.$refs.analytics?.loadAnalytics?.();
                } else if (page === 'orders') {
                    await this.$refs.ordersList?.loadOrders?.();
                } else if (page === 'users') {
                    await this.$refs['users-list']?.getUsers?.();
                } else if (page === 'messages') {
                    this.selectedMessage = null;
                    const url = new URL(window.location.href);
                    url.searchParams.delete('id');
                    history.pushState({}, '', url.toString());
                    await this.getMessages();
                } else if (page === 'message' || page === 'message-reply') {
                    await this._loadMessagePage(page);
                }
            } catch (e) {
                console.error(`changePage(${page}) error:`, e);
            }

            window.scrollTo(0, 0);
            this._hideLoader();
        },
        async _loadMessagePage(page) {
            const messageId = new URLSearchParams(window.location.search).get('id')
                ?? this.selectedMessage?.id
                ?? null;

            if (!messageId) return;

            const url = new URL(window.location.href);
            url.searchParams.set('page', page);
            url.searchParams.set('id', messageId);
            history.pushState({}, '', url.toString());

            const find = () => this.messages.find(m => String(m.id) === String(messageId));

            if (!this.messages.length) {
                await this.getMessages();
            }

            const msg = find();
            if (msg) this.selectedMessage = msg;
        },
        _updateUrl(page) {
            const url = new URL(window.location.href);

            if (page) {
                url.searchParams.set('page', page);
            } else {
                url.searchParams.delete('page');
            }

            if (!page.includes('message')) {
                url.searchParams.delete('id');
            }

            history.pushState({}, '', url.toString());
        },
        toggleMobileMenu() {
            if (this.$root) this.$root.mobileMenuOpen = !this.$root.mobileMenuOpen;
        },
        closeMobileMenu() {
            if (this.$root) this.$root.mobileMenuOpen = false;
        },
        _showLoader() {
            const loader = document.getElementById('block_loader');
            if (loader) loader.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        },
        _hideLoader(delay = 500) {
            setTimeout(() => {
                const loader = document.getElementById('block_loader');
                if (loader) loader.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, delay);
        }
    }
};