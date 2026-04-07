<script>
export default {
  name: "Profile",
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
  methods: {
    openProfileModal() {
      this.showProfileModal = true;
      this.profileError = '';
      this.profileSuccess = '';
      this.passwordError = '';
      this.passwordSuccess = '';
      this.loadProfile().then(r => null);
    },
    closeProfileModal() {
      this.showProfileModal = false;
      this.profileForm = { username: '', role: '', created_at: '' };
      this.passwordForm = { current_password: '', new_password: '', confirm_password: '' };
      this.profileError = '';
      this.profileSuccess = '';
      this.passwordError = '';
      this.passwordSuccess = '';
    },
    async loadProfile() {
      try {
        const response = await fetch('../api.php?action=get_profile', { credentials: 'same-origin' });
        const data = await response.json();
        if (response.ok && data.success) {
          this.profileForm = {
            username: data.user.username || '',
            role: data.user.role || '',
            created_at: data.user.created_at || ''
          };
        } else {
          this.profileError = data.error || 'Ошибка загрузки профиля';
        }
      } catch (error) {
        this.profileError = 'Ошибка загрузки профиля: ' + error.message;
      }
    },
    async updateProfile() {
      this.profileError = '';
      this.profileSuccess = '';

      try {
        const username = (this.profileForm.username || '').trim();

        if (username === '') {
          throw new Error('Имя пользователя не может быть пустым');
        }

        if (username.length > 50) {
          throw new Error('Имя пользователя слишком длинное');
        }

        this.profileLoading = true;

        const formData = new FormData();
        formData.append('action', 'update_profile');
        formData.append('username', username);

        const response = await fetch('../api.php', { method: 'POST', body: formData, credentials: 'same-origin' });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Ошибка обновления профиля');
        }

        this.profileSuccess = 'Профиль успешно обновлен';

        if (typeof NV !== 'undefined' && NV.getAuth && NV.setAuth) {
          const auth = NV.getAuth();
          auth.username = username;
          NV.setAuth(auth);
        }

        setTimeout(() => {
          this.profileSuccess = '';
        }, 3000);
      } catch (error) {
        this.profileError = error.message || 'Ошибка обновления профиля';
      } finally {
        this.profileLoading = false;
      }
    },
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
}
</script>

<template>
  <div class="admin-content">
    <main class="profile">
      <div class="container">
        <section class="profile">
          <h2>Смена пароля</h2>
          <form class="password-change-form" @submit.prevent="changePassword">
            <div class="form-group">
              <label>Текущий пароль</label>
              <input type="password" v-model="passwordForm.current_password"
                     placeholder="Введите текущий пароль"
                     required
                     autocomplete="current-password">
            </div>
            <div class="form-group">
              <label>Новый пароль</label>
              <input type="password" v-model="passwordForm.new_password"
                     placeholder="Введите новый пароль (минимум 6 символов)"
                     required
                     autocomplete="new-password"
                     minlength="6">
            </div>
            <div class="form-group">
              <label>Подтвердите новый пароль</label>
              <input type="password" v-model="passwordForm.confirm_password"
                     placeholder="Повторите новый пароль"
                     required
                     autocomplete="new-password"
                     minlength="6">
            </div>
            <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
            <div v-if="passwordSuccess" class="success-message">{{ passwordSuccess }}</div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="passwordLoading">
                <span v-if="passwordLoading">Сохранение...</span>
                <span v-else>Изменить пароль</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>

</style>