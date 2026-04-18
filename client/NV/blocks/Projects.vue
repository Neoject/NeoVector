<script>
import Props from "./Props.vue";

export default {
  mixins: [Props],
  name: "Projects",
  data() {
    return {
      projects: [
        {
          id: 1,
          title: 'Shelfer',
          description: 'Десктопное приложение для планировки товарной выкладки',
          tech: ['Vue.js', 'Vite', 'JavaScript', 'Electron', 'Typescript', 'Node.js'],
          icon: '🎨',
          github: 'https://github.com/Neoject/shelfer',
          demo: 'https://ubers.site/shelfer/'
        },
        {
          id: 2,
          title: 'Aeternum',
          description: 'Полнофункциональный интернет-магазин с корзиной покупок и системой заказов',
          tech: ['Vue.js', 'php'],
          icon: '🛒',
          site: 'https://aeternum.by'
        },
        {
          id: 3,
          title: 'Media Rocket',
          description: 'Приложение для передачи файлов между ПК и смартфоном на Android',
          tech: ['Kotlin', 'Vue.js', 'Electron', 'TypeScript'],
          icon: '📊',
          github: 'https://github.com/Neoject/media-rocket',
          github2: 'https://github.com/Neoject/mediarocket-desktop',
          github2_title: 'Media Rocket desktop'
        },
        {
          id: 4,
          title: 'ModCare',
          description: 'Сайт для медицинской консультации с помощью ИИ',
          tech: ['Node.js', 'Vue', 'JavaScript'],
          icon: '🏥',
          github: 'https://github.com/Neoject/modcure',
          demo: 'https://modcare.site/'
        }
      ],
      projectModalOpen: false,
      project: {},
      clickPoint: { x: 0, y: 0 }
    };
  },
  methods: {
    openProject(e, i) {
      this.clickPoint = { x: e.clientX, y: e.clientY };
      this.project = this.projects[i];
      this.projectModalOpen = true;

      this.$nextTick(() => {
        const modal = this.$refs.modal;
        const backdrop = this.$refs.backdrop;
        if (!modal) return;

        const g = window.gsap;
        if (!g) return;

        const rect = modal.getBoundingClientRect();
        const originX = this.clickPoint.x - rect.left;
        const originY = this.clickPoint.y - rect.top;

        if (backdrop) {
          g.set(backdrop, { opacity: 0 });
          g.to(backdrop, { opacity: 1, duration: 0.25 });
        }
        g.set(modal, { transformOrigin: `${originX}px ${originY}px`, scale: 0.3, rotation: -10, opacity: 0 });
        g.to(modal, { scale: 1, rotation: 0, opacity: 1, duration: 0.45, ease: "back.out(1.7)" });
      });
    },
    closeProject() {
      const modal = this.$refs.modal;
      const backdrop = this.$refs.backdrop;
      if (!modal) {
        this.projectModalOpen = false;
        this.project = {};
        return;
      }

      const g = window.gsap;
      if (!g) {
        this.projectModalOpen = false;
        this.project = {};
        return;
      }

      const rect = modal.getBoundingClientRect();
      const originX = this.clickPoint.x - rect.left;
      const originY = this.clickPoint.y - rect.top;

      g.set(modal, { transformOrigin: `${originX}px ${originY}px` });
      if (backdrop) {
        g.to(backdrop, { opacity: 0, duration: 0.25 });
      }
      g.to(modal, {
        scale: 0.3,
        rotation: 10,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          this.projectModalOpen = false;
          this.project = {};
        }
      });
    }
  }
}
</script>

<template>
  <section id="projects" class="projects">
    <div class="container">
      <h2 class="section-title">Мои проекты</h2>
      <div class="projects-grid">
        <div
            v-for="(p, index) in projects"
            :key="p.id"
            class="project-card"
            @click="openProject($event, index)"
        >
          <div class="project-image">
            <div class="project-placeholder"><span>{{ p.icon }}</span></div>
          </div>
          <div class="project-content">
            <h3>{{ p.title }}</h3>
            <p>{{ p.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
  <template v-if="projectModalOpen">
    <teleport to="body">
      <div class="project-modal-root">
        <div class="project-modal-backdrop" ref="backdrop" @click="closeProject"></div>
        <div class="project-modal" ref="modal" @click.stop>
          <button type="button" class="close-icon project-modal-close" aria-label="Закрыть" @click="closeProject">
            <i class="fas fa-times"></i>
          </button>
          <h3>{{ project.title }}</h3>
          <p>{{ project.description }}</p>
          <div v-if="project.tech && project.tech.length" class="project-tech">
            <span v-for="t in project.tech" :key="t" class="tech-tag">{{ t }}</span>
          </div>
          <div class="project-links">
            <a v-if="project.github" :href="project.github" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">GitHub</a>
            <a v-if="project.github2" :href="project.github2" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">{{ project.github2_title || 'GitHub' }}</a>
            <a v-if="project.demo" :href="project.demo" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Демо</a>
            <a v-if="project.site" :href="project.site" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Сайт</a>
          </div>
        </div>
      </div>
    </teleport>
  </template>
</template>

<style scoped>

</style>