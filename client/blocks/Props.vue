<script>
export default{
  name: "Props",
  methods: {
    click(event, button) {
      const target = button.target || button.link;

      if (button.linkType === 'page') {
        event.preventDefault();

        if (!target || target === '') {
          this.goHome({ updateHistory: true, scrollToTop: true });
        }
      } else if (button.linkType === 'section') {
        event.preventDefault();
        this.scroll_to(target);
      }
    },
    scroll_to(targetId) {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    },
    getLink(button) {
      if (!button) {
        return '#';
      }

      if (button.linkType === 'page') {
        const slug = button.link || button.target;

        if (!slug || slug === '') {
          return this.getBasePath();
        }

        const basePath = this.getBasePath();
        const normalizedSlug = slug.startsWith('/') ? slug.substring(1) : slug;

        return basePath + normalizedSlug;
      } else if (button.linkType === 'section') {
        const target = button.link || button.target;
        return '#' + target;
      } else if (button.linkType === 'url') {
        return button.link || button.target;
      }

      return '#';
    },
    getBasePath() {
      try {
        const scriptEl = document.querySelector('script[src*="script.js"]');

        if (scriptEl && scriptEl.src) {
          const url = new URL(scriptEl.src, window.location.origin);
          const pathname = url.pathname || '/';
          const idx = pathname.lastIndexOf('/');

          if (idx >= 0) {
            const basePath = pathname.substring(0, idx + 1);

            if (window.location.pathname.startsWith(basePath)) {
              return basePath;
            }
          }
        }
      } catch (e) {
        console.warn(e);
      }

      let path = window.location.pathname;

      if (path.endsWith('/') && path.length > 1) {
        path = path.slice(0, -1);
      }

      if (path !== '/' && path !== '') {
        const parts = path.split('/').filter(p => p);

        if (parts.length > 0)  return '/';
        if (parts.length > 1) return '/' + parts.slice(0, -1).join('/') + '/';
      }

      return '/';
    },
    isVideo(url) {
      if (!url) return false;
      const u = url.toLowerCase();
      return /\.(mp4|webm|ogg|m4v|mov|avi|flv)(\?|#|$)/i.test(u);
    },
  }
}
</script>

<template>

</template>

<style scoped>

</style>