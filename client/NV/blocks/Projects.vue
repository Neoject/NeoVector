<script>
import Props from "./Props.vue";
import { gsap } from "gsap";

export default {
  mixins: [Props],
  name: "Projects",
  inheritAttrs: false,
  props: {
    block: { type: Object, default: () => ({}) },
    isInView: { type: Function, default: null },
  },
  computed: {
    sectionTitle() {
      return this.block?.settings?.sectionTitle || 'Мои проекты';
    },
    projects() {
      const list = this.block?.settings?.projects;
      return list.map((p, i) => ({
        ...p,
        id: p.id ?? i + 1,
        tech: typeof p.tech === 'string'
          ? p.tech.split(',').map(t => t.trim()).filter(Boolean)
          : (Array.isArray(p.tech) ? p.tech : []),
      }));
    },
  },
  data() {
    return {
      projectModalOpen: false,
      project: {},
      clickPoint: { x: 0, y: 0 },
      screenshotIndex: 0,
    };
  },
  methods: {
    openProject(e, i) {
      this.clickPoint = { x: e.clientX, y: e.clientY };
      this.project = this.projects[i];
      this.screenshotIndex = 0;
      this.projectModalOpen = true;

      this.$nextTick(() => {
        const modal = this.$refs.modal;
        const backdrop = this.$refs.backdrop;
        if (!modal) return;

        const g = gsap;
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

      const g = gsap;
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
    },
    prevScreenshot() {
      const len = this.project.screenshots?.length || 0;
      if (len < 2) return;
      this.screenshotIndex = (this.screenshotIndex - 1 + len) % len;
    },
    nextScreenshot() {
      const len = this.project.screenshots?.length || 0;
      if (len < 2) return;
      this.screenshotIndex = (this.screenshotIndex + 1) % len;
    },
  }
}
</script>

<template>
  <section id="projects" class="projects">
    <div class="container">
      <h2 class="section-title">{{ sectionTitle }}</h2>
      <div class="projects-grid">
        <div
            v-for="(p, index) in projects"
            :key="p.id"
            class="project-card"
            @click="openProject($event, index)"
        >
          <div class="project-image">
            <div class="project-placeholder">
              <img v-if="p.iconType === 'image' && p.icon" :src="p.icon" style="width:60px;height:60px;object-fit:cover;border-radius:8px">
              <i v-else-if="p.iconType === 'fa' && p.icon" :class="p.icon" style="font-size:40px"></i>
              <span v-else>{{ p.icon }}</span>
            </div>
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
          <div class="project-modal-header" style="margin-bottom: 12px">
            <img v-if="project.iconType === 'image' && project.icon" :src="project.icon" style="height:60px;border-radius:8px">
            <i v-else-if="project.iconType === 'fa' && project.icon" :class="project.icon" style="font-size:40px"></i>
            <span v-else style="font-size: 40px">{{ project.icon }}</span>
            <h3>{{ project.title }}</h3>
          </div>
          <p>{{ project.description }}</p>
          <div v-if="project.screenshots && project.screenshots.length" class="carousel">
            <div class="image-wrapper">
              <img :src="project.screenshots[screenshotIndex]" :alt="project.title">
            </div>
            <template v-if="project.screenshots.length > 1">
              <div class="screenshot-dots">
                <span
                    v-for="(_, i) in project.screenshots"
                    :key="i"
                    class="dot"
                    :class="{ active: i === screenshotIndex }"
                    @click.stop="screenshotIndex = i"
                ></span>
              </div>
              <button class="back" @click.stop="prevScreenshot" aria-label="Назад">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button class="forward" @click.stop="nextScreenshot" aria-label="Вперёд">
                <i class="fas fa-chevron-right"></i>
              </button>
            </template>
          </div>
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
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}
.project-card {
  background: var(--surface-color);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-primary);
  transition: all 0.3s ease;
  box-shadow: 0 20px 40px var(--shadow-primary);
  cursor: pointer;
}
.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.2);
  border-color: var(--primary);
}
.project-image {
  height: 200px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
}
.project-placeholder {
  font-size: 4rem;
}
.project-content {
  padding: 1.5rem;
}
.project-content h3 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}
.project-content p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.6;
}
.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.tech-tag {
  padding: 0.25rem 0.75rem;
  background: var(--surface-muted);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  font-size: 0.8rem;
  color: var(--primary);
}
.project-links {
  display: flex;
  gap: 0.75rem;
}
.btn-sm {
  padding: 0.5rem 1.25rem;
  font-size: 0.9rem;
}
@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}
.project-modal-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2rem;
}
.project-modal-root {
  position: fixed;
  inset: 0;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  pointer-events: none;
}
.project-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: auto;
}
.project-modal {
  position: relative;
  z-index: 1;
  width: 92vw;
  height: 92vh;
  overflow: auto;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--background-secondary);
  box-shadow: var(--shadow-primary);
  pointer-events: auto;
}
.project-modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}
.carousel {
  position: relative;
  display: flex;
  flex-direction: row;
  max-width: 90vw;
  overflow-x: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  transition: all 0.1s ease-in-out;
  padding: 0 4vw;
}
.carousel > img {
  scroll-snap-align: center;
  max-height: 54.7vh;
  margin: 2vw 16vw;
  border-radius: 16px;
  box-shadow: 0 0 12px 2px #00000050;
}
.screenshots-block {
  margin: 1rem 0;
}
.carousel-controls {
  display: flex;
  position: absolute;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.carousel > button {
  position: absolute;
  width: 50px;
  height: 50px;
  top: 32vh;
  padding: 16px;
  border: none;
  border-radius: 50%;
  font-size: 16px;
  background: #00000090;
  color: #ffffff;
  box-shadow: 0 0 12px 1px #00000050;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}
.carousel > button:hover {
  background: #00000099;
  box-shadow: 0 0 12px 2px #00000090;
}
.carousel > button:active {
  background: #00000099;
  color: #919191;
  box-shadow: 0 0 12px 2px #000000, inset 0 0 12px 0 #000000;
}
.carousel > button.back {
  top: 32vh;
  left: 1rem;
}
.carousel > button.forward {
  top: 32vh;
  right: 1rem;
}
.screenshot-dots {
  position: absolute;
  display: flex;
  gap: 6px;
  align-items: center;
  bottom: 0;
  right: 40vw;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-primary);
  cursor: pointer;
  transition: background 0.2s;
}
.dot.active {
  background: var(--primary);
}
.image-wrapper {
  width: 100%;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-color);
  border: 1px solid var(--border-strong);
  display: flex;
  justify-content: center;
  align-items: center;
}
.image-wrapper img {
  width: 100%;
  height: auto;
  max-height: 60vh;
  object-fit: contain;
  display: block;
  transition: transform 0.3s ease;
}
@media (max-width: 768px) {
  .project-card {
    border-radius: 10px;
  }
  .project-content {
    padding: 1rem;
  }
  .project-content h3 {
    font-size: 1.2rem;
  }
  .project-content p {
    font-size: 0.9rem;
  }
  .project-modal {
    width: 100%;
    height: 100%;
    padding: 1rem;
    border-radius: 0;
  }
  .project-modal-close {
    top: 0.5rem;
    right: 0.5rem;
  }
  .carousel {
    max-width: 100%;
    padding: 0;
    overflow-x: auto;
  }
  .carousel > img {
    margin: 0 2vw;
    max-height: 24vh;
    width: auto;
    box-shadow: none;
  }
  .carousel-controls > button {
    width: 36px;
    height: 36px;
    top: 18%;
    padding: 8px;
    font-size: 12px;
  }
  .image-wrapper {
    margin: 0.5rem 0;
  }
  .image-wrapper img {
    max-height: 50vh;
  }
  .tech-tag {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
  }
  .btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}
</style>