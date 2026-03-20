NV.ready(function registerMessagesComponent() {
    if (!NV.admin) {
        setTimeout(registerMessagesComponent, 10);
        return;
    }
    NV.admin.component('messages-view', {
    template: '#messages-template',
    computed: {
        messages() {
            return this.$root.messages;
        }
    },
    methods: {
        openMessage(message) {
            if (typeof this.$root.openMessage === 'function') {
                this.$root.openMessage(message);
            }
        },
        deleteMessage(message) {
            if (typeof this.$root.deleteMessage === 'function') {
                this.$root.deleteMessage(message);
            }
        },
        openReply(message) {
            if (typeof this.$root.openReply === 'function') {
                this.$root.openReply(message);
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