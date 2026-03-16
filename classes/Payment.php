<?php

namespace NeoVector;

class Payment
{
    public static function getPaymentToken($data = []): void
    {
        global $HOME_URL;

        if (empty($data)) {
            $rawInput = file_get_contents('php://input');
            if ($rawInput) {
                $decoded = json_decode($rawInput, true);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            }
        }

        $shopId = Config::get('SHOP_ID');
        $secretKey = Config::get('SECRET_BEPAID_KEY');

        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');

        if (!empty($HOME_URL) && $HOME_URL !== '/') {
            $basePath = rtrim($HOME_URL, '/');
        } else {
            $basePath = $scriptDir ?: '';
        }
        
        $baseUrl = $protocol . '://' . $host . $basePath;

        if (!empty($_GET['id'])) {
            $returnUrl = $baseUrl . '/product?id=' . urlencode($_GET['id']);
        } else {
            $returnUrl = $baseUrl . '/';
        }

        $orderForm = $data['orderForm'] ?? [];
        $cartItems = $data['cartItems'] ?? [];
        $cartTotal = $data['cartTotal'] ?? 0;

        $amount = (int) round(((float) $cartTotal) * 100);
        if ($amount <= 0) {
            Service::sendError(400, 'Некорректная сумма заказа. Сумма должна быть больше нуля.');
        }

        $customerEmail = trim((string) ($orderForm['customer_email'] ?? ''));
        if (empty($customerEmail)) {
            Service::sendError(400, 'Email обязателен для онлайн-оплаты');
        }
        
        if (!filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
            Service::sendError(400, 'Некорректный формат email адреса');
        }

        $customerName = trim((string) ($orderForm['customer_name'] ?? ''));

        if (empty($cartItems) || !is_array($cartItems) || count($cartItems) === 0) {
            Service::sendError(400, 'Корзина пуста');
        }

        $description = 'Оплата заказа';
        if ($customerName !== '') {
            $description .= ' для ' . $customerName;
        }

        if (empty($shopId) || empty($secretKey)) {
            Log::error('Payment credentials missing', ['shop_id' => !empty($shopId), 'secret_key' => !empty($secretKey)]);
            Service::sendError(500, 'Ошибка конфигурации платежной системы');
        }

        $notificationUrl = $baseUrl . '/api.php?action=payment_notification';
        
        $checkoutData = [
            'checkout' => [
                'test' => false,
                'transaction_type' => 'payment',
                'attempts' => 3,
                'settings' => [
                    'return_url' => $returnUrl,
                    'success_url' => $returnUrl,
                    'decline_url' => $returnUrl,
                    'fail_url' => $returnUrl,
                    'cancel_url' => $returnUrl,
                    'notification_url' => $notificationUrl,
                    'button_next_text' => 'Вернуться в магазин',
                    'language' => 'ru',
                    'customer_fields' => [
                        'visible' => ['first_name', 'last_name'],
                        'read_only' => ['email']
                    ]
                ],
                'order' => [
                    'currency' => 'BYN',
                    'amount' => $amount,
                    'description' => $description
                ],
                'customer' => [
                    'email' => $customerEmail
                ]
            ]
        ];

        $ch = curl_init('https://checkout.bepaid.by/ctp/api/checkouts');

        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($checkoutData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-API-Version: 2'
        ]);
        curl_setopt($ch, CURLOPT_USERPWD, $shopId . ':' . $secretKey);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            Service::sendError(500, 'Ошибка cURL при запросе в платежный шлюз', $error);
        }

        curl_close($ch);

        if ($httpCode === 200 || $httpCode === 201) {
            $result = json_decode($response, true);

            if ($result === null && json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Payment API JSON decode error', json_last_error_msg());
                Service::sendError(500, 'Ошибка обработки ответа платежного шлюза');
            }

            Service::sendJson($result);
        } else {
            $errorResponse = json_decode($response, true);
            $errorMessage = 'Ошибка платежного шлюза';
            
            if (is_array($errorResponse)) {
                if (isset($errorResponse['message'])) {
                    $errorMessage = $errorResponse['message'];
                } elseif (isset($errorResponse['errors']) && is_array($errorResponse['errors'])) {
                    $errorMessages = [];

                    foreach ($errorResponse['errors'] as $error) {
                        if (is_string($error)) {
                            $errorMessages[] = $error;
                        } elseif (is_array($error) && isset($error['message'])) {
                            $errorMessages[] = $error['message'];
                        }
                    }

                    if (!empty($errorMessages)) {
                        $errorMessage = implode(', ', $errorMessages);
                    }
                }
            }
            
            Log::error('Payment API error', [
                'http_code' => $httpCode,
                'response' => $response,
                'checkout_data' => $checkoutData
            ]);

            if ($httpCode === 422) {
                Service::sendError(422, 'Ошибка валидации данных платежной системы: ' . $errorMessage);
            } else {
                Service::sendError(500, 'Ошибка платежного шлюза: ' . $errorMessage);
            }
        }
    }
}