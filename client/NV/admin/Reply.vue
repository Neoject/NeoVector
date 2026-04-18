<script>
import { formatDate } from "./service";
import {api} from "../../../server/api";

export default {
  name: "Reply",
  props: {
    selectedMessage: {
      type: Object,
      required: true
    }
  },
  emits: ["update:page"],
  data() {
    return {
      replySubject: "",
      replyMessage: "",
      replyLoading: false,
      replyError: "",
      replySuccess: ""
    };
  },
  mounted() {
    if (!this.selectedMessage?.id) return;
    const id = String(this.selectedMessage.id);
    if (this.$router) {
      if (this.$route.params.id !== id || this.$route.name !== 'admin-message-reply') {
        this.$router.replace({ name: 'admin-message-reply', params: { id } });
      }
      return;
    }
    const url = new URL(window.location.href);
    const currentId = url.searchParams.get("id");
    if (currentId !== id) {
      url.searchParams.set("page", "message-reply");
      url.searchParams.set("id", id);
      history.pushState({}, "", url.toString());
    }
  },
  methods: {
    formatDate,
    changePage(page) {
      const id = this.selectedMessage?.id != null ? String(this.selectedMessage.id) : null;
      if (this.$router && id) {
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
    handleBack() {
      if (this.replyLoading) return;

      const hasUnsavedData = this.replySubject.trim() || this.replyMessage.trim();
      if (hasUnsavedData) {
        if (confirm("Данные ответа не будут сохранены")) {
          this.changePage("message");
        }
      } else {
        this.changePage("message");
      }
    },
    async sendReply() {
      if (!this.selectedMessage) {
        this.replyError = "Сообщение не выбрано";
        return;
      }

      if (!this.replySubject.trim()) {
        this.replyError = "Тема письма обязательна";
        return;
      }

      if (!this.replyMessage.trim()) {
        this.replyError = "Текст ответа обязателен";
        return;
      }

      this.replyLoading = true;
      try {
        const response = await api.sendReply({
          messageId: this.selectedMessage.id,
          to: this.selectedMessage.email,
          subject: this.replySubject.trim(),
          message: this.replyMessage.trim(),
        });

        const result = await response.json();

        if (result.success) {
          this.replySuccess = 'Ответ успешно отправлен!';
          this.replySubject = ''; this.replyMessage = '';
          setTimeout(() => this.changePage('message'), 2000);
        } else {
          this.replyError = result.error || 'Ошибка';
        }
      } catch {
        this.replyError = 'Ошибка при отправке ответа.';
      } finally {
        this.replyLoading = false;
      }
    }
  }
};
</script>

<template>
  <main class="admin-main">
    <div class="container">
      <section class="messages-section">

        <div class="message-header">
          <button class="btn btn-secondary" @click="handleBack">
            ← Назад
          </button>
          <div class="message-field date">
            <label>Дата отправки:</label>
            <div class="message-value">{{ formatDate(selectedMessage.created_at) }}</div>
          </div>
        </div>
        <div class="message-details">
          <h1>
            Ответить на сообщение от
            <a :href="'mailto:' + selectedMessage.email">{{ selectedMessage.email }}</a>
          </h1>
          <div class="message-field">
            <label>Исходное сообщение:</label>
            <div class="message-value message-text">
              {{ selectedMessage.message }}
            </div>
          </div>
        </div>
        <div class="message-reply-form">
          <form @submit.prevent="sendReply">
            <div class="form-group">
              <label for="reply-subject">
                Тема письма <span style="color: red;">*</span>
              </label>
              <input
                  id="reply-subject"
                  type="text"
                  v-model="replySubject"
                  :disabled="replyLoading"
                  placeholder="Введите тему письма"
                  required
              />
            </div>
            <div class="form-group">
              <label for="reply-message">
                Текст ответа <span style="color: red;">*</span>
              </label>
              <textarea
                  id="reply-message"
                  v-model="replyMessage"
                  :disabled="replyLoading"
                  placeholder="Введите текст ответа"
                  rows="10"
                  required
              ></textarea>
            </div>
            <div v-if="replyError" class="error-message">{{ replyError }}</div>
            <div v-if="replySuccess" class="success-message">{{ replySuccess }}</div>
            <div class="message-footer">
              <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="replyLoading || !replySubject.trim() || !replyMessage.trim()"
              >
                <span v-if="replyLoading">Отправка...</span>
                <span v-else>Отправить ответ</span>
              </button>
              <button
                  type="button"
                  class="btn btn-secondary"
                  @click="changePage('message')"
                  :disabled="replyLoading"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
</style>
