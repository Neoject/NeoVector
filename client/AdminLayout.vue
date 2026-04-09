<script>
import NavBar from "./admin/NavBar.vue";
import Taskbar from "./admin/TaskBar.vue";

const ROUTE_TO_PAGE = {
    'admin-dashboard': '',
    'admin-products': 'product',
    'admin-pages': 'page',
    'admin-orders': 'orders',
    'admin-analytics': 'analytics',
    'admin-messages': 'messages',
    'admin-message': 'message',
    'admin-message-reply': 'message-reply',
    'admin-profile': 'profile',
    'admin-users': 'users',
    'admin-settings': 'settings',
    'admin-options': 'options',
};

const PAGE_TO_PATH = {
    '': '/admin',
    options: '/admin/options',
    orders: '/admin/orders',
    analytics: '/admin/analytics',
    messages: '/admin/messages',
    profile: '/admin/profile',
    users: '/admin/users',
    settings: '/admin/settings',
    page: '/admin/pages',
    product: '/admin/products',
    block: '/admin',
};

export default {
  components: {
    Taskbar,
    NavBar,
  },
  inject: ['params'],
  computed: {
    page() {
      const name = this.$route.name;
      return ROUTE_TO_PAGE[name] ?? '';
    },
  },
  methods: {
    onUpdatePage(p) {
      const path = PAGE_TO_PATH[p];
      if (path) this.$router.push(path);
    },
  },
}
</script>

<template>
  <NavBar :logo="params?.logo" />
  <router-view v-slot="{ Component }">
    <component
        :is="Component"
        :page="page"
        :logo="params?.logo"
        @update:page="onUpdatePage"
    />
  </router-view>
  <Taskbar />
</template>

<style>
.admin-loading-container {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  min-width: 100%;
  min-height: 100%;
  z-index: 1111;
  background: var(--background);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.admin-loader {
  width: fit-content;
  font-size: 40px;
  font-family: system-ui,sans-serif;
  font-weight: bold;
  text-transform: uppercase;
  color: #0000;
  -webkit-text-stroke: 1px #000;
  background: linear-gradient(-60deg,#000 45%,
  var(--header-secondary) 0 55%,#000 0) 0/300% 100% no-repeat text;
  animation: l3 2s linear infinite;
}
.admin-loader:before {
  content: "Loading";
}
@keyframes l3 {
  0%{background-position: 100%}
}
.admin-block-loading-container {
  position: absolute;
  display: none;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  min-width: 100%;
  min-height: 100%;
  z-index: 900;
  background: var(--background);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.admin-block-loader {
  width: 60px;
  aspect-ratio: 1;
  border: 15px solid var(--background);
  border-radius: 50%;
  position: relative;
  transform: rotate(45deg);
}
.admin-block-loader::before {
  content: "";
  position: absolute;
  inset: -15px;
  border-radius: 50%;
  border: 15px solid var(--header-secondary);
  animation: l18 0.8s infinite linear;
}
@keyframes l18 {
  0%   {clip-path:polygon(50% 50%,0 0,0    0,0    0   ,0    0   ,0    0   )}
  25%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 0   ,100% 0   ,100% 0   )}
  50%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
  75%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0    100%,0    100%)}
  100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0    100%,0    0   )}
}
.admin header {
  background: unset;
}
.admin section {
  padding: 20px;
  background: var(--background-secondary);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--secondary);
  border-radius: 2vw;
  background: var(--background);
}
.admin-link {
  background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-additional) 100%);
  border: 1px solid var(--border-secondary);
  color: var(--header-secondary) !important;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.admin-link:hover {
  background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-additional) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--shadow-primary);
}
.admin-link::after {
  display: none;
}
.admin-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.admin-header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}
.admin-actions .btn-text {
  margin-left: 0.5rem;
  display: inline;
}
.mobile-admin-menu {
  position: fixed;
  top: 0;
  left: -300px;
  width: 300px;
  height: 100vh;
  background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background-additional) 100%);
  backdrop-filter: blur(10px);
  box-shadow: 5px 0 20px var(--shadow-primary);
  transition: left 0.4s ease;
  z-index: 2000;
  overflow-y: auto;
  padding: 30px 20px;
}
.mobile-admin-menu.active {
  left: 0;
}
.admin-dashboard {
  min-height: 100vh;
  background: var(--background);
}
.admin-actions {
  display: flex;
  gap: 15px;
}
.admin-actions .btn {
  padding: 4px 8px;
  font-size: 12px;
  margin: 4px;
}
.admin-main {
  padding: 40px 0;
}
.admin-main .container {
  gap: 2vh;
}
.admin-main .container:nth-child(1) {
  margin-top: 10vh;
}
.admin-main .container,
.admin-header.container {
  max-width: 80vw;
}
.admin-content {
  margin-top: 16vh;
}
.file-upload-area.uploading {
  opacity: 0.7;
  pointer-events: none;
}
.upload-progress {
  text-align: center;
  padding: 20px;
}
.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--text-primary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}
.progress-fill {
  height: 100%;
  background-color: var(--info-primary);
  transition: width 0.3s ease;
}
.upload-status {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  margin: 10px 0;
}
.upload-status.success {
  background-color: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}
.upload-status.error {
  background-color: var(--error-bg);
  color: var(--error-text);
  border: 1px solid var(--error-border);
}
.upload-status i {
  font-size: 24px;
  margin-bottom: 10px;
}
.cancel-upload-btn,
.status-close-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  margin-top: 10px;
}
.cancel-upload-btn:hover,
.status-close-btn:hover {
  opacity: 0.8;
}
@media (max-width: 768px) {
  .admin-header .container {
    flex-direction: row;
    gap: 0;
  }
  .admin-header-content { width: 100%; }
  .admin-actions { display: none; }
  .admin-actions .btn-text { display: none; }
  .admin-logo { font-size: 18px !important; }
}
</style>
