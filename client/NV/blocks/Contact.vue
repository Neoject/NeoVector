<script >
import {api} from "../../../server/api";

export default {
  name: "Contact",
  props: {
    block: {
      type: Object,
      default: {
        id: 0,
        type: '',
        settings: ''
      }
    },
    isInView: Function,
  },
  data() {
    return {
      contactLoading: false,
      contactError: '',
      contactSuccess: '',
      contactForm: {
        name: '',
        email: '',
        message: ''
      },
    }
  },
  methods: {
    links(e) {
      return e && Object.values(e).some(link => link && link.trim() !== '');
    },
    async submit() {
      if (this.contactLoading) {
        return;
      }

      this.contactError = '';
      this.contactSuccess = '';

      const name = (this.contactForm.name || '').trim();
      const email = (this.contactForm.email || '').trim();
      const message = (this.contactForm.message || '').trim();

      if (!name || !email || !message) {
        this.contactError = 'Пожалуйста, заполните имя, email и сообщение';
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        this.contactError = 'Введите корректный email';
        return;
      }

      if (name.length > 200) {
        this.contactError = 'Имя слишком длинное';
        return;
      }

      if (message.length < 10) {
        this.contactError = 'Сообщение должно содержать не менее 10 символов';
        return;
      }

      if (message.length > 2000) {
        this.contactError = 'Сообщение слишком длинное';
        return;
      }

      this.contactLoading = true;

      try {
        const response = await api.sendContact(name, email, message);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Не удалось отправить сообщение');
        }

        this.contactSuccess = result.message || 'Сообщение отправлено. Мы скоро свяжемся с вами!';
        this.contactForm = { name: '', email: '', message: '' };
      } catch (error) {
        this.contactError = error.message || 'Не удалось отправить сообщение';
      } finally {
        this.contactLoading = false;
      }
    },
  }
}
</script>

<template>
  <section v-if="block && block.type === 'contact'" id="contact">
    <div class="container">
      <h2 v-if="block.settings.sectionTitle" class="section-title scroll-animate"
          :class="{ 'animated': isInView('contact-title-' + block.id), 'hidden': !isInView('contact-title-' + block.id) }"
          :id="'contact-title-' + block.id">{{ block.settings.sectionTitle }}</h2>
      <div class="contact-info">
        <div class="contact-details-card scroll-animate"
             :class="{ 'animated': isInView('contact-panel-' + block.id), 'hidden': !isInView('contact-panel-' + block.id) }"
             :id="'contact-panel-' + block.id">
          <div class="contact-details">
            <div v-if="block.settings.email" class="contact-item" :id="'contact-email-' + block.id">
              <i class="fas fa-envelope"></i>
              <a :href="'mailto:' + block.settings.email">{{ block.settings.email }}</a>
            </div>
            <div v-if="block.settings.phone" class="contact-item" :id="'contact-phone-' + block.id">
              <i class="fas fa-phone"></i>
              <a :href="'tel:' + block.settings.phone">{{ block.settings.phone }}</a>
            </div>
            <div v-if="block.settings.address" class="contact-item"
                 :id="'contact-address-' + block.id">
              <i class="fas fa-map-marker-alt"></i>
              <span>{{ block.settings.address }}</span>
            </div>
          </div>
          <div v-if="links(block.settings.socialLinks)"
               class="social-links contact-social-links">
            <a v-if="block.settings.socialLinks.instagram"
               :href="block.settings.socialLinks.instagram" target="_blank" class="social-link"
               aria-label="Instagram">
              <i class="fab fa-instagram"></i>
            </a>
            <a v-if="block.settings.socialLinks.tiktok" :href="block.settings.socialLinks.tiktok"
               target="_blank" class="social-link" aria-label="TikTok">
              <i class="fab fa-tiktok"></i>
            </a>
            <a v-if="block.settings.socialLinks.telegram"
               :href="block.settings.socialLinks.telegram" target="_blank" class="social-link"
               aria-label="Telegram">
              <i class="fab fa-telegram"></i>
            </a>
          </div>
        </div>
        <div class="contact-form-card scroll-animate"
             :class="{ 'animated': isInView('contact-form-' + block.id), 'hidden': !isInView('contact-form-' + block.id) }"
             :id="'contact-form-' + block.id">
          <h3>Напишите нам</h3>
          <p>Оставьте имя, email и короткое сообщение, и мы свяжемся с вами в ближайшее время.</p>
          <form class="contact-form" @submit.prevent="submit">
            <div class="form-group">
              <label for="contact-name">Ваше имя *</label>
              <input
                  id="contact-name"
                  type="text"
                  class="form-control"
                  v-model.trim="contactForm.name"
                  required
                  :disabled="contactLoading"
                  autocomplete="name"
                  placeholder="Иван Иванов">
            </div>
            <div class="form-group">
              <label for="contact-email">Ваш email *</label>
              <input
                  id="contact-email"
                  type="email"
                  class="form-control"
                  v-model.trim="contactForm.email"
                  required
                  :disabled="contactLoading"
                  autocomplete="email"
                  placeholder="name@example.com">
            </div>
            <div class="form-group">
              <label for="contact-message">Сообщение *</label>
              <textarea
                  id="contact-message"
                  class="form-control"
                  rows="4"
                  v-model.trim="contactForm.message"
                  required
                  :disabled="contactLoading"></textarea>
            </div>
            <div class="contact-form-status" aria-live="polite">
              <span v-if="contactError" class="error-message">{{ contactError }}</span>
              <span v-else-if="contactSuccess" class="success-message">{{ contactSuccess }}</span>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="contactLoading">
              {{ contactLoading ? 'Отправляем...' : 'Отправить сообщение' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
  align-items: stretch;
}
.contact-details-card,
.contact-form-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 30px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}
.contact-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: 8px;
  transition: all 0.3s ease;
}
.contact-item:hover {
  background: var(--background-secondary);
  transform: translateY(-2px);
}
.contact-item i {
  font-size: 1.5rem;
  color: var(--primary);
  width: 30px;
  text-align: center;
}
.contact-item a {
  color: var(--text-primary);
  text-decoration: none;
  transition: color 0.3s ease;
}
.contact-item a:hover {
  color: var(--primary);
}
.contact-form-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.contact-form-card p {
  margin-bottom: 1.5rem;
  color: var(--text-additional-light);
}
.contact-form-status {
  min-height: 24px;
  margin-bottom: 10px;
}
.contact-form-status .error-message,
.contact-form-status .success-message {
  display: inline-block;
  font-size: 0.95rem;
  color: var(--success-text);
}
.contact-form-card .btn {
  width: -webkit-fill-available;
}
.social-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.contact-social-links {
  margin-top: 30px;
  justify-content: center;
}
.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: var(--background-secondary);
  border-radius: 50%;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 1.5rem;
  transition: all 0.3s ease;
}
.social-link:hover {
  background: var(--primary);
  color: var(--background);
  transform: translateY(-3px);
}
</style>