<script>
import {formatDate} from "./service";
import Message from "./Message.vue";
import Reply from "./Reply.vue";

export default {
  name: "Mail",
  components: { Reply, Message },
  props: {
    page: {
      type: String,
      default: '',
    },
  },
  emits: ['update:page'],
  data() {
    return {
      showMessageModal: false,
      messages: [],
      selectedMessage: null,
    }
  },
  mounted() {
    this.getMessages().then(() => this.syncSelectedFromUrl())
  },
  watch: {
    page() {
      this.syncSelectedFromUrl()
    },
    messages() {
      this.syncSelectedFromUrl()
    },
  },
  methods: {
    formatDate,
    syncSelectedFromUrl() {
      const params = new URLSearchParams(location.search)
      const pageParam = params.get('page') || this.page
      const id = params.get('id')
      if (!id || !this.messages?.length) return
      if (pageParam !== 'message' && pageParam !== 'message-reply') return
      const found = this.messages.find((m) => String(m.id) === String(id))
      if (found) this.selectedMessage = found
    },
    onChildUpdatePage(next) {
      this.$emit('update:page', next)
      if (next === 'messages') {
        this.selectedMessage = null
      }
    },
    async getMessages () {
      try {
        const response = await fetch('../api.php?action=messages', { credentials: 'same-origin' });
        if (response.ok) {
          const res = await response.json();

          if (res.success && res.data) {
            this.messages = res.data;
          } else if (Array.isArray(res)) {
            this.messages = res;
          }
        }
      } catch (e) {
        console.error('Error loading messages', e);
      }
    },
    openMessageModal(message) {
      this.selectedMessage = message;
      this.showMessageModal = true;
    },
    closeMessageModal() {
      this.showMessageModal = false;
      this.selectedMessage = null;
    },
    openMessage(message) {
      this.selectedMessage = message
      const url = new URL(window.location.href)
      url.searchParams.set('page', 'message')
      url.searchParams.set('id', String(message.id))
      history.pushState({}, '', url.toString())
      this.$emit('update:page', 'message')
    },
    openReply(message) {
      this.selectedMessage = message
      const url = new URL(window.location.href)
      url.searchParams.set('page', 'message-reply')
      url.searchParams.set('id', String(message.id))
      history.pushState({}, '', url.toString())
      this.$emit('update:page', 'message-reply')
    },
    async deleteMessage(message) {
      if (!message || !message.id) return;
      if (!confirm('Удалить это сообщение? Действие необратимо.')) return;

      try {
        const formData = new FormData();

        formData.append('action', 'delete_message');
        formData.append('id', message.id);

        const response = await fetch('../api.php', {
          method: 'POST',
          body: formData,
          credentials: 'same-origin'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            this.messages = this.messages.filter(m => m.id !== message.id);
            if (this.selectedMessage && this.selectedMessage.id === message.id) {
              this.selectedMessage = null
              this.$emit('update:page', 'messages')
            }
          }
        } else {
          const err = await response.json().catch(() => ({}));
          alert(err.error || 'Ошибка при удалении сообщения');
        }
      } catch (e) {
        console.error('Error deleting message', e);
        alert('Ошибка при удалении сообщения');
      }
    }
  }
}
</script>

<template>
  <main v-if="page === 'messages'" class="admin-main">
    <div class="container">
      <section class="messages-section">
        <h1>Сообщения с формы обратной связи</h1>
        <div v-if="!messages || messages.length === 0" class="empty-state">
          Сообщений пока нет.
        </div>
        <table v-else class="table user-messages-table">
          <thead>
          <tr>
            <th>Отправитель</th>
            <th>Почта отправителя</th>
            <th>Дата</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          <tr class="user-message" v-for="message in messages" :key="message.id"
              @click="openMessage(message)"
              style="cursor: pointer;">
            <td>{{ message.name }}</td>
            <td>
              <a :href="'?page=message&id=' + message.id" @click.prevent="openMessage(message)" style="color: inherit; text-decoration: none;">
                {{ message.email }}
              </a>
            </td>
            <td>{{ formatDate(message.created_at) }}</td>
            <td>
              <button type="button" class="btn btn-sm btn-primary" @click.stop="openReply(message)" title="Ответить">
                <i class="fas fa-reply"></i>
              </button>
              <button type="button" class="btn btn-sm btn-delete" @click.stop="deleteMessage(message)" title="Удалить">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </section>
    </div>
  </main>
  <main v-else-if="page === 'message' && !selectedMessage" class="admin-main">
    <div class="container">
      <p>Загрузка сообщения…</p>
    </div>
  </main>
  <main v-else-if="page === 'message-reply' && !selectedMessage" class="admin-main">
    <div class="container">
      <p>Загрузка…</p>
    </div>
  </main>
  <Message
    v-else-if="page === 'message' && selectedMessage"
    :selected-message="selectedMessage"
    @update:page="onChildUpdatePage"
  />
  <Reply
    v-else-if="page === 'message-reply' && selectedMessage"
    :selected-message="selectedMessage"
    @update:page="onChildUpdatePage"
  />
</template>

<style scoped>
.message-replies {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid var(--border-light, rgba(255, 255, 255, 0.1));
}

.message-replies h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-replies h2::before {
  content: "💬";
  font-size: 24px;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reply-item {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
  border: 1px solid var(--border-secondary, rgba(255, 215, 0, 0.3));
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.reply-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, var(--header-secondary, #ffd700) 0%, rgba(255, 215, 0, 0.5) 100%);
}

.reply-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.15);
  border-color: var(--border-secondary, rgba(255, 215, 0, 0.5));
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 15px;
  flex-wrap: wrap;
}

.reply-subject {
  flex: 1;
  min-width: 200px;
  font-size: 16px;
  color: var(--header-secondary, #ffd700);
  font-weight: 600;
  line-height: 1.4;
}

.reply-subject strong {
  color: var(--header-secondary, #ffd700);
  font-weight: 600;
}

.reply-date {
  font-size: 13px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.reply-date::before {
  content: "🕒";
  font-size: 14px;
}

.reply-message {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  color: var(--text-primary, #fff);
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
  border-left: 3px solid var(--header-secondary, #ffd700);
}

.reply-to {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.reply-to::before {
  content: "👤";
  font-size: 14px;
}

.reply-to strong {
  color: var(--text-primary, #fff);
  font-weight: 500;
}

.user-messages-table {
  width: 100%;
  border-collapse: collapse;
}

.user-messages-table th,
.user-messages-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.user-messages-table .user-message {
  transition: background-color 0.2s ease;
}

.user-messages-table .user-message:hover {
  background-color: var(--table-element-hover);
}

.message-details {
  padding: 20px;
}

.message-field {
  margin-bottom: 20px;
}

.message-field label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--primary);
}

.message-value {
  color: #666;
  word-wrap: break-word;
}

.message-value a {
  color: #007bff;
  text-decoration: none;
}

.message-value a:hover {
  text-decoration: underline;
}

.message-text {
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.6;
  user-select: text;
  white-space: pre-wrap;
  color: var(--secondary);
  padding: 10px;
  background: var(--background);
  border: 1px solid var(--secondary);
  border-radius: 4px;
}

.message-header {
  display: flex;
  width: -webkit-fill-available;
}

.message-field.date {
  margin-left: auto;
}

.message-field.date label {
  color: var(--primary);
}

@media (max-width: 768px) {
  .message-replies {
    margin-top: 20px;
    padding-top: 20px;
  }

  .message-replies h2 {
    font-size: 18px;
  }

  .reply-item {
    padding: 16px;
  }

  .reply-header {
    flex-direction: column;
    gap: 8px;
  }

  .reply-subject {
    min-width: 100%;
    font-size: 15px;
  }

  .reply-date {
    font-size: 12px;
  }

  .reply-message {
    padding: 12px;
    font-size: 13px;
  }

  .reply-to {
    font-size: 12px;
  }
}
</style>