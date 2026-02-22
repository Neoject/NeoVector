NV.ready(function registerOptionsComponent() {
    if (!NV.admin) {
        setTimeout(registerOptionsComponent, 10);
        return;
    }
    NV.admin.component('options-view', {
    template: '#options-template',
    computed: {
        productOptionTypes: {
            get() {
                if (!this.$root.productOptionTypes) {
                    this.$root.productOptionTypes = [];
                }
                return this.$root.productOptionTypes;
            }
        },
        newOptionTypeName: {
            get() {
                return this.$root.newOptionTypeName || '';
            },
            set(value) {
                this.$root.newOptionTypeName = value;
            }
        },
        optionsLoading() {
            return this.$root.optionsLoading || false;
        },
        optionsError() {
            return this.$root.optionsError || '';
        },
        optionsSuccess() {
            return this.$root.optionsSuccess || '';
        }
    },
    methods: {
        isMobileDevice() {
            if (typeof this.$root.isMobileDevice === 'function') {
                return this.$root.isMobileDevice();
            }
            return false;
        },
        async loadProductOptions() {
            if (typeof this.$root.loadProductOptions === 'function') {
                await this.$root.loadProductOptions();
            }
        },
        async saveProductOptions() {
            if (typeof this.$root.saveProductOptions === 'function') {
                await this.$root.saveProductOptions();
            }
        },
        addOptionType() {
            if (typeof this.$root.addOptionType === 'function') {
                this.$root.addOptionType();
            }
        },
        removeOptionType(index) {
            if (typeof this.$root.removeOptionType === 'function') {
                this.$root.removeOptionType(index);
            }
        },
        moveOptionTypeUp(typeIndex) {
            if (typeof this.$root.moveOptionTypeUp === 'function') {
                this.$root.moveOptionTypeUp(typeIndex);
            }
        },
        moveOptionTypeDown(typeIndex) {
            if (typeof this.$root.moveOptionTypeDown === 'function') {
                this.$root.moveOptionTypeDown(typeIndex);
            }
        },
        addOptionValue(typeIndex) {
            if (typeof this.$root.addOptionValue === 'function') {
                this.$root.addOptionValue(typeIndex);
            }
        },
        removeOptionValue(typeIndex, valueIndex) {
            if (typeof this.$root.removeOptionValue === 'function') {
                this.$root.removeOptionValue(typeIndex, valueIndex);
            }
        }
    }
    });
});