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
      slideDir: 'next',
      lightboxOpen: false,
      lightboxDir: 'next',
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
      this.slideDir = 'prev';
      this.screenshotIndex = (this.screenshotIndex - 1 + len) % len;
    },
    nextScreenshot() {
      const len = this.project.screenshots?.length || 0;
      if (len < 2) return;
      this.slideDir = 'next';
      this.screenshotIndex = (this.screenshotIndex + 1) % len;
    },
    onTouchStart(e) {
      this._touchX = e.touches[0].clientX;
    },
    onTouchEnd(e) {
      if (this._touchX === undefined) return;
      const dx = e.changedTouches[0].clientX - this._touchX;
      if (Math.abs(dx) < 40) return;
      dx < 0 ? this.nextScreenshot() : this.prevScreenshot();
      this._touchX = undefined;
    },
    openLightbox() {
      this.lightboxOpen = true;
      document.addEventListener('keydown', this._onLightboxKey);
    },
    closeLightbox() {
      this.lightboxOpen = false;
      document.removeEventListener('keydown', this._onLightboxKey);
    },
    _onLightboxKey(e) {
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowRight') this.lbNext();
      if (e.key === 'ArrowLeft') this.lbPrev();
    },
    lbPrev() {
      const len = this.project.screenshots?.length || 0;
      if (len < 2) return;
      this.lightboxDir = 'prev';
      this.screenshotIndex = (this.screenshotIndex - 1 + len) % len;
    },
    lbNext() {
      const len = this.project.screenshots?.length || 0;
      if (len < 2) return;
      this.lightboxDir = 'next';
      this.screenshotIndex = (this.screenshotIndex + 1) % len;
    },
    onLbTouchStart(e) {
      this._lbTouchX = e.touches[0].clientX;
    },
    onLbTouchEnd(e) {
      if (this._lbTouchX === undefined) return;
      const dx = e.changedTouches[0].clientX - this._lbTouchX;
      if (Math.abs(dx) < 40) return;
      dx < 0 ? this.lbNext() : this.lbPrev();
      this._lbTouchX = undefined;
    },
  }
}
</script>

<template>
  <section id="projects" class="projects" data-aos="zoom-out-up">
    <div class="container">
      <h2 class="section-title">{{ sectionTitle }}</h2>
      <div class="projects-grid">
        <div
            v-for="(p, index) in projects"
            :key="p.id"
            class="project-card"
            data-aos-delay="300"
            @click="openProject($event, index)"
            :style="{background: p.color}"
        >
          <div class="project-image">
            <div class="project-placeholder">
              <img v-if="p.iconType === 'image' && p.icon" :src="p.icon"
                   style="height: 120px; object-fit: cover; border-radius: 8px"
              >
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
          <div v-if="project.screenshots && project.screenshots.length" class="screenshots-block">
            <div class="screenshot-viewer carousel" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
              <div class="image-wrapper" @click.stop="openLightbox" title="Открыть на весь экран">
                <Transition :name="'slide-' + slideDir">
                  <img :key="screenshotIndex" :src="project.screenshots[screenshotIndex]" :alt="project.title">
                </Transition>
                <div class="expand-hint"><i class="fas fa-expand"></i></div>
              </div>
              <template v-if="project.screenshots.length > 1">
                <button class="ss-btn ss-prev" @click.stop="prevScreenshot" aria-label="Назад">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="ss-btn ss-next" @click.stop="nextScreenshot" aria-label="Вперёд">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </template>
            </div>
            <div v-if="project.screenshots.length > 1" class="screenshot-dots">
              <span
                  v-for="(_, i) in project.screenshots"
                  :key="i"
                  class="dot"
                  :class="{ active: i === screenshotIndex }"
                  @click.stop="screenshotIndex = i"
              ></span>
            </div>
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
  <teleport to="body" v-if="lightboxOpen">
    <div
        class="lightbox"
        @click.self="closeLightbox"
        @touchstart.passive="onLbTouchStart"
        @touchend.passive="onLbTouchEnd"
    >
      <button class="close-icon lightbox-close" @click="closeLightbox" aria-label="Закрыть">
        <i class="fas fa-times"></i>
      </button>
      <Transition :name="'slide-' + lightboxDir" mode="out-in">
        <img
            :key="screenshotIndex"
            :src="project.screenshots[screenshotIndex]"
            :alt="project.title"
            class="lightbox-img"
            @click.stop
        >
      </Transition>
      <template v-if="project.screenshots.length > 1">
        <button class="lightbox-nav lightbox-prev" @click.stop="lbPrev" aria-label="Назад">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="lightbox-nav lightbox-next" @click.stop="lbNext" aria-label="Вперёд">
          <i class="fas fa-chevron-right"></i>
        </button>
        <div class="lightbox-dots">
          <span
              v-for="(_, i) in project.screenshots"
              :key="i"
              class="dot"
              :class="{ active: i === screenshotIndex }"
              @click.stop="screenshotIndex = i"
          ></span>
        </div>
      </template>
    </div>
  </teleport>
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
/* ── modal shell ── */
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
  background: rgba(0, 0, 0, 0.55);
  pointer-events: auto;
}
.project-modal {
  position: relative;
  z-index: 1;
  width: 92vw;
  height: 86vh;
  overflow-y: auto;
  padding: 1.75rem;
  border-radius: 14px;
  background: var(--background-secondary);
  box-shadow: var(--shadow-primary);
  pointer-events: auto;
}
.project-modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  min-width: 36px;
  min-height: 36px;
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
/* ── modal header (icon + title) ── */
.project-modal-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 0.75rem;
  padding-right: 2.5rem;
}
.project-modal-header h3 {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.3;
}

/* ── screenshots ── */
.screenshots-block {
  margin: 1rem 0;
}
.screenshot-viewer {
  position: relative;
}
.image-wrapper {
  position: relative;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-color);
  border: 1px solid var(--border-strong);
  aspect-ratio: 16/9;
}
.image-wrapper img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* slide-next: новый входит справа, старый уходит влево */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.32s ease;
}
.slide-next-enter-from  { transform: translateX(100%); opacity: 0; }
.slide-next-leave-to    { transform: translateX(-100%); opacity: 0; }
.slide-prev-enter-from  { transform: translateX(-100%); opacity: 0; }
.slide-prev-leave-to    { transform: translateX(100%); opacity: 0; }
.slide-next-enter-to,
.slide-next-leave-from,
.slide-prev-enter-to,
.slide-prev-leave-from  { transform: translateX(0); opacity: 1; }
.ss-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  z-index: 1;
}
.ss-btn:hover {
  background: rgba(0, 0, 0, 0.82);
}
.ss-prev {
  left: 0.5rem;
}
.ss-next {
  right: 0.5rem;
}
.screenshot-dots {
  display: flex;
  justify-content: center;
  gap: 7px;
  padding: 8px 0 4px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-primary);
  cursor: pointer;
  transition: background 0.2s;
}
.dot.active { background: var(--primary); }

/* ── expand hint on image hover ── */
.image-wrapper { cursor: zoom-in; }
.expand-hint {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.image-wrapper:hover .expand-hint { opacity: 1; }

/* ── lightbox ── */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0,0,0,0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.lightbox-img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 0 60px rgba(0,0,0,0.6);
  user-select: none;
}
.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  min-width: 44px;
  min-height: 44px;
  z-index: 1;
}
.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  z-index: 1;
}
.lightbox-nav:hover { background: rgba(255,255,255,0.25); }
.lightbox-prev { left: 1rem; }
.lightbox-next { right: 1rem; }
.lightbox-dots {
  position: absolute;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

/* ── tech + links ── */
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
  flex-wrap: wrap;
  gap: 0.75rem;
}
.btn-sm {
  padding: 0.5rem 1.25rem;
  font-size: 0.9rem;
}
/* ── project cards ── */
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
.project-placeholder { font-size: 4rem; }
.project-content { padding: 1.5rem; }
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
/* ── mobile ── */
@media (max-width: 768px) {
  .projects-grid { grid-template-columns: 1fr; }
  .project-card { border-radius: 10px; }
  .project-content { padding: 1rem; }
  .project-content h3 { font-size: 1.2rem; }
  .project-content p { font-size: 0.9rem; }

  .project-modal-root { padding: 0; }
  .project-modal {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    height: 100%;
    border-radius: 0;
    padding: 1rem 1rem 1.5rem;
  }
  .project-modal-close {
    top: 0.6rem;
    right: 0.6rem;
    min-width: 44px;
    min-height: 44px;
  }
  .project-modal-header {
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }
  .project-modal-header h3 { font-size: 1.15rem; }

  .ss-btn { width: 36px; height: 36px; font-size: 12px; }
  .ss-prev { left: 0.25rem; }
  .ss-next { right: 0.25rem; }

  .tech-tag { font-size: 0.72rem; padding: 0.2rem 0.5rem; }
  .btn-sm { padding: 0.45rem 0.9rem; font-size: 0.85rem; }
}
</style>