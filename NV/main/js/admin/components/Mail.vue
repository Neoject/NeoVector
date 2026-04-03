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

</style>