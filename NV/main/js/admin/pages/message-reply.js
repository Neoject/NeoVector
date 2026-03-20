NV.ready(function registerMessageReplyComponent() {
    if (!NV.admin) {
        setTimeout(registerMessageReplyComponent, 10);
        return;
    }
    NV.admin.component('message-reply-view', {
        template: '#message-reply-template',
        data() {
            return {
                replySubject: '',
                replyMessage: '',
                replyLoading: false,
                replyError: '',
                replySuccess: ''
            };
        },
        computed: {
            selectedMessage() {
                return this.$root.selectedMessage;
            }
        },
        mounted() {
            if (this.selectedMessage) {
                const url = new URL(window.location.href);
                const currentId = url.searchParams.get('id');

                if (currentId !== String(this.selectedMessage.id)) {
                    url.searchParams.set('page', 'message-reply');
                    url.searchParams.set('id', this.selectedMessage.id);
                    history.pushState({}, '', url.toString());
                }
            }
        },
        methods: {
            changePage(page) {
                if (typeof this.$root.changePage === 'function') {
                    if (page === 'messages') {
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', 'messages');
                        url.searchParams.delete('id');
                        history.pushState({}, '', url.toString());
                    } else if (page === 'message' && this.selectedMessage) {
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', 'message');
                        url.searchParams.set('id', this.selectedMessage.id);
                        history.pushState({}, '', url.toString());
                    } else if (page === 'message-reply' && this.selectedMessage) {
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', 'message-reply');
                        url.searchParams.set('id', this.selectedMessage.id);
                        history.pushState({}, '', url.toString());
                    }
                    this.$root.changePage(page);
                }
            },
            formatDate(dateString) {
                if (typeof this.$root.formatDate === 'function') {
                    return this.$root.formatDate(dateString);
                }
                return dateString;
            },
            handleBack() {
                if (this.replyLoading) {
                    return;
                }
                
                const hasUnsavedData = this.replySubject.trim() || this.replyMessage.trim();
                
                if (hasUnsavedData) {
                    if (confirm('Данные ответа не будут сохранены')) {
                        this.changePage('message');
                    }
                } else {
                    this.changePage('message');
                }
            },
            async sendReply() {
                if (!this.selectedMessage) {
                    this.replyError = 'Сообщение не выбрано';
                    return;
                }

                if (!this.replySubject.trim()) {
                    this.replyError = 'Тема письма обязательна';
                    return;
                }

                if (!this.replyMessage.trim()) {
                    this.replyError = 'Текст ответа обязателен';
                    return;
                }

                this.replyLoading = true;
                this.replyError = '';
                this.replySuccess = '';

                try {
                    const response = await fetch('../api.php?action=send-reply', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            messageId: this.selectedMessage.id,
                            to: this.selectedMessage.email,
                            subject: this.replySubject.trim(),
                            message: this.replyMessage.trim()
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        this.replySuccess = 'Ответ успешно отправлен!';
                        this.replySubject = '';
                        this.replyMessage = '';
                        setTimeout(() => {
                            this.changePage('message');
                        }, 2000);
                    } else {
                        this.replyError = result.error || 'Ошибка при отправке ответа';
                    }
                } catch (error) {
                    console.error('Error sending reply:', error);
                    this.replyError = 'Ошибка при отправке ответа. Попробуйте позже.';
                } finally {
                    this.replyLoading = false;
                }
            }
        }
    });
});
