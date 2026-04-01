<script>
import Auth from "./components/Auth.vue";
import NavBar from "./components/NavBar.vue";

export default {
  components: {
    Auth,
    NavBar,
  },
  data() {
    return {
      credits: null
    }
  },
  watch: {

  },
  created() {
  },
  mounted() {
    const el = document.getElementById('credits-data');

    if (el) {
      this.credits = JSON.parse(el.textContent)
      el.remove()
    }
  },
  computed: {

  },
  methods: {

  }
}
</script>

<template>
  <template v-if="credits">
    <template v-if="!credits.admin">
      <Auth />
    </template>
    <template v-else>
      <NavBar/>
    </template>
  </template>
</template>

<style scoped>

</style>