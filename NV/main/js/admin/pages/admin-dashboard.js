NV.ready(function registerAdminDashboardComponent() {
    if (!NV.admin) {
        setTimeout(registerAdminDashboardComponent, 10);
        return;
    }
    NV.admin.component('admin-dashboard-view', {
        template: '#admin-dashboard-template',
        computed: {
            root() {
                return this.$root;
            }
        },
        methods: {
            triggerFileUpload() {
                if (this.$refs.fileInput) this.$refs.fileInput.click();
            },
            triggerAdditionalImagesUpload() {
                if (this.$refs.additionalImagesInput) this.$refs.additionalImagesInput.click();
            }
        }
    });
});
