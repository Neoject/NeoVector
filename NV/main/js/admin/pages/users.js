NV.ready(function registerUsersComponent() {
    if (!NV.admin) {
        setTimeout(registerUsersComponent, 10);
        return;
    }

    NV.admin.component('users-list', {
        template: '#users-template',
        computed: {
            users() {
                return this.$root.users;
            },
            usersLoading() {
                return this.$root.usersLoading;
            },
            usersError() {
                return this.$root.usersError;
            },
            registerSuccess() {
                return this.$root.registerSuccess || '';
            }
        },
        watch: {
            registerSuccess(newVal) {
                if (newVal && newVal.includes('успешно')) {
                    setTimeout(() => {
                        this.loadUsers();
                    }, 1000);
                }
            }
        },
        methods: {
            openAddUserModal() {
                const root = this.$root;
                if (!root) {
                    console.error('Root component not available');
                    return;
                }
                
                if (root.openAddUserModal && typeof root.openAddUserModal === 'function') {
                    root.openAddUserModal();
                } else if (root.openModal && typeof root.openModal === 'function') {
                    root.openModal('addUserModal', {
                        showProperty: 'showAddUser',
                        mobilePage: 'user'
                    });
                } else {
                    root.showAddUser = true;
                }
            },
            async loadUsers() {
                if (typeof this.$root.loadUsers === 'function') {
                    await this.$root.loadUsers();
                }
            },
            formatDate(dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            },
            getRoleLabel(role) {
                const roles = {
                    'admin': 'Администратор',
                    'user': 'Пользователь'
                };
                return roles[role] || role;
            },
            getRoleClass(role) {
                return role === 'admin' ? 'role-admin' : 'role-user';
            }
        },
        mounted() {
            this.loadUsers();
        }
    });
});