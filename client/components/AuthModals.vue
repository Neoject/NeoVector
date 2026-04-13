<script>
import Modal from "./Modal.vue";
import {login, register} from "./auth";

export default {
  name: "Auth",
  components: { Modal },
  emits: ['auth-changed'],
  data() {
    return {
      // login
      showLogin: false,
      loginData: { username: '', password: '', remember: false },
      loginLoading: false,
      loginError: '',
      // register
      showRegister: false,
      registerData: { username: '', password: '', confirmPassword: '' },
      registerLoading: false,
      registerError: '',
    };
  },
  methods: {
    // ── login ──────────────────────────────────────────────────────
    openLogin() {
      this.loginError = '';
      this.showRegister = false;
      this.showLogin = true;
    },
    closeLogin() {
      this.showLogin = false;
      this.loginData = { username: '', password: '', remember: false };
      this.loginError = '';
    },
    goToRegister() {
      this.closeLogin();
      this.openRegister();
    },
    async doLogin() {
      this.loginError = '';
      this.loginLoading = true;

      try {
        const result = await login(this.loginData.username, this.loginData.password, this.loginData.remember);

        if (result.success) {
          this.$emit('auth-changed');
          this.closeLogin();
          window.location.reload();
        } else {
          this.loginError = result.error || 'Ошибка входа';
        }
      } catch (err) {
        this.loginError = err.message || 'Ошибка входа';
      } finally {
        this.loginLoading = false;
      }
    },
    // ── register ───────────────────────────────────────────────────
    openRegister() {
      this.registerError = '';
      this.showLogin = false;
      this.showRegister = true;
    },
    closeRegister() {
      this.showRegister = false;
      this.registerData = { username: '', password: '', confirmPassword: '' };
      this.registerError = '';
    },
    goToLogin() {
      this.closeRegister();
      this.openLogin();
    },
    async doRegister() {
      this.registerError = '';
      const { username, password, confirmPassword } = this.registerData;
      const normalizedUsername = username.trim();

      if (!normalizedUsername || !password) {
        this.registerError = 'Введите логин и пароль'; return;
      }

      if (password.length < 6) {
        this.registerError = 'Пароль должен быть не короче 6 символов'; return;
      }

      if (password !== confirmPassword) {
        this.registerError = 'Пароли не совпадают'; return;
      }

      this.registerLoading = true;

      try {
        const result = await register(normalizedUsername, password, 'user');

        if (!result.success) {
          this.registerError = result.error || 'Ошибка регистрации'; return;
        }

        const loginResult = await login(normalizedUsername, password, false);

        if (!loginResult.success) {
          this.registerError = loginResult.error || 'Аккаунт создан, но автоматический вход не выполнен';
          return;
        }

        this.$emit('auth-changed');
        this.closeRegister();
        window.location.reload();
      } catch (err) {
        this.registerError = err.message || 'Ошибка регистрации';
      } finally {
        this.registerLoading = false;
      }
    },
  },
};
</script>

<template>
  <!-- Вход -->
  <Modal
      v-model="showLogin"
      modal-id="auth-login"
      title="Вход"
      default-width="440px"
      default-height="420px"
      :show-controls="false"
      :resizable="false"
      @close="closeLogin"
  >
    <div class="form-group">
      <label>Логин</label>
      <input v-model.trim="loginData.username" type="text" placeholder="Введите логин" />
    </div>
    <div class="form-group">
      <label>Пароль</label>
      <input v-model="loginData.password" type="password" placeholder="Введите пароль"
             @keyup.enter="doLogin" />
    </div>
    <div class="form-group" style="display:flex;align-items:center;gap:8px;">
      <input id="remember-me" v-model="loginData.remember" type="checkbox" style="width:auto;" />
      <label for="remember-me" style="margin:0;">Запомнить меня</label>
    </div>
    <p v-if="loginError" class="error-message">{{ loginError }}</p>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;">
      <button class="btn btn-outline" @click="closeLogin">Отмена</button>
      <button class="btn btn-primary" :disabled="loginLoading" @click="doLogin">
        {{ loginLoading ? 'Входим…' : 'Войти' }}
      </button>
    </div>
    <p style="margin-top:14px;">
      Нет аккаунта? <a href="#" @click.prevent="goToRegister">Зарегистрироваться</a>
    </p>
  </Modal>

  <!-- Регистрация -->
  <Modal
      v-model="showRegister"
      modal-id="auth-register"
      title="Регистрация"
      default-width="440px"
      default-height="480px"
      :show-controls="false"
      :resizable="false"
      @close="closeRegister"
  >
    <div class="form-group">
      <label>Логин</label>
      <input v-model.trim="registerData.username" type="text" placeholder="Придумайте логин" />
    </div>
    <div class="form-group">
      <label>Пароль</label>
      <input v-model="registerData.password" type="password" placeholder="Минимум 6 символов" />
    </div>
    <div class="form-group">
      <label>Подтвердите пароль</label>
      <input v-model="registerData.confirmPassword" type="password" placeholder="Повторите пароль"
             @keyup.enter="doRegister" />
    </div>
    <p v-if="registerError" class="error-message">{{ registerError }}</p>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;">
      <button class="btn btn-outline" @click="closeRegister">Отмена</button>
      <button class="btn btn-primary" :disabled="registerLoading" @click="doRegister">
        {{ registerLoading ? 'Регистрируем…' : 'Зарегистрироваться' }}
      </button>
    </div>
    <p style="margin-top:14px;">
      Уже есть аккаунт? <a href="#" @click.prevent="goToLogin">Войти</a>
    </p>
  </Modal>
</template>

<style>
.error-message {
  color: var(--error-red-alt);
  margin-top: 15px;
  font-size: 14px;
}
</style>