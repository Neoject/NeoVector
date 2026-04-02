<script>
import {formatDate} from "./service";

export default {
  name: "Users",
  data() {
    return {
      users: [],
      usersLoading: false,
      usersError: '',
      registerData: { username: '', password: '', role: 'user' },
    }
  },
  mounted() {
    this.loadUsers();
  },
  methods: {
    formatDate,
    openAddUserModal() {},
    async loadUsers() {
      this.usersLoading = true;
      this.usersError = '';

      try {
        const response = await fetch('../api.php?action=users', { credentials: 'same-origin' });
        if (response.ok) {
          const text = await response.text();

          try {
            this.users = JSON.parse(text);
          } catch (e) {
            console.error('Invalid JSON:', text);
            this.usersError = 'Сервер вернул херню, а не JSON';
          }
        } else {
          this.usersError = 'Ошибка загрузки пользователей';
        }
      } catch (error) {
        console.error('Error loading users:', error);
        this.usersError = 'Ошибка загрузки пользователей';
      }

      this.usersLoading = false;
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
  }
}
</script>

<template>
  <div class="admin-content users-content">
    <div class="container users-container">
      <section>
        <div class="content-header">
          <h2>Управление пользователями</h2>
          <div class="header-actions">
            <button @click="openAddUserModal" class="btn btn-primary">
              <i class="fas fa-plus" />
              <span class="btn-text">Создать пользователя</span>
            </button>
            <button @click="loadUsers" class="btn btn-secondary" :disabled="usersLoading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': usersLoading }" />
              <span class="btn-text">Обновить</span>
            </button>
          </div>
        </div>
        <div v-if="usersError" class="error-message">{{ usersError }}</div>
        <div v-if="usersLoading" class="loading-state">
          <i class="fas fa-spinner fa-spin" />
          <p>Загрузка пользователей...</p>
        </div>
        <div v-else-if="users.length === 0" class="empty-state">
          <i class="fas fa-users" />
          <h3>Пользователей пока нет</h3>
          <p>Зарегистрированные пользователи появятся здесь.</p>
        </div>
        <div v-else class="users-list">
          <div class="users-table">
            <table>
              <thead>
              <tr>
                <th>ID</th>
                <th>Имя пользователя</th>
                <th>Роль</th>
                <th>Дата регистрации</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="user in users" :key="user.id || user.username" class="user-row">
                <td>{{ user.id }}</td>
                <td><strong>{{ user.username }}</strong></td>
                <td><span :class="['role-badge', getRoleClass(user.role)]">{{ getRoleLabel(user.role) }}</span></td>
                <td>{{ formatDate(user.created_at) }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>

</style>