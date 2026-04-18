<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
  name: "History",
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
})
</script>

<template>
  <section v-if="block && block.type === 'history'" id="history">
    <div class="container">
      <h2 class="section-title scroll-animate"
          :class="{ 'animated': isInView('history-title-' + block.id), 'hidden': !isInView('history-title-' + block.id) }"
          :id="'history-title-' + block.id">{{ block.settings.sectionTitle || 'Наша история' }}</h2>
      <div class="history-content">
        <div class="history-timeline">
          <div v-for="(event, eventIndex) in block.settings.events" :key="eventIndex"
               class="timeline-item scroll-animate"
               :class="{ 'animated': isInView('timeline-' + block.id + '-' + eventIndex), 'hidden': !isInView('timeline-' + block.id + '-' + eventIndex) }"
               :id="'timeline-' + block.id + '-' + eventIndex"
               :style="'transition-delay: ' + (0.1 + eventIndex * 0.1) + 's'">
            <div class="timeline-year">{{ event.year }}</div>
            <div class="timeline-content">
              <h3>{{ event.title }}</h3>
              <p>{{ event.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.history-content {
  max-width: 1000px;
  margin: 0 auto;
  user-select: none;
}
.history-timeline {
  position: relative;
  margin-bottom: 80px;
}
.history-timeline::after {
  content: '';
  position: absolute;
  left: 5%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--primary);
  transform: translateX(-50%);
  z-index: 0;
}
.history-timeline::before {
  content: '';
  position: absolute;
  left: 95%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--primary);
  transform: translateX(-50%);
  z-index: 0;
}
.timeline-item {
  display: flex;
  align-items: center;
  margin-bottom: 60px;
  position: relative;
  z-index: 1;
}
.timeline-item:nth-child(odd) {
  flex-direction: row;
}
.timeline-item:nth-child(even) {
  flex-direction: row-reverse;
}
.timeline-year {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  color: var(--text-dark);
  padding: 15px 25px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 18px;
  min-width: 100px;
  text-align: center;
  position: relative;
  z-index: 2;
  box-shadow: var(--shadow-primary);
}
.timeline-content {
  background: var(--background-secondary);
  -webkit-border-radius: 15px;
  border-radius: 15px;
  padding: 30px;
  margin: 0 40px;
  flex: 1;
  max-width: 400px;
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}
.timeline-content:hover {
  background: var(--background-secondary);
  transform: translateY(-5px);
  box-shadow: 0 10px 25px var(--shadow-primary);
}
.timeline-content h3 {
  font-size: 22px;
  margin-bottom: 15px;
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.timeline-content p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 16px;
}
.history-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
  margin-top: 60px;
}
.stat-item {
  background: var(--background-secondary);
  -webkit-border-radius: 15px;
  border-radius: 15px;
  padding: 40px 20px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}
.stat-item:hover {
  background: var(--background-secondary);
  -webkit-transform: translateY(-10px);
  -moz-transform: translateY(-10px);
  -ms-transform: translateY(-10px);
  transform: translateY(-10px);
  box-shadow: 0 15px 30px var(--shadow-primary);
}
.stat-number {
  font-size: 48px;
  font-weight: 700;
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}
.stat-label {
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 500;
}
</style>