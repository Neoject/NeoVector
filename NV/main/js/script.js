NV.ready(() => {
    const { createApp } = Vue;

    createApp({
        mixins: [Props],
        components: {
            'hero': Hero,
            'actual': Actual,
            'products': Products,
            'features': Features,
            'buttons': Buttons,
            'history': History,
            'text-block': Text,
            'stats': Stats,
            'contact': Contact,
            'info-buttons': InfoButtons
        },
        data() {
            return {
                mobileMenuOpen: false,
                currentVirtualPage: null,
                virtualPageError: null,
                currentProduct: null,
                pageBlocks: [],
                sortedPageBlocks: [],

            }
        },
        methods: {
            goHome(options = {}) {
                const {updateHistory = true, scrollToTop = true} = options;
                this.currentVirtualPage = null;
                this.virtualPageError = null;
                this.currentProduct = null;
                // this.headerNavigation.other = [];

                if (scrollToTop) {
                    window.scrollTo({top: 0, behavior: 'smooth'});
                }

                const basePath = this.getBasePath();
                if (updateHistory && window.history && window.history.pushState) {
                    window.history.pushState({page: null}, '', basePath);
                }

                this.loadPageBlocks().then(() => {
                    this.updateSortedPageBlocks();

                    this.$nextTick(() => {
                        this.showAllElementsOnLoad();
                        this.checkScrollAnimations();
                    });
                });
            },
            updateSortedPageBlocks() {
                if (!Array.isArray(this.pageBlocks)) {
                    this.sortedPageBlocks = [];
                    return;
                }

                const regularBlocks = this.pageBlocks.filter(b => b.type !== 'footer' && b.type !== 'info_buttons' && b.is_active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                const infoButtonsBlocks = this.pageBlocks.filter(b => b.type === 'info_buttons' && b.is_active);
                const footerBlocks = this.pageBlocks.filter(b => b.type === 'footer' && b.is_active);

                let sorted = [...regularBlocks];

                if (infoButtonsBlocks.length > 0) {
                    const infoButtons = infoButtonsBlocks.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
                    sorted.push(infoButtons);
                }

                if (footerBlocks.length > 0) {
                    const footer = footerBlocks.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
                    sorted.push(footer);
                }

                this.sortedPageBlocks = sorted;
            },
        }
    }).mount('#app')
})