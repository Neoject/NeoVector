NV.ready(function registerOrdersComponent() {
    if (!NV.admin) {
        setTimeout(registerOrdersComponent, 10);
        return;
    }
    NV.admin.component('orders-list', {
    template: '#orders-template',
    computed: {
        orders() {
            return this.$root.orders;
        },
        ordersLoading() {
            return this.$root.ordersLoading;
        },
        ordersError() {
            return this.$root.ordersError;
        },
        orderStatuses() {
            return this.$root.orderStatuses || {};
        }
    },
    methods: {
        async loadOrders() {
            if (typeof this.$root.loadOrders === 'function') {
                await this.$root.loadOrders();
            }
        },
        async updateOrderStatus(orderId, newStatus) {
            if (typeof this.$root.updateOrderStatus === 'function') {
                await this.$root.updateOrderStatus(orderId, newStatus);
            }
        },
        async updatePaymentStatus(orderId, paymentStatus) {
            if (typeof this.$root.updatePaymentStatus === 'function') {
                await this.$root.updatePaymentStatus(orderId, paymentStatus);
            }
        },
        getStatusClass(status) {
            if (typeof this.$root.getStatusClass === 'function') {
                return this.$root.getStatusClass(status);
            }
            return '';
        },
        getDeliveryTypeLabel(type) {
            if (typeof this.$root.getDeliveryTypeLabel === 'function') {
                return this.$root.getDeliveryTypeLabel(type);
            }
            return type;
        },
        formatDate(dateString) {
            if (typeof this.$root.formatDate === 'function') {
                return this.$root.formatDate(dateString);
            }
            return dateString;
        },
        formatPrice(price) {
            if (typeof this.$root.formatPrice === 'function') {
                return this.$root.formatPrice(price);
            }
            return price;
        },
        async deleteOrder(orderId) {
            if (typeof this.$root.deleteOrder === 'function') {
                await this.$root.deleteOrder(orderId);
            }
        }
    }
    });
});