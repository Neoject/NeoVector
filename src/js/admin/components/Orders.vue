<script>
import {formatDate} from "./service";

export default {
  name: "Orders",
  data() {
    return {
      orders: [],
      ordersLoading: false,
      ordersError: '',
      orderStatuses: {
        pending: 'Ожидает',
        confirmed: 'Подтвержден',
        processing: 'В обработке',
        shipped: 'Отправлен',
        delivered: 'Доставлен',
        cancelled: 'Отменен'
      },
    }
  },
  mounted() {
    this.loadOrders().then(() => null);
  },
  methods: {
    formatDate,
    async loadOrders() {
      this.ordersLoading = true;
      this.ordersError = '';

      try {
        const response = await fetch('../api.php?action=orders', { credentials: 'same-origin' });

        if (response.ok) {
          this.orders = await response.json();
        } else {
          this.ordersError = 'Ошибка загрузки заказов';
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        this.ordersError = 'Ошибка загрузки заказов';
      }

      this.ordersLoading = false;
    },
    async updateOrderStatus(orderId, newStatus) {
      try {
        const formData = new FormData();
        formData.append('action', 'update_order_status');
        formData.append('order_id', orderId);
        formData.append('status', newStatus);

        const response = await fetch('../api.php', {
          method: 'POST',
          body: formData,
          credentials: 'same-origin'
        });

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            const order = this.orders.find(o => o.id === orderId);

            if (order) {
              order.status = newStatus;
            }
          } else {
            alert('Ошибка обновления статуса: ' + (result.error || 'Неизвестная ошибка'));
          }
        } else {
          alert('Ошибка обновления статуса');
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        alert('Ошибка обновления статуса');
      }
    },
    async updatePaymentStatus(orderId, paymentStatus) {
      try {
        const formData = new FormData();
        formData.append('action', 'update_payment_status');
        formData.append('order_id', orderId);
        formData.append('payment_status', paymentStatus);

        const response = await fetch('../api.php', {
          method: 'POST',
          body: formData,
          credentials: 'same-origin'
        });

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            const order = this.orders.find(o => o.id === orderId);

            if (order) {
              order.payment_status = paymentStatus;
            }
          } else {
            alert('Ошибка обновления статуса оплаты: ' + (result.error || 'Неизвестная ошибка'));
          }
        } else {
          alert('Ошибка обновления статуса оплаты');
        }
      } catch (error) {
        console.error('Error updating payment status:', error);
        alert('Ошибка обновления статуса оплаты');
      }
    },
    getStatusClass(status) {
      const statusClasses = {
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
        'processing': 'status-processing',
        'shipped': 'status-shipped',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
      };

      return statusClasses[status] || '';
    },
    getDeliveryTypeLabel(type) {
      return type === 'pickup' ? 'Самовывоз' : 'Доставка';
    },
    formatPrice(price) {
      return new Intl.NumberFormat('ru-RU').format(price) + ' руб.';
    },
    async deleteOrder(orderId) {
      if (!orderId) {
        alert('ID заказа не указан');
        return false;
      }

      if (!confirm('Вы действительно хотите удалить этот заказ? Это действие необратимо')) {
        return false;
      }

      try {
        const formData = new FormData();
        formData.append('action', 'delete_order');
        formData.append('order_id', orderId);

        const response = await fetch('../api.php', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          alert('Заказ успешно удален');
          await this.loadOrders();
          return true;
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'HTTP error! status: ' + response.status);
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Произошла ошибка: ' + error.message || 'Неизвестная ошибка');
        return false;
      }
    },
  }
}
</script>

<template>
  <div class="admin-content orders-content">
    <div class="container orders-container">
      <section>
        <div class="content-header">
          <h2>Управление заказами</h2>
          <div class="header-actions">
            <button @click="loadOrders" class="btn btn-secondary" :disabled="ordersLoading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': ordersLoading }"></i>
              <span class="btn-text">Обновить</span>
            </button>
          </div>
        </div>
        <div v-if="ordersError" class="error-message">
          {{ ordersError }}
        </div>
        <div v-if="ordersLoading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Загрузка заказов...</p>
        </div>
        <div v-else-if="orders.length === 0" class="empty-state">
          <i class="fas fa-shopping-cart"></i>
          <h3>Заказов пока нет</h3>
          <p>Когда клиенты будут оформлять заказы, они появятся здесь.</p>
        </div>
        <div v-else class="orders-list">
          <div v-for="order in orders" :key="order.id" class="order-card">
            <div class="order-header">
              <div class="order-info">
                <h3>Заказ #{{ order.id }}</h3>
                <div class="order-meta">
                  <span class="order-date">
                    <i class="fas fa-calendar"></i>
                    {{ formatDate(order.created_at) }}
                  </span>
                  <span class="order-total">
                    {{ formatPrice(order.total_amount) }}
                  </span>
                </div>
              </div>
              <div class="order-payment">
                <div class="payment-info">
                  <div class="payment-type">
                    <i :class="order.payment_type === 'online' ? 'fas fa-credit-card' : 'fas fa-money-bill-wave'"></i>
                    <span>{{ order.payment_type === 'online' ? 'Онлайн оплата' : 'Наличные' }}</span>
                  </div>
                  <div class="payment-status" :class="order.payment_status === 1 ? 'paid' : 'unpaid'">
                    <i :class="order.payment_status === 1 ? 'fas fa-check-circle' : 'fas fa-clock'"></i>
                    <span>{{ order.payment_status === 1 ? 'Оплачено' : 'Не оплачено' }}</span>
                  </div>
                </div>
                <button v-if="order.payment_status !== 1"
                        @click="updatePaymentStatus(order.id, 1)"
                        class="btn btn-sm btn-primary payment-status-btn"
                        title="Отметить как оплачено">
                  <i class="fas fa-check"></i> Оплачено
                </button>
              </div>
              <div class="order-status">
                <span
                    v-if="Object.keys(orderStatuses)[(Object.keys(orderStatuses).indexOf(order.status)) + 1]"
                    class="next-order-status"
                >Статус заказа:
                  <select :value="order.status"
                          @change="updateOrderStatus(order.id, $event.target.value)"
                          class="new-order-status"
                          :class="['status-select', getStatusClass(order.status)]"
                  >
                    <option value="pending">Ожидает</option>
                    <option value="confirmed">Подтвержден</option>
                    <option value="processing">В обработке</option>
                    <option value="shipped">Отправлен</option>
                    <option value="delivered">Доставлен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </span>
              </div>
              <div class="order-delete" @click="deleteOrder(order.id)">
                <i class="fas fa-trash"></i>
                <p>Удалить</p>
              </div>
            </div>
            <div class="order-content">
              <div class="order-customer">
                <h4>Клиент</h4>
                <div class="customer-info">
                  <p><strong>{{ order.customer_name }}</strong></p>
                  <p><i class="fas fa-phone"></i> {{ order.customer_phone }}</p>
                  <p v-if="order.customer_email"><i class="fas fa-envelope"></i> {{
                      order.customer_email }}
                  </p>
                </div>
              </div>
              <div class="order-delivery">
                <h4>Доставка</h4>
                <div class="delivery-info">
                  <p><strong>{{ getDeliveryTypeLabel(order.delivery_type) }}</strong>
                  </p>
                  <div v-if="order.delivery_type === 'delivery'">
                    <p><i class="fas fa-map-marker-alt"></i>
                      {{ order.delivery_address }}
                    </p>
                    <p v-if="order.delivery_date"><i class="fas fa-calendar"></i>
                      Дата: {{ order.delivery_date }}
                    </p>
                    <p v-if="order.delivery_time"><i class="fas fa-clock"></i>
                      Время: {{ order.delivery_time }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="order-items">
                <h4>Товары</h4>
                <div class="items-list">
                  <div v-for="item in order.order_items" :key="item.id"
                       class="order-item">
                    <img :src="'../' + item.image" :alt="item.name"
                         class="item-image">
                    <div class="item-details">
                      <h5>{{ item.name }}</h5>
                      <template v-if="item.options && item.options.length">
                        <p v-for="option in item.options"
                           :key="'order-item-option-' + item.id + '-' + option.slug">
                          {{ option.name }}: {{ option.value }}
                        </p>
                      </template>
                      <p>{{ item.material }}</p>
                      <div class="item-quantity">
                        <span>Количество: {{ item.quantity }}</span>
                        <span class="item-price">{{ formatPrice(item.price * item.quantity) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="order.notes" class="order-notes">
                <h4>Комментарий</h4>
                <p>{{ order.notes }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>

</style>