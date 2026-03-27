<?php

namespace NeoVector;

use mysqli;
use Exception;

class Order
{
    public function __construct()
    {
        $this->createTable();
    }

    public static function createTable(): void
    {
        $sql = "CREATE TABLE IF NOT EXISTS `orders` (
            `id` int(255) NOT NULL AUTO_INCREMENT,
            `customer_name` varchar(255) NOT NULL,
            `customer_phone` varchar(20) NOT NULL,
            `customer_email` varchar(255),
            `delivery_type` enum('pickup', 'delivery') NOT NULL,
            `delivery_address` text,
            `delivery_date` date,
            `delivery_time` time,
            `payment_type` enum('cash', 'online') NOT NULL,
            `payment_status` int(255) NOT NULL,
            `order_items` text NOT NULL,
            `total_amount` decimal(10,2) NOT NULL,
            `status` enum('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
            `notes` text,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";

        Database::db()->query($sql);
    }

    /**
     * @param array $data
     * @return int
     * @throws Exception
     */
    public static function create(array $data): int
    {
        $customerName = trim($data['customer_name'] ?? '');
        $customerPhone = trim($data['customer_phone'] ?? '');
        $customerEmail = trim($data['customer_email'] ?? '');
        $deliveryType = $data['delivery_type'] ?? '';
        $deliveryAddress = trim($data['delivery_address'] ?? '');
        $deliveryDate = $data['delivery_date'] ?? '';
        $deliveryTime = $data['delivery_time'] ?? '';
        $paymentType = $data['payment_type'] ?? '';
        $paymentStatus = $data['payment_status'] ?? '';
        $orderItems = $data['order_items'] ?? '';
        $totalAmount = floatval($data['total_amount'] ?? 0);
        $notes = trim($data['notes'] ?? '');

        if (empty($customerName) || empty($customerPhone) || empty($deliveryType) || empty($orderItems)) {
            throw new Exception('Обязательные поля не заполнены');
        }

        if (!in_array($deliveryType, ['pickup', 'delivery'])) {
            throw new Exception('Неверный тип доставки');
        }

        if ($deliveryType === 'delivery' && empty($deliveryAddress)) {
            throw new Exception('Адрес доставки обязателен');
        }

        if (!empty($customerEmail) && !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Неверный формат email');
        }

        if (empty($paymentType) || !in_array($paymentType, ['cash', 'online'])) {
            throw new Exception('Неверный тип оплаты');
        }

        if ($paymentType === 'online') {
            $paymentStatus = 1;
        } else {
            $paymentStatus = intval($paymentStatus ?? 0);
        }

        if (is_array($orderItems)) {
            $orderItems = json_encode($orderItems, JSON_UNESCAPED_UNICODE);
        }

        $stmt = Database::db()->prepare('INSERT INTO orders (customer_name, customer_phone, customer_email, delivery_type, delivery_address, delivery_date, delivery_time, payment_type, payment_status, order_items, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('ssssssssisds', $customerName, $customerPhone, $customerEmail, $deliveryType, $deliveryAddress, $deliveryDate, $deliveryTime, $paymentType, $paymentStatus, $orderItems, $totalAmount, $notes);
        $stmt->execute();
        $id = Database::db()->insert_id;
        $stmt->close();

        self::handleOrder($data, $id);

        return $id;
    }

    private static function handleOrder(array $data, int $id): void
    {
        try {
            $paymentType = $data['payment_type'] ?? 'cash';

            if (!empty($data['customer_email'])) {
                try {
                    self::sendOrderConfirmationEmail($id, $paymentType);
                } catch (Exception $e) {
                    Log::error('Customer email sending error:', $e->getMessage());
                }
            }

            try {
                self::sendOrderNotificationToSeller($id, $paymentType);
            } catch (Exception $e) {
                Log::error('Seller email sending error:', $e->getMessage());
            }

            return;
        } catch (Exception $e) {
            Service::sendError(400, $e->getMessage());
        }
    }

    /**
     * @return array
     */
    public static function getAll(): array
    {
        $stmt = Database::db()->prepare('SELECT * FROM orders ORDER BY created_at DESC');
        $stmt->execute();
        $result = $stmt->get_result();

        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = [
                'id' => (int)$row['id'],
                'customer_name' => $row['customer_name'],
                'customer_phone' => $row['customer_phone'],
                'customer_email' => $row['customer_email'],
                'delivery_type' => $row['delivery_type'],
                'delivery_address' => $row['delivery_address'],
                'delivery_date' => $row['delivery_date'],
                'delivery_time' => $row['delivery_time'],
                'payment_type' => $row['payment_type'],
                'payment_status' => $row['payment_status'],
                'order_items' => json_decode($row['order_items'], true),
                'total_amount' => floatval($row['total_amount']),
                'status' => $row['status'],
                'notes' => $row['notes'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at']
            ];
        }

        $stmt->close();

        return $orders;
    }

    /**
     * @param int $orderId
     * @param string $status
     * @return bool
     * @throws Exception
     */
    public static function updateStatus(int $orderId, string $status): bool
    {
        $allowedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!in_array($status, $allowedStatuses)) {
            throw new Exception('Invalid status');
        }

        $stmt = Database::db()->prepare('UPDATE orders SET status = ? WHERE id = ?');
        $stmt->bind_param('si', $status, $orderId);
        $result = $stmt->execute();
        $stmt->close();

        return $result;
    }

    /**
     * Обновить статус оплаты заказа
     * @param int $orderId
     * @param int $paymentStatus 0 — не оплачено, 1 — оплачено
     * @return bool
     * @throws Exception
     */
    public static function updatePaymentStatus(int $orderId, int $paymentStatus): bool
    {
        if (!in_array($paymentStatus, [0, 1])) {
            throw new Exception('Invalid payment status');
        }

        $stmt = Database::db()->prepare('UPDATE orders SET payment_status = ? WHERE id = ?');
        $stmt->bind_param('ii', $paymentStatus, $orderId);
        $result = $stmt->execute();
        $stmt->close();

        return $result;
    }

    /**
     * @param int $orderId
     * @return bool
     */
    public static function delete(int $orderId): bool
    {
        $stmt = Database::db()->prepare('DELETE FROM orders WHERE id = ?');
        $stmt->bind_param('i', $orderId);
        $result = $stmt->execute();
        $stmt->close();

        return $result;
    }

    /**
     * Получить заказ по ID
     * @param int $orderId
     * @return array|null
     */
    public static function getById(int $orderId): ?array
    {
        $stmt = Database::db()->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->bind_param('i', $orderId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        if (!$row) {
            return null;
        }

        return [
            'id' => (int)$row['id'],
            'customer_name' => $row['customer_name'],
            'customer_phone' => $row['customer_phone'],
            'customer_email' => $row['customer_email'],
            'delivery_type' => $row['delivery_type'],
            'delivery_address' => $row['delivery_address'],
            'delivery_date' => $row['delivery_date'],
            'delivery_time' => $row['delivery_time'],
            'payment_type' => $row['payment_type'],
            'payment_status' => $row['payment_status'],
            'order_items' => json_decode($row['order_items'], true),
            'total_amount' => floatval($row['total_amount']),
            'status' => $row['status'],
            'notes' => $row['notes'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }

    /**
     * Отправить email клиенту с подтверждением заказа
     * @param int $orderId
     * @param string $paymentType Тип оплаты (cash или online)
     * @return bool
     */
    public static function sendOrderConfirmationEmail(int $orderId, string $paymentType = 'cash'): bool
    {
        $order = self::getById($orderId);
        
        if (!$order || empty($order['customer_email'])) {
            return false;
        }

        $customerEmail = trim($order['customer_email']);
        if (!filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $orderItems = $order['order_items'] ?? [];
        $itemsHtml = '';
        
        if (is_array($orderItems)) {
            foreach ($orderItems as $item) {
                $itemName = htmlspecialchars($item['name'] ?? 'Товар');
                $itemQuantity = (int)($item['quantity'] ?? 1);
                $itemPrice = floatval($item['price'] ?? 0);
                $itemTotal = $itemPrice * $itemQuantity;
                
                $optionsHtml = '';
                if (!empty($item['options']) && is_array($item['options'])) {
                    $options = [];
                    foreach ($item['options'] as $option) {
                        $optName = htmlspecialchars($option['name'] ?? '');
                        $optValue = htmlspecialchars($option['value'] ?? '');
                        if ($optName && $optValue) {
                            $options[] = "{$optName}: {$optValue}";
                        }
                    }
                    if (!empty($options)) {
                        $optionsHtml = '<br><small style="color: #666;">' . implode(', ', $options) . '</small>';
                    }
                }
                
                $materialHtml = '';
                if (!empty($item['material'])) {
                    $materialHtml = '<br><small style="color: #666;">Материал: ' . htmlspecialchars($item['material']) . '</small>';
                }
                
                $itemsHtml .= "
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$itemName}{$optionsHtml}{$materialHtml}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>{$itemQuantity}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>{$itemTotal} руб.</td>
                </tr>";
            }
        }

        $deliveryTypeText = $order['delivery_type'] === 'delivery' ? 'Доставка' : 'Самовывоз';
        
        if ($order['delivery_type'] === 'delivery' && !empty($order['delivery_address'])) {
            $deliveryInfo = '<p><strong>Адрес доставки:</strong> ' . htmlspecialchars($order['delivery_address']) . '</p>';
            if (!empty($order['delivery_date'])) {
                $deliveryInfo .= '<p><strong>Дата доставки:</strong> ' . htmlspecialchars($order['delivery_date']) . '</p>';
            }
            if (!empty($order['delivery_time'])) {
                $deliveryInfo .= '<p><strong>Время доставки:</strong> ' . htmlspecialchars($order['delivery_time']) . '</p>';
            }
        } else {
            $deliveryInfo = '<p>Вы сможете забрать заказ в нашем магазине.</p>';
        }

        $notesHtml = '';
        if (!empty($order['notes'])) {
            $notesHtml = '<p><strong>Комментарий к заказу:</strong><br>' . nl2br(htmlspecialchars($order['notes'])) . '</p>';
        }

        $paymentTypeText = $paymentType === 'online' ? 'Онлайн оплата (оплачено)' : 'Наличными при получении';

        $subject = "Подтверждение заказа №{$orderId}";
        
        $emailHtml = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>" . htmlspecialchars($subject) . "</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;'>
                <h2 style='color: #d4af37; margin-top: 0;'>Спасибо за ваш заказ!</h2>
                <p>Здравствуйте, " . htmlspecialchars($order['customer_name']) . "!</p>
                <p>Ваш заказ успешно оформлен. Ниже представлена информация о заказе:</p>
            </div>
            
            <div style='background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;'>
                <h3 style='color: #333; margin-top: 0;'>Детали заказа</h3>
                <p><strong>Дата заказа:</strong> " . htmlspecialchars($order['created_at']) . "</p>
                <p><strong>Имя:</strong> " . htmlspecialchars($order['customer_name']) . "</p>
                <p><strong>Телефон:</strong> " . htmlspecialchars($order['customer_phone']) . "</p>
                <p><strong>Email:</strong> " . htmlspecialchars($order['customer_email']) . "</p>
                <p><strong>Способ доставки:</strong> {$deliveryTypeText}</p>
                {$deliveryInfo}
                <p><strong>Способ оплаты:</strong> {$paymentTypeText}</p>
            </div>
            
            <div style='background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;'>
                <h3 style='color: #333; margin-top: 0;'>Состав заказа</h3>
                <table style='width: 100%; border-collapse: collapse;'>
                    <thead>
                        <tr style='background: #f8f9fa;'>
                            <th style='padding: 10px; text-align: left; border-bottom: 2px solid #ddd;'>Товар</th>
                            <th style='padding: 10px; text-align: center; border-bottom: 2px solid #ddd;'>Количество</th>
                            <th style='padding: 10px; text-align: right; border-bottom: 2px solid #ddd;'>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan='2' style='padding: 15px 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;'>Итого:</td>
                            <td style='padding: 15px 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd; font-size: 18px; color: #d4af37;'>{$order['total_amount']} руб.</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            " . (!empty($notesHtml) ? "<div style='background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;'>{$notesHtml}</div>" : "") . "
            
            <div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;'>
                <p style='margin: 0; color: #666; font-size: 14px;'>Мы свяжемся с вами в ближайшее время для подтверждения заказа.</p>
                <p style='margin: 10px 0 0 0; color: #666; font-size: 14px;'>Если у вас возникли вопросы, пожалуйста, свяжитесь с нами.</p>
            </div>
        </body>
        </html>";

        $fromEmail = Config::get('EMAIL_FROM', 'noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        $fromName = Config::get('EMAIL_FROM_NAME');
        
        $headers = "From: {$fromName} <{$fromEmail}>\r\n";
        $headers .= "Reply-To: " . Config::get('EMAIL', $fromEmail) . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();

        $mailSent = @mail($customerEmail, $subject, $emailHtml, $headers);
        
        if ($mailSent) {
            Log::write('order_email_sent', [
                'order_id' => $orderId,
                'email' => $customerEmail
            ]);
        } else {
            Log::error('order_email_failed', [
                'order_id' => $orderId,
                'email' => $customerEmail
            ]);
        }

        return $mailSent;
    }

    /**
     * Отправить email продавцу о новом заказе
     * @param int $orderId
     * @param string $paymentType Тип оплаты (cash или online)
     * @return bool
     */
    public static function sendOrderNotificationToSeller(int $orderId, string $paymentType = 'cash'): bool
    {
        $order = self::getById($orderId);
        
        if (!$order) {
            return false;
        }

        $sellerEmail = Config::get('EMAIL');

        if (empty($sellerEmail)) {
            $sellerEmail = Config::get('CONTACT_EMAIL');
        }

        if (empty($sellerEmail)) {
            $sellerEmail = getenv('CONTACT_EMAIL');
        }

        if (empty($sellerEmail) || !filter_var($sellerEmail, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $orderItems = $order['order_items'] ?? [];
        $itemsHtml = '';
        
        if (is_array($orderItems)) {
            foreach ($orderItems as $item) {
                $itemName = htmlspecialchars($item['name'] ?? 'Товар');
                $itemQuantity = (int)($item['quantity'] ?? 1);
                $itemPrice = floatval($item['price'] ?? 0);
                $itemTotal = $itemPrice * $itemQuantity;
                
                $optionsHtml = '';
                if (!empty($item['options']) && is_array($item['options'])) {
                    $options = [];
                    foreach ($item['options'] as $option) {
                        $optName = htmlspecialchars($option['name'] ?? '');
                        $optValue = htmlspecialchars($option['value'] ?? '');
                        if ($optName && $optValue) {
                            $options[] = "{$optName}: {$optValue}";
                        }
                    }
                    if (!empty($options)) {
                        $optionsHtml = '<br><small style="color: #666;">' . implode(', ', $options) . '</small>';
                    }
                }
                
                $materialHtml = '';
                if (!empty($item['material'])) {
                    $materialHtml = '<br><small style="color: #666;">Материал: ' . htmlspecialchars($item['material']) . '</small>';
                }
                
                $itemsHtml .= "
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$itemName}{$optionsHtml}{$materialHtml}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>{$itemQuantity}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>{$itemTotal} руб.</td>
                </tr>";
            }
        }

        $deliveryTypeText = $order['delivery_type'] === 'delivery' ? 'Доставка' : 'Самовывоз';
        $deliveryInfo = '';
        
        if ($order['delivery_type'] === 'delivery' && !empty($order['delivery_address'])) {
            $deliveryInfo = '<p><strong>Адрес доставки:</strong> ' . htmlspecialchars($order['delivery_address']) . '</p>';
            if (!empty($order['delivery_date'])) {
                $deliveryInfo .= '<p><strong>Дата доставки:</strong> ' . htmlspecialchars($order['delivery_date']) . '</p>';
            }
            if (!empty($order['delivery_time'])) {
                $deliveryInfo .= '<p><strong>Время доставки:</strong> ' . htmlspecialchars($order['delivery_time']) . '</p>';
            }
        } else {
            $deliveryInfo = '<p><strong>Способ получения:</strong> Самовывоз из магазина</p>';
        }

        $notesHtml = '';
        if (!empty($order['notes'])) {
            $notesHtml = '<p><strong>Комментарий клиента:</strong><br>' . nl2br(htmlspecialchars($order['notes'])) . '</p>';
        }

        $paymentTypeText = $paymentType === 'online' ? 'Онлайн оплата (оплачено)' : 'Наличными при получении';
        $paymentStatusHtml = $paymentType === 'online' 
            ? '<p style="color: #4CAF50; font-weight: bold;">✓ Заказ оплачен онлайн</p>' 
            : '<p style="color: #ff9800; font-weight: bold;">⚠ Оплата при получении</p>';

        $subject = "Новый заказ №{$orderId} от " . htmlspecialchars($order['customer_name']);
        
        $emailHtml = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>" . htmlspecialchars($subject) . "</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background: #ff9800; padding: 20px; border-radius: 8px; margin-bottom: 20px;'>
                <h2 style='color: #fff; margin-top: 0;'>Новый заказ!</h2>
                <p style='color: #fff; margin-bottom: 0; font-size: 18px; font-weight: bold;'>Заказ №{$orderId}</p>
            </div>
            
            <div style='background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;'>
                <h3 style='color: #333; margin-top: 0;'>Информация о клиенте</h3>
                <p><strong>Имя:</strong> " . htmlspecialchars($order['customer_name']) . "</p>
                <p><strong>Телефон:</strong> " . htmlspecialchars($order['customer_phone']) . "</p>
                " . (!empty($order['customer_email']) ? "<p><strong>Email:</strong> " . htmlspecialchars($order['customer_email']) . "</p>" : "") . "
                <p><strong>Дата заказа:</strong> " . htmlspecialchars($order['created_at']) . "</p>
            </div>
            
            <div style='background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;'>
                <h3 style='color: #333; margin-top: 0;'>Доставка</h3>
                <p><strong>Способ доставки:</strong> {$deliveryTypeText}</p>
                {$deliveryInfo}
            </div>
            
            <div style='background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;'>
                <h3 style='color: #333; margin-top: 0;'>Оплата</h3>
                {$paymentStatusHtml}
                <p><strong>Способ оплаты:</strong> {$paymentTypeText}</p>
            </div>
            
            <div style='background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;'>
                <h3 style='color: #333; margin-top: 0;'>Состав заказа</h3>
                <table style='width: 100%; border-collapse: collapse;'>
                    <thead>
                        <tr style='background: #f8f9fa;'>
                            <th style='padding: 10px; text-align: left; border-bottom: 2px solid #ddd;'>Товар</th>
                            <th style='padding: 10px; text-align: center; border-bottom: 2px solid #ddd;'>Количество</th>
                            <th style='padding: 10px; text-align: right; border-bottom: 2px solid #ddd;'>Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan='2' style='padding: 15px 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;'>Итого:</td>
                            <td style='padding: 15px 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd; font-size: 18px; color: #ff9800;'>{$order['total_amount']} руб.</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            " . (!empty($notesHtml) ? "<div style='background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;'>{$notesHtml}</div>" : "") . "
            
            <div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;'>
                <p style='margin: 0; color: #666; font-size: 14px;'>Пожалуйста, обработайте заказ в административной панели.</p>
            </div>
        </body>
        </html>";

        $fromEmail = Config::get('EMAIL_FROM', 'noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        $fromName = Config::get('EMAIL_FROM_NAME');
        
        $headers = "From: {$fromName} <{$fromEmail}>\r\n";
        $headers .= "Reply-To: " . (!empty($order['customer_email']) ? $order['customer_email'] : $fromEmail) . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();

        $mailSent = @mail($sellerEmail, $subject, $emailHtml, $headers);
        
        if ($mailSent) {
            Log::write('seller_order_email_sent', [
                'order_id' => $orderId,
                'seller_email' => $sellerEmail
            ]);
        } else {
            Log::error('seller_order_email_failed', [
                'order_id' => $orderId,
                'seller_email' => $sellerEmail
            ]);
        }

        return $mailSent;
    }
}