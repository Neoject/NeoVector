<script>
import { login } from './components/auth';
import {setPageTitle} from "../../server/src/utils";

export default {
  name: 'AdminLogin',
  inject: ['params'],
  data() {
    return {
      username: '',
      password: '',
      error: '',
      remember: false,
    };
  },
  mounted() {
    setPageTitle(this.params.title, 'вход в панель администратора')
  },
  methods: {
    async submit() {
      this.error = '';
      const result = await login(this.username, this.password);

      if (result.success && result.role === 'admin') {
        this.$router.push('/admin');
      } else if (result.success) {
        this.error = 'Нет прав администратора';
      } else {
        this.error = result.error;
      }
    },
  },
};
</script>

<template>
  <div class="login-container">
    <div class="login-form" style="text-align:center;">
      <h2>Вход в админ-панель</h2>
      <div class="form-group">
        <label>Имя пользователя</label>
        <input v-model="username"
               type="text"
               required
               autocomplete="username"
               @keyup.enter="submit"
        />
      </div>
      <div class="form-group">
        <label>Пароль</label>
        <input v-model="password"
               type="password"
               required
               autocomplete="current-password"
               @keyup.enter="submit"
        />
      </div>
      <div class="form-group" style="display:flex; align-items:center; gap:10px;">
        <input type="checkbox"
               id="rememberMe"
               name="remember"
               value="1"
               :checked="remember"
               style="width:16px; height:16px; padding: 12px">
        <label for="rememberMe" style="margin:0;">Запомнить меня</label>
      </div>
      <p v-if="error" class="error-message">{{ error }}</p>
      <button class="btn btn-primary" @click="submit">Войти</button>
      <a class="btn btn-secondary" href="/" style="margin-left:10px;">На главную</a>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background);
  padding: 20px;
}
.login-form {
  background: var(--background-secondary);
  backdrop-filter: blur(10px);
  -webkit-border-radius: 15px;
  border-radius: 15px;
  padding: 40px;
  border: 1px solid var(--border-light);
  max-width: 400px;
  width: 100%;
  text-align: center;
}
.login-form h2 {
  color: var(--primary);
  margin-bottom: 30px;
  font-size: 28px;
}
.login-form .form-group {
  margin-bottom: 20px;
}
.login-form input {
  width: 100%;
  padding: 15px 20px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 16px;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}
.login-form input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--background-secondary);
  box-shadow: 0 0 0 2px var(--border-light);
}
.login-form input::placeholder {
  color: var(--text-secondary);
}
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background);
  padding: 20px;
}
.login-form {
  background: var(--background-secondary);
  backdrop-filter: blur(10px);
  -webkit-border-radius: 15px;
  border-radius: 15px;
  padding: 40px;
  border: 1px solid var(--border-light);
  max-width: 400px;
  width: 100%;
  text-align: center;
}
.login-form h2 {
  color: var(--primary);
  margin-bottom: 30px;
  font-size: 28px;
}
.login-form .form-group {
  margin-bottom: 20px;
}
.login-form input {
  width: 100%;
  padding: 15px 20px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 16px;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}
.login-form input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--background-secondary);
  box-shadow: 0 0 0 2px var(--border-light);
}
.login-form input::placeholder {
  color: var(--text-secondary);
}
.error-message {
  color: var(--error-red-alt);
  margin-top: 15px;
  font-size: 14px;
}
</style>