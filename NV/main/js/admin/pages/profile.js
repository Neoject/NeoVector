NV.ready(function registerProfileComponent() {
    if (!NV.admin) {
        setTimeout(registerProfileComponent, 10);
        return;
    }

    NV.admin.component('profile-params', {
        template: '#profile-template',
        data() {
            return {
                passwordForm: {
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                },
                passwordLoading: false,
                passwordError: '',
                passwordSuccess: ''
            }
        },
        computed: {

        },
        methods: {
            async changePassword() {
                this.passwordError = '';
                this.passwordSuccess = '';

                try {
                    const currentPassword = (this.passwordForm.current_password || '').trim();
                    const newPassword = (this.passwordForm.new_password || '').trim();
                    const confirmPassword = (this.passwordForm.confirm_password || '').trim();

                    if (currentPassword === '' || newPassword === '' || confirmPassword === '') {
                        throw new Error('Все поля обязательны для заполнения');
                    }

                    if (newPassword.length < 6) {
                        throw new Error('Новый пароль должен содержать минимум 6 символов');
                    }

                    if (newPassword !== confirmPassword) {
                        throw new Error('Новый пароль и подтверждение не совпадают');
                    }

                    this.passwordLoading = true;

                    const formData = new FormData();
                    formData.append('action', 'change_password');
                    formData.append('current_password', currentPassword);
                    formData.append('new_password', newPassword);
                    formData.append('confirm_password', confirmPassword);

                    const response = await fetch('../api.php', { 
                        method: 'POST', 
                        body: formData, 
                        credentials: 'same-origin' 
                    });
                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Ошибка смены пароля');
                    }

                    this.passwordSuccess = 'Пароль успешно изменен';
                    this.passwordForm = { 
                        current_password: '', 
                        new_password: '', 
                        confirm_password: '' 
                    };

                    setTimeout(() => {
                        this.passwordSuccess = '';
                    }, 3000);
                } catch (error) {
                    this.passwordError = error.message || 'Ошибка смены пароля';
                } finally {
                    this.passwordLoading = false;
                }
            }
        }
    });
});