NV.ready(function registerMessagesDetailComponent() {
    if (!NV.admin) {
        setTimeout(registerMessagesDetailComponent, 10);
        return;
    }

    NV.admin.component('message-detail-view', {
        template: '#message-detail-template',
        data() {
            return {
                replies: [],
                repliesLoading: false
            };
        },
        computed: {
            selectedMessage() {
                return this.$root.selectedMessage;
            }
        },
        watch: {
            selectedMessage: {
                handler(newMessage) {
                    if (newMessage && newMessage.id) {
                        this.loadReplies();
                    }
                },
                immediate: true
            }
        },
        methods: {
            async loadReplies() {
                if (!this.selectedMessage || !this.selectedMessage.id) {
                    this.replies = [];
                    return;
                }

                this.repliesLoading = true;
                try {
                    const response = await fetch(`../api.php?action=message-replies&message_id=${this.selectedMessage.id}`, {
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                            this.replies = result.data;
                        } else {
                            this.replies = [];
                        }
                    } else {
                        this.replies = [];
                    }
                } catch (error) {
                    console.error('Error loading replies:', error);
                    this.replies = [];
                } finally {
                    this.repliesLoading = false;
                }
            },
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
            }
        }
    });
});