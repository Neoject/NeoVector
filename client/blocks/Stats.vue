<script>
export default {
  name: "Stats",
  props: {
    block: {
      type: Object,
      default: {
        id: 0,
        type: '',
        settings: ''
      }
    },
    isInView: Function,
  }
}
</script>

<template>
  <section v-if="block && block.type === 'stats'" id="stats">
    <div class="container">
      <h2 v-if="block.settings.sectionTitle" class="section-title scroll-animate"
          :class="{ 'animated': isInView('stats-title-' + block.id), 'hidden': !isInView('stats-title-' + block.id) }"
          :id="'stats-title-' + block.id">{{ block.settings.sectionTitle }}</h2>
      <div v-if="block.settings.stats && block.settings.stats.length > 0" class="stats-grid">
        <div v-for="(stat, statIndex) in block.settings.stats" :key="statIndex"
             class="stat-item scroll-animate"
             :class="{ 'animated': isInView('stat-' + block.id + '-' + statIndex), 'hidden': !isInView('stat-' + block.id + '-' + statIndex) }"
             :id="'stat-' + block.id + '-' + statIndex"
             :style="'transition-delay: ' + (0.1 + statIndex * 0.1) + 's'">
          <div class="stat-number">{{ stat.number }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
      <div v-else class="empty-stats">
        <p>Нет данных для отображения</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
  user-select: none;
}
.stat-item {
  text-align: center;
  padding: 2rem;
  background: var(--background-secondary);
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid var(--border-light);
}
.stat-item:hover {
  background: var(--background-secondary);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
.stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 0.5rem;
  line-height: 1;
}
.stat-label {
  font-size: 1.1rem;
  color: var(--text-additional-light);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.empty-stats {
  text-align: center;
  padding: 2rem;
  color: var(--text-additional);
  font-style: italic;
}
</style>