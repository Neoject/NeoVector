const Order = {
    mixins: [nv],
    template: `
    
    `,
    data() {
        return {
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
                delivery_price: 0,
                payment_type: 'cash',
                notes: ''
            },
            fieldErrors: {
                customer_name: '',
                customer_phone: '',
                delivery_city: '',
                delivery_street: '',
                delivery_building: '',
                policy: ''
            },
            currentOrderProduct: null,
            dadataToken: '7c958262d9f01a263e77984b8ee106c01816709a',
            citySuggestions: [],
            streetSuggestions: [],
            citySearchLoading: false,
            streetSearchLoading: false,
            citySearchTimeout: null,
            streetSearchTimeout: null,
            citySearchAbortController: null,
            streetSearchAbortController: null,
            deliveryCityValid: false,
            deliveryStreetValid: false,
            selectedCityData: null,
            selectedStreetData: null,
            deliveryCityError: '',
            deliveryStreetError: '',
            orderLoading: false,
            orderError: '',
            orderSuccess: '',
            policyYes: false,
            policyNo: false,
            deliveryAvailable: true,
            pickupAddress: '',
            workHours: '',
            storePhone: '',
            deliveryBel: '',
            deliveryRus: '',
        }
    },
    methods: {
        policy() {
            return !!this.policyYes && !this.policyNo;
        },
        deliveryAddressPreview() {
            if (this.orderForm.delivery_type !== 'delivery') {
                return '';
            }
            return this.buildDeliveryAddress();
        },
        increaseCurrentOrderQuantity() {
            if (!this.currentOrderProduct) return;
            const currentQty = Number(this.currentOrderProduct.quantity || 1) || 1;
            this.currentOrderProduct.quantity = currentQty + 1;
        },
        decreaseCurrentOrderQuantity() {
            if (!this.currentOrderProduct) return;
            const currentQty = Number(this.currentOrderProduct.quantity || 1) || 1;
            if (currentQty <= 1) {
                return;
            }
            this.currentOrderProduct.quantity = currentQty - 1;
        },
        handleProductCardClick(event, product) {
            if (this.isMobile) {
                const isButtonClick = event.target.closest('button') !== null;

                if (!isButtonClick) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        },
        onCityInput() {
            this.deliveryCityError = '';
            this.fieldErrors.delivery_city = '';
            this.deliveryCityValid = false;
            this.selectedCityData = null;
            this.resetStreetData();

            const query = (this.orderForm.delivery_city || '').trim();

            if (this.citySearchTimeout) clearTimeout(this.citySearchTimeout);

            if (!query || query.length < 2) {
                this.citySuggestions = [];
                return;
            }

            this.citySearchTimeout = setTimeout(() => {
                this.searchCity(query).then(r => null);
            }, 300);
        },
        onCityBlur() {
            if (!this.orderForm.delivery_city.trim()) {
                this.deliveryCityError = 'Укажите город доставки';
                this.citySuggestions = [];
                return;
            }
            if (!this.deliveryCityValid) {
                this.deliveryCityError = 'Выберите город из списка';
            }
            this.citySuggestions = [];
        },
        async searchCity(query) {
            if (!this.dadataToken) {
                console.warn('Dadata token is missing. Cannot perform city search.');
                return;
            }

            if (!query || query.trim().length < 2) {
                this.citySuggestions = [];
                return;
            }

            this.citySearchLoading = true;

            try {
                const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Token ${this.dadataToken}`
                    },
                    body: JSON.stringify({
                        query: query,
                        count: 10,
                        locations: [
                            { country: 'Беларусь' },
                            { country_iso_code: 'BY' }
                        ],
                        restrict_value: true,
                        from_bound: { value: 'city' },
                        to_bound: { value: 'city' }
                    })
                });

                const result = await response.json()

                this.citySuggestions = Array.isArray(result?.suggestions)
                    ? result.suggestions.map(s => ({
                        label: s.value,
                        value: s.value,
                        data: s.data,
                        raw: s
                    }))
                    : [];

                if (!result.suggestions.length) {
                    const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Token ${this.dadataToken}`
                        },
                        body: JSON.stringify({
                            query: query,
                            count: 10,
                            locations: [
                                { country: 'Россия' },
                                { country_iso_code: 'RU' }
                            ],
                            restrict_value: true,
                            from_bound: { value: 'city' },
                            to_bound: { value: 'city' }
                        })
                    });

                    const result = await response.json()

                    this.citySuggestions = Array.isArray(result?.suggestions)
                        ? result.suggestions.map(s => ({
                            label: s.value,
                            value: s.value,
                            data: s.data,
                            raw: s
                        }))
                        : [];
                }
            } catch (err) {
                console.error('Dadata city error:', err);
                this.deliveryCityError = 'Ошибка поиска городов. Попробуйте позже.';
            } finally {
                this.citySearchLoading = false;
            }
        },
        formatCitySuggestion(place) {
            if (!place || !place.address) {
                return null;
            }

            const label = this.normalizeCityName(place.address);

            if (!label) {
                return null;
            }
            return {
                place_id: place.place_id,
                label,
                region: place.address.state || place.address.region || place.address.county || '',
                raw: place
            };
        },
        selectCity(city) {
            if (!city) return;

            this.orderForm.delivery_city = city.label;
            this.deliveryCityValid = true;
            this.selectedCityData = city.data;  // тут вся инфа: kladr_id, fias_id, region, etc.
            this.deliveryCityError = '';
            this.citySuggestions = [];
            this.resetStreetData();
            // this.orderForm.delivery_postcode = city.data.postal_code || '';
        },
        onStreetInput() {
            this.deliveryStreetError = '';
            this.fieldErrors.delivery_street = '';
            this.deliveryStreetValid = false;

            const query = (this.orderForm.delivery_street || '').trim();

            if (this.streetSearchTimeout) clearTimeout(this.streetSearchTimeout);

            if (!query || query.length < 2) {
                this.streetSuggestions = [];
                return;
            }

            this.streetSearchTimeout = setTimeout(() => {
                this.searchStreet(query);
            }, 300);
        },
        onStreetBlur() {
            if (!this.orderForm.delivery_street.trim()) {
                this.deliveryStreetError = 'Укажите улицу доставки';
                this.streetSuggestions = [];
                return;
            }
            if (!this.deliveryStreetValid) {
                this.deliveryStreetError = 'Выберите улицу из списка';
            }
            this.streetSuggestions = [];
        },
        async searchStreet(query) {
            if (!this.dadataToken) {
                console.warn('Dadata token is missing. Cannot perform street search.');
                this.streetSuggestions = [];
                return;
            }

            if (!this.selectedCityData) {
                this.streetSuggestions = [];
                return;
            }

            if (!query || query.trim().length < 2) {
                this.streetSuggestions = [];
                return;
            }

            this.streetSearchLoading = true;

            try {
                const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Token ${this.dadataToken}`
                    },
                    body: JSON.stringify({
                        query: query,
                        count: 15,
                        locations: [
                            {
                                country: 'Беларусь',
                                region_fias_id: this.selectedCityData.region_fias_id,
                                area_fias_id: this.selectedCityData.area_fias_id || null,
                                city_fias_id: this.selectedCityData.city_fias_id || null,
                                settlement_fias_id: this.selectedCityData.settlement_fias_id || null
                            }
                        ],
                        restrict_value: true,
                        from_bound: { value: 'street' },
                        to_bound: { value: 'street' }
                    })
                });

                const result = await response.json();

                this.streetSuggestions = Array.isArray(result?.suggestions)
                    ? result.suggestions.map(s => ({
                        label: s.value,
                        value: s.value,
                        data: s.data,
                        raw: s
                    }))
                    : [];

                if (!result.suggestions.length) {
                    const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Token ${this.dadataToken}`
                        },
                        body: JSON.stringify({
                            query: query,
                            count: 15,
                            locations: [
                                {
                                    country: 'Россия',
                                    region_fias_id: this.selectedCityData.region_fias_id,
                                    area_fias_id: this.selectedCityData.area_fias_id || null,
                                    city_fias_id: this.selectedCityData.city_fias_id || null,
                                    settlement_fias_id: this.selectedCityData.settlement_fias_id || null
                                }
                            ],
                            restrict_value: true,
                            from_bound: { value: 'street' },
                            to_bound: { value: 'street' }
                        })
                    });

                    const result = await response.json();

                    this.streetSuggestions = Array.isArray(result?.suggestions)
                        ? result.suggestions.map(s => ({
                            label: s.value,
                            value: s.value,
                            data: s.data,
                            raw: s
                        }))
                        : [];
                }
            } catch (err) {
                console.error('Dadata street error:', err);
                this.deliveryStreetError = 'Ошибка поиска улиц.';
            } finally {
                this.streetSearchLoading = false;
            }
        },
        formatStreetSuggestion(place) {
            if (!place || !place.address) {
                return null;
            }
            const label = this.normalizeStreetName(place.address);
            if (!label) {
                return null;
            }
            return {
                place_id: place.place_id,
                label,
                raw: place
            };
        },
        selectStreet(street) {
            if (!street) return;

            this.orderForm.delivery_street = street.label.replace(/^ул\.?\s+/i, '');
            this.deliveryStreetValid = true;
            this.selectedStreetData = street.data;
            this.deliveryStreetError = '';
            this.streetSuggestions = [];
        },
        resetStreetData() {
            this.orderForm.delivery_street = '';
            this.deliveryStreetValid = false;
            this.selectedStreetData = null;
            this.streetSuggestions = [];
            this.orderForm.delivery_building = '';
            this.deliveryStreetError = '';
        },
        normalizeCityName(address) {
            if (!address) {
                return '';
            }
            return address.city || address.town || address.village || address.hamlet || address.municipality || address.state || '';
        },
        normalizeStreetName(address) {
            if (!address) {
                return '';
            }
            return address.road || address.residential || address.pedestrian || address.footway || address.cycleway || address.path || '';
        },
        buildDeliveryAddress() {
            if (this.orderForm.delivery_type !== 'delivery') {
                return '';
            }
            const parts = [];
            if (this.orderForm.delivery_city) {
                parts.push(this.orderForm.delivery_city);
            }
            if (this.orderForm.delivery_street) {
                parts.push(`ул. ${this.orderForm.delivery_street}`);
            }
            if (this.orderForm.delivery_building) {
                parts.push(this.orderForm.delivery_building);
            }
            return parts.join(', ');
        },
        onDeliveryTypeChange() {
            if (this.orderForm.delivery_type === 'pickup') {
                this.orderForm.delivery_city = '';
                this.orderForm.delivery_street = '';
                this.orderForm.delivery_building = '';
                this.orderForm.delivery_date = '';
                this.orderForm.delivery_time = '';
                this.deliveryCityValid = false;
                this.deliveryStreetValid = false;
                this.selectedCityData = null;
                this.selectedStreetData = null;
                this.citySuggestions = [];
                this.streetSuggestions = [];
                this.deliveryCityError = '';
                this.deliveryStreetError = '';
            }
        },
        async submitOrder() {
            this.orderLoading = true;
            this.orderError = '';
            this.orderSuccess = '';

            try {
                const email = (this.orderForm.customer_email || '').trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!this.orderForm.customer_name.trim()) {
                    this.orderLoading = false;
                    this.scrollToField('customer_name', 'Имя обязательно для заполнения');
                    return;
                }
                if (!this.orderForm.customer_phone.trim()) {
                    this.orderLoading = false;
                    this.scrollToField('customer_phone', 'Телефон обязателен для заполнения');
                    return;
                }
                if (!this.validatePhoneFormat(this.orderForm.customer_phone.trim())) {
                    this.orderLoading = false;
                    this.scrollToField('customer_phone', 'Введите корректный номер телефона. Формат: +375 (XX) XXX-XX-XX или 8 (0XX) XXX-XX-XX');
                    return;
                }
                if (this.orderForm.payment_type === 'online') {
                    if (!email) {
                        this.orderLoading = false;
                        this.scrollToField('customer_email', 'Email обязателен для онлайн-оплаты');
                        return;
                    }
                    if (!emailRegex.test(email)) {
                        this.orderLoading = false;
                        this.scrollToField('customer_email', 'Введите корректный email');
                        return;
                    }
                }
                if (this.orderForm.delivery_type === 'delivery') {
                    if (!this.deliveryCityValid || !this.orderForm.delivery_city.trim()) {
                        throw new Error('Выберите существующий город Беларуси из списка');
                    }
                    if (!this.deliveryStreetValid || !this.orderForm.delivery_street.trim()) {
                        throw new Error('Выберите улицу в выбранном городе');
                    }
                    if (!this.orderForm.delivery_building.trim()) {
                        throw new Error('Укажите номер дома или квартиры');
                    }
                }

                const deliveryAddress = this.orderForm.delivery_type === 'delivery'
                    ? this.buildDeliveryAddress()
                    : '';

                const orderData = {
                    action: 'create_order',
                    customer_name: this.orderForm.customer_name.trim(),
                    customer_phone: this.orderForm.customer_phone.trim(),
                    customer_email: email,
                    delivery_type: this.orderForm.delivery_type,
                    delivery_address: deliveryAddress,
                    delivery_date: this.orderForm.delivery_date,
                    delivery_time: this.orderForm.delivery_time,
                    payment_type: this.orderForm.payment_type || 'cash',
                    order_items: JSON.stringify(this.currentOrderProduct ? [this.currentOrderProduct] : this.cartItems),
                    total_amount: this.currentOrderProduct ? this.currentOrderProduct.price * this.currentOrderProduct.quantity : this.cartTotal,
                    notes: this.orderForm.notes.trim()
                };

                const formData = new FormData();
                Object.keys(orderData).forEach(key => {
                    formData.append(key, orderData[key]);
                });

                const response = await fetch('api.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });

                const result = await response.json();

                if (result.success) {
                    this.orderSuccess = 'Ващ заказ успешно оформлен!';

                    if (!this.currentOrderProduct) {
                        this.cartItems = [];
                        this.saveCart();
                    }

                    this.orderForm = {
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
                        notes: ''
                    };
                    this.deliveryCityValid = false;
                    this.deliveryStreetValid = false;
                    this.selectedCityData = null;
                    this.selectedStreetData = null;
                    this.citySuggestions = [];
                    this.streetSuggestions = [];
                    this.deliveryCityError = '';
                    this.deliveryStreetError = '';
                    this.hand = null;
                    this.showHandSelector = false;
                    this.resetOptionSelectionState();
                    this.selectingHandProductId = null;

                    setTimeout(() => {
                        this.closeOrderModal();
                    }, 3000);
                } else {
                    this.orderError = result.error || 'Ошибка при оформлении заказа';
                }
            } catch (error) {
                this.orderError = error.message || 'Произошла ошибка при оформлении заказа';
            }

            this.orderLoading = false;
        },
        clearFieldErrors() {
            this.fieldErrors = {
                customer_name: '',
                customer_phone: '',
                delivery_city: '',
                delivery_street: '',
                delivery_building: '',
                policy: ''
            };
        },
        scrollToField(fieldId, errorMessage) {
            this.$nextTick(() => {
                const field = document.getElementById(fieldId);

                if (field) {
                    if (field.type === 'checkbox') {
                        const formGroup = field.closest('.form-group');

                        if (formGroup) {
                            formGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    } else {
                        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        field.focus();
                    }
                    const errorKey = fieldId === 'privacy-policy' ? 'policy' : fieldId;
                    this.fieldErrors[errorKey] = errorMessage;

                    setTimeout(() => {
                        if (this.fieldErrors[errorKey] === errorMessage) {
                            this.fieldErrors[errorKey] = '';
                        }
                    }, 5000);
                }
            });
        },
        validatePhoneFormat(phone) {
            if (!phone || !phone.trim()) {
                return false;
            }

            const cleaned = phone.replace(/[\s\-\(\)]/g, '');

            if (/^\+375\d{9}$/.test(cleaned)) {
                return true;
            }

            if (/^375\d{9}$/.test(cleaned)) {
                return true;
            }

            if (/^8\d{9}$/.test(cleaned)) {
                return true;
            }

            return /^0\d{9}$/.test(cleaned);


        },
        validateOrderForm() {
            this.clearFieldErrors();
            this.orderError = '';

            const email = (this.orderForm.customer_email || '').trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!this.orderForm.customer_name.trim()) {
                this.scrollToField('customer_name', 'Имя обязательно для заполнения');
                return false;
            }

            if (!this.orderForm.customer_phone.trim()) {
                this.scrollToField('customer_phone', 'Телефон обязателен для заполнения');
                return false;
            }

            if (!this.validatePhoneFormat(this.orderForm.customer_phone.trim())) {
                this.scrollToField('customer_phone', 'Введите корректный номер телефона. Формат: +375 (XX) XXX-XX-XX или 8 (0XX) XXX-XX-XX');
                return false;
            }

            if (this.orderForm.payment_type === 'online') {
                if (!email) {
                    this.scrollToField('customer_email', 'Email обязателен для онлайн-оплаты');
                    return false;
                }

                if (!emailRegex.test(email)) {
                    this.scrollToField('customer_email', 'Введите корректный email');
                    return false;
                }
            }

            if (this.orderForm.delivery_type === 'delivery') {
                if (!this.deliveryCityValid || !this.orderForm.delivery_city.trim()) {
                    this.scrollToField('delivery_city', 'Выберите существующий город Беларуси из списка');
                    return false;
                }

                if (!this.deliveryStreetValid || !this.orderForm.delivery_street.trim()) {
                    this.scrollToField('delivery_street', 'Выберите улицу в выбранном городе');
                    return false;
                }

                if (!this.orderForm.delivery_building.trim()) {
                    this.scrollToField('delivery_building', 'Укажите номер дома или квартиры');
                    return false;
                }
            }

            if (!this.policy) {
                this.scrollToField('privacy-policy', 'Необходимо согласие с политикой обработки персональных данных');
                return false;
            }

            return true;
        },
        handleOnlinePayment() {
            if (this.validateOrderForm()) {
                this.orderForm.delivery_price = this.currentOrderProduct
                    ? this.orderForm.delivery_type === 'delivery'
                        ? this.orderForm.delivery_city && this.orderForm.delivery_city.includes('Беларусь')
                            ? this.deliveryBel
                            : this.orderForm.delivery_city
                                ? this.deliveryRus
                                : 0
                        : 0
                    : 0;

                const orderData = {
                    orderForm: { ...this.orderForm },
                    cartItems: this.currentOrderProduct ? [this.currentOrderProduct] : [...this.cartItems],
                    cartTotal: (this.currentOrderProduct
                        ? (this.currentOrderProduct.price * this.currentOrderProduct.quantity)
                        : this.cartTotal) + this.orderForm.delivery_price,
                    currentOrderProduct: this.currentOrderProduct
                };

                NV.payment(orderData, async () => {
                    try {
                        await this.submitOrder();
                    } finally {
                        this.closeOrderModal();
                    }
                });
            }
        },
        orderProduct(product, event) {
            if (this.isMobile && event) {
                event.stopPropagation();
            }

            this.currentOrderProduct = {
                ...product,
                options: this.selectedProductOptions.map(option => ({ ...option })),
                optionKey: this.buildOptionKey(this.selectedProductOptions),
                quantity: 1
            };
            this.openOrderModal();
        },
        policyChange(value) {
            this.fieldErrors.policy = '';

            if (value === 'yes') {
                this.policyNo = false;
                this.deliveryAvailable = true;
            } else if (value === 'no') {
                this.policyNotify();
                this.orderForm.delivery_type = 'pickup';
                this.policyYes = false;
                this.deliveryAvailable = false;
            }
        },
        policyNotify() {
            NV.notifyPolicyReject();
        },
    }
}