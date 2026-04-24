<script>
import { registerMinimized, unregisterMinimized } from '../admin/modalRegistry'

const RESIZE_DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const PAD = 2;
const MIN_W = 360;
const MIN_H = 180;

export default {
  name: 'Modal',
  inheritAttrs: false,
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    modalId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'Окно',
    },
    defaultWidth: {
      type: String,
      default: '560px',
    },
    defaultHeight: {
      type: String,
      default: '480px',
    },
    resizable: {
      type: Boolean,
      default: true,
    },
    showControls: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue', 'close'],
  data() {
    return {
      state: 'normal', // 'normal' | 'minimized' | 'maximized'
      resizeDirections: RESIZE_DIRECTIONS,
      resizing: false,
      resizeDir: null,
      resizeStart: {},
      dragging: false,
      dragStart: {},
      snapshot: null,
      _onMouseMove: null,
      _onMouseUp: null,
    };
  },
  computed: {
    isVisible() {
      return this.modelValue;
    },
    storageKey() {
      return `modal_state_${this.modalId}`;
    },
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.$nextTick(() => this._openModal());
      }
    },
  },
  beforeUnmount() {
    unregisterMinimized(this.modalId)
    this._clearListeners()
  },
  methods: {
    //region ── Public API ──
    close() {
      this.save();
      unregisterMinimized(this.modalId);
      this.state = 'normal';
      this.$emit('update:modelValue', false);
      this.$emit('close');
    },
    minimize() {
      if (this.state === 'minimized') {
        this.restore();
        return;
      }
      this.save();
      this.state = 'minimized';
      registerMinimized(this.modalId, this.title, () => this.restore(), () => this.close());
    },
    maximize() {
      if (this.state === 'maximized') {
        this.restore();
        return;
      }

      const el = this._el();
      if (!el) return;

      if (this._isMobile()) {
        this.snapshot = null;
        Object.assign(el.style, { position: 'fixed', inset: '0', width: '', height: '', maxWidth: '', maxHeight: '' });
        this.state = 'maximized';
        return;
      }

      this.snapshot = this._captureRect(el);
      Object.assign(el.style, {
        position: 'fixed',
        left: PAD + 'px',
        top: PAD + 'px',
        width: `calc(100vw - ${PAD * 2}px)`,
        height: `calc(100vh - ${PAD * 2}px)`,
        right: 'auto',
        bottom: 'auto',
        maxWidth: 'none',
        maxHeight: 'none',
      });
      this.state = 'maximized';
    },
    restore() {
      unregisterMinimized(this.modalId);
      const el = this._el();
      if (!el) return;

      if (this._isMobile()) {
        this._clearMobileStyles(el);
        this.snapshot = null;
        this.state = 'normal';
        return;
      }

      if (this.state === 'maximized' && this.snapshot) {
        const s = this.snapshot;
        Object.assign(el.style, {
          position: 'fixed',
          left: s.left + 'px',
          top: s.top + 'px',
          width: s.width + 'px',
          height: s.height + 'px',
          right: 'auto',
          bottom: 'auto',
          maxWidth: 'none',
          maxHeight: 'none',
        });
        this.snapshot = null;
      }

      this.state = 'normal';
    },
    bringToFront() {
      document.querySelectorAll('.modal[values-modal-id]').forEach(m => { m.style.zIndex = '1000'; });
      const el = this._el();
      if (el) el.style.zIndex = '1001';
    },
    //endregion
    //region ── Open / Init ──
    _isMobile() {
      return window.innerWidth <= 768;
    },
    _clearMobileStyles(el) {
      Object.assign(el.style, { position: '', inset: '', left: '', top: '', right: '', bottom: '', width: '', height: '', maxWidth: '', maxHeight: '' });
    },
    _openModal() {
      this.state = 'normal';
      const el = this._el();
      if (!el) return;
      this.bringToFront();

      if (this._isMobile()) {
        this._clearMobileStyles(el);
        return;
      }

      if (this.resizable) {
        const saved = this.load();

        if (saved?.width && saved?.height) {
          Object.assign(el.style, {
            width: saved.width,
            height: saved.height,
            position: 'fixed',
            maxWidth: 'none',
            maxHeight: 'none',
          });

          if (saved.left != null) { el.style.left = saved.left + 'px'; el.style.right = 'auto'; }
          if (saved.top != null) { el.style.top = saved.top + 'px'; el.style.bottom = 'auto'; }

          this._constrain(el);
        }
      } else {
        this._setDefault(el);
      }
    },
    _setDefault(el) {
      const w = parseInt(this.defaultWidth, 10)  || MIN_W;
      const h = parseInt(this.defaultHeight, 10) || MIN_H;

      Object.assign(el.style, {
        width:     w + 'px',
        height:    h + 'px',
        position:  'fixed',
        maxWidth:  'none',
        maxHeight: 'none',
        left:   Math.max(PAD, (window.innerWidth  - w) / 2) + 'px',
        top:    Math.max(PAD, (window.innerHeight - h) / 2) + 'px',
        right:  'auto',
        bottom: 'auto',
      });
    },
    //endregion
    //region ── Drag ──
    startDrag(event) {
      if (this._isMobile() || this.state === 'maximized') return;
      if (event.target.closest('.modal-controls') || event.target.closest('.modal-resize-handle')) return;
      event.preventDefault();
      const el = this._el();
      if (!el) return;
      const r = el.getBoundingClientRect();
      this.dragging = true;
      this.dragStart = { mx: event.clientX, my: event.clientY, el: r.left, et: r.top };
      this._attach(this._onDragMove.bind(this), this._stopDrag.bind(this));
      el.classList.add('dragging');
      this.bringToFront();
    },
    _onDragMove(event) {
      if (!this.dragging) return;
      const el = this._el();
      if (!el) return;
      const dx = event.clientX - this.dragStart.mx;
      const dy = event.clientY - this.dragStart.my;
      const vw = window.innerWidth, vh = window.innerHeight;
      const mw = el.offsetWidth, mh = el.offsetHeight;
      const nl = Math.max(PAD, Math.min(this.dragStart.el + dx, vw - mw - PAD));
      const nt = Math.max(PAD, Math.min(this.dragStart.et + dy, vh - mh - PAD));
      Object.assign(el.style, { left: nl + 'px', top: nt + 'px', right: 'auto', bottom: 'auto' });
    },
    _stopDrag() {
      if (!this.dragging) return;
      this.dragging = false;
      const el = this._el();
      if (el) el.classList.remove('dragging');
      this.save();
      this._clearListeners();
    },
    //endregion
    //region ── Resize ──
    startResize(event, dir) {
      if (this._isMobile() || this.state === 'maximized' || this.dragging) return;
      event.preventDefault();
      event.stopPropagation();
      const el = this._el();
      if (!el) return;
      const r = el.getBoundingClientRect();
      this.resizing = true;
      this.resizeDir = dir;

      this.resizeStart = {
        mx: event.clientX, my: event.clientY,
        w: r.width, h: r.height, l: r.left, t: r.top,
      };

      this._attach(this._onResizeMove.bind(this), this._stopResize.bind(this));
      this.bringToFront();
    },
    _onResizeMove(event) {
      if (!this.resizing) return;
      const el = this._el();
      if (!el) return;
      const { mx, my, w, h, l, t } = this.resizeStart;
      const dx = event.clientX - mx, dy = event.clientY - my;
      const dir = this.resizeDir;
      const vw = window.innerWidth, vh = window.innerHeight;
      const maxW = vw - 2 * PAD, maxH = vh - 2 * PAD;
      let nw = w, nh = h, nl = l, nt = t;

      if (dir.includes('e')) nw = Math.max(MIN_W, Math.min(maxW, w + dx));
      if (dir.includes('s')) nh = Math.max(MIN_H, Math.min(maxH, h + dy));

      if (dir.includes('w')) {
        nw = Math.max(MIN_W, Math.min(maxW, w - dx));
        nl = l + (w - nw);
        if (nl < PAD) { nl = PAD; nw = Math.max(MIN_W, w + l - PAD); }
      }

      if (dir.includes('n')) {
        nh = Math.max(MIN_H, Math.min(maxH, h - dy));
        nt = t + (h - nh);
        if (nt < PAD) { nt = PAD; nh = Math.max(MIN_H, h + t - PAD); }
      }

      if (nl + nw > vw - PAD) nw = vw - PAD - nl;
      if (nt + nh > vh - PAD) nh = vh - PAD - nt;

      Object.assign(el.style, {
        position: 'fixed',
        width: nw + 'px',
        height: nh + 'px',
        maxWidth: 'none',
        maxHeight: 'none',
      });

      if (dir.includes('w')) { el.style.left = Math.max(PAD, nl) + 'px'; el.style.right = 'auto'; }
      if (dir.includes('n')) { el.style.top = Math.max(PAD, nt) + 'px'; el.style.bottom = 'auto'; }
      if (dir.includes('e') && !dir.includes('w')) { /* left stays */ }
      if (dir.includes('s') && !dir.includes('n')) { /* top stays */ }
    },
    _stopResize() {
      if (!this.resizing) return;
      this.resizing = false;
      this.resizeDir = null;
      this.save();
      this._clearListeners();
    },
    //endregion
    //region ── Persistence ──
    save() {
      if (this._isMobile()) return;
      const el = this._el();
      if (!el) return;
      const r = el.getBoundingClientRect();
      try {
        localStorage.setItem(this.storageKey, JSON.stringify({
          width: r.width + 'px',
          height: r.height + 'px',
          left: r.left,
          top: r.top,
        }));
      } catch {}
    },
    load() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    },
    //endregion
    //region ── Helpers ──
    _el() {
      return this.$refs.modalEl || null;
    },
    _captureRect(el) {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    },
    _constrain(el) {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      let nl = r.left, nt = r.top, nw = r.width, nh = r.height;
      if (nl + nw > vw - PAD) nl = Math.max(PAD, vw - PAD - nw);
      if (nt + nh > vh - PAD) nt = Math.max(PAD, vh - PAD - nh);
      if (nl < PAD) nl = PAD;
      if (nt < PAD) nt = PAD;
      nw = Math.max(MIN_W, Math.min(nw, vw - 2 * PAD));
      nh = Math.max(MIN_H, Math.min(nh, vh - 2 * PAD));

      Object.assign(el.style, {
        left: nl + 'px', top: nt + 'px',
        width: nw + 'px', height: nh + 'px',
        right: 'auto', bottom: 'auto',
      });
    },
    _attach(onMove, onUp) {
      this._onMouseMove = onMove;
      this._onMouseUp = onUp;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    _clearListeners() {
      if (this._onMouseMove) { document.removeEventListener('mousemove', this._onMouseMove); this._onMouseMove = null; }
      if (this._onMouseUp) { document.removeEventListener('mouseup', this._onMouseUp); this._onMouseUp = null; }
    },
    //endregion
  },
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
          v-if="isVisible"
          ref="modalEl"
          class="modal"
          v-bind="$attrs"
          :class="{
            'is-minimized': state === 'minimized',
            'is-maximized': state === 'maximized',
            'is-dragging': dragging,
            'is-resizing': resizing,
          }"
          :data-modal-id="modalId"
          @mousedown="bringToFront"
      >
        <!-- Resize handles (8 directions) -->
        <template v-if="resizable && state === 'normal'">
          <div
              v-for="dir in resizeDirections"
              :key="dir"
              class="modal-resize-handle"
              :class="dir"
              @mousedown.prevent.stop="startResize($event, dir)"
          />
        </template>
        <!-- Header (title + drag area) -->
        <div class="modal-header" @mousedown="startDrag">
          <div class="modal-title">
            <h3>{{ title }}</h3>
          </div>
          <!-- Toolbar (controls) -->
          <div v-if="showControls" class="modal-toolbar">
            <div class="control-btns">
              <button
                  class="ctrl-btn btn-minimize"
                  :class="{ active: state === 'minimized' }"
                  type="button"
                  title="Свернуть"
                  @click="minimize"
              >
                <i class="fas fa-minus"></i>
              </button>
              <button
                  class="ctrl-btn btn-maximize"
                  :class="{ active: state === 'maximized' }"
                  type="button"
                  :title="state === 'maximized' ? 'Восстановить' : 'Развернуть'"
                  @click="maximize"
              >
                <i :class="state === 'maximized' ? 'fas fa-compress' : 'fas fa-expand'"></i>
              </button>
              <button
                  class="ctrl-btn btn-close"
                  type="button"
                  title="Закрыть"
                  @click="close"
              >
                <i class="fas fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>
        <!-- Body -->
        <div v-show="state !== 'minimized'" class="modal-body">
          <slot />
        </div>
        <!-- Footer -->
        <div v-if="$slots.footer && state !== 'minimized'" class="modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── Modal window ────────────────────────────────────────────── */
.modal {
  background: var(--background);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid var(--border-light);
  width: 100%;
  max-height: 90vh;
  position: fixed;
  min-width: 360px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  user-select: none;
}
.modal.is-maximized {
  border-radius: 0;
  border: none;
}
.modal.is-minimized {
  display: none !important;
}
.modal.is-dragging {
  cursor: grabbing;
}
.modal.is-resizing {
  cursor: nwse-resize;
}
/* ─── Resize handles ──────────────────────────────────────────── */
.modal-resize-handle {
  position: absolute;
  z-index: 12;
  background: transparent;
  transition: background 0.2s ease;
}
.modal-resize-handle:hover {
  background: var(--hover-secondary);
}
.modal-resize-handle.nw {
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  border-radius: 15px 0 0 0;
}
.modal-resize-handle.ne {
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nesw-resize;
  border-radius: 0 15px 0 0;
}
.modal-resize-handle.sw {
  bottom: 0;
  left: 0;
  width: 20px;
  height: 20px;
  cursor: nesw-resize;
  border-radius: 0 0 0 15px;
}
.modal-resize-handle.se {
  bottom: 0;
  right: 0;
  width: 6px;
  height: 6px;
  cursor: nwse-resize;
  border-radius: 0 0 15px 0;
  z-index: 11;
}
.modal-resize-handle.n  {
  top: 0;
  left: 20px;
  right: 20px;
  height: 6px;
  cursor: ns-resize;
}
.modal-resize-handle.s  {
  bottom: 0;
  left: 20px;
  right: 22px;
  height: 6px;
  cursor: ns-resize;
}
.modal-resize-handle.e  {
  right: 0;
  top: 20px;
  bottom: 22px;
  width: 6px;
  cursor: ew-resize;
}
.modal-resize-handle.w  {
  left: 0;
  top: 20px;
  bottom: 20px;
  width: 6px;
  cursor: ew-resize;
}
.modal-resize-handle.nw::after,
.modal-resize-handle.ne::after,
.modal-resize-handle.sw::after,
.modal-resize-handle.se::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 2px solid var(--border-strong);
  border-radius: 2px;
}
.modal-resize-handle.nw::after {
  top: 4px;
  left: 4px;
  border-right: none;
  border-bottom: none;
}
.modal-resize-handle.ne::after {
  top: 4px;
  right: 4px;
  border-left: none;
  border-bottom: none;
}
.modal-resize-handle.sw::after {
  bottom: 4px;
  left: 4px;
  border-right: none;
  border-top: none;
}
.modal-resize-handle.se::after {
  bottom: 4px;
  right: 4px;
  border-left: none;
  border-top: none;
}
.modal-resize-handle:hover::after {
  border-color: var(--border-strong);
}
/* ─── Toolbar ─────────────────────────────────────────────────── */
.modal-toolbar {
  display: flex;
  justify-content: flex-end;
  height: 4.5vh;
  z-index: 5;
}

.control-btns {
  margin-right: 1vw;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.ctrl-btn:hover {
  background: var(--hover-secondary);
  color: var(--text-primary);
}
.ctrl-btn.active {
  color: var(--primary);
  background: var(--border-light);
}
.btn-close:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
.btn-minimize:hover {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
}
.btn-maximize:hover {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}
/* ─── Header ──────────────────────────────────────────────────── */
.modal-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-left: 8px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  cursor: grab;
}
.modal-header:active {
  cursor: grabbing;
}
.modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  pointer-events: none;
}
.modal-title-icon {
  font-size: 16px;
  color: var(--primary);
  flex-shrink: 0;
}
.modal-title h3 {
  color: var(--primary);
  margin: 0;
  font-size: 20px;
}
/* ─── Body ────────────────────────────────────────────────────── */
.modal-body {
  padding: 30px 38px 12px 30px;
  overflow-y: auto;
  overflow-x: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: var(--background-additional) var(--background-secondary);
}
.modal-body .form-group {
  margin-bottom: 20px;
}
.modal-body label {
  display: block;
  color: var(--primary);
  margin-bottom: 8px;
  font-weight: 500;
}
.modal-body input,
.modal-body select {
  width: 100%;
  padding: 12px 16px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 16px;
  transition: all 0.3s ease;
}
.modal-body input:focus,
.modal-body select:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--background-secondary);
  box-shadow: 0 0 0 2px var(--border-light);
}
.modal-body input::placeholder {
  color: var(--text-secondary);
}
.modal-body select {
  background-image: none;
  padding-right: 40px;
  cursor: pointer;
}
.modal-body select option {
  background-color: var(--text-dark);
  color: var(--text-primary);
  padding: 8px 12px;
}
.modal-body select option:checked {
  background-color: var(--primary);
  color: var(--text-dark);
}
.modal-body .form-group textarea {
  width: 100%;
  height: 200px;
  padding: 12px 16px;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 16px;
}
.modal-body textarea::-webkit-resizer {
  background-color: var(--info-primary);
  border-radius: 1px;
  border: 2px solid white;
}
.modal-body textarea::-webkit-resizer:hover {
  background-color: var(--info-secondary);
}
.modal-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.modal-body::-webkit-scrollbar-track {
  background: var(--background-additional);
  border-radius: 4px;
  margin: 10px 12px 12px 0;
}
.modal-body::-webkit-scrollbar-thumb {
  background: var(--background-secondary);
  border-radius: 4px;
  border: 1px solid var(--border-strong);
}
.modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--hover-primary);
  border-color: var(--border-medium);
}
.modal-body::-webkit-scrollbar-corner {
  background: var(--background-secondary);
  border-radius: 0 0 15px 0;
}
/* ─── Footer ──────────────────────────────────────────────────── */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border-light);
  flex-shrink: 0;
}
/* ─── Transition ──────────────────────────────────────────────── */
.modal-fade-enter-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.modal-fade-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}
.modal-fade-enter-from {
  opacity: 0;
  transform: scale(0.97) translateY(-6px);
}
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-4px);
}
@media (max-width: 768px) {
  .modal {
    position: fixed;
    inset: 10px;
    width: auto;
    height: auto;
    max-width: none;
    max-height: none;
    min-width: 0;
    min-height: 0;
    border-radius: 12px;
  }
  .modal.is-maximized {
    inset: 0;
    border-radius: 0;
  }
  .modal-header {
    cursor: default;
  }
  .modal-toolbar {
    height: auto;
    padding: 4px 0;
  }
  .control-btns {
    margin-right: 8px;
  }
  .modal-body {
    padding: 16px 20px 12px;
  }
  .modal-resize-handle {
    display: none;
  }
}
</style>