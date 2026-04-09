<script>
import {api} from "../../server/api";
import {setPageTitle} from "../../server/src/utils";

export default {
  name: "Profile",
  inject: ['params'],
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
  mounted() {
    setPageTitle(this.params.title, 'профиль');
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
        const response = await api.getProfile();
        const data = await response.json();
        if (response.ok && data.success) {
          this.profileForm = { username: data.user.username || '', role: data.user.role || '', created_at: data.user.created_at || '' };
        } else { this.profileError = data.error || 'Ошибка загрузки профиля'; }
      } catch (error) { this.profileError = 'Ошибка загрузки профиля'; }
    },
    async updateProfile() {
      this.profileError = ''; this.profileSuccess = '';

      try {
        const username = (this.profileForm.username || '').trim();
        if (!username) throw new Error('Имя пользователя не может быть пустым');
        this.profileLoading = true;
        const response = await api.updateProfile(username);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Ошибка обновления профиля');
        this.profileSuccess = 'Профиль успешно обновлен';
        setTimeout(() => { this.profileSuccess = ''; }, 3000);
      } catch (error) {
        this.profileError = error.message;
      } finally {
        this.profileLoading = false;
      }
    },
    async changePassword() {
      this.passwordError = ''; this.passwordSuccess = '';
      const { current_password, new_password, confirm_password } = this.passwordForm;
      try {
        if (!current_password?.trim() || !new_password?.trim() || !confirm_password?.trim())
          throw new Error('Все поля обязательны');
        if (new_password.length < 6) throw new Error('Минимум 6 символов');
        if (new_password !== confirm_password) throw new Error('Пароли не совпадают');
        this.passwordLoading = true;
        const response = await api.changePassword(current_password, new_password, confirm_password);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Ошибка смены пароля');
        this.passwordSuccess = 'Пароль успешно изменен';
        this.passwordForm = { current_password: '', new_password: '', confirm_password: '' };
        setTimeout(() => { this.passwordSuccess = ''; }, 3000);
      } catch (error) { this.passwordError = error.message; }
      finally { this.passwordLoading = false; }
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