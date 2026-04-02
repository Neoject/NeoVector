<script>
export default {
  name: "Auth",
  props: {
    form_action: String,
    username: String,
    remember: Boolean,
    error_message: String
  },
  data() {
    return {
      error: false
    }
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-form" style="text-align:center;">
      <h2>Вход в админ-панель</h2>
      <p style="margin-top:10px;">Только для администраторов.</p>
      <form method="post" :action="form_action" style="max-width:320px; margin:20px auto 0; text-align:left;">
        <input type="hidden" name="action" value="login">
        <div class="form-group">
          <label>Имя пользователя</label>
          <input type="text" name="username" required autocomplete="username"
                 :value="username">
        </div>
        <div class="form-group">
          <label>Пароль</label>
          <input type="password" name="password" required autocomplete="current-password">
        </div>
        <div class="form-group" style="display:flex; align-items:center; gap:10px;">
          <input type="checkbox" id="rememberMe" name="remember" value="1" :checked="remember"
                 style="width:16px; height:16px;">
          <label for="rememberMe" style="margin:0;">Запомнить меня</label>
        </div>
        <template v-if="error">
          <div class="error-message">{{ error_message }}</div>
        </template>
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Войти</button>
      <a class="btn btn-secondary" href="../.." style="margin-left:10px;">На главную</a>
    </div>
    </form>
  </div>
  </div>
</template>

<style scoped>

</style>