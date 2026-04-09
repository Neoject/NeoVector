<script>
import { formatDate } from "./service";
import {api} from "../../server/api";

export default {
  name: "Message",
  props: {
    selectedMessage: {
      type: Object,
      required: true
    }
  },
  emits: ["update:page"],
  data() {
    return {
      replies: [],
      repliesLoading: false
    };
  },
  watch: {
    selectedMessage: {
      handler(newMessage) {
        if (newMessage && newMessage.id) {
          this.loadReplies();
        }
      },
      immediate: true
    }
  },
  methods: {
    formatDate,
    changePage(page) {
      const id = this.selectedMessage?.id != null ? String(this.selectedMessage.id) : null;
      if (this.$router && id) {
        if (page === 'message-reply') {
          this.$router.push({ name: 'admin-message-reply', params: { id } });
          return;
        }
        if (page === 'message') {
          this.$router.push({ name: 'admin-message', params: { id } });
          return;
        }
        if (page === 'messages') {
          this.$router.push({ name: 'admin-messages' });
          return;
        }
      }
      const url = new URL(window.location.href);
      url.searchParams.set("page", page);
      if (id) url.searchParams.set("id", id);
      history.pushState({}, "", url.toString());
      this.$emit("update:page", page);
    },
    async loadReplies() {
      if (!this.selectedMessage?.id) { this.replies = []; return; }
      this.repliesLoading = true;
      try {
        const response = await api.getReplies(this.selectedMessage.id);
        if (response.ok) {
          const result = await response.json();
          this.replies = result.success && result.data ? result.data : [];
        } else { this.replies = []; }
      } catch { this.replies = []; }
      finally { this.repliesLoading = false; }
    },
  }
};
</script>

<template>
  <main class="admin-main">
    <div class="container">
      <section class="messages-section">

        <div class="message-header">
          <button class="btn btn-secondary" @click="changePage('messages')">
            ← Назад к сообщениям
          </button>
          <div class="message-field date">
            <label>Дата отправки:</label>
            <div class="message-value">{{ formatDate(selectedMessage.created_at) }}</div>
          </div>
        </div>
        <div class="message-details">
          <h1>
            Сообщение от
            <a :href="'mailto:' + selectedMessage.email">{{ selectedMessage.email }}</a>
          </h1>
          <div class="message-field">
            <label>Сообщение:</label>
            <div class="message-value message-text">
              {{ selectedMessage.message }}
            </div>
          </div>
        </div>
        <div class="message-replies" v-if="replies.length > 0">
          <h2>Ответы на сообщение ({{ replies.length }})</h2>
          <div class="replies-list">
            <div class="reply-item" v-for="reply in replies" :key="reply.id">
              <div class="reply-header">
                <div class="reply-subject">
                  <strong>{{ reply.subject }}</strong>
                </div>
                <div class="reply-date">{{ formatDate(reply.created_at) }}</div>
              </div>
              <div class="reply-message">{{ reply.message }}</div>
              <div class="reply-to">
                <strong>Ответил:</strong> {{ reply.username }}
              </div>
            </div>
          </div>
        </div>
        <div class="message-footer">
          <button class="btn btn-primary btn-reply" @click="changePage('message-reply')">
            Ответить
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
</style>
