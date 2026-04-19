<script>
export default {
  name: 'OrderModal',
  props: {
    modelValue: { type: Boolean, default: false },
    currentOrderProduct: { type: Object, default: null },
    cartItems: { type: Array, default: () => [] },
    cartTotal: { type: Number, default: 0 },
  },
  emits: ['update:modelValue', 'order-success'],
  data() {
    return {
      orderLoading: false,
      orderError: '',
      orderSuccess: '',
      orderForm: {
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        delivery_type: 'pickup',
        delivery_city: '',
        delivery_street: '',
        delivery_building: '',
        delivery_date: '',
        delivery_time: '',
        payment_type: 'cash',
        notes: '',
      },
    };
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.orderError = '';
        this.orderSuccess = '';
      }
    },
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
    async submitOrder() {
      this.orderLoading = true;
      this.orderError = '';
      this.orderSuccess = '';

      try {
        if (!this.orderForm.customer_name.trim()) throw new Error('Имя обязательно');
        if (!this.orderForm.customer_phone.trim()) throw new Error('Телефон обязателен');

        const items = this.currentOrderProduct ? [this.currentOrderProduct] : this.cartItems;
        const total = this.currentOrderProduct
            ? this.currentOrderProduct.price * this.currentOrderProduct.quantity
            : this.cartTotal;

        const body = {
          customer_name: this.orderForm.customer_name.trim(),
          customer_phone: this.orderForm.customer_phone.trim(),
          customer_email: this.orderForm.customer_email.trim(),
          delivery_type: this.orderForm.delivery_type,
          delivery_address: this.orderForm.delivery_type === 'delivery'
              ? `${this.orderForm.delivery_city}, ${this.orderForm.delivery_street}, ${this.orderForm.delivery_building}`
              : '',
          delivery_date: this.orderForm.delivery_date,
          delivery_time: this.orderForm.delivery_time,
          payment_type: this.orderForm.payment_type,
          order_items: items,
          total_amount: total,
          notes: this.orderForm.notes.trim(),
        };

        const r = await fetch('/api/orders', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const json = await r.json();
        if (!json.success) throw new Error(json.error || 'Ошибка');

        this.orderSuccess = 'Заказ оформлен! Мы свяжемся с вами.';
        this.$emit('order-success');
        setTimeout(() => this.close(), 3000);
      } catch (e) {
        this.orderError = e.message;
      } finally {
        this.orderLoading = false;
      }
    },
  },
};
</script>

<template>
  <div v-if="modelValue" class="order-modal-overlay" @click.self="close">
    <div class="order-modal">
      <div class="order-modal-header">
        <h3>Оформление заказа</h3>
        <button @click="close" class="close-icon"><i class="fas fa-times"></i></button>
      </div>
      <div class="order-modal-body">
        <div v-if="orderSuccess" class="alert-success">{{ orderSuccess }}</div>
        <div v-if="orderError" class="alert-error">{{ orderError }}</div>
        <form @submit.prevent="submitOrder">
          <div class="form-group"><label>Имя *</label><input v-model="orderForm.customer_name" required></div>
          <div class="form-group"><label>Телефон *</label><input v-model="orderForm.customer_phone" required type="tel"></div>
          <div class="form-group"><label>Email</label><input v-model="orderForm.customer_email" type="email"></div>
          <div class="form-group">
            <label>Доставка</label>
            <select v-model="orderForm.delivery_type">
              <option value="pickup">Самовывоз</option>
              <option value="delivery">Доставка</option>
            </select>
          </div>
          <template v-if="orderForm.delivery_type === 'delivery'">
            <div class="form-group"><label>Город *</label><input v-model="orderForm.delivery_city" required></div>
            <div class="form-group"><label>Улица *</label><input v-model="orderForm.delivery_street" required></div>
            <div class="form-group"><label>Дом/квартира *</label><input v-model="orderForm.delivery_building" required></div>
          </template>
          <div class="form-group">
            <label>Оплата</label>
            <select v-model="orderForm.payment_type">
              <option value="cash">Наличные</option>
              <option value="card">Карта</option>
            </select>
          </div>
          <div class="form-group"><label>Комментарий</label><textarea v-model="orderForm.notes" rows="3"></textarea></div>
          <button type="submit" class="btn btn-primary" :disabled="orderLoading" style="width:100%">
            {{ orderLoading ? 'Отправка...' : 'Оформить заказ' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.order-modal {
  background: var(--background);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}
.order-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}
.order-modal-header h3 {
  font-size: 20px;
  color: var(--primary);
  margin: 0;
}
.order-modal-body { padding: 20px; }
.alert-success { background: var(--success-bg); color: #fff; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; }
.alert-error { background: var(--error-bg); color: #fff; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; }
</style>
