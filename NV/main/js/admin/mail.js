const Mail = {
    data() {
        return {
            messages: [],
            showMessageModal: false,
            selectedMessage: null
        }
    },
    methods: {
        async getMessages () {
            try {
                const response = await fetch('../api.php?action=messages', { credentials: 'same-origin' });
                if (response.ok) {
                    const res = await response.json();

                    if (res.success && res.data) {
                        this.messages = res.data;
                    } else if (Array.isArray(res)) {
                        this.messages = res;
                    }
                }
            } catch (e) {
                console.error('Error loading messages', e);
            }
        },
        openMessageModal(message) {
            this.selectedMessage = message;
            this.showMessageModal = true;
        },
        closeMessageModal() {
            this.showMessageModal = false;
            this.selectedMessage = null;
        },
        openMessage(message) {
            this.selectedMessage = message;
            const url = new URL(window.location.href);
            url.searchParams.set('page', 'message');
            url.searchParams.set('id', message.id);
            history.pushState({}, '', url.toString());
            this.changePage('message');
        },
        openReply(message) {
            this.selectedMessage = message;
            const url = new URL(window.location.href);
            url.searchParams.set('page', 'message-reply');
            url.searchParams.set('id', message.id);
            history.pushState({}, '', url.toString());
            this.changePage('message-reply');
        },
        async deleteMessage(message) {
            if (!message || !message.id) return;
            if (!confirm('Удалить это сообщение? Действие необратимо.')) return;
            try {
                const formData = new FormData();
                formData.append('action', 'delete_message');
                formData.append('id', message.id);
                const response = await fetch('../api.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.messages = this.messages.filter(m => m.id !== message.id);
                        if (this.selectedMessage && this.selectedMessage.id === message.id) {
                            this.selectedMessage = null;
                            this.changePage('messages');
                        }
                    }
                } else {
                    const err = await response.json().catch(() => ({}));
                    alert(err.error || 'Ошибка при удалении сообщения');
                }
            } catch (e) {
                console.error('Error deleting message', e);
                alert('Ошибка при удалении сообщения');
            }
        }
    }
}