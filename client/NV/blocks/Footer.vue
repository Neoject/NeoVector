<script>
export default {
  name: "Footer",
  inject: ['params'],
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
  },
  data() {
    return {
      title: this.params.title
    }
  }
}
</script>

<template>
  <section id="footer">
    <footer>
      <div class="container" style="flex: 1">
        <div v-if="block.settings.paysystems" class="paysystems">
          <ul>
            <li><img src="../images/bepaid.png" alt=""></li>
            <li><img src="../images/erip.svg" alt=""></li>
          </ul>
          <ul>
            <li><img src="../images/visa.png" alt=""></li>
            <li><img src="../images/mastercard.png" alt=""></li>
            <li><img src="../images/belkart.png" alt=""></li>
            <li><img src="../images/apple-pay.webp" alt=""></li>
            <li><img src="../images/samsung-pay.png" alt=""></li>
            <li><img src="../images/google-pay.webp" alt=""></li>
          </ul>
        </div>
        <div class="footer-content"
             :class="{ 'animated': isInView('footer-content-' + block.id) }"
             id="'footer-content-' + footerBlock.id"
             v-html="block.content"
        >
        </div>
        <div class="footer-copyright">
          <div class="copyright-block">
            Copyright © 2025, {{ title }} — Все права защищены
          </div>
        </div>
      </div>
    </footer>
  </section>
</template>

<style scoped>

</style>