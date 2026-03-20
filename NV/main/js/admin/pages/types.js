NV.ready(function registerTypesComponent() {
    if (!NV.admin) {
        setTimeout(registerTypesComponent, 10);
        return;
    }

    NV.admin.component('types-view', {
        template: '#options-template',
        computed: {
            productTypes: {
                get() {
                    if (!this.$root.productTypes) {
                        this.$root.productTypes = [];
                    }
                    return this.$root.productTypes;
                }
            },
            newProductTypeName: {
                get() {
                    return this.$root.newProductTypeName || '';
                },
                set(value) {
                    this.$root.newProductTypeName = value;
                }
            },
            typesLoading() {
                return this.$root.typesLoading || false;
            },
            typesError() {
                return this.$root.typesError || '';
            },
            typesSuccess() {
                return this.$root.typesSuccess || '';
            },
            productOptions: {
                get() {
                    if (!this.$root.productOptions) {
                        this.$root.productOptions = [];
                    }
                    return this.$root.productOptions;
                }
            },
            newOptionName: {
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
            async loadProductTypes() {
                if (typeof this.$root.loadProductTypes === 'function') {
                    await this.$root.loadProductTypes();
                }
            },
            async saveProductTypes() {
                if (typeof this.$root.saveProductTypes === 'function') {
                    await this.$root.saveProductTypes();
                }
            },
            addProductType() {
                if (typeof this.$root.addProductType === 'function') {
                    this.$root.addProductType();
                }
            },
            removeProductType(index) {
                if (typeof this.$root.removeProductType === 'function') {
                    this.$root.removeProductType(index);
                }
            },
            moveProductTypeUp(index) {
                if (typeof this.$root.moveProductTypeUp === 'function') {
                    this.$root.moveProductTypeUp(index);
                }
            },
            moveProductTypeDown(index) {
                if (typeof this.$root.moveProductTypeDown === 'function') {
                    this.$root.moveProductTypeDown(index);
                }
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

