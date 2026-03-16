NV.ready(function registerSettingsComponent() {
    if (!NV.admin) {
        setTimeout(registerSettingsComponent, 10);
        return;
    }
    NV.admin.component('settings-view', {
    template: '#settings-template',
    computed: {
        title: {
            get() {
                return this.$root.title;
            },
            set (value) {
                this.$root.title = value;
            }
        },
        description: {
            get() {
                return this.$root.description;
            },
            set (value) {
                this.$root.description = value;
            }
        },
        imageMetaTags: {
            get() {
                return this.$root.imageMetaTags;
            },
            set(value) {
                this.$root.imageMetaTags = value;
            }
        },
        pickupAddress: {
            get() {
                return this.$root.pickupAddress;
            },
            set(value) {
                this.$root.pickupAddress = value;
            }
        },
        workHours: {
            get() {
                return this.$root.workHours;
            },
            set(value) {
                this.$root.workHours = value;
            }
        },
        storePhone: {
            get() {
                return this.$root.storePhone;
            },
            set(value) {
                this.$root.storePhone = value;
            }
        },
        deliveryBel: {
            get() {
                return this.$root.deliveryBel;
            },
            set(value) {
                this.$root.deliveryBel = value;
            }
        },
        deliveryRus: {
            get() {
                return this.$root.deliveryRus;
            },
            set(value) {
                this.$root.deliveryRus = value;
            }
        }
    },
    methods: {
        saveParams() {
            if (typeof this.$root.saveParams === 'function') {
                this.$root.saveParams();
            }
        }
    }
    });
});