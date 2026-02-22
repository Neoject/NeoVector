// Минимальный JavaScript - только интерактивность
(function() {
  'use strict';

  // Утилита для плавной прокрутки
  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Инициализация темы
  let currentTheme = localStorage.getItem('theme') || 'dark';
  const isDark = currentTheme === 'dark';
  document.documentElement.classList.toggle('dark-theme', isDark);

  // Обновление иконки темы
  function updateThemeIcon() {
    const iconEl = document.getElementById('theme-icon');
    if (iconEl) {
      iconEl.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    }
  }
  updateThemeIcon();

  // Переключение темы
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark-theme', currentTheme === 'dark');
      localStorage.setItem('theme', currentTheme);
      updateThemeIcon();
    });
  }

  // Мобильное меню
  let menuOpen = false;
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  
  function updateMenu() {
    if (navMenu) {
      navMenu.classList.toggle('active', menuOpen);
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      menuOpen = !menuOpen;
      updateMenu();
    });
  }

  // Закрытие меню при клике на ссылку
  if (navMenu) {
    navMenu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        menuOpen = false;
        updateMenu();
      }
    });
  }

  // Плавная прокрутка для всех ссылок
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        scrollToSection(href.substring(1));
        menuOpen = false;
        updateMenu();
      }
    });
  });

  // Кнопки прокрутки
  document.querySelectorAll('[data-scroll]').forEach(btn => {
    btn.addEventListener('click', () => {
      scrollToSection(btn.getAttribute('data-scroll'));
    });
  });

  // Копирование навыков
  document.querySelectorAll('.skill-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const skill = tag.getAttribute('data-skill');
      if (skill) {
        navigator.clipboard.writeText(skill).catch(() => {});
      }
    });
  });

  // Установка текущего года
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Обработка формы контактов
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nameEl = document.getElementById('form-name');
      const emailEl = document.getElementById('form-email');
      const messageEl = document.getElementById('form-message');
      const successEl = document.getElementById('form-success');
      const errorEl = document.getElementById('form-error');
      const submitEl = document.getElementById('form-submit');

      const name = nameEl?.value.trim() || '';
      const email = emailEl?.value.trim() || '';
      const message = messageEl?.value.trim() || '';

      // Скрыть предыдущие сообщения
      if (successEl) successEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'none';

      // Валидация
      function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }

      function showError(message) {
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.style.display = 'block';
          if (successEl) successEl.style.display = 'none';
          setTimeout(() => {
            if (errorEl) errorEl.style.display = 'none';
          }, 7000);
        }
      }

      function showSuccess() {
        if (successEl) {
          successEl.style.display = 'block';
          if (errorEl) errorEl.style.display = 'none';
          setTimeout(() => {
            if (successEl) successEl.style.display = 'none';
          }, 5000);
        }
      }

      if (!name) {
        showError('Пожалуйста, введите ваше имя');
        return;
      }
      if (!email) {
        showError('Пожалуйста, введите ваш email');
        return;
      }
      if (!validateEmail(email)) {
        showError('Пожалуйста, введите корректный email адрес');
        return;
      }
      if (!message) {
        showError('Пожалуйста, введите сообщение');
        return;
      }

      // Отправка
      if (submitEl) {
        submitEl.disabled = true;
        submitEl.textContent = 'Отправка...';
      }

      try {
        const response = await fetch('/api/contact.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorData;
          if (contentType && contentType.indexOf('application/json') !== -1) {
            errorData = await response.json();
          } else {
            errorData = { details: await response.text() || response.statusText };
          }
          
          if (response.status === 404) {
            throw new Error('PHP скрипт не найден');
          } else if (response.status === 400) {
            throw new Error(errorData.error || 'Все поля обязательны');
          } else if (response.status === 500) {
            throw new Error(errorData.details || errorData.error || 'Ошибка сервера');
          } else {
            throw new Error(errorData.details || errorData.error || 'Не удалось отправить');
          }
        }

        // Успех
        if (nameEl) nameEl.value = '';
        if (emailEl) emailEl.value = '';
        if (messageEl) messageEl.value = '';
        showSuccess();
      } catch (err) {
        showError(err.message || 'Произошла ошибка при отправке');
      } finally {
        if (submitEl) {
          submitEl.disabled = false;
          submitEl.textContent = 'Отправить';
        }
      }
    });
  }
})();
