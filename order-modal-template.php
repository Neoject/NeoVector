<?php
/**
 * Общий шаблон окна оформления заказа
 * Используется в index.php и product/index.php
 * 
 * @var string $HOME_URL Базовый URL сайта
 * @var bool $hasAutocomplete Использовать ли автодополнение для адреса (DaData)
 * @var callable|null $normalizeImageUrl Функция для нормализации URL изображений (опционально)
 */

if (!isset($HOME_URL)) {
    $HOME_URL = '';
}
if (!isset($hasAutocomplete)) {
    $hasAutocomplete = false;
}
if (!isset($normalizeImageUrl)) {
    $normalizeImageUrl = null;
}

$policyUrl = rtrim($HOME_URL, '/') . '/policy';
?>
<div class="order-modal" :class="{ 'active': orderModalOpen }" @click.self="closeOrderModal">
    <div class="order-modal-content">
        <div class="order-header">
            <h3>Оформление заказа</h3>
            <button class="close-icon" @click="closeOrderModal">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="order-content">
            <div class="order-summary">
                <h4>Ваш заказ</h4>
                <div class="order-items">
                    <div v-if="currentOrderProduct" class="order-item">
                        <img :src="currentOrderProduct.image" :alt="currentOrderProduct.name" class="order-item-img"
                            loading="lazy" decoding="async">
                        <div class="order-item-details">
                            <h5>{{ currentOrderProduct.name }}</h5>
                            <template v-if="currentOrderProduct.options && currentOrderProduct.options.length">
                                <p v-for="option in currentOrderProduct.options"
                                    :key="`order-product-option-${option.slug}`">
                                    {{ option.name }}: {{ option.value }}
                                </p>
                            </template>
                            <p>{{ currentOrderProduct.material }}</p>
                            <div class="order-item-quantity">
                                <span>
                                    Количество:
                                    <button type="button" class="qty-btn" @click="decreaseCurrentOrderQuantity">−</button>
                                    <strong>{{ currentOrderProduct.quantity }}</strong>
                                    <button type="button" class="qty-btn" @click="increaseCurrentOrderQuantity">+</button>
                                </span>
                                <span class="order-item-price">{{ currentOrderProduct.price *
                                    currentOrderProduct.quantity }} руб.</span>
                            </div>
                        </div>
                    </div>
                    <div v-else v-for="item in cartItems" :key="`${item.id}-${item.optionKey || item.hand || ''}`"
                        class="order-item">
                        <img :src="'/'+item.image" :alt="item.name" class="order-item-img" loading="lazy" decoding="async">
                        <div class="order-item-details">
                            <div class="cart-item-title-content">
                                <h5>{{ item.name }}</h5>
                                <span @click="removeFromCart(item)" class="remove-item-btn"><i
                                        class="fa-solid fa-xmark"></i></span>
                            </div>
                            <template v-if="item.options && item.options.length">
                                <p v-for="option in item.options" :key="`order-cart-option-${item.id}-${option.slug}`">
                                    {{ option.name }}: {{ option.value }}
                                </p>
                            </template>
                            <p>{{ item.material }}</p>
                            <div class="order-item-quantity">
                                <span>
                                    Количество:
                                    <button type="button" class="qty-btn" @click="decreaseQuantity(item)">−</button>
                                    <strong>{{ item.quantity }}</strong>
                                    <button type="button" class="qty-btn" @click="increaseQuantity(item)">+</button>
                                </span>
                                <span class="order-item-price">{{ item.price * item.quantity }} руб.</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="order-total">
                    <span>Итого: {{ currentOrderProduct ? currentOrderProduct.price * currentOrderProduct.quantity :
                        cartTotal }} руб.</span>
                </div>
            </div>
            <form @submit.prevent="submitOrder" class="order-form">
                <div class="form-section">
                    <h4>Контактная информация</h4>
                    <div class="form-group">
                        <label for="customer_name">Имя *</label>
                        <input type="text" id="customer_name" v-model="orderForm.customer_name" @input="fieldErrors.customer_name = ''" required>
                        <div v-if="fieldErrors.customer_name" class="field-tooltip">{{ fieldErrors.customer_name }}</div>
                    </div>
                    <div class="form-group">
                        <label for="customer_phone">Телефон *</label>
                        <input type="tel" id="customer_phone" v-model="orderForm.customer_phone" @input="fieldErrors.customer_phone = ''" required>
                        <div v-if="fieldErrors.customer_phone" class="field-tooltip">{{ fieldErrors.customer_phone }}</div>
                    </div>
                    <div class="form-group">
                        <label for="customer_email">
                            Email<span v-if="orderForm.payment_type === 'online'"> *</span>
                        </label>
                        <input
                            type="email"
                            id="customer_email"
                            v-model="orderForm.customer_email"
                            :required="orderForm.payment_type === 'online'"
                        >
                    </div>
                </div>
                <div class="form-section">
                    <h4>Способ получения</h4>
                    <div class="delivery-options">
                        <label class="delivery-option">
                            <input type="radio" v-model="orderForm.delivery_type" value="pickup" <?php echo $hasAutocomplete ? '@change="onDeliveryTypeChange"' : ''; ?>>
                            <div class="delivery-option-content">
                                <i class="fas fa-store"></i>
                                <div>
                                    <span class="delivery-option-title">Самовывоз</span>
                                    <span class="delivery-option-description">Забрать в магазине</span>
                                </div>
                            </div>
                        </label>
                        <label class="delivery-option">
                            <input type="radio" v-model="orderForm.delivery_type" value="delivery" <?php echo $hasAutocomplete ? '@change="onDeliveryTypeChange"' : ''; ?>>
                            <div class="delivery-option-content">
                                <i class="fas fa-truck"></i>
                                <div>
                                    <span class="delivery-option-title">Доставка</span>
                                    <span class="delivery-option-description">Доставка по адресу</span>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                <div v-if="orderForm.delivery_type === 'delivery'" class="form-section delivery-details">
                    <h4>Детали доставки</h4>
                    <?php if ($hasAutocomplete): ?>
                        <div class="form-group autocomplete">
                            <label for="delivery_city">Город *</label>
                            <div>
                                <input type="text" id="delivery_city" v-model="orderForm.delivery_city" @input="onCityInput"
                                    @blur="onCityBlur" autocomplete="off" placeholder="Введите свой город"
                                    :class="{ 'invalid': deliveryCityError || fieldErrors.delivery_city }">
                                <span class="clear-input fas fa-x" @click="clearInput('city')"></span>
                            </div>
                            <p class="input-hint">Укажите свой город</p>
                            <div v-if="citySearchLoading" class="autocomplete-status">Ищем города...</div>
                            <div v-else-if="orderForm.delivery_city && !citySuggestions.length && !deliveryCityValid"
                                class="autocomplete-status warning">
                                Город не найден
                            </div>
                            <ul v-if="citySuggestions.length" class="autocomplete-list">
                                <li v-for="city in citySuggestions" :key="city.place_id"
                                    @mousedown.prevent="selectCity(city)">
                                    <span>{{ city.label }}</span>
                                    <small v-if="city.region">{{ city.region }}</small>
                                </li>
                            </ul>
                            <p v-if="deliveryCityError" class="input-error">{{ deliveryCityError }}</p>
                            <div v-if="fieldErrors.delivery_city" class="field-tooltip">{{ fieldErrors.delivery_city }}</div>
                        </div>
                        <div class="form-group autocomplete">
                            <label for="delivery_street">Улица *</label>
                            <div>
                                <input type="text" id="delivery_street" v-model="orderForm.delivery_street"
                                    @input="onStreetInput" @blur="onStreetBlur" :disabled="!deliveryCityValid"
                                    autocomplete="off" placeholder="Введите улицу"
                                    :class="{ 'invalid': deliveryStreetError || fieldErrors.delivery_street }">
                                <span class="clear-input fas fa-x" @click="clearInput('street')"></span>
                            </div>
                            <p class="input-hint">Сначала выберите город, затем улицу</p>
                            <div v-if="streetSearchLoading" class="autocomplete-status">Ищем улицы...</div>
                            <div v-else-if="orderForm.delivery_street && !streetSuggestions.length && !deliveryStreetValid"
                                class="autocomplete-status warning">
                                Улица не найдена
                            </div>
                            <ul v-if="streetSuggestions.length" class="autocomplete-list">
                                <li v-for="street in streetSuggestions" :key="street.place_id"
                                    @mousedown.prevent="selectStreet(street)">
                                    <span>{{ street.label }}</span>
                                </li>
                            </ul>
                            <p v-if="deliveryStreetError" class="input-error">{{ deliveryStreetError }}</p>
                            <div v-if="fieldErrors.delivery_street" class="field-tooltip">{{ fieldErrors.delivery_street }}</div>
                        </div>
                        <div class="form-group">
                            <label for="delivery_building">Дом / квартира *</label>
                            <input type="text" id="delivery_building" v-model="orderForm.delivery_building"
                                @input="fieldErrors.delivery_building = ''" placeholder="Например: д. 10, кв. 15" required>
                            <div v-if="fieldErrors.delivery_building" class="field-tooltip">{{ fieldErrors.delivery_building }}</div>
                        </div>
                        <div class="delivery-address-preview" v-if="deliveryAddressPreview">
                            <strong>Адрес доставки:</strong>
                            <span>{{ deliveryAddressPreview }}</span>
                        </div>
                    <?php else: ?>
                        <div class="form-group">
                            <label for="delivery_city">Город *</label>
                            <input type="text" id="delivery_city" v-model="orderForm.delivery_city" @input="fieldErrors.delivery_city = ''" required>
                            <div v-if="fieldErrors.delivery_city" class="field-tooltip">{{ fieldErrors.delivery_city }}</div>
                        </div>
                        <div class="form-group">
                            <label for="delivery_street">Улица *</label>
                            <input type="text" id="delivery_street" v-model="orderForm.delivery_street" @input="fieldErrors.delivery_street = ''" required>
                            <div v-if="fieldErrors.delivery_street" class="field-tooltip">{{ fieldErrors.delivery_street }}</div>
                        </div>
                        <div class="form-group">
                            <label for="delivery_building">Дом / квартира *</label>
                            <input type="text" id="delivery_building" v-model="orderForm.delivery_building"
                                @input="fieldErrors.delivery_building = ''" placeholder="Например: д. 10, кв. 15" required>
                            <div v-if="fieldErrors.delivery_building" class="field-tooltip">{{ fieldErrors.delivery_building }}</div>
                        </div>
                    <?php endif; ?>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="delivery_date">Дата доставки</label>
                            <input type="date" id="delivery_date" v-model="orderForm.delivery_date" :min="today">
                        </div>
                        <div class="form-group">
                            <label for="delivery_time">Время доставки</label>
                            <input type="time" id="delivery_time" v-model="orderForm.delivery_time">
                        </div>
                    </div>
                </div>
                <div v-if="orderForm.delivery_type === 'pickup'" class="form-section pickup-details">
                    <h4>Информация о самовывозе</h4>
                    <div class="pickup-info">
                        <p id="pickup_address"><i class="fas fa-map-marker-alt"></i></p>
                        <p id="work_hours"><i class="fas fa-clock"></i></p>
                        <p id="store_phone"><i class="fas fa-phone"></i></p>
                    </div>
                </div>
                <div class="form-section">
                    <h4>Способ оплаты</h4>
                    <div class="payment-options">
                        <label class="payment-option">
                            <input type="radio" v-model="orderForm.payment_type" value="cash">
                            <div class="payment-option-content">
                                <i class="fa-solid fa-wallet"></i>
                                <div>
                                    <span class="payment-option-title">Наличными</span>
                                    <span class="payment-option-description">При получении</span>
                                </div>
                            </div>
                        </label>
                        <label class="payment-option">
                            <input type="radio" v-model="orderForm.payment_type" value="online">
                            <div class="payment-option-content">
                                <i class="fa-solid fa-credit-card"></i>
                                <div>
                                    <span class="payment-option-title">Онлайн</span>
                                    <span class="payment-option-description">оплата картой</span>
                                </div>
                            </div>
                        </label>
                    </div>
<!--                    <div v-if="orderForm.payment_type === 'online'" class="payment-selector">
                        <a onclick="AE.payment()" class="btn">Оплатить</a>
                    </div>-->
                </div>
                <div class="form-section">
                    <h4>Дополнительно</h4>
                    <div class="form-group">
                        <label for="order_notes">Комментарий к заказу</label>
                        <textarea id="order_notes" v-model="orderForm.notes" rows="3"
                            placeholder="Дополнительные пожелания..."></textarea>
                    </div>
                </div>
                <div class="form-section">
                    <div class="form-group checkbox-form">
                        <input id="privacy-policy" type="checkbox" v-model="policy" @change="fieldErrors.policy = ''">
                        <label class="checkbox-label" for="privacy-policy">
                            Согласен с
                            <a href="<?php echo htmlspecialchars($policyUrl); ?>" target="_blank">политикой обработки
                                персональных данных</a>
                        </label>
                        <div v-if="fieldErrors.policy" class="field-tooltip">{{ fieldErrors.policy }}</div>
                    </div>
                </div>
                <div v-if="orderError" class="error-message">{{ orderError }}</div>
                <div v-if="orderSuccess" class="success-message">{{ orderSuccess }}</div>
                <div class="order-actions">
                    <button type="button" class="btn btn-secondary" @click="closeOrderModal">Отмена</button>
                    <button v-if="orderForm.payment_type === 'online'" type="button" class="btn btn-primary" @click="handleOnlinePayment" :disabled="orderLoading || !policy">
                        {{ orderLoading ? 'Оформляем заказ...' : 'Оформить заказ' }}
                    </button>
                    <button v-else type="submit" class="btn btn-primary" :disabled="orderLoading || !policy">
                        {{ orderLoading ? 'Оформляем заказ...' : 'Оформить заказ' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>