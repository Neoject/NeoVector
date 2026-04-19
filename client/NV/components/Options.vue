<script>
export default {
  name: 'OptionSelector',
  props: {
    modelValue: { type: Boolean, default: false },
    options: { type: Array, default: () => [] },
    action: { type: String, default: 'cart' },
  },
  emits: ['update:modelValue', 'done'],
  data() {
    return {
      index: 0,
      selected: [],
    };
  },
  computed: {
    currentOptionType() {
      return this.options[this.index] || null;
    },
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.index = 0;
        this.selected = [];
      }
    },
  },
  methods: {
    chooseValue(value) {
      const opt = this.currentOptionType;
      if (!opt) return;

      this.selected.push({ name: opt.name, slug: opt.slug, value });
      this.index++;

      if (this.index >= this.options.length) {
        const options = [...this.selected];
        const optionKey = options
            .map(o => `${o.slug || o.name}:${o.value}`)
            .join('|');
        this.$emit('done', { options, optionKey, action: this.action });
        this.close();
      }
    },
    close() {
      this.index = 0;
      this.selected = [];
      this.$emit('update:modelValue', false);
    },
  },
};
</script>

<template>
  <div v-if="modelValue" class="option-selector-modal" @click.self="close">
    <div class="option-selector-content">
      <div class="option-selector-header">
        <h3>Выберите {{ currentOptionType?.name || 'опцию' }}</h3>
        <button @click="close" class="close-icon"><i class="fas fa-times"></i></button>
      </div>
      <div class="option-selector-body">
        <div v-if="currentOptionType" class="option-values">
          <button v-for="value in currentOptionType.values" :key="value"
                  class="option-value-btn" @click="chooseValue(value)">
            {{ value }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.option-selector-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.option-selector-content {
  background: var(--background);
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
}
.option-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}
.option-selector-header h3 { font-size: 18px; color: var(--primary); margin: 0; }
.option-selector-body { padding: 20px; }
.option-values { display: flex; flex-wrap: wrap; gap: 10px; }
.option-value-btn {
  padding: 10px 18px;
  background: var(--background-secondary);
  border: 2px solid var(--border-light);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 15px;
  transition: all 0.2s;
}
.option-value-btn:hover { border-color: var(--primary); background: var(--hover-secondary); }
</style>
