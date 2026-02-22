NV.ready(function registerSettingsComponent() {
    if (!NV.admin) {
        setTimeout(registerSettingsComponent, 10);
        return;
    }
    NV.admin.component('settings-view', {
    template: '#settings-template',
    computed: {
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