NV.ready(function registerSettingsComponent() {
    if (!NV.admin) {
        setTimeout(registerSettingsComponent, 10);
        return;
    }

    const rootFields = [
        'title', 'description', 'imageMetaTags', 'pickupAddress',
        'workHours', 'storePhone', 'deliveryBel', 'deliveryRus'
    ];

    const computed = {};

    rootFields.forEach(field => {
        computed[field] = {
            get() { return this.$root[field]; },
            set(value) { this.$root[field] = value; }
        };
    });

    NV.admin.component('settings-view', {
        template: '#settings-template',
        computed,
        methods: {
            saveParams() {
                if (typeof this.$root.saveParams === 'function') {
                    this.$root.saveParams();
                }
            }
        }
    });
});