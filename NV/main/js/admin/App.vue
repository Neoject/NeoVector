<script>
import Auth from "./components/Auth.vue";
import NavBar from "./components/NavBar.vue";
import Settings from "./components/Settings.vue";
import Mail from "./components/Mail.vue";
import Analytics from "./components/Analytics.vue";
import Users from "./components/Users.vue";
import Orders from "./components/Orders.vue";
import Options from "./components/Options.vue";
import Profile from "./components/Profile.vue";
import Main from "./components/Main.vue";
import Taskbar from "./components/TaskBar.vue";

export default {
  components: {
    Taskbar,
    Main,
    Profile,
    Options,
    Orders,
    Users,
    Mail,
    Analytics,
    Settings,
    Auth,
    NavBar,
  },
  data() {
    return {
      credits: {
        admin: false,
        admin_user: null,
        logo: '',
        auth: {
          action: '',
          username: '',
          remember: false,
          error: ''
        }
      },
      page: new URLSearchParams(location.search).get('page') || '',
    }
  },
  mounted() {
    const el = document.getElementById('credits-data');
    if (el) {
      try {
        this.credits = JSON.parse(el.textContent);
      } catch (e) {
        console.error('Failed to parse credits-data:', e);
      }
      el.remove();
    }
  },
  computed: {
    currentComponent() {
      const p = this.page
      if (['messages', 'message', 'message-reply'].includes(p)) {
        return Mail
      }
      const map = {
        users: Users,
        orders: Orders,
        analytics: Analytics,
        settings: Settings,
        profile: Profile,
        options: Options,
      }

      return map[p] || Main
    }
  }
}
</script>

<template>
  <template v-if="credits">
    <template v-if="!credits.admin">
      <Auth
        :form_action="credits.auth.action"
        :username="credits.auth.username"
        :remember="credits.auth.remember"
        :error_message="credits.auth.error"
      />
    </template>
    <template v-else>
      <NavBar
          v-model:page="page"
          :logo="credits.logo"
      />
      <component :is="currentComponent" v-model:page="page" />
      <Taskbar />
    </template>
  </template>
</template>