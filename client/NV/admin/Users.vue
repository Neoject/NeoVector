<script>
import {formatDate} from "./service";
import Modal from "../components/Modal.vue";
import {api} from "../../../server/api";
import {setPageTitle} from "../../../server/src/utils";

export default {
  name: "Users",
  components: {Modal},
  inject: ['params'],
  data() {
    return {
      users: [],
      usersLoading: false,
      usersError: '',
      showAddUserModal: false,
      registerLoading: false,
      registerError: '',
      registerSuccess: '',
      registerData: { username: '', password: '', role: 'user' },
    }
  },
  computed: {
    canSubmitRegister() {
      const u = (this.registerData.username || '').trim()
      const p = (this.registerData.password || '').trim()
      return u.length > 0 && p.length > 0 && u.length <= 50
    },
  },
  mounted() {
    setPageTitle(this.params.title, 'пользователи');
    this.loadUsers();
  },
  methods: {
    formatDate,
    openAddUserModal() {
      this.resetRegisterForm()
      this.showAddUserModal = true
    },
    resetRegisterForm() {
      this.registerError = ''
      this.registerSuccess = ''
      this.registerLoading = false
      this.registerData = { username: '', password: '', role: 'user' }
    },
    onAddUserModalClose() {
      this.resetRegisterForm()
    },
    closeAddUserModal() {
      this.showAddUserModal = false
      this.resetRegisterForm()
    },
    async submitRegister() {
      this.registerError = '';
      this.registerSuccess = '';
      const u = (this.registerData.username || '').trim();
      const p = (this.registerData.password || '').trim();

      if (!u || !p) {
        this.registerError = 'Введите логин и пароль';
        return;
      }

      if (u.length > 50) {
        this.registerError = 'Слишком длинное имя пользователя';
        return;
      }

      this.registerLoading = true;

      try {
        const response = await api.register(u, p, this.registerData.role || 'user');
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) throw new Error(data.error || 'Ошибка регистрации');
        this.registerSuccess = 'Пользователь создан успешно';
        await this.loadUsers();
        setTimeout(() => { this.showAddUserModal = false; this.resetRegisterForm(); }, 800);
      } catch (e) {
        this.registerError = e.message || 'Ошибка регистрации';
      } finally {
        this.registerLoading = false;
      }
    },
    async loadUsers() {
      this.usersLoading = true;
      this.usersError = '';

      try {
        const response = await api.getUsers();
        if (response.ok) this.users = await response.json();
        else this.usersError = 'Ошибка загрузки пользователей';
      } catch {
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
  <Modal
    v-model="showAddUserModal"
    modal-id="add-user"
    title="Создать пользователя"
    :resizable="false"
    default-width="370px"
    default-height="436px"
    @close="onAddUserModalClose"
  >
    <form @submit.prevent="submitRegister">
      <div class="form-group">
        <label>Имя пользователя</label>
        <input
          v-model="registerData.username"
          type="text"
          required
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
        >
      </div>
      <div class="form-group">
        <label>Пароль</label>
        <input v-model="registerData.password" type="password" required autocomplete="new-password">
      </div>
      <div class="form-group">
        <label>Роль</label>
        <select v-model="registerData.role">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <div v-if="registerError" class="error-message">{{ registerError }}</div>
      <div v-if="registerSuccess" class="register-success">{{ registerSuccess }}</div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="!canSubmitRegister || registerLoading">
          {{ registerLoading ? 'Создание...' : 'Создать' }}
        </button>
        <button type="button" class="btn btn-secondary" @click="closeAddUserModal">
          Отмена
        </button>
      </div>
    </form>
  </Modal>
</template>

<style scoped>
.users-content { padding: 20px 0; }
.users-container { max-width: 1400px; margin: 0 auto; }

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.content-header h2 {
  color: var(--primary);
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions .btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.header-actions .btn-primary {
  background: linear-gradient(135deg, var(--header-secondary) 0%, var(--header-secondary) 100%);
  color: var(--background);
}

.header-actions .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

.header-actions .btn-secondary {
  background: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
}

.header-actions .btn-secondary:hover:not(:disabled) {
  background: var(--background-additional);
  border-color: var(--border-strong);
}

.header-actions .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.users-list { margin-top: 20px; }

.users-table {
  background: var(--background-secondary);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid var(--border-light);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.users-table thead { background: var(--background-secondary); }

.users-table th {
  padding: 18px 20px;
  text-align: left;
  color: var(--primary);
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid rgba(255, 237, 179, 0.2);
  position: relative;
}

.users-table th:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  height: 60%;
  width: 1px;
  background: var(--background-secondary);
}

.users-table tbody tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.users-table tbody tr:last-child { border-bottom: none; }
.users-table tbody tr:hover {
  background: var(--background-additional);
  transform: translateX(4px);
}

.users-table tbody tr.user-row { cursor: default; }

.users-table td {
  padding: 18px 20px;
  color: var(--text-primary);
  font-size: 14px;
  vertical-align: middle;
}

.users-table td:first-child {
  color: var(--text-additional-dark);
  font-weight: 500;
  font-size: 13px;
  width: 80px;
}

.users-table td:nth-child(2) { font-weight: 500; }
.users-table td:nth-child(2) strong { color: var(--text-primary); font-size: 15px; }
.users-table td:nth-child(3) { width: 180px; }
.users-table td:nth-child(4) {
  color: var(--text-additional-light);
  font-size: 13px;
  width: 220px;
}

.role-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.role-badge.role-admin {
  background: linear-gradient(135deg, var(--error-red-alt) 0%, var(--error-bg) 100%);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(238, 90, 111, 0.3);
}

.role-badge.role-admin:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 90, 111, 0.4);
}

.role-badge.role-user {
  background: linear-gradient(135deg, var(--background) 0%, var(--background-additional) 100%);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(68, 160, 141, 0.3);
}

.role-badge.role-user:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(68, 160, 141, 0.4);
}

@media (max-width: 768px) {
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .header-actions .btn {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }

  .users-table { overflow-x: auto; }
  .users-table table { min-width: 600px; }
  .users-table th,
  .users-table td {
    padding: 12px 15px;
    font-size: 13px;
  }
}

.register-success {
  color: var(--success-text);
  margin-top: 10px;
  font-size: 14px;
}
</style>