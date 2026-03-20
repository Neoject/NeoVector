NV.ready(function registerBlockModalComponent() {
    if (!NV.admin) {
        setTimeout(registerBlockModalComponent, 10);
        return;
    }
    NV.admin.component('block-modal-view', {
        template: '#block-modal-template',
        computed: {
            blockForm: {
                get() {
                    return this.$root.blockForm || {};
                },
                set(value) {
                    if (this.$root.blockForm !== undefined) {
                        this.$root.blockForm = value;
                    }
                }
            },
            editingBlock() {
                return this.$root.editingBlock;
            },
            blockError() {
                return this.$root.blockError;
            },
            blockSuccess() {
                return this.$root.blockSuccess;
            },
            blockLoading() {
                return this.$root.blockLoading;
            },
            pages() {
                return this.$root.pages || [];
            }
        },
        methods: {
            saveBlock() {
                if (typeof this.$root.saveBlock === 'function') {
                    this.$root.saveBlock();
                }
            },
            closeBlockModal() {
                if (typeof this.$root.closeBlockModal === 'function') {
                    this.$root.closeBlockModal();
                }
            },
            onBlockTypeChange() {
                if (typeof this.$root.onBlockTypeChange === 'function') {
                    this.$root.onBlockTypeChange();
                }
            },
            removeBackgroundImage() {
                if (typeof this.$root.removeBackgroundImage === 'function') {
                    this.$root.removeBackgroundImage();
                }
            },
            handleBackgroundImageUpload(e) {
                if (typeof this.$root.handleBackgroundImageUpload === 'function') {
                    this.$root.handleBackgroundImageUpload(e);
                }
            },
            addFeature() {
                if (typeof this.$root.addFeature === 'function') {
                    this.$root.addFeature();
                }
            },
            removeFeature(index) {
                if (typeof this.$root.removeFeature === 'function') {
                    this.$root.removeFeature(index);
                }
            },
            openIconPicker(feature, field) {
                if (typeof this.$root.openIconPicker === 'function') {
                    this.$root.openIconPicker(feature, field);
                }
            },
            addHistoryEvent() {
                if (typeof this.$root.addHistoryEvent === 'function') {
                    this.$root.addHistoryEvent();
                }
            },
            removeHistoryEvent(index) {
                if (typeof this.$root.removeHistoryEvent === 'function') {
                    this.$root.removeHistoryEvent(index);
                }
            },
            addStat() {
                if (typeof this.$root.addStat === 'function') {
                    this.$root.addStat();
                }
            },
            removeStat(index) {
                if (typeof this.$root.removeStat === 'function') {
                    this.$root.removeStat(index);
                }
            },
            addButton() {
                if (typeof this.$root.addButton === 'function') {
                    this.$root.addButton();
                }
            },
            removeButton(index) {
                if (typeof this.$root.removeButton === 'function') {
                    this.$root.removeButton(index);
                }
            },
            addPromotion() {
                if (typeof this.$root.addPromotion === 'function') {
                    this.$root.addPromotion();
                }
            },
            removePromotion(index) {
                if (typeof this.$root.removePromotion === 'function') {
                    this.$root.removePromotion(index);
                }
            },
            handlePromotionImageUpload(event, index) {
                if (typeof this.$root.handlePromotionImageUpload === 'function') {
                    this.$root.handlePromotionImageUpload(event, index);
                }
                event.target.value = '';
            },
            removePromotionImage(index) {
                if (typeof this.$root.removePromotionImage === 'function') {
                    this.$root.removePromotionImage(index);
                }
            },
            addLink() {
                console.log('test')
            }
        }
    });
});
