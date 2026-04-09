<script>
function cssToHex(val) {
  if (!val) return '#000000';
  val = val.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(val)) return val;
  if (/^#[0-9a-fA-F]{3}$/.test(val)) {
    return '#' + val[1]+val[1]+val[2]+val[2]+val[3]+val[3];
  }
  if (/^#[0-9a-fA-F]{8}$/.test(val)) return val.slice(0, 7);
  const m = val.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (m) return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  return '#000000';
}

function isGradient(val) {
  return typeof val === 'string' && val.trim().includes('gradient');
}

let _nextStopId = 1;

export default {
  name: 'ColorPicker',

  props: {
    modelValue: { type: String, default: '#000000' },
  },
  emits: ['update:modelValue'],

  data() {
    return {
      isOpen: false,
      mode: 'solid',            // 'solid' | 'gradient'
      solidColor: '#4678d8',
      gradientType: 'linear',   // 'linear' | 'radial'
      gradientAngle: 135,
      stops: [
        { id: _nextStopId++, color: '#4678d8', position: 0 },
        { id: _nextStopId++, color: '#8e4aff', position: 100 },
      ],
      activeStopId: 1,
      dragging: null,
      _skipWatcher: false,
    };
  },

  computed: {
    activeStop() {
      return this.stops.find(s => s.id === this.activeStopId) || this.stops[0];
    },
    sortedStops() {
      return [...this.stops].sort((a, b) => a.position - b.position);
    },
    gradientCss() {
      const str = this.sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
      if (this.gradientType === 'radial') return `radial-gradient(circle, ${str})`;
      return `linear-gradient(${this.gradientAngle}deg, ${str})`;
    },
    currentValue() {
      return this.mode === 'solid' ? this.solidColor : this.gradientCss;
    },
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(v) {
        if (this._skipWatcher) return;
        this.parseIncoming(v);
      },
    },
  },

  mounted() {
    this._onOutside = (e) => {
      if (this.isOpen && this.$el && !this.$el.contains(e.target)) {
        this.isOpen = false;
      }
    };
    document.addEventListener('mousedown', this._onOutside);
  },
  beforeUnmount() {
    document.removeEventListener('mousedown', this._onOutside);
  },

  methods: {
    parseIncoming(val) {
      if (!val) return;
      if (isGradient(val)) {
        this.mode = 'gradient';
        this.parseGradient(val);
      } else {
        this.mode = 'solid';
        this.solidColor = cssToHex(val);
      }
    },

    parseGradient(val) {
      this.gradientType = val.trim().startsWith('radial') ? 'radial' : 'linear';
      const angleM = val.match(/(\d+)deg/);
      if (angleM) this.gradientAngle = parseInt(angleM[1]);

      // Extract inner content
      const inner = val.replace(/^(?:linear|radial)-gradient\(\s*/, '').replace(/\s*\)$/, '');
      const tokens = inner.split(',').map(s => s.trim()).filter(Boolean);
      const parsed = [];
      let sid = _nextStopId;

      for (const tok of tokens) {
        if (/^\d+deg$/.test(tok) || tok === 'circle' || tok === 'ellipse' || /^to\s/.test(tok)) continue;
        const colorM = tok.match(/(#[0-9a-fA-F]{3,8})/);
        const posM   = tok.match(/(\d+(?:\.\d+)?)%/);
        if (colorM) {
          parsed.push({
            id: sid++,
            color: cssToHex(colorM[1]),
            position: posM ? parseFloat(posM[1]) : parsed.length === 0 ? 0 : 100,
          });
        }
      }
      if (parsed.length >= 2) {
        this.stops = parsed;
        _nextStopId = sid;
        this.activeStopId = parsed[0].id;
      }
    },

    toggle() { this.isOpen = !this.isOpen; },

    emit() {
      this._skipWatcher = true;
      this.$emit('update:modelValue', this.currentValue);
      this.$nextTick(() => { this._skipWatcher = false; });
    },

    setMode(m) {
      this.mode = m;
      this.$nextTick(() => this.emit());
    },

    // ── Solid ───────────────────────────────────────────────────
    onSolidInput(e) {
      this.solidColor = e.target.value;
      this.emit();
    },
    onSolidHexInput(e) {
      const v = e.target.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        this.solidColor = v;
        this.emit();
      }
    },

    // ── Gradient ────────────────────────────────────────────────
    onAngleInput(e) {
      this.gradientAngle = parseInt(e.target.value);
      this.emit();
    },
    onAngleText(e) {
      const v = parseInt(e.target.value);
      if (!isNaN(v)) { this.gradientAngle = Math.min(360, Math.max(0, v)); this.emit(); }
    },

    onStopColorInput(e) {
      if (this.activeStop) { this.activeStop.color = e.target.value; this.emit(); }
    },
    onStopPosInput(e) {
      if (this.activeStop) {
        const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
        this.activeStop.position = v;
        this.emit();
      }
    },

    addStop() {
      // Place between the two most distant neighbours
      const sorted = this.sortedStops;
      let bestPos = 50;
      let maxGap = -1;
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i + 1].position - sorted[i].position;
        if (gap > maxGap) { maxGap = gap; bestPos = Math.round((sorted[i].position + sorted[i + 1].position) / 2); }
      }
      const nearest = [...this.stops].sort((a, b) => Math.abs(a.position - bestPos) - Math.abs(b.position - bestPos))[0];
      const ns = { id: _nextStopId++, color: nearest.color, position: bestPos };
      this.stops.push(ns);
      this.activeStopId = ns.id;
      this.emit();
    },

    removeActiveStop() {
      if (this.stops.length <= 2) return;
      const idx = this.stops.findIndex(s => s.id === this.activeStopId);
      this.stops.splice(idx, 1);
      this.activeStopId = this.stops[Math.max(0, idx - 1)].id;
      this.emit();
    },

    onBarClick(e) {
      if (this.dragging) return;
      const bar = this.$refs.gradientBar;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const pos = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const nearest = [...this.stops].sort((a, b) => Math.abs(a.position - pos) - Math.abs(b.position - pos))[0];
      const ns = { id: _nextStopId++, color: nearest.color, position: pos };
      this.stops.push(ns);
      this.activeStopId = ns.id;
      this.emit();
    },

    startDrag(e, stop) {
      e.preventDefault();
      e.stopPropagation();
      this.activeStopId = stop.id;
      const bar = this.$refs.gradientBar;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const startX = e.clientX;
      const startPos = stop.position;
      this.dragging = stop.id;

      const onMove = (me) => {
        const dx = me.clientX - startX;
        const dPct = (dx / rect.width) * 100;
        const s = this.stops.find(s => s.id === stop.id);
        if (s) { s.position = Math.min(100, Math.max(0, Math.round(startPos + dPct))); this.emit(); }
      };
      const onUp = () => {
        this.dragging = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
  },
};
</script>

<template>
  <div class="cpw">
    <!-- Swatch trigger -->
    <div
        class="cpw-swatch"
        :style="{ background: modelValue || '#000000' }"
        @click="toggle"
        title="Выбрать цвет / градиент"
    />

    <!-- Popover -->
    <Transition name="cpw-fade">
      <div v-if="isOpen" class="cpw-popover">

        <!-- Tabs -->
        <div class="cpw-tabs">
          <button :class="['cpw-tab', { active: mode === 'solid' }]" @click="setMode('solid')">
            <span class="cpw-tab-icon">⬤</span> Цвет
          </button>
          <button :class="['cpw-tab', { active: mode === 'gradient' }]" @click="setMode('gradient')">
            <span class="cpw-tab-icon">▦</span> Градиент
          </button>
        </div>

        <!-- ── SOLID ─────────────────────────────── -->
        <div v-if="mode === 'solid'" class="cpw-body">
          <input type="color" class="cpw-native-color" :value="solidColor" @input="onSolidInput" />
          <div class="cpw-hex-row">
            <span class="cpw-hex-hash">#</span>
            <input
                type="text"
                class="cpw-hex-input"
                :value="solidColor.slice(1)"
                @change="onSolidHexInput({ target: { value: '#' + $event.target.value } })"
                maxlength="6"
                spellcheck="false"
            />
          </div>
        </div>

        <!-- ── GRADIENT ──────────────────────────── -->
        <div v-else class="cpw-body">

          <!-- Type selector -->
          <div class="cpw-segmented">
            <button
                :class="{ active: gradientType === 'linear' }"
                @click="gradientType = 'linear'; emit()"
            >Линейный</button>
            <button
                :class="{ active: gradientType === 'radial' }"
                @click="gradientType = 'radial'; emit()"
            >Радиальный</button>
          </div>

          <!-- Angle (linear only) -->
          <div v-if="gradientType === 'linear'" class="cpw-angle-row">
            <div class="cpw-angle-dial" :style="{ '--a': gradientAngle + 'deg' }" @click="onBarClick">
              <div class="cpw-angle-needle" />
            </div>
            <input
                type="range" min="0" max="360"
                :value="gradientAngle"
                @input="onAngleInput"
                class="cpw-range"
            />
            <input
                type="number" min="0" max="360"
                :value="gradientAngle"
                @change="onAngleText"
                class="cpw-angle-num"
            />
          </div>

          <!-- Gradient bar + handles -->
          <div class="cpw-gradient-area">
            <div
                ref="gradientBar"
                class="cpw-bar"
                :style="{ background: gradientCss }"
                @click="onBarClick"
                title="Клик — добавить точку"
            />
            <!-- Stop handles -->
            <div class="cpw-handles-track">
              <div
                  v-for="stop in stops"
                  :key="stop.id"
                  class="cpw-handle"
                  :class="{ active: stop.id === activeStopId }"
                  :style="{ left: stop.position + '%', background: stop.color }"
                  @mousedown="startDrag($event, stop)"
                  @click.stop="activeStopId = stop.id"
                  :title="stop.position + '%'"
              />
            </div>
          </div>

          <!-- Active stop controls -->
          <div v-if="activeStop" class="cpw-stop-row">
            <input
                type="color"
                class="cpw-stop-color"
                :value="activeStop.color"
                @input="onStopColorInput"
            />
            <div class="cpw-stop-pos">
              <input
                  type="number" min="0" max="100"
                  :value="activeStop.position"
                  @change="onStopPosInput"
                  class="cpw-pos-input"
              />
              <span class="cpw-pos-unit">%</span>
            </div>
            <button class="cpw-stop-btn cpw-add" @click="addStop" title="Добавить точку">+</button>
            <button
                class="cpw-stop-btn cpw-del"
                @click="removeActiveStop"
                :disabled="stops.length <= 2"
                title="Удалить точку"
            >×</button>
          </div>

          <!-- Stops list pills -->
          <div class="cpw-stops-list">
            <div
                v-for="stop in sortedStops"
                :key="stop.id"
                class="cpw-stop-pill"
                :class="{ active: stop.id === activeStopId }"
                :style="{ '--c': stop.color }"
                @click="activeStopId = stop.id"
            >
              <span class="cpw-pill-swatch" />
              <span class="cpw-pill-pos">{{ stop.position }}%</span>
            </div>
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
.cpw {
  position: relative;
  display: inline-block;
}

/* ── Swatch ─────────────────────────────────────────────── */
.cpw-swatch {
  width: 38px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, .18);
  cursor: pointer;
  transition: box-shadow .15s, transform .1s;
  flex-shrink: 0;
}
.cpw-swatch:hover {
  box-shadow: 0 0 0 3px rgba(109, 123, 186, .3);
  transform: scale(1.05);
}

/* ── Popover ────────────────────────────────────────────── */
.cpw-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 9999;
  width: 240px;
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-medium, rgba(0,0,0,.12));
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.08);
  overflow: hidden;
}

/* keep popover in view when near right edge */
@media (max-width: 600px) {
  .cpw-popover { left: auto; right: 0; }
}

/* ── Transition ─────────────────────────────────────────── */
.cpw-fade-enter-active, .cpw-fade-leave-active { transition: opacity .15s, transform .15s; }
.cpw-fade-enter-from, .cpw-fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── Tabs ───────────────────────────────────────────────── */
.cpw-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color, rgba(0,0,0,.1));
}
.cpw-tab {
  flex: 1;
  padding: .5rem .25rem;
  font-size: .78rem;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary, #475569);
  transition: background .15s, color .15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .3rem;
}
.cpw-tab.active {
  background: var(--surface-muted, #eef2ff);
  color: var(--primary, #6d7bba);
  font-weight: 600;
}
.cpw-tab:hover:not(.active) { background: rgba(0,0,0,.04); }
.cpw-tab-icon { font-size: .65rem; }

/* ── Body ───────────────────────────────────────────────── */
.cpw-body {
  padding: .75rem;
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

/* ── Native color input (full-width swatch) ─────────────── */
.cpw-native-color {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 80px;
  border: 1px solid rgba(0,0,0,.12);
  border-radius: 8px;
  padding: 2px;
  cursor: pointer;
  background: none;
}
.cpw-native-color::-webkit-color-swatch-wrapper { padding: 0; }
.cpw-native-color::-webkit-color-swatch { border: none; border-radius: 6px; }

/* ── Hex input ──────────────────────────────────────────── */
.cpw-hex-row {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-medium, rgba(0,0,0,.12));
  border-radius: 6px;
  overflow: hidden;
  background: #acacac
}
.cpw-hex-hash {
  padding: 0 .4rem 0 .55rem;
  font-family: monospace;
  font-size: .8rem;
  color: var(--text-secondary, #475569);
  user-select: none;
}
.cpw-hex-input {
  flex: 1;
  border: none;
  outline: none;
  font-family: monospace;
  font-size: .82rem;
  text-transform: uppercase;
  padding: .32rem .5rem .32rem 0;
  background: transparent;
  color: var(--text-primary, #0f172a);
  width: 0; /* flex takes care of sizing */
  min-width: 0;
}

/* ── Segmented control ──────────────────────────────────── */
.cpw-segmented {
  display: flex;
  border: 1px solid var(--border-color, rgba(0,0,0,.12));
  border-radius: 7px;
  overflow: hidden;
}
.cpw-segmented button {
  flex: 1;
  padding: .3rem .5rem;
  font-size: .75rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary, #475569);
  transition: background .15s, color .15s;
}
.cpw-segmented button.active {
  background: var(--primary, #6d7bba);
  color: #fff;
  font-weight: 600;
}
.cpw-segmented button:not(.active):hover { background: rgba(0,0,0,.05); }

/* ── Angle row ──────────────────────────────────────────── */
.cpw-angle-row {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.cpw-angle-dial {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--primary, #6d7bba);
  position: relative;
  flex-shrink: 0;
  background: var(--surface-muted, #eef2ff);
  cursor: default;
}
.cpw-angle-needle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40%;
  height: 2px;
  background: var(--primary, #6d7bba);
  transform-origin: left center;
  transform: rotate(var(--a, 135deg)) translateY(-50%);
  border-radius: 2px;
}
.cpw-range {
  flex: 1;
  height: 4px;
  accent-color: var(--primary, #6d7bba);
  cursor: pointer;
}
.cpw-angle-num {
  width: 46px;
  font-size: .75rem;
  font-family: monospace;
  text-align: center;
  border: 1px solid var(--border-medium, rgba(0,0,0,.12));
  border-radius: 5px;
  padding: .2rem .25rem;
  background: #acacac;
  color: var(--text-primary, #0f172a);
  outline: none;
}
.cpw-angle-num::-webkit-inner-spin-button { opacity: .5; }

/* ── Gradient bar + handles ─────────────────────────────── */
.cpw-gradient-area {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.cpw-bar {
  height: 28px;
  border-radius: 6px 6px 0 0;
  border: 1px solid rgba(0,0,0,.1);
  border-bottom: none;
  cursor: crosshair;
}
.cpw-handles-track {
  height: 18px;
  position: relative;
  background: repeating-linear-gradient(
      45deg,
      #ccc 0, #ccc 4px,
      #fff 4px, #fff 8px
  );
  border-radius: 0 0 6px 6px;
  border: 1px solid rgba(0,0,0,.1);
  border-top: none;
}
.cpw-handle {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1.5px rgba(0,0,0,.3), 0 2px 4px rgba(0,0,0,.2);
  transform: translate(-50%, -50%);
  cursor: grab;
  transition: box-shadow .1s, transform .1s;
  z-index: 1;
}
.cpw-handle:active { cursor: grabbing; }
.cpw-handle.active {
  box-shadow: 0 0 0 2.5px var(--primary, #6d7bba), 0 2px 4px rgba(0,0,0,.3);
  transform: translate(-50%, -50%) scale(1.25);
  z-index: 2;
}

/* ── Active stop controls ───────────────────────────────── */
.cpw-stop-row {
  display: flex;
  align-items: center;
  gap: .45rem;
}
.cpw-stop-color {
  -webkit-appearance: none;
  appearance: none;
  width: 32px;
  height: 28px;
  border: 1px solid rgba(0,0,0,.12);
  border-radius: 5px;
  padding: 1px;
  cursor: pointer;
  background: none;
  flex-shrink: 0;
}
.cpw-stop-color::-webkit-color-swatch-wrapper { padding: 0; }
.cpw-stop-color::-webkit-color-swatch { border: none; border-radius: 3px; }

.cpw-stop-pos {
  display: flex;
  align-items: center;
  flex: 1;
  border: 1px solid var(--border-medium, rgba(0,0,0,.12));
  border-radius: 5px;
  overflow: hidden;
  background: #acacac;
}
.cpw-pos-input {
  width: 0;
  flex: 1;
  border: none;
  outline: none;
  font-family: monospace;
  font-size: .78rem;
  padding: .28rem .3rem;
  background: transparent;
  color: var(--text-primary, #0f172a);
  text-align: center;
}
.cpw-pos-input::-webkit-inner-spin-button { opacity: .5; }
.cpw-pos-unit {
  padding-right: .35rem;
  font-size: .72rem;
  color: var(--text-secondary, #475569);
}
.cpw-stop-btn {
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: 1px solid var(--border-color, rgba(0,0,0,.12));
  background: var(--surface-muted, #eef2ff);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s, color .15s;
  flex-shrink: 0;
}
.cpw-add:hover { background: var(--success-bg, #28a745); color: #fff; border-color: var(--success-bg, #28a745); }
.cpw-del:hover:not(:disabled) { background: var(--error-bg, #dc3545); color: #fff; border-color: var(--error-bg, #dc3545); }
.cpw-del:disabled { opacity: .35; cursor: not-allowed; }

/* ── Stops list pills ───────────────────────────────────── */
.cpw-stops-list {
  display: flex;
  flex-wrap: wrap;
  gap: .3rem;
}
.cpw-stop-pill {
  display: flex;
  align-items: center;
  gap: .3rem;
  padding: .2rem .45rem;
  border-radius: 20px;
  border: 1.5px solid transparent;
  background: var(--surface-muted, #eef2ff);
  cursor: pointer;
  font-size: .72rem;
  color: var(--text-secondary, #475569);
  transition: border-color .15s, background .15s;
}
.cpw-stop-pill.active {
  border-color: var(--primary, #6d7bba);
  background: var(--surface-color, #fff);
  color: var(--text-primary, #0f172a);
  font-weight: 600;
}
.cpw-pill-swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--c, #000);
  border: 1px solid rgba(0,0,0,.12);
  flex-shrink: 0;
}
</style>