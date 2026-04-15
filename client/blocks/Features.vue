<script>
export default {
  name: "Features",
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
  <section v-if="block && block.type === 'features'" id="features">
    <div class="container">
      <h2 class="section-title scroll-animate"
          :class="{ 'animated': isInView('features-title-' + block.id), 'hidden': !isInView('features-title-' + block.id) }"
          :id="'features-title-' + block.id">{{ block.settings.sectionTitle
        }}</h2>
      <div class="features-grid">
        <div v-for="(feature, featureIndex) in block.settings.features" :key="featureIndex"
             class="feature-card"
             :class="{ 'animated': isInView('feature-' + block.id + '-' + featureIndex), 'hidden': !isInView('feature-' + block.id + '-' + featureIndex) }"
             :id="'feature-' + block.id + '-' + featureIndex">
          <div class="feature-icon">
            <i :class="feature.icon"></i>
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}
.feature-card {
  background: var(--background-secondary);
  -webkit-border-radius: 15px;
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
}
.feature-card:hover {
  -ms-transform: translateY(-10px);
  transform: translateY(-10px);
  background: var(--background-secondary);
  box-shadow: 0 15px 30px var(--shadow-primary);
}
.feature-icon {
  font-size: 50px;
  background: var(--primary);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-alt) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
}
.feature-title {
  font-size: 22px;
  margin-bottom: 15px;
}
.feature-description {
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>